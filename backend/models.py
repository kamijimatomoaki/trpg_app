from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from datetime import datetime

# Firestoreのドキュメントは辞書として扱われるため、Pydanticモデルで構造を定義します。

class CharacterAbilities(BaseModel):
    """キャラクターの基本能力値（D&D風システム）"""
    strength: int = 10      # 筋力（物理攻撃、運搬能力）
    dexterity: int = 10     # 敏捷性（回避、盗賊技能）
    constitution: int = 10  # 体力（HP、毒耐性）
    intelligence: int = 10  # 知力（魔法、知識）
    wisdom: int = 10        # 判断力（感知、意志）
    charisma: int = 10      # 魅力（交渉、指導力）

class Player(BaseModel):
    name: str  # UIDで代用
    characterName: Optional[str] = None
    characterDescription: Optional[str] = None
    characterImageUrl: Optional[str] = None
    abilities: Optional[CharacterAbilities] = Field(default_factory=CharacterAbilities)
    isReady: bool = False
    joinedAt: datetime = Field(default_factory=datetime.utcnow)

class ScenarioEndConditions(BaseModel):
    primary_objectives: List[str]  # メイン目標
    success_criteria: List[str]    # 成功条件
    failure_criteria: List[str]    # 失敗条件  
    completion_threshold: float = 0.8  # 終了判定の閾値 (0.8 = 80%完了)
    max_turns: int = 50           # 最大ターン数

class ScenarioOption(BaseModel):
    id: str
    title: str
    summary: str
    endConditions: Optional[ScenarioEndConditions] = None

class OpeningVideo(BaseModel):
    status: Literal['generating', 'ready', 'error'] = 'generating'
    url: Optional[str] = None
    prompt: str

class GameLog(BaseModel):
    turn: int
    type: Literal['gm_narration', 'player_action', 'gm_response', 'image_generation', 'dice_roll']
    content: str
    imageUrl: Optional[str] = None
    playerId: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CompletionResult(BaseModel):
    completion_percentage: float
    is_completed: bool
    ending_type: Literal['great_success', 'success', 'failure', 'disaster']
    remaining_objectives: List[str]
    achieved_objectives: List[str]

class PlayerContribution(BaseModel):
    player_id: str
    character_name: str
    key_actions: List[str]
    dice_rolls: List[Dict]
    highlight_moments: List[str]

class EpilogueData(BaseModel):
    ending_narrative: str
    ending_type: Literal['great_success', 'success', 'failure', 'disaster']
    player_contributions: List[PlayerContribution]
    adventure_summary: str
    total_turns: int
    completion_percentage: float
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class Game(BaseModel):
    id: Optional[str] = None # Document ID
    roomId: str
    hostId: str
    gameStatus: Literal['lobby', 'voting', 'creating_char', 'ready_to_start', 'playing', 'epilogue', 'finished'] = 'lobby'
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    players: Dict[str, Player] = {}
    scenarioOptions: Optional[List[ScenarioOption]] = None
    votes: Optional[Dict[str, List[str]]] = None # { scenarioId: [uid1, uid2] }
    decidedScenarioId: Optional[str] = None
    openingVideo: Optional[OpeningVideo] = None
    gameLog: Optional[List[GameLog]] = []
    currentTurn: int = 0
    playerActionsThisTurn: Optional[Dict[str, str]] = {}
    endConditions: Optional[ScenarioEndConditions] = None
    completionResult: Optional[CompletionResult] = None
    epilogue: Optional[EpilogueData] = None
