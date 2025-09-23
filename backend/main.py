import os
import random
import string
import json
import uuid
import base64
import io
from collections import Counter
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, Header, Body, BackgroundTasks, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uvicorn
import firebase_admin
from firebase_admin import credentials, auth, firestore
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud import storage

import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, HarmCategory, HarmBlockThreshold, Tool, FunctionDeclaration, Part
from vertexai.preview.vision_models import ImageGenerationModel
import google.generativeai as genai
try:
    # Vertex AI認証でgoogle.generativeaiを使用
    GOOGLE_GENAI_AVAILABLE = True
    print("✅ google.generativeai ライブラリが利用可能です")
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False
    print("⚠️ google.generativeai ライブラリが利用できません。pip install google-generativeai を実行してください。")

from models import Game, Player, ScenarioOption, GameLog

# --- ダイスロール関数の定義 ---
def roll_dice(num_dice: int, num_sides: int) -> dict:
    """
    指定された数のダイスを振り、それぞれの出目を返します。
    例: 2d6 (num_dice=2, num_sides=6)

    Args:
        num_dice: 振るダイスの数 (正の整数)。
        num_sides: ダイスの面数 (正の整数)。

    Returns:
        各ダイスの出目のリストと合計値を含む辞書。
        例: {"rolls": [3, 5], "total": 8}
    """
    if not (isinstance(num_dice, int) and num_dice > 0):
        return {"error": "振るダイスの数 (num_dice) は1以上の整数である必要があります。"}
    if not (isinstance(num_sides, int) and num_sides > 0):
        return {"error": "ダイスの面数 (num_sides) は1以上の整数である必要があります。"}
    
    rolls = [random.randint(1, num_sides) for _ in range(num_dice)]
    total = sum(rolls)
    print(f"🎲 ダイスロール実行: {num_dice}d{num_sides} -> {rolls} (合計: {total})")
    return {"rolls": rolls, "total": total}

# --- Function Declaration（Geminiにツールとして認識させるため） ---
# 最新のVertex AI SDK用に修正
roll_dice_declaration = FunctionDeclaration(
    name="roll_dice",
    description="指定された数と種類のダイスを振り、出目と合計値を返します。プレイヤーの行動が成功したか失敗したかを判定するために使います。例: 鍵開け判定なら1d20、ダメージなら2d6など。",
    parameters={
        "type": "object",
        "properties": {
            "num_dice": {
                "type": "integer", 
                "description": "振るダイスの数 (例: 2d6の'2')"
            },
            "num_sides": {
                "type": "integer", 
                "description": "ダイスの面数 (例: 2d6の'6', D&Dなら通常20面)"
            }
        }
    }
)

# 終了判定関数
def check_scenario_completion(current_situation: str, completed_objectives: str, primary_objectives: str, force_ending: bool = False, completion_percentage: float = None, is_completed: bool = None) -> dict:
    """
    シナリオの完了状況を判定する関数
    Args:
        current_situation: 現在の状況の説明
        completed_objectives: 既に達成された目標のリスト（カンマ区切り）
        primary_objectives: メイン目標のリスト（カンマ区切り）
    Returns:
        完了判定の結果
    """
    try:
        # 常に目標リストを解析（後続処理で使用）
        completed_list = [obj.strip() for obj in completed_objectives.split(',') if obj.strip()]
        primary_list = [obj.strip() for obj in primary_objectives.split(',') if obj.strip()]
        
        # 完了率の計算（プロンプトから指定されるか、従来方式でフォールバック）
        if completion_percentage is None:
            # フォールバック：従来のキーワードマッチング方式
            if not primary_list:
                return {"error": "主要目標が設定されていません"}
            
            completion_percentage = len(completed_list) / len(primary_list) * 100.0
            print(f"⚠️ フォールバック：キーワードマッチング完了率 {completion_percentage:.1f}%")
        else:
            print(f"✅ プロンプトベース完了率: {completion_percentage:.1f}%")
        
        # 終了判定（プロンプトから指定されるか、従来方式でフォールバック）
        if is_completed is None:
            # フォールバック：75%以上または強制終了で完了判定
            is_completed = completion_percentage >= 75.0 or force_ending
            print(f"⚠️ フォールバック：75%基準で完了判定 → {is_completed}")
        else:
            print(f"✅ プロンプトベース完了判定: {is_completed}")
        
        # 終了タイプ判定
        if force_ending:
            if completion_percentage >= 50.0:
                ending_type = "tragic_success"  # 悲劇的成功（目標は達成したが代償が大きい）
            else:
                ending_type = "disaster"  # 完全な失敗
        else:
            # 通常の成功判定
            if completion_percentage >= 95.0:
                ending_type = "great_success"
            elif completion_percentage >= 75.0:
                ending_type = "success"
            elif completion_percentage >= 50.0:
                ending_type = "failure"
            else:
                ending_type = "disaster"
        
        # 残り目標を計算
        remaining_objectives = [obj for obj in primary_list if obj not in completed_list]
        
        print(f"🎯 シナリオ完了判定: {completion_percentage:.1f}% - {ending_type} {'(強制終了)' if force_ending else ''}")
        
        return {
            "completion_percentage": completion_percentage,
            "is_completed": is_completed,
            "ending_type": ending_type,
            "remaining_objectives": remaining_objectives,
            "achieved_objectives": completed_list,
            "force_ending": force_ending
        }
        
    except Exception as e:
        return {"error": f"終了判定エラー: {str(e)}"}

# 終了判定関数のFunction Declaration
check_completion_declaration = FunctionDeclaration(
    name="check_scenario_completion",
    description="シナリオの進行状況を分析し、完了条件を満たしているかを判定する。プレイヤー死亡、絶望的状況、不可逆的失敗などの場合はforce_endingをtrueにする。",
    parameters={
        "type": "object",
        "properties": {
            "current_situation": {
                "type": "string",
                "description": "現在の状況の説明"
            },
            "completed_objectives": {
                "type": "string", 
                "description": "達成された目標のリスト（カンマ区切り文字列）"
            },
            "primary_objectives": {
                "type": "string",
                "description": "シナリオのメイン目標のリスト（カンマ区切り文字列）"
            },
            "completion_percentage": {
                "type": "number",
                "description": "現在のシナリオ完了率（0-100%）。部分達成や進捗度合いを含めて総合的に判断した完了率",
                "minimum": 0,
                "maximum": 100
            },
            "is_completed": {
                "type": "boolean",
                "description": "シナリオが完了と判定できる状況に達したかどうか。完了率に関係なく、物語として一区切りついた場合はtrue"
            },
            "force_ending": {
                "type": "boolean",
                "description": "プレイヤー死亡、全滅、絶望的状況、不可逆的失敗などでシナリオを強制終了する場合はtrue",
                "default": False
            }
        },
        "required": ["current_situation", "completed_objectives", "primary_objectives"]
    }
)

# ツール定義（ダイスロールと終了判定）
scenario_tools = Tool(function_declarations=[roll_dice_declaration, check_completion_declaration])

# --- アプリケーションのライフサイクルイベント ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    startup_initialization(app)
    yield
    # Shutdown (何も必要なければ空)

def startup_initialization(app: FastAPI):
    """アプリケーション起動時の初期化処理"""
    print("サーバー起動時の初期化を開始します...")
    load_dotenv()
    PROJECT_ID = os.getenv("PROJECT_ID")
    LOCATION = os.getenv("LOCATION")
    try:
        if not firebase_admin._apps:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDKを新規に初期化しました")
        app.state.db = firestore.client()
        
        # Cloud Storageクライアントの初期化
        try:
            app.state.storage_client = storage.Client(project=PROJECT_ID)
            # バケット名を環境変数から取得（デフォルトは PROJECT_ID-trpg-images）
            bucket_name = os.getenv("STORAGE_BUCKET", f"{PROJECT_ID}-trpg-images")
            app.state.storage_bucket = app.state.storage_client.bucket(bucket_name)
            print(f"Cloud Storageクライアント初期化完了: {bucket_name}")
        except Exception as e:
            app.state.storage_client = None
            app.state.storage_bucket = None
            print(f"警告: Cloud Storageの初期化に失敗しました: {e}")
        
        if PROJECT_ID and LOCATION:
            try:
                vertexai.init(project=PROJECT_ID, location=LOCATION)
                app.state.gemini_model = GenerativeModel("gemini-2.5-flash")
                print("✅ Gemini 2.5 Flash初期化完了")
            except Exception as e:
                print(f"❌ Gemini初期化失敗: {e}")
                app.state.gemini_model = None
            # --- Imagenモデルの初期化 (新しいモデルに変更) ---
            try:
                app.state.imagen_model = ImageGenerationModel.from_pretrained("imagen-4.0-fast-generate-001")
                print("Imagen 4.0モデルの初期化完了")
            except Exception as e:
                app.state.imagen_model = None
                import traceback
                print(f"警告: Imagenモデルの初期化に失敗しました: {type(e).__name__}: {e}")
                print(f"🔍 初期化エラーのスタックトレース: {traceback.format_exc()}")
            
            # --- Veoモデルの初期化 ---
            try:
                # 最新のVertex AI Veo実装方法（GenerativeModel使用）
                if GOOGLE_GENAI_AVAILABLE:
                    import google.generativeai as genai
                    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
                    # Veo 2モデルを使用
                    app.state.veo_client = genai.GenerativeModel("publishers/google/models/veo-2.0-generate-001")
                    app.state.veo_model_name = "veo-2.0-generate-001"
                    app.state.veo_model = None  # 互換性のため
                    print("✅ Vertex AI Veo 2初期化成功")
                else:
                    raise ImportError("google.generativeai が利用できません")
            except Exception as e:
                print(f"⚠️ Veo初期化失敗: {e}")
                print("Veoは限定プレビューのため利用できない可能性があります")
                app.state.veo_model = None
                app.state.veo_client = None
                app.state.veo_model_name = None
            # ----------------------------------------
            print("Vertex AI SDKの初期化完了")
        else:
            app.state.gemini_model = None
            app.state.imagen_model = None
            app.state.veo_client = None
            app.state.veo_model = None
            app.state.veo_model_name = None
            print("警告: Vertex AIは初期化されません。")
    except Exception as e:
        print(f"初期化中にエラー: {e}")
        app.state.db = None
        app.state.gemini_model = None
        app.state.imagen_model = None
        app.state.veo_client = None
        app.state.veo_model = None
        app.state.veo_model_name = None

# FastAPIアプリケーションの初期化
app = FastAPI(lifespan=lifespan)

# --- CORSミドルウェアの設定 ---
origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- リクエストボディモデル ---
class VoteRequest(BaseModel): scenarioId: str
class CreateCharacterRequest(BaseModel): characterName: str; characterDescription: str
class ActionRequest(BaseModel): actionText: str

class ManualDiceRequest(BaseModel):
    num_dice: int
    num_sides: int
    description: str = ""  # ダイスロールの説明（例: "鍵開け判定", "攻撃ロール"）

class GMChatRequest(BaseModel):
    message: str  # GMへのメッセージ

class StartVotingRequest(BaseModel):
    difficulty: str = "normal"  # "easy", "normal", "hard", "extreme"
    keywords: list[str] = []  # 物語に含めたいキーワード（例: ["海賊", "宝探し", "呪い"]）
    theme_preference: str = ""  # テーマの希望（例: "ダークファンタジー", "コメディ"）
    opening_video_enabled: bool = True  # オープニング動画の有効/無効
    epilogue_video_enabled: bool = False  # エピローグ動画の有効/無効

# --- 認証ヘルパー ---
async def get_current_user_uid(authorization: str = Header(...)):
    try: return auth.verify_id_token(authorization.split("Bearer ")[1])['uid']
    except Exception as e: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

# テスト用認証バイパス
async def get_test_user_uid():
    return "test_player_1"

# --- ヘルパー関数 ---
def generate_room_id():
    return ''.join(random.choices(string.digits, k=6))

def upload_image_to_storage(image_bytes: bytes, storage_bucket, filename: str) -> str:
    """
    画像データをCloud Storageにアップロードし、公開URLを返す
    """
    try:
        blob = storage_bucket.blob(filename)
        blob.upload_from_string(image_bytes, content_type='image/png')
        
        # ブロブを公開可能にする
        blob.make_public()
        
        # 公開URLを返す
        return blob.public_url
        
    except Exception as e:
        print(f"Cloud Storageアップロードエラー: {e}")
        raise e

# --- ヘルパー関数：Veo動画生成 ---
import asyncio
async def generate_epilogue_video(scenario_title: str, ending_type: str, player_highlights: list, completion_percentage: float, game_id: str) -> str:
    """
    エピローグのハイライト動画を生成し、Cloud Storage URLを返す
    """
    try:
        # 環境変数から取得
        PROJECT_ID = os.getenv("PROJECT_ID")
        LOCATION = os.getenv("LOCATION")
        
        # Veo クライアント初期化
        veo_model = None
        veo_client = None
        veo_model_name = None
        
        try:
            if PROJECT_ID and LOCATION:
                # Vertex AI Veo初期化
                vertexai.init(project=PROJECT_ID, location=LOCATION)
                
                # Veo 3.0を最優先で試行（成功していた方法）
                try:
                    from vertexai.preview.generative_models import GenerativeModel
                    veo_client = GenerativeModel("veo-3.0-generate-001")  # モデル名のみ3.0に変更
                    veo_model_name = "veo-3.0-generate-001"
                    veo_model = True
                    print("✅ エピローグ動画用 Vertex AI Veo 3.0初期化成功")
                except ImportError:
                    # フォールバック: Veo 1
                    from vertexai.preview.vision_models import VideoGenerationModel
                    veo_client = VideoGenerationModel.from_pretrained("veo-001")
                    veo_model_name = "veo-001"
                    veo_model = True
                    print("✅ エピローグ動画用 Vertex AI Veo 1初期化成功 (フォールバック)")
            else:
                raise ImportError("PROJECT_ID または LOCATION が設定されていません")
        except Exception as e:
            print(f"❌ エピローグ Veo初期化エラー: {e}")
            print("Veoは限定プレビューのため利用できない可能性があります")
            return None
            
        if not veo_model and not veo_client:
            print("Veoモデルまたはクライアントが利用できません")
            return None
            
        # 日本語と英語混合プロンプトでより具体的に
        highlights_text = ", ".join(player_highlights[:3])  # 最大3つのハイライト
        
        ending_descriptions = {
            "great_success": "triumphant victory with heroes celebrating",
            "success": "successful completion with heroes proud", 
            "failure": "bittersweet ending with lessons learned",
            "disaster": "dramatic failure with heroes reflecting"
        }
        
        ending_desc = ending_descriptions.get(ending_type, "epic conclusion")
        
        prompt = f"""
Epic fantasy TRPG adventure finale: {scenario_title}
{ending_desc} ({completion_percentage:.0f}% completion)
Key heroic moments: {highlights_text}
Cinematic fantasy style, dramatic lighting, medieval fantasy setting
High quality animation, 4 seconds duration
"""
        
        print(f"🎬 動画生成開始 - プロンプト: {prompt[:100]}...")
        
        # Vertex AI Veoで動画生成
        if veo_model and veo_client:
            print("🎬 Vertex AI Veoを使用してエピローグ動画生成")
            try:
                print(f"🎬 Veo動画生成開始...")
                
                # 動画生成リクエスト（Veo 3.0 vs Veo 1の分岐）
                if veo_model_name == "veo-3.0-generate-001":
                    # Veo 3.0の場合（成功していた2.0と同じ方法）
                    response = veo_client.generate_content(
                        contents=[prompt],
                        generation_config={
                            "max_output_tokens": 1,
                            "temperature": 0.7
                        }
                    )
                else:
                    # Veo 1の場合
                    response = veo_client.generate_video(
                        prompt=prompt,
                        aspect_ratio="16:9"
                    )
                
                print(f"🎬 Veo動画生成リクエスト送信完了")
                
                # レスポンスから動画データを取得
                if response and hasattr(response, 'uri'):
                    video_url = response.uri
                    print(f"✅ Veoエピローグ動画生成完了: {video_url}")
                    return video_url
                elif response and hasattr(response, 'gcs_uri'):
                    video_url = response.gcs_uri
                    print(f"✅ Veoエピローグ動画生成完了: {video_url}")
                    return video_url
                else:
                    print("❌ 動画生成レスポンスが無効です")
                    return None
                    
            except Exception as e:
                print(f"❌ Veo生成エラー: {e}")
                import traceback
                print(f"🔍 Veoエラーのスタックトレース: {traceback.format_exc()}")
                return None
        else:
            print("❌ 利用可能なVeoサービスがありません")
            return None
    except Exception as e:
        print(f"❌ 動画生成エラー: {e}")
        import traceback
        print(f"🔍 動画生成エラーのスタックトレース: {traceback.format_exc()}")
        return None

# --- APIエンドポイント ---

@app.get("/")
async def read_root():
    """ルートエンドポイント"""
    return {"message": "AI TRPG Backend API", "status": "running"}

@app.post("/games")
async def create_game(request: Request, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    
    try:
        room_id = generate_room_id()
        # 重複チェック
        existing_games = db.collection('games').where(filter=FieldFilter('roomId', '==', room_id)).get()
        while len(existing_games) > 0:
            room_id = generate_room_id()
            existing_games = db.collection('games').where(filter=FieldFilter('roomId', '==', room_id)).get()
        
        # 新しいゲームドキュメントを作成
        game_data = {
            'roomId': room_id,
            'hostId': uid,
            'gameStatus': 'lobby',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'players': {
                uid: {
                    'name': uid,  # プレイヤー名（今回はuidで代用）
                    'characterName': None,
                    'characterDescription': None,
                    'characterImageUrl': None,
                    'isReady': False,
                    'joinedAt': firestore.SERVER_TIMESTAMP
                }
            }
        }
        
        doc_ref = db.collection('games').add(game_data)[1]
        return {"gameId": doc_ref.id, "roomId": room_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create game session: {e}")

@app.post("/games/{room_id}/join")
async def join_game(request: Request, room_id: str, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    
    try:
        # roomIdでゲームを検索
        games = db.collection('games').where(filter=FieldFilter('roomId', '==', room_id)).get()
        if len(games) == 0:
            raise HTTPException(status_code=404, detail="Room not found")
        
        game_doc = games[0]
        game_data = game_doc.to_dict()
        
        # ゲーム状態確認
        if game_data.get('gameStatus') != 'lobby':
            raise HTTPException(status_code=403, detail="Game has already started")
        
        # プレイヤー数制限（最大4人と仮定）
        if len(game_data.get('players', {})) >= 4:
            raise HTTPException(status_code=403, detail="Room is full")
        
        # 既に参加しているかチェック
        if uid in game_data.get('players', {}):
            return {"gameId": game_doc.id}
        
        # プレイヤーを追加
        player_data = {
            'name': uid,
            'characterName': None,
            'characterDescription': None,
            'characterImageUrl': None,
            'isReady': False,
            'joinedAt': firestore.SERVER_TIMESTAMP
        }
        
        game_doc.reference.update({f'players.{uid}': player_data})
        return {"gameId": game_doc.id}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join game: {e}")

@app.post("/games/{game_id}/start-voting")
async def start_voting(request: Request, game_id: str, req: StartVotingRequest, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    gemini_model = request.app.state.gemini_model
    if not db or not gemini_model: raise HTTPException(status_code=503, detail="Service not available")
    
    try:
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: raise HTTPException(status_code=404, detail="Game not found")
        game_data = game_doc.to_dict()
        
        # ホスト権限確認
        if game_data.get('hostId') != uid:
            raise HTTPException(status_code=403, detail="Only host can start voting")
        
        # ゲーム状態確認
        if game_data.get('gameStatus') != 'lobby':
            raise HTTPException(status_code=400, detail="Game is not in lobby state")
        
        print(f"🎬 動画設定受信: オープニング={req.opening_video_enabled}, エピローグ={req.epilogue_video_enabled}")
        
        # 難易度に応じた設定
        difficulty_settings = {
            "easy": {"max_turns": 40, "threshold": 0.6, "complexity": "簡単で分かりやすい"},
            "normal": {"max_turns": 30, "threshold": 0.75, "complexity": "適度な難易度の"},
            "hard": {"max_turns": 25, "threshold": 0.8, "complexity": "挑戦的で複雑な"},
            "extreme": {"max_turns": 20, "threshold": 0.9, "complexity": "非常に困難で複合的な"}
        }
        
        settings = difficulty_settings.get(req.difficulty, difficulty_settings["normal"])
        keywords_text = f"必須キーワード: {', '.join(req.keywords)}" if req.keywords else ""
        theme_text = f"テーマ: {req.theme_preference}" if req.theme_preference else ""
        
        # Geminiでシナリオ候補と終了条件を生成
        prompt = f"""
        あなたはTRPGのシナリオ作成の専門家です。
        以下の条件で3つの異なる{settings['complexity']}シナリオ案を作成してください：
        
        # 基本設定
        - 難易度: {req.difficulty} ({settings['complexity']})
        - {keywords_text}
        - {theme_text}
        
        # シナリオタイプ
        1. ファンタジー系
        2. SF系  
        3. 現代系（ホラー、ミステリー、アクションなど）
        
        各シナリオには以下を含めてください：
        - title: 魅力的なタイトル（15文字以内）
        - summary: 簡潔なあらすじ（100文字程度）
        - endConditions: 終了条件（各シナリオの完了判定に必要な情報）
          - primary_objectives: メイン目標のリスト（3-5個）
          - success_criteria: 成功条件のリスト
          - failure_criteria: 失敗条件のリスト
          - completion_threshold: 完了判定の閾値（{settings['threshold']}）
          - max_turns: 最大ターン数（{settings['max_turns']}）
        
        JSON配列形式で出力してください。例：
        [
          {{
            "title": "失われた魔法の森",
            "summary": "古い魔法の森で消えた村人たちを探す冒険。邪悪な魔法使いの呪いを解く必要がある。",
            "endConditions": {{
              "primary_objectives": ["村人の行方を突き止める", "邪悪な魔法使いを発見する", "呪いの謎を解明する", "呪いを解除する"],
              "success_criteria": ["全ての村人を救出", "魔法使いを倒すか説得", "森の平和を回復"],
              "failure_criteria": ["パーティ全滅", "村人の半数以上が犠牲", "呪いが拡散"],
              "completion_threshold": 0.75,
              "max_turns": 30
            }}
          }}
        ]
        """
        
        response = gemini_model.generate_content([prompt], generation_config=GenerationConfig(response_mime_type="application/json"))
        scenario_ideas = json.loads(response.text)
        scenario_options = [ScenarioOption(id=str(uuid.uuid4()), **idea) for idea in scenario_ideas]
        
        game_ref.update({
            "scenarioOptions": [opt.model_dump() for opt in scenario_options], 
            "gameStatus": "voting",
            "votes": {},
            "videoSettings": {
                "openingVideoEnabled": req.opening_video_enabled,
                "epilogueVideoEnabled": req.epilogue_video_enabled
            }
        })
        
        return {"message": "Voting started.", "scenarios": [opt.model_dump() for opt in scenario_options]}
        
    except Exception as e: 
        raise HTTPException(status_code=500, detail=f"Failed to start voting: {e}")

# --- バックグラウンドタスク ---
def generate_opening_video_task(game_id: str, scenario_title: str, scenario_summary: str):
    import asyncio
    asyncio.run(generate_opening_video_async(game_id, scenario_title, scenario_summary))

async def generate_opening_video_async(game_id: str, scenario_title: str, scenario_summary: str):
    db_client = firestore.client()
    game_ref = db_client.collection('games').document(game_id)
    
    try:
        # 環境変数から取得
        PROJECT_ID = os.getenv("PROJECT_ID")
        LOCATION = os.getenv("LOCATION")
        
        # Vertex AI Veoモデルとクライアントの取得
        veo_model = None
        veo_client = None
        veo_model_name = None
        
        # Vertex AI Veo初期化（最新仕様対応）
        try:
            if PROJECT_ID and LOCATION:
                # Veo 2の正しい実装
                vertexai.init(project=PROJECT_ID, location=LOCATION)
                
                # 方法1: Vertex AI Veo 2（成功していた実装）
                try:
                    from vertexai.preview.generative_models import GenerativeModel
                    veo_client = GenerativeModel("veo-3.0-generate-001")  # モデル名のみ3.0に変更
                    veo_model_name = "veo-3.0-generate-001"
                    veo_model = True
                    print("✅ Vertex AI Veo 3.0初期化成功")
                except ImportError as veo_import_error:
                    print(f"⚠️ Veo 3.0インポートエラー: {veo_import_error}")
                    
                    # 方法2: 従来のVeo 1
                    try:
                        from vertexai.preview.vision_models import VideoGenerationModel
                        veo_client = VideoGenerationModel.from_pretrained("veo-001")
                        veo_model_name = "veo-001"
                        veo_model = True
                        print("✅ Vertex AI Veo 1初期化成功")
                    except Exception as veo1_error:
                        print(f"⚠️ Veo 1初期化エラー: {veo1_error}")
                        raise veo1_error
            else:
                raise ImportError(f"PROJECT_ID または LOCATION が設定されていません")
        except Exception as e:
            print(f"❌ Veo初期化エラー: {e}")
            if "quota" in str(e).lower() or "429" in str(e):
                print("⚠️ Veo APIクォータ上限に達しています。プレースホルダー動画を使用します。")
            else:
                print("⚠️ Veoは限定プレビューのため利用できない可能性があります")
            veo_model = None
            veo_client = None
            veo_model_name = None
            
        if not veo_model and not veo_client:
            print("⚠️ Veoが利用できないため、プレースホルダー動画を使用")
            video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
            game_ref.update({
                "openingVideo.status": "ready",
                "openingVideo.url": video_url
            })
            return
            
        # 実際のVeo動画生成
        prompt = f"""
Epic fantasy TRPG adventure opening: {scenario_title}
{scenario_summary}
Cinematic fantasy style, dramatic atmosphere, medieval setting
High quality animation, 4 seconds duration
"""
        
        print(f"🎬 オープニング動画生成開始: {scenario_title}")
        
        # Vertex AI Veoで動画生成
        if veo_model and veo_client:
            try:
                print(f"🎬 Vertex AI Veo({veo_model_name})でオープニング動画生成")
                
                # Veo 3.0とVeo 1で異なる呼び出し方法
                if veo_model_name == "veo-3.0-generate-001":
                    # Veo 3.0の場合（成功していた2.0と同じ方法）
                    response = veo_client.generate_content(
                        contents=[prompt],
                        generation_config={
                            "max_output_tokens": 1,
                            "temperature": 0.7
                        }
                    )
                else:
                    # Veo 1の場合
                    response = veo_client.generate_video(
                        prompt=prompt,
                        aspect_ratio="16:9"
                    )
                
                print(f"🎬 Veo動画生成リクエスト送信完了")
                
                # レスポンスから動画データを取得
                if response and hasattr(response, 'uri'):
                    video_url = response.uri
                    print(f"✅ Veoオープニング動画生成完了: {video_url}")
                elif response and hasattr(response, 'gcs_uri'):
                    video_url = response.gcs_uri
                    print(f"✅ Veoオープニング動画生成完了: {video_url}")
                else:
                    print("❌ 動画生成レスポンスが無効です")
                    video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                        
                game_ref.update({
                    "openingVideo.status": "ready",
                    "openingVideo.url": video_url
                })
                return
                    
            except Exception as e:
                print(f"❌ Veoエラー: {e}")
                import traceback
                print(f"🔍 詳細エラー: {traceback.format_exc()}")
                # エラー時はダミー動画を使用
                video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                game_ref.update({
                    "openingVideo.status": "ready",
                    "openingVideo.url": video_url
                })
                return
        
        # Veoが利用できない場合はプレースホルダー動画を使用
        print("❌ Veoが利用できません、プレースホルダー動画を使用")
        video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
        game_ref.update({
            "openingVideo.status": "ready",
            "openingVideo.url": video_url
        })
        print(f"オープニング動画準備完了: {game_id}")

    except Exception as e:
        print(f"オープニング動画生成に失敗: {e}")
        # フォールバックとしてプレースホルダーを使用
        video_url = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
        game_ref.update({
            "openingVideo.status": "ready",
            "openingVideo.url": video_url
        })

# --- プレイ中動画生成機能（将来実装） ---
# 注意: 現在は実装していません。理由：
# 1. コスト問題：ターン毎の動画生成は非常に高コスト
# 2. パフォーマンス：生成時間が長く、ゲーム進行が遅延する
# 3. 必要性：現在の画像生成機能で十分な視覚効果を提供
# 
# 将来的な実装案：
# - 重要なターンのみ動画生成（ボス戦、クライマックス等）
# - バックグラウンド生成でゲーム進行を妨げない設計
# - プレイヤーオプションとして有効/無効切り替え可能
# 
# async def generate_turn_video_if_needed(game_id: str, turn_number: int, significant_events: list):
#     """重要なターンでのみ動画生成を実行する将来実装用関数"""
#     pass

def generate_gm_response_task(game_id: str):
    try:
        # グローバルなアプリインスタンスを取得
        db_client = firestore.client()
        gemini_model = None
        
        # 環境変数からVertex AI設定を取得してモデルを初期化
        PROJECT_ID = os.getenv("PROJECT_ID")
        LOCATION = os.getenv("LOCATION")
        if PROJECT_ID and LOCATION:
            try:
                vertexai.init(project=PROJECT_ID, location=LOCATION)
                # Function Callingツール付きでモデルを初期化（ダイスロールと終了判定）
                gemini_model = GenerativeModel("gemini-2.5-flash", tools=[scenario_tools])
            except Exception as e:
                print(f"Geminiモデル初期化エラー: {e}")
        
        game_ref = db_client.collection('games').document(game_id)
        game_data = game_ref.get().to_dict()

        scenario = next((s for s in game_data['scenarioOptions'] if s['id'] == game_data['decidedScenarioId']), None)
        game_history = "\n".join([f"{log['type']} ({log.get('playerId', 'GM')}): {log['content']}" for log in game_data.get('gameLog', [])])
        
        # プレイヤーアクションの安全な構築
        player_actions_list = []
        for uid, action in game_data.get('playerActionsThisTurn', {}).items():
            try:
                player_data = game_data.get('players', {}).get(uid, {})
                character_name = player_data.get('characterName')
                
                # character_nameが文字列でない場合の対処
                if isinstance(character_name, list):
                    character_name = ' '.join(str(item) for item in character_name)
                elif not isinstance(character_name, str):
                    character_name = str(character_name) if character_name else f"プレイヤー{uid[:8]}"
                
                player_actions_list.append(f"- {character_name}: {action}")
            except Exception as e:
                print(f"⚠️ プレイヤーアクション構築エラー (UID: {uid}): {e}")
                player_actions_list.append(f"- プレイヤー{uid[:8]}: {action}")
        
        player_actions = "\n".join(player_actions_list)
        
        # 終了条件情報を取得
        end_conditions = game_data.get('endConditions', {})
        primary_objectives = ', '.join(end_conditions.get('primary_objectives', []))
        current_turn = game_data.get('currentTurn', 1)
        max_turns = end_conditions.get('max_turns', 50)

        # 安全な文字列結合でプロンプトを作成
        scenario_title = str(scenario.get('title', '不明なシナリオ'))
        scenario_summary = str(scenario.get('summary', '概要なし'))
        primary_objectives_str = str(primary_objectives)
        current_turn_str = str(current_turn)
        max_turns_str = str(max_turns)
        game_history_str = str(game_history)
        player_actions_str = str(player_actions)
        
        prompt = """あなたはTRPGの熟練ゲームマスターです。
以下の状況に基づき、物語の次の展開を生成してください。

# ルール
- プレイヤーの行動が成功/失敗の判定を必要とする場合、必ず `roll_dice` 関数を使用してください。
- 例: 「鍵のかかった扉を開けようとする」→ `roll_dice(num_dice=1, num_sides=20)` で判定
- 例: 「剣で攻撃する」→ `roll_dice(num_dice=1, num_sides=20)` で命中判定、成功なら `roll_dice(num_dice=1, num_sides=8)` でダメージ
- 例: 「魔法を唱える」→ `roll_dice(num_dice=1, num_sides=20)` で成功判定
- ダイスロールの結果に基づいて、物語の展開を記述してください。
- 判定が不要な行動（会話、移動など）はダイスロールを使わずに進めてください。
- 重要な進展があった場合、必ず `check_scenario_completion` 関数を使用してシナリオの完了状況を確認してください。
- `completion_percentage`は部分達成や進捗度合いを含めて総合的に判断してください：
  * 目標の半分が達成 → 50%
  * 重要な手がかりを発見したが解決に至らず → 25-40%
  * 最終段階まで進んだが決定的な解決策が未実行 → 80-90%
  * 完全に解決 → 100%
- `is_completed`は物語として一区切りついたかで判断してください：
  * 主要な謎が解決された → true
  * 敵との決着がついた → true
  * 重要な選択をして結果が明確になった → true
  * 完了率が低くても物語的にまとまった → true
  * まだ続きがありそうな状況 → false
- 以下の場合は `force_ending=true` でシナリオ終了を判定してください：
  * プレイヤーが死亡、意識不明、重傷で行動不能
  * 全滅、壊滅状態
  * 目標達成が不可能になった絶望的状況
  * プレイヤーが冒険を完全に諦めた場合
  * その他ゲームを続行できない状況

# 世界観
シナリオ: """ + scenario_title + """
あらすじ: """ + scenario_summary + """

# シナリオ目標
主要目標: """ + primary_objectives_str + """
現在ターン: """ + current_turn_str + """/""" + max_turns_str + """

# これまでの物語
""" + game_history_str + """

# 今回のプレイヤーの行動
""" + player_actions_str + """

# あなたのタスク
1. 各プレイヤーの行動を評価し、必要に応じて `roll_dice` を呼び出してください。
2. ダイスロールの結果を含めて、物語の次の状況を具体的に描写してください。
3. 重要な目標が達成されたり、大きな進展があった場合は `check_scenario_completion` を呼び出してください。
4. 応答は必ずこの正確なJSON形式で出力してください（他の形式は使用しないでください）：
{
  "narration": "物語の状況描写（日本語で詳細に）",
  "imagePrompt": "情景画像生成用の英語プロンプト（null可）"
}

重要：フィールド名は「narration」と「imagePrompt」を必ず使用してください。「gm_narration」など他の名前は使用しないでください。"""
        
        narration = "ゲームマスターが次の展開を考えています..."
        image_prompt = None

        if gemini_model:
            print(f"🤖 Geminiモデル利用可能 - GM応答生成開始")
            try:
                # チャット履歴をFirestoreから取得（一時的に履歴復元を無効化して安定化）
                chat_history = game_data.get('chatHistory', [])
                
                if chat_history:
                    print(f"📚 {len(chat_history)}件のチャット履歴が存在（一時的に無効化中）")
                    
                    # デバッグ: チャット履歴の内容を詳細確認
                    for i, entry in enumerate(chat_history):
                        print(f"🔍 履歴エントリ{i}: {type(entry)}, キー: {entry.keys() if isinstance(entry, dict) else 'N/A'}")
                        if isinstance(entry, dict):
                            print(f"🔍 role: {entry.get('role', 'None')}, content型: {type(entry.get('content', 'None'))}")
                            content_preview = str(entry.get('content', 'None'))[:50]
                            print(f"🔍 content内容: {content_preview}...")
                
                # 常に新しいセッションを開始（履歴復元を一時的に無効化）
                try:
                    chat = gemini_model.start_chat()
                    print(f"✅ 新しいチャットセッション開始成功（履歴復元一時無効）")
                except Exception as start_chat_error:
                    print(f"🚨 start_chat()エラー: {start_chat_error}")
                    print(f"🔍 Geminiモデル型: {type(gemini_model)}")
                    print(f"🔍 Geminiモデル属性: {dir(gemini_model)}")
                    raise start_chat_error
                
                response = chat.send_message(prompt, tools=[scenario_tools], safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                })

                # Function Callingの処理 - 複数関数呼び出し対応
                function_responses = []
                
                if response.candidates and response.candidates[0].function_calls:
                    print(f"🛠️ Function Call要求数: {len(response.candidates[0].function_calls)}")
                    
                    for function_call in response.candidates[0].function_calls:
                        if hasattr(function_call, 'name') and hasattr(function_call, 'args'):
                            
                            if function_call.name == "roll_dice":
                                try:
                                    # ダイスロール実行
                                    dice_results = roll_dice(**function_call.args)
                                    print(f"🎲 ダイスロール実行: {function_call.args['num_dice']}d{function_call.args['num_sides']} -> {dice_results.get('rolls', [])} (合計: {dice_results.get('total', 'エラー')})")
                                    
                                    # ダイスロール結果をログに記録
                                    if dice_results.get('error'):
                                        log_content = f"ダイスロールエラー: {dice_results.get('error')}"
                                    else:
                                        log_content = f"ダイスロール ({function_call.args['num_dice']}d{function_call.args['num_sides']}): {dice_results.get('rolls', [])} (合計: {dice_results.get('total', 'エラー')})"

                                    dice_log_entry = GameLog(
                                        turn=current_turn,
                                        type='dice_roll',
                                        content=log_content,
                                        playerId='GM'
                                    )
                                    game_ref.update({"gameLog": firestore.ArrayUnion([dice_log_entry.model_dump()])})
                                    
                                    # Function Response作成
                                    function_responses.append(
                                        Part.from_function_response(
                                            name="roll_dice",
                                            response=dice_results
                                        )
                                    )

                                except Exception as e:
                                    print(f"🚨 ダイスロール関数の実行エラー: {e}")
                                    function_responses.append(
                                        Part.from_function_response(
                                            name="roll_dice", 
                                            response={"error": str(e)}
                                        )
                                    )
                            
                            elif function_call.name == "check_scenario_completion":
                                try:
                                    print(f"🎯 終了判定実行中...")
                                    completion_result = check_scenario_completion(**function_call.args)
                                    print(f"📊 終了判定結果: {completion_result}")
                                    
                                    # 終了判定結果をFirestoreに保存
                                    print(f"🔍 終了判定結果チェック: error={completion_result.get('error')}, is_completed={completion_result.get('is_completed')}")
                                    if not completion_result.get('error') and completion_result.get('is_completed'):
                                        game_ref.update({
                                            "completionResult": completion_result,
                                            "gameStatus": "completed"
                                        })
                                        print(f"🏁 シナリオ完了！エピローグフェーズに移行: {game_id}")
                                    elif completion_result.get('is_completed'):
                                        # エラーがあってもis_completedがtrueなら完了とする
                                        print(f"⚠️ エラーがありますが、is_completed=trueのため完了処理を実行")
                                        game_ref.update({
                                            "completionResult": completion_result,
                                            "gameStatus": "completed"
                                        })
                                        print(f"🏁 シナリオ完了！エピローグフェーズに移行: {game_id}")
                                    
                                    # Function Response作成 - シンプルな形式
                                    simple_result = {
                                        "completion_percentage": completion_result.get("completion_percentage", 0),
                                        "is_completed": completion_result.get("is_completed", False),
                                        "ending_type": completion_result.get("ending_type", "ongoing")
                                    }
                                    function_responses.append(
                                        Part.from_function_response(
                                            name="check_scenario_completion",
                                            response=simple_result
                                        )
                                    )

                                except Exception as e:
                                    print(f"🚨 終了判定関数の実行エラー: {e}")
                                    function_responses.append(
                                        Part.from_function_response(
                                            name="check_scenario_completion", 
                                            response={"error": str(e)}
                                        )
                                    )
                            else:
                                # 未知の関数の場合
                                print(f"⚠️ 未知の関数呼び出し: {function_call.name}")
                                function_responses.append(
                                    Part.from_function_response(
                                        name=function_call.name, 
                                        response={"error": f"Unknown function: {function_call.name}"}
                                    )
                                )
                        
                    # すべてのFunction Responseを一度にGeminiに送信（最新仕様対応）
                    if function_responses:
                        try:
                            print(f"📤 {len(function_responses)}個のFunction Response結果をGeminiに送信中...")
                            from vertexai.generative_models import Content
                            response_with_tool_result = chat.send_message(
                                Content(
                                    role="user",
                                    parts=function_responses
                                )
                            )
                            
                            # より堅牢な応答テキスト抽出
                            response_text = ""
                            
                            # デバッグ: response_with_tool_resultの構造を詳しく調査
                            print(f"🔍 response_with_tool_result型: {type(response_with_tool_result)}")
                            print(f"🔍 response_with_tool_result属性: {dir(response_with_tool_result)}")
                            if hasattr(response_with_tool_result, 'candidates'):
                                print(f"🔍 candidates数: {len(response_with_tool_result.candidates) if response_with_tool_result.candidates else 0}")
                                if response_with_tool_result.candidates:
                                    print(f"🔍 第1候補の型: {type(response_with_tool_result.candidates[0])}")
                                    if hasattr(response_with_tool_result.candidates[0], 'content'):
                                        print(f"🔍 content型: {type(response_with_tool_result.candidates[0].content)}")
                                        if hasattr(response_with_tool_result.candidates[0].content, 'parts'):
                                            print(f"🔍 parts数: {len(response_with_tool_result.candidates[0].content.parts) if response_with_tool_result.candidates[0].content.parts else 0}")
                            
                            # 方法1: 直接textプロパティを試行
                            try:
                                if hasattr(response_with_tool_result, 'text') and response_with_tool_result.text:
                                    response_text = response_with_tool_result.text.strip()
                                    print(f"🔄 直接text取得成功: {len(response_text)}文字")
                            except Exception as direct_text_error:
                                print(f"⚠️ 直接text取得失敗: {direct_text_error}")
                            
                            # 方法2: candidatesから手動でtext部分を抽出
                            if not response_text:
                                try:
                                    if (response_with_tool_result.candidates and 
                                        response_with_tool_result.candidates[0].content.parts):
                                        
                                        text_parts = []
                                        for part in response_with_tool_result.candidates[0].content.parts:
                                            if hasattr(part, 'text') and part.text:
                                                clean_text = part.text.strip()
                                                if clean_text and clean_text != "":
                                                    text_parts.append(clean_text)
                                        
                                        if text_parts:
                                            response_text = " ".join(text_parts)
                                            print(f"🔄 candidates text取得成功: {len(text_parts)}パート, {len(response_text)}文字")
                                except Exception as candidates_error:
                                    print(f"⚠️ candidates text取得失敗: {candidates_error}")
                            
                            # JSONパースとフォールバック処理
                            if response_text:
                                # まず、テキストがJSONかプレーンテキストかを判定
                                response_text_cleaned = response_text.strip()
                                
                                # JSONの可能性があるかチェック
                                looks_like_json = (response_text_cleaned.startswith('{') or 
                                                 response_text_cleaned.startswith('```json') or 
                                                 '"narration"' in response_text_cleaned or 
                                                 '"imagePrompt"' in response_text_cleaned)
                                
                                if looks_like_json:
                                    try:
                                        # より厳密なテキストクリーニング
                                        cleaned_text = response_text.strip()
                                        
                                        # BOMと制御文字を除去
                                        import re
                                        cleaned_text = re.sub(r'^\ufeff', '', cleaned_text)  # BOM除去
                                        cleaned_text = re.sub(r'^[\x00-\x1f\x7f-\x9f]+', '', cleaned_text)  # 制御文字除去
                                        
                                        # マークダウンJSONブロックを削除
                                        if cleaned_text.startswith('```json'):
                                            cleaned_text = cleaned_text[7:]
                                        if cleaned_text.endswith('```'):
                                            cleaned_text = cleaned_text[:-3]
                                        
                                        # 先頭の余分な文字（クォート、カンマなど）を除去
                                        cleaned_text = re.sub(r'^[",\s]*', '', cleaned_text)
                                        
                                        # JSONの開始を探して修正
                                        if not cleaned_text.startswith('{'):
                                            # JSONの開始を探す
                                            json_start = cleaned_text.find('{')
                                            if json_start != -1:
                                                cleaned_text = cleaned_text[json_start:]
                                        
                                        cleaned_text = cleaned_text.strip()
                                        print(f"🔍 クリーニング後のテキスト (最初の100文字): {cleaned_text[:100]}")
                                        
                                        gm_response = json.loads(cleaned_text)
                                        # 複数の可能なフィールド名をチェック（寛容な処理）
                                        if isinstance(gm_response, dict):
                                            narration = (gm_response.get('narration') or 
                                                       gm_response.get('gm_narration') or 
                                                       gm_response.get('text') or 
                                                       response_text)
                                            image_prompt = (gm_response.get('imagePrompt') or 
                                                          gm_response.get('image_prompt') or 
                                                          gm_response.get('imageUrl'))
                                        else:
                                            narration = response_text
                                            image_prompt = None
                                        print(f"✅ JSON解析成功")
                                    except json.JSONDecodeError as json_error:
                                        print(f"⚠️ JSON解析失敗: {json_error}")
                                        print(f"🔍 クリーニング前テキスト: {response_text[:100]}...")
                                        print(f"🔍 クリーニング後テキスト: {cleaned_text[:100]}...")
                                        
                                        # JSON解析失敗時は画像プロンプトと思われる部分を除去してナレーションを抽出
                                        if '"imagePrompt"' in response_text:
                                            # imagePromptを含むJSONの可能性があるので、ナレーション部分だけ抽出を試みる
                                            narration_match = re.search(r'"narration":\s*"([^"]*)"', response_text)
                                            if narration_match:
                                                narration = narration_match.group(1)
                                            else:
                                                narration = "ゲームマスターが物語を紡いでいます..."
                                            print(f"🔍 画像プロンプト付きJSON検出、ナレーション抽出: {narration[:50]}...")
                                        else:
                                            # 通常のテキスト応答として処理
                                            narration = response_text if len(response_text) < 1000 else "ゲームマスターが壮大な物語を紡いでいます..."
                                        
                                        image_prompt = None
                                else:
                                    # プレーンテキストのナレーション（JSONではない）
                                    print(f"✅ プレーンテキストナレーション検出: {len(response_text)}文字")
                                    narration = response_text if len(response_text) < 2000 else response_text[:2000] + "..."
                                    image_prompt = None
                            else:
                                print(f"⚠️ 有効な応答テキストが取得できませんでした")
                                print(f"🔍 Function Call結果をデバッグ表示:")
                                for i, func_resp in enumerate(function_responses):
                                    print(f"  Response {i}: {func_resp}")
                                
                                # フォールバック: Function Call結果を基に応答を生成
                                if function_responses:
                                    try:
                                        # Function Call結果の詳細から応答を構築
                                        func_result = function_responses[0].function_response.response
                                        if 'is_completed' in func_result and func_result['is_completed']:
                                            narration = f"冒険は完了しました！完了率: {func_result.get('completion_percentage', 0):.1f}%"
                                        else:
                                            narration = "ゲームマスターが次の展開を考慮中です。しばらくお待ちください..."
                                    except Exception as fallback_error:
                                        print(f"⚠️ フォールバック応答生成エラー: {fallback_error}")
                                        narration = "ゲームマスターが応答を準備しています..."
                                else:
                                    narration = "ゲームマスターが応答を準備しています..."
                                image_prompt = None
                            
                            print(f"✅ Function Calling後の応答取得: {len(response_text)}文字")
                        except Exception as e:
                            print(f"🚨 Function Response送信エラー: {e}")
                            print(f"🔍 エラー詳細: {type(e).__name__}")
                            import traceback
                            print(f"🔍 スタックトレース: {traceback.format_exc()}")
                            # エラー時でも基本的な応答を返す
                            response_text = ""
                    else:
                        print("⚠️ 送信するFunction Responseがありません")
                        response_text = ""
                
                else:
                    # Function Callingが不要の場合、直接レスポンステキストを処理
                    print(f"💬 通常応答（Function Calling不要）")
                    response_text = ""
                    if hasattr(response, 'text') and response.text:
                        response_text = response.text.strip()
                    elif response.candidates and response.candidates[0].content.parts:
                        text_parts = []
                        for part in response.candidates[0].content.parts:
                            if hasattr(part, 'text') and part.text:
                                text_parts.append(part.text.strip())
                        response_text = " ".join(text_parts) if text_parts else ""
                
                # 最終レスポンス処理
                if response_text:
                    try:
                        # マークダウンJSONブロックを削除
                        cleaned_text = response_text.strip()
                        if cleaned_text.startswith('```json'):
                            cleaned_text = cleaned_text[7:]
                        if cleaned_text.endswith('```'):
                            cleaned_text = cleaned_text[:-3]
                        cleaned_text = cleaned_text.strip()
                        
                        gm_response = json.loads(cleaned_text)
                        # 複数の可能なフィールド名をチェック（寛容な処理）
                        narration = (gm_response.get('narration') or 
                                   gm_response.get('gm_narration') or 
                                   gm_response.get('text') or 
                                   response_text)
                        image_prompt = (gm_response.get('imagePrompt') or 
                                      gm_response.get('image_prompt') or 
                                      gm_response.get('imageUrl'))
                        print(f"✅ JSON解析成功")
                    except json.JSONDecodeError as json_error:
                        print(f"⚠️ JSON解析失敗: {json_error}")
                        print(f"🔍 応答テキスト内容: {response_text[:200]}...")
                        # JSONでない場合は直接ナレーションとして使用
                        narration = response_text if len(response_text) < 1000 else "ゲームマスターが壮大な物語を紡いでいます..."
                        image_prompt = None
                else:
                    print(f"⚠️ 有効な応答テキストが取得できませんでした")
                    narration = "ゲームマスターが応答を準備しています..."
                    image_prompt = None
                

            except Exception as e:
                print(f"🚨 Gemini応答生成エラー: {e}")
                import traceback
                print(f"🔍 Gemini応答生成エラースタックトレース: {traceback.format_exc()}")
                # より親しみやすいエラー応答
                narration = "申し訳ありません。一時的な問題が発生しました。別の行動を試してみてください。"
                image_prompt = None

        # 画像生成（プレースホルダー）
        image_url = None
        if image_prompt:
            # 実際にはImagen APIで画像を生成
            image_url = "https://picsum.photos/600/400?random=scene"

        # ゲームログに追加
        current_turn = game_data.get('currentTurn', 1)
        log_entry = GameLog(
            turn=current_turn,
            type='gm_response',
            content=narration,
            imageUrl=image_url
        )

        # チャット履歴を更新（ユーザーメッセージと応答を保存）
        current_chat_history = game_data.get('chatHistory', [])
        current_chat_history.append({
            'role': 'user',
            'content': prompt,
            'timestamp': datetime.utcnow().isoformat()
        })
        current_chat_history.append({
            'role': 'model', 
            'content': narration,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # ゲーム状態を更新
        update_data = {
            "gameLog": firestore.ArrayUnion([log_entry.model_dump()]),
            "currentTurn": current_turn + 1,
            "playerActionsThisTurn": {},  # 次のターンのためにリセット
            "chatHistory": current_chat_history  # チャット履歴を保存
        }
        
        game_ref.update(update_data)
        print(f"✅ GM応答生成完了: {game_id}")
        print(f"📝 応答内容: {narration[:100]}...")
        print(f"🔄 ターン更新: {current_turn} -> {current_turn + 1}")

    except Exception as e:
        print(f"GM応答生成に失敗: {e}")
        # エラー時もターンを進める
        try:
            error_db = firestore.client()
            game_ref = error_db.collection('games').document(game_id)
            game_data = game_ref.get().to_dict()
            current_turn = game_data.get('currentTurn', 1)
            
            error_log_entry = GameLog(
                turn=current_turn,
                type='gm_response',
                content="申し訳ありません。ゲームマスターが一時的に考え込んでいます。少しお待ちください..."
            )
            
            game_ref.update({
                "gameLog": firestore.ArrayUnion([error_log_entry.model_dump()]),
                "currentTurn": current_turn + 1,
                "playerActionsThisTurn": {}
            })
        except Exception as inner_e:
            print(f"エラー処理中にさらにエラー: {inner_e}")

@firestore.transactional
def update_vote_in_transaction(transaction: Transaction, game_ref, uid: str, scenario_id: str, background_tasks: BackgroundTasks):
    game_snapshot = game_ref.get(transaction=transaction)
    if not game_snapshot.exists: raise HTTPException(status_code=404, detail="Game not found")
    game_data = game_snapshot.to_dict()

    if game_data.get('gameStatus') != 'voting': raise HTTPException(status_code=400, detail="Not in voting state")
    if uid not in game_data.get('players', {}): raise HTTPException(status_code=403, detail="Player not in game")
    
    valid_scenario_ids = {opt['id'] for opt in game_data.get('scenarioOptions', [])}
    if scenario_id not in valid_scenario_ids: raise HTTPException(status_code=400, detail="Invalid scenario ID")

    votes = game_data.get('votes', {})
    # Remove previous vote if any
    for s_id, voters in votes.items():
        if uid in voters: voters.remove(uid)
    
    # Add new vote
    if scenario_id not in votes: votes[scenario_id] = []
    votes[scenario_id].append(uid)
    
    transaction.update(game_ref, {"votes": votes})

    # Check if all players have voted
    total_votes = sum(len(v) for v in votes.values())
    num_players = len(game_data['players'])
    if total_votes == num_players:
        # Tally results
        vote_counts = Counter({s_id: len(v) for s_id, v in votes.items()})
        decided_scenario_id = vote_counts.most_common(1)[0][0]
        
        # 選択されたシナリオの情報を取得
        scenario_title = ""
        scenario_summary = ""
        end_conditions = None
        for opt in game_data.get('scenarioOptions', []):
            if opt['id'] == decided_scenario_id:
                scenario_title = opt['title']
                scenario_summary = opt['summary']
                end_conditions = opt.get('endConditions')
                break
        
        # 動画設定を確認
        video_settings = game_data.get("videoSettings", {"openingVideoEnabled": True})
        opening_video_enabled = video_settings.get("openingVideoEnabled", True)
        
        update_data = {
            "decidedScenarioId": decided_scenario_id,
            "gameStatus": "creating_char"
        }
        
        # オープニング動画設定に応じて処理
        if opening_video_enabled:
            update_data["openingVideo"] = {"status": "generating", "prompt": ""}
            print(f"🎬 オープニング動画有効: {scenario_title}")
        else:
            update_data["openingVideo"] = {"status": "disabled", "url": None}
            print(f"🚫 オープニング動画無効: {scenario_title}")
        
        # 終了条件をゲームに設定
        if end_conditions:
            update_data["endConditions"] = end_conditions
            
        transaction.update(game_ref, update_data)
        
        # 動画有効時のみバックグラウンドタスクを実行
        if opening_video_enabled:
            background_tasks.add_task(generate_opening_video_task, game_ref.id, scenario_title, scenario_summary)
        else:
            print(f"⏭️ オープニング動画生成をスキップ: 設定により無効")

@app.post("/games/{game_id}/vote")
async def vote_for_scenario(request: Request, game_id: str, vote_req: VoteRequest, background_tasks: BackgroundTasks, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    try:
        game_ref = db.collection('games').document(game_id)
        transaction = db.transaction()
        update_vote_in_transaction(transaction, game_ref, uid, vote_req.scenarioId, background_tasks)
        return {"message": "Vote cast successfully."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during voting: {e}")

@app.post("/games/{game_id}/create-character")
async def create_character(request: Request, game_id: str, req: CreateCharacterRequest, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    imagen_model = request.app.state.imagen_model
    storage_bucket = request.app.state.storage_bucket
    if not db: raise HTTPException(status_code=503, detail="Service not initialized")
    game_ref = db.collection('games').document(game_id)
    game_doc = game_ref.get()
    if not game_doc.exists: raise HTTPException(status_code=404, detail="Game not found")
    game_data = game_doc.to_dict()

    if game_data.get('gameStatus') != 'creating_char':
        raise HTTPException(status_code=400, detail="Not in character creation state")
    if uid not in game_data.get('players', {}): raise HTTPException(status_code=403, detail="Player not in game")

    scenario_title = "a fantasy world"
    decided_scenario_id = game_data.get('decidedScenarioId')
    if decided_scenario_id:
        for opt in game_data.get('scenarioOptions', []):
            if opt['id'] == decided_scenario_id:
                scenario_title = opt['title']
                break

    # 日本語プロンプトをシンプルに（公式ドキュメント準拠）
    prompt = f"{req.characterName}の肖像画、{req.characterDescription}、人物の顔と上半身"
    print(f"🎨 日本語プロンプト: {prompt}")
    print(f"🗂️ Cloud Storageバケット: {app.state.storage_bucket.name if app.state.storage_bucket else 'None'}")

    try:
        # --- Imagenでの画像生成 ---
        print(f"🔍 Imagenモデル状態: {imagen_model is not None}")
        print(f"🔍 生成プロンプト: {prompt}")
        
        if imagen_model:
            try:
                print(f"🚀 Imagen APIを呼び出し中...")
                # 最小限のパラメータでテスト
                response = imagen_model.generate_images(
                    prompt=prompt,  # 日本語プロンプト
                    number_of_images=1,
                    language="ja"  # 日本語プロンプト（公式ドキュメント準拠）
                )
                print(f"📸 Imagen APIレスポンス受信: {type(response)}")
                
                # Imagen画像生成とCloud Storageアップロード
                if response and hasattr(response, 'images') and len(response.images) > 0:
                    generated_image = response.images[0]
                    print(f"✅ Imagen画像生成成功")
                    
                    # 画像データを取得
                    try:
                        # 画像データを取得する方法を複数試行
                        image_data = None
                        print(f"🔍 画像オブジェクトの属性: {dir(generated_image)}")
                        if hasattr(generated_image, '_image_bytes'):
                            image_data = generated_image._image_bytes
                            print(f"✅ _image_bytesから画像データ取得")
                        elif hasattr(generated_image, 'data'):
                            image_data = generated_image.data
                            print(f"✅ dataから画像データ取得")
                        elif hasattr(generated_image, 'content'):
                            image_data = generated_image.content
                            print(f"✅ contentから画像データ取得")
                        else:
                            print(f"❌ 画像データの取得方法が見つかりません")
                            
                        if image_data and storage_bucket:
                            # Cloud Storageにアップロード
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                            filename = f"characters/{game_id}/{uid}_{timestamp}.png"
                            
                            image_url = upload_image_to_storage(image_data, storage_bucket, filename)
                            print(f"🔗 Cloud Storage URL: {image_url}")
                        else:
                            # Cloud Storageが利用できない場合はプレースホルダー
                            image_url = f"https://picsum.photos/400/400?random={random.randint(10, 999)}"
                            print(f"⚠️ Cloud Storage利用不可、プレースホルダー使用: {image_url}")
                    
                    except Exception as upload_err:
                        print(f"🚨 Cloud Storageアップロードエラー: {upload_err}")
                        image_url = f"https://picsum.photos/400/400?random={random.randint(10, 999)}"
                        print(f"🖼️ エラー時プレースホルダー使用: {image_url}")
                else:
                    print(f"❌ Imagen画像生成に失敗")
                    image_url = f"https://picsum.photos/400/400?random={random.randint(10, 999)}"
            except Exception as e:
                print(f"🚨 Imagen画像生成エラー詳細: {type(e).__name__}: {e}")
                import traceback
                print(f"🔍 スタックトレース: {traceback.format_exc()}")
                # エラー時もプレースホルダーを使用
                image_url = "https://picsum.photos/400/400?random=2"
        else:
            # Imagenモデルが利用できない場合のプレースホルダー
            image_url = "https://picsum.photos/400/400?random=3"
        
        player_update = {
            f'players.{uid}.characterName': req.characterName,
            f'players.{uid}.characterDescription': req.characterDescription,
            f'players.{uid}.characterImageUrl': image_url,
        }
        game_ref.update(player_update)

        # キャラクター作成完了後、全員のキャラクター作成が完了したかチェック
        updated_game_doc = game_ref.get()
        updated_game_data = updated_game_doc.to_dict()
        
        print(f"🔍 キャラクター作成チェック: ゲーム {game_id}")
        print(f"🔍 現在のプレイヤー数: {len(updated_game_data.get('players', {}))}")
        
        # 全プレイヤーがキャラクター名を設定済みかチェック
        players = updated_game_data.get('players', {})
        character_status = {}
        for uid, player in players.items():
            character_name = player.get('characterName')
            character_status[uid] = character_name is not None
            print(f"🔍 プレイヤー {uid}: キャラクター名='{character_name}', 完了={character_name is not None}")
        
        all_characters_created = all(character_status.values())
        print(f"🔍 全員のキャラクター作成完了: {all_characters_created}")
        
        # 自動遷移は無効化 - ホストが手動で開始する方式に変更
        # if all_characters_created:
        #     print(f"✅ 状態遷移実行: {game_id} を ready_to_start に変更")
        #     game_ref.update({"gameStatus": "ready_to_start"})
        #     print(f"✅ 全員のキャラクター作成完了: ゲーム {game_id} が ready_to_start 状態に遷移")

        return {"characterImageUrl": image_url}
    except Exception as e: raise HTTPException(status_code=500, detail=f"Failed to generate character image: {e}")

@app.post("/games/{game_id}/ready")
async def player_ready(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    game_ref = db.collection('games').document(game_id)
    game_doc = game_ref.get()
    if not game_doc.exists: raise HTTPException(status_code=404, detail="Game not found")
    game_data = game_doc.to_dict()

    if uid not in game_data.get('players', {}): raise HTTPException(status_code=403, detail="Player not in game")

    game_ref.update({f'players.{uid}.isReady': True})

    updated_game_doc = game_ref.get() 
    updated_game_data = updated_game_doc.to_dict()
    all_players_ready = all(p.get('isReady', False) for p in updated_game_data.get('players', {}).values())
    video_ready = updated_game_data.get('openingVideo', {}).get('status') == 'ready'

    if all_players_ready and video_ready:
        game_ref.update({"gameStatus": "ready_to_start"})
        return {"message": "Player is ready. All players are ready to start!"}

    return {"message": "Player is ready."}

@app.post("/games/{game_id}/proceed-to-ready")
async def proceed_to_ready(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    """ホストがキャラクター作成完了後に準備完了段階に進める"""
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    
    game_ref = db.collection('games').document(game_id)
    game_doc = game_ref.get()
    if not game_doc.exists: raise HTTPException(status_code=404, detail="Game not found")
    game_data = game_doc.to_dict()
    
    # ホスト権限確認
    if game_data.get('hostId') != uid:
        raise HTTPException(status_code=403, detail="Only host can proceed to ready phase")
    
    # ゲーム状態確認
    if game_data.get('gameStatus') != 'creating_char':
        raise HTTPException(status_code=400, detail="Not in character creation state")
    
    # 全員のキャラクター作成が完了しているか確認
    players = game_data.get('players', {})
    all_characters_created = all(p.get('characterName') and p.get('characterImageUrl') for p in players.values())
    
    if not all_characters_created:
        raise HTTPException(status_code=400, detail="Not all players have completed character creation")
    
    print(f"✅ ホストによる準備完了段階への移行: {game_id}")
    game_ref.update({"gameStatus": "ready_to_start"})
    
    return {"message": "Proceeding to ready phase"}

@app.post("/games/{game_id}/start-game")
async def start_game(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    gemini_model = request.app.state.gemini_model
    if not db or not gemini_model: raise HTTPException(status_code=503, detail="Service not available")
    game_ref = db.collection('games').document(game_id)
    game_doc = game_ref.get()
    if not game_doc.exists: raise HTTPException(status_code=404, detail="Game not found")
    game_data = game_doc.to_dict()

    if game_data.get('hostId') != uid: raise HTTPException(status_code=403, detail="Only host can start the game")
    if game_data.get('gameStatus') != 'ready_to_start': raise HTTPException(status_code=400, detail="Game not ready to start")

    scenario = next((s for s in game_data['scenarioOptions'] if s['id'] == game_data['decidedScenarioId']), None)
    players_info = "\n".join([f"- {p['characterName']}: {p['characterDescription']}" for p in game_data['players'].values()])

    prompt = f"""
    あなたはTRPGの熟練ゲームマスターです。
    以下の設定でゲームを開始します。プレイヤーたちを物語へ引き込む、魅力的で具体的なオープニングナレーションを生成してください。
    
    シナリオ: {scenario['title']}
    あらすじ: {scenario['summary']}
    
    登場するプレイヤー:
    {players_info}
    
    出力はナレーションのテキストのみにしてください。
    """
    try:
        response = gemini_model.generate_content(prompt)
        narration = response.text

        log_entry = GameLog(
            turn=0,
            type='gm_narration',
            content=narration
        )
        game_ref.update({
            "gameStatus": "playing",
            "currentTurn": 1,
            "gameLog": firestore.ArrayUnion([log_entry.model_dump()])
        })
        return {"message": "Game started!", "initialNarration": narration}
    except Exception as e: raise HTTPException(status_code=500, detail=f"Failed to start game: {e}")

@app.post("/games/{game_id}/action")
async def player_action(request: Request, game_id: str, req: ActionRequest, background_tasks: BackgroundTasks, uid: str = Depends(get_current_user_uid)):
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    game_ref = db.collection('games').document(game_id)
    
    @firestore.transactional
    def update_action_in_transaction(transaction: Transaction):
        game_snapshot = game_ref.get(transaction=transaction)
        if not game_snapshot.exists: raise HTTPException(404, "Game not found")
        game_data = game_snapshot.to_dict()

        if game_data.get('gameStatus') != 'playing': raise HTTPException(400, "Game not in playing state")
        if uid not in game_data.get('players', {}): raise HTTPException(403, detail="Player not in game")
        if uid in game_data.get('playerActionsThisTurn', {}): raise HTTPException(400, "You have already acted this turn")

        log_entry = GameLog(turn=game_data['currentTurn'], type='player_action', content=req.actionText, playerId=uid)
        transaction.update(game_ref, {
            f"playerActionsThisTurn.{uid}": req.actionText,
            "gameLog": firestore.ArrayUnion([log_entry.model_dump()])
        })
        return game_snapshot.to_dict() # Return data for post-transaction check

    try:
        updated_game_data = update_action_in_transaction(db.transaction())
        
        num_players = len(updated_game_data.get('players', {}))
        num_actions = len(updated_game_data.get('playerActionsThisTurn', {})) + 1 

        if num_actions >= num_players:
            background_tasks.add_task(generate_gm_response_task, game_id)

        return {"message": "Action recorded."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Failed to record action: {e}")

@app.post("/games/{game_id}/manual-dice")
async def manual_dice_roll(request: Request, game_id: str, req: ManualDiceRequest, uid: str = Depends(get_current_user_uid)):
    """プレイヤーが手動でダイスを振る"""
    db = request.app.state.db
    if not db: raise HTTPException(status_code=503, detail="DB service not available")
    game_ref = db.collection('games').document(game_id)
    
    try:
        game_snapshot = game_ref.get()
        if not game_snapshot.exists: raise HTTPException(404, "Game not found")
        game_data = game_snapshot.to_dict()

        if game_data.get('gameStatus') != 'playing': raise HTTPException(400, "Game not in playing state")
        if uid not in game_data.get('players', {}): raise HTTPException(403, detail="Player not in game")

        # ダイスロール実行
        dice_result = roll_dice(req.num_dice, req.num_sides)
        if "error" in dice_result:
            raise HTTPException(400, dice_result["error"])

        # ダイスロール結果をゲームログに追加
        player_name = game_data['players'][uid]['characterName']
        description = f" ({req.description})" if req.description else ""
        dice_content = f"ダイスロール{description} ({req.num_dice}d{req.num_sides}): {dice_result['rolls']} (合計: {dice_result['total']})"
        
        log_entry = GameLog(
            turn=game_data['currentTurn'], 
            type='dice_roll', 
            content=dice_content, 
            playerId=uid
        )
        
        game_ref.update({
            "gameLog": firestore.ArrayUnion([log_entry.model_dump()])
        })

        return {
            "message": "Dice rolled successfully", 
            "result": dice_result,
            "player_name": player_name
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Failed to roll dice: {e}")

@app.post("/games/{game_id}/gm-chat")
async def gm_chat(request: Request, game_id: str, req: GMChatRequest, uid: str = Depends(get_current_user_uid)):
    """GMとのチャット機能 - プレイヤーがGMに質問や相談ができる"""
    db = request.app.state.db
    gemini_model = request.app.state.gemini_model
    if not db or not gemini_model: 
        raise HTTPException(status_code=503, detail="Service not available")
    
    try:
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: 
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        
        # ゲーム参加確認
        if uid not in game_data.get('players', {}):
            raise HTTPException(status_code=403, detail="Player not in game")
        
        # ゲーム状態確認（プレイ中または完了状態で利用可能）
        game_status = game_data.get('gameStatus')
        if game_status not in ['playing', 'completed', 'epilogue']:
            raise HTTPException(status_code=400, detail="GM chat not available in current game state")
        
        # プレイヤー情報取得
        player_data = game_data['players'][uid]
        character_name = player_data.get('characterName', 'プレイヤー')
        
        # シナリオ情報取得
        scenario = next((s for s in game_data['scenarioOptions'] if s['id'] == game_data['decidedScenarioId']), None)
        
        # ゲーム履歴取得（最新10件）
        game_history = "\n".join([f"ターン{log['turn']} {log['type']}: {log['content'][:100]}..." 
                                 for log in game_data.get('gameLog', [])[-10:]])
        
        # GMチャット用プロンプト
        gm_prompt = f"""
        あなたはTRPGの熟練ゲームマスターです。
        プレイヤー「{character_name}」からの質問や相談に、親切で物語を盛り上げるように応答してください。
        
        # 現在のゲーム状況
        シナリオ: {scenario['title'] if scenario else '不明'}
        ゲーム状態: {game_status}
        現在ターン: {game_data.get('currentTurn', 1)}
        
        # 最近のゲーム展開
        {game_history}
        
        # プレイヤーからのメッセージ
        {character_name}: {req.message}
        
        # 応答ガイドライン
        - プレイヤーの質問に分かりやすく答える
        - ルールについて聞かれたら適切に説明する
        - 物語の展開について聞かれたら、ネタバレしない範囲でヒントを与える
        - プレイヤーのモチベーションを高める
        - 300文字以内で簡潔に回答する
        
        GMとして応答してください:
        """
        
        # Geminiで応答生成
        response = gemini_model.generate_content(gm_prompt)
        gm_response = response.text
        
        # チャット履歴をログに記録
        chat_log_entry = GameLog(
            turn=game_data.get('currentTurn', 1),
            type='gm_chat',
            content=f"{character_name}: {req.message}\nGM: {gm_response}",
            playerId=uid
        )
        
        game_ref.update({
            "gameLog": firestore.ArrayUnion([chat_log_entry.model_dump()])
        })
        
        return {
            "message": "GM chat response generated",
            "gm_response": gm_response,
            "player_message": req.message,
            "character_name": character_name
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"GMチャットエラー: {e}")
        raise HTTPException(500, f"Failed to process GM chat: {e}")

@app.post("/games/{game_id}/generate-epilogue")
async def generate_epilogue(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    """エピローグを生成し、冒険の振り返りデータを作成する"""
    db = request.app.state.db
    gemini_model = request.app.state.gemini_model
    if not db or not gemini_model: 
        raise HTTPException(status_code=503, detail="Service not available")
    
    try:
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: 
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        
        # ホスト権限確認
        if game_data.get('hostId') != uid:
            raise HTTPException(status_code=403, detail="Only host can generate epilogue")
        
        # ゲーム状態確認
        if game_data.get('gameStatus') not in ['epilogue', 'completed']:
            raise HTTPException(status_code=400, detail="Game is not in epilogue or completed state")
        
        # 既にエピローグが生成されている場合はそれを返す
        if game_data.get('epilogue'):
            return {"message": "Epilogue already generated", "epilogue": game_data['epilogue']}
        
        # 冒険データを分析
        scenario = next((s for s in game_data['scenarioOptions'] if s['id'] == game_data['decidedScenarioId']), None)
        completion_result = game_data.get('completionResult', {})
        game_logs = game_data.get('gameLog', [])
        players = game_data.get('players', {})
        total_turns = game_data.get('currentTurn', 1)
        
        # プレイヤー別の活躍を分析
        player_contributions = []
        for player_id, player_data in players.items():
            player_actions = [log for log in game_logs if log.get('playerId') == player_id and log.get('type') == 'player_action']
            dice_rolls = [log for log in game_logs if log.get('type') == 'dice_roll']
            
            # ハイライトモーメントを抽出（最初と最後の行動など）
            highlight_moments = []
            if player_actions:
                highlight_moments.append(f"最初の行動: {player_actions[0]['content']}")
                if len(player_actions) > 1:
                    highlight_moments.append(f"印象的な行動: {player_actions[-1]['content']}")
            
            player_contributions.append({
                "player_id": player_id,
                "character_name": player_data.get('characterName', 'Unknown'),
                "key_actions": [action['content'] for action in player_actions[:3]],  # 最初の3つの行動
                "dice_rolls": [{"content": roll['content'], "turn": roll['turn']} for roll in dice_rolls[:5]],
                "highlight_moments": highlight_moments
            })
        
        # 冒険サマリーを生成
        adventure_summary_logs = [f"ターン{log['turn']}: {log['content'][:100]}..." for log in game_logs if log.get('type') in ['gm_narration', 'gm_response']][:5]
        adventure_summary = "\n".join(adventure_summary_logs)
        
        # Geminiでエピローグナレーションを生成
        epilogue_prompt = f"""
        あなたはTRPGの熟練ゲームマスターです。
        以下の冒険の結果を受けて、感動的で満足感のあるエピローグを生成してください。
        
        # シナリオ情報
        タイトル: {scenario['title']}
        あらすじ: {scenario['summary']}
        
        # 冒険の結果
        終了タイプ: {completion_result.get('ending_type', 'success')}
        達成率: {completion_result.get('completion_percentage', 75)}%
        達成した目標: {', '.join(completion_result.get('achieved_objectives', []))}
        総ターン数: {total_turns}
        
        # 冒険の流れ
        {adventure_summary}
        
        # プレイヤーたちの活躍
        {chr(10).join([f"- {contrib['character_name']}: {', '.join(contrib['key_actions'][:2])}" for contrib in player_contributions])}
        
        # 要求
        1. 物語として自然で感動的な結末を描いてください
        2. プレイヤーたちの成長や絆を強調してください  
        3. 今回の冒険の意義や教訓を含めてください
        4. 300-500文字程度の長さにしてください
        
        出力はエピローグのナレーションテキストのみにしてください。
        """
        
        response = gemini_model.generate_content(epilogue_prompt)
        ending_narrative = response.text
        
        # エピローグデータを作成
        epilogue_data = {
            "ending_narrative": ending_narrative,
            "ending_type": completion_result.get('ending_type', 'success'),
            "player_contributions": player_contributions,
            "adventure_summary": adventure_summary,
            "total_turns": total_turns,
            "completion_percentage": completion_result.get('completion_percentage', 75),
            "generated_at": firestore.SERVER_TIMESTAMP
        }
        
        # Firestoreに保存
        game_ref.update({
            "epilogue": epilogue_data,
            "gameStatus": "finished"
        })
        
        print(f"📜 エピローグ生成完了: {game_id}")
        
        # レスポンス用のエピローグデータ（SERVER_TIMESTAMPを現在時刻に変換）
        response_epilogue_data = epilogue_data.copy()
        response_epilogue_data["generated_at"] = datetime.now().isoformat()
        
        return {"message": "Epilogue generated successfully", "epilogue": response_epilogue_data}
        
    except HTTPException as e:
        raise e

# 手動シナリオ完了エンドポイント
@app.post("/games/{game_id}/manual-complete")
async def manual_complete_scenario(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    """手動でシナリオを完了状態にし、エピローグフェーズに移行する"""
    db = request.app.state.db
    if not db:
        raise HTTPException(status_code=503, detail="Service not available")
    
    try:
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists:
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        
        # ホスト権限確認
        if game_data.get('hostId') != uid:
            raise HTTPException(status_code=403, detail="Only host can manually complete scenario")
        
        # ゲーム状態確認（進行中のゲームのみ）
        if game_data.get('gameStatus') not in ['playing', 'in_progress']:
            raise HTTPException(status_code=400, detail="Game is not in progress")
        
        # 手動完了の結果を作成
        manual_completion_result = {
            "completion_percentage": 100.0,
            "is_completed": True,
            "ending_type": "manual_success",
            "remaining_objectives": [],
            "achieved_objectives": ["手動でシナリオ完了"],
            "force_ending": True,
            "manual_completion": True
        }
        
        # Firestoreを更新
        game_ref.update({
            "completionResult": manual_completion_result,
            "gameStatus": "completed"
        })
        
        print(f"🔧 手動シナリオ完了: {game_id} by {uid}")
        
        return {
            "message": "Scenario manually completed successfully",
            "completion_result": manual_completion_result
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🚨 手動完了エラー: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# テスト用エンドポイント
@app.post("/test-games/{game_id}/force-epilogue")
async def test_generate_epilogue(request: Request, game_id: str):
    """テスト用: 認証なしでエピローグ強制生成"""
    try:
        db = request.app.state.db
        gemini_model = request.app.state.gemini_model
        if not db: raise HTTPException(status_code=503, detail="Service not available")
        
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: 
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        
        # 強制的にエピローグ状態に遷移
        completion_result = {
            "completion_percentage": 85.0,
            "is_completed": True,
            "ending_type": "success",
            "remaining_objectives": [],
            "achieved_objectives": ["軌道ステーション避難", "全員の安全確保"]
        }
        
        game_ref.update({
            "gameStatus": "epilogue",
            "completionResult": completion_result
        })
        
        print(f"🧪 テスト: {game_id} を強制的にエピローグ状態に遷移")
        return {"message": "Game forced to epilogue state", "completion_result": completion_result}
        
    except Exception as e:
        print(f"🚨 テスト用エピローグ強制生成エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Test epilogue failed: {e}")

@app.post("/test-games/{game_id}/complete-epilogue")
async def test_complete_epilogue(request: Request, game_id: str):
    """テスト用: 認証なしで完全なエピローグデータ生成"""
    try:
        db = request.app.state.db
        if not db: raise HTTPException(status_code=503, detail="Service not available")
        
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: 
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        scenario = next((s for s in game_data.get('scenarioOptions', []) if s['id'] == game_data.get('decidedScenarioId')), None)
        
        # モックエピローグデータ
        epilogue_data = {
            "ending_narrative": "レイ・コートニーと仲間たちは、軌道ステーションXの危機を見事に乗り越えました。緊急避難システムの起動により、全クルーの安全を確保し、宇宙での冒険に新たな歴史を刻みました。この困難を通じて、チームワークと勇気の大切さを改めて実感した冒険者たちは、次なる挑戦への準備を整えています。",
            "ending_type": "success",
            "player_contributions": [
                {
                    "player_id": "test_player_1",
                    "character_name": "レイ・コートニー",
                    "key_actions": ["軌道ステーションの調査開始", "避難システムの手動起動", "全員の安全確保"],
                    "dice_rolls": [
                        {"content": "1d20で技術判定: [17] (合計: 17)", "turn": 1},
                        {"content": "1d20で操作判定: [15] (合計: 15)", "turn": 3}
                    ],
                    "highlight_moments": ["見事な技術判定で避難システムを起動", "仲間との連携で危機を乗り越えた"]
                }
            ],
            "adventure_summary": "軌道ステーションXでの緊急事態対応により、全員が無事に避難を完了した。",
            "total_turns": 7,
            "completion_percentage": 85.0,
            "generated_at": datetime.utcnow()
        }
        
        completion_result = {
            "completion_percentage": 85.0,
            "is_completed": True,
            "ending_type": "success",
            "remaining_objectives": [],
            "achieved_objectives": ["軌道ステーション避難", "全員の安全確保"]
        }
        
        # Firestoreに保存
        game_ref.update({
            "epilogue": epilogue_data,
            "gameStatus": "finished",
            "completionResult": completion_result
        })
        
        print(f"🧪 テスト: {game_id} の完全エピローグデータ生成完了")
        return {"message": "Complete epilogue generated", "epilogue": epilogue_data}
        
    except Exception as e:
        print(f"🚨 テスト用完全エピローグ生成エラー: {e}")
        raise HTTPException(status_code=500, detail=f"Complete epilogue failed: {e}")

# テスト用のエピローグ強制生成エンドポイント
@app.post("/test-games/{game_id}/force-epilogue")
async def force_epilogue(request: Request, game_id: str, new_host_uid: str = Query(None)):
    """テスト用: ゲームステータスを強制的にエピローグに変更"""
    db = request.app.state.db
    if not db: 
        raise HTTPException(status_code=503, detail="Service not available")
    
    try:
        print(f"🔍 デバッグ: new_host_uid = {new_host_uid}")
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists: 
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        print(f"🔍 現在のhostId: {game_data.get('hostId')}")
        game_logs = game_data.get('gameLog', [])
        total_turns = game_data.get('currentTurn', 1)
        
        # 簡易的な終了判定（5ターン以上で自動成功）
        completion_percentage = min(85.0, total_turns * 17.0)  # ターンあたり17%の進捗
        ending_type = "success" if completion_percentage >= 75.0 else "failure"
        
        completion_result = {
            "completion_percentage": completion_percentage,
            "is_completed": True,
            "ending_type": ending_type,
            "remaining_objectives": [],
            "achieved_objectives": ["軌道ステーション避難", "全員の安全確保"]
        }
        
        # 更新データ
        update_data = {
            "gameStatus": "epilogue",
            "completionResult": completion_result
        }
        
        # 新しいホストUIDが指定された場合は更新
        if new_host_uid:
            update_data["hostId"] = new_host_uid
            print(f"🔧 ホストID更新: {game_data.get('hostId')} -> {new_host_uid}")
        
        # ゲームステータスを強制的にエピローグに変更
        game_ref.update(update_data)
        
        print(f"🧪 テスト: {game_id} を強制的にエピローグ状態に遷移")
        print(f"📝 更新データ: {update_data}")
        return {"message": "Game forced to epilogue state", "completion_result": completion_result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to force epilogue: {e}")

@app.post("/games/{game_id}/generate-epilogue-video")
async def generate_epilogue_video_endpoint(request: Request, game_id: str, uid: str = Depends(get_current_user_uid)):
    """エピローグのハイライト動画を生成する（トグルスイッチ対応）"""
    db = request.app.state.db
    veo_model = request.app.state.veo_model
    veo_client = request.app.state.veo_client
    veo_model_name = request.app.state.veo_model_name
    
    if not db:
        raise HTTPException(status_code=503, detail="Database service not available")
    
    if not veo_model and not veo_client:
        raise HTTPException(status_code=503, detail="Veo video generation service not available")
    
    try:
        game_ref = db.collection('games').document(game_id)
        game_doc = game_ref.get()
        if not game_doc.exists:
            raise HTTPException(status_code=404, detail="Game not found")
        
        game_data = game_doc.to_dict()
        
        # ホスト権限確認
        if game_data.get('hostId') != uid:
            raise HTTPException(status_code=403, detail="Only host can generate epilogue video")
        
        # エピローグ状態確認
        if game_data.get('gameStatus') not in ['epilogue', 'finished']:
            raise HTTPException(status_code=400, detail="Game is not in epilogue state")
        
        # エピローグデータ確認
        epilogue_data = game_data.get('epilogue')
        if not epilogue_data:
            raise HTTPException(status_code=400, detail="Epilogue not generated yet")
        
        # 既に動画が生成されている場合は既存URLを返す
        if epilogue_data.get('video_url'):
            return {"message": "Video already exists", "video_url": epilogue_data['video_url']}
        
        # シナリオとエピローグ情報を取得
        scenario = next((s for s in game_data.get('scenarioOptions', []) if s['id'] == game_data.get('decidedScenarioId')), {})
        scenario_title = scenario.get('title', 'Unknown Adventure')
        ending_type = epilogue_data.get('ending_type', 'success')
        completion_percentage = epilogue_data.get('completion_percentage', 75.0)
        
        # プレイヤーのハイライトを収集
        player_highlights = []
        for contribution in epilogue_data.get('player_contributions', []):
            character_name = contribution.get('character_name', 'Hero')
            key_actions = contribution.get('key_actions', [])
            if key_actions:
                player_highlights.append(f"{character_name}: {key_actions[0]}")
        
        if not player_highlights:
            player_highlights = ["Epic adventure completion"]
        
        print(f"🎬 エピローグ動画生成開始 - シナリオ: {scenario_title}")
        
        # 動画生成（時間がかかるため非同期処理）
        video_url = await generate_epilogue_video(
            scenario_title=scenario_title, 
            ending_type=ending_type,
            player_highlights=player_highlights,
            completion_percentage=completion_percentage,
            game_id=game_id
        )
        
        if video_url:
            # 動画URLをエピローグデータに保存
            epilogue_data['video_url'] = video_url
            game_ref.update({"epilogue": epilogue_data})
            
            print(f"✅ エピローグ動画生成完了: {video_url}")
            return {"message": "Epilogue video generated successfully", "video_url": video_url}
        else:
            print("❌ エピローグ動画生成に失敗しました")
            raise HTTPException(status_code=500, detail="Failed to generate epilogue video")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ エピローグ動画生成エラー: {e}")
        import traceback
        print(f"🔍 エラーのスタックトレース: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate epilogue video: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)