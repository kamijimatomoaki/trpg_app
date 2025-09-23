import { useGameStore } from '../store/gameStore';

// バックエンドAPIのベースURL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// --- ヘルパー関数: fetch APIでAPIを呼び出す ---
const callApi = async (endpoint: string, method: string, body?: any) => {
  // Firebase認証から最新のトークンを取得
  const { auth } = await import('./firebase');
  let idToken = null;
  
  if (auth.currentUser) {
    try {
      // 強制的に最新のトークンを取得（期限切れの場合は自動更新）
      idToken = await auth.currentUser.getIdToken(true);
      // ストアのトークンも更新
      useGameStore.getState().setIdToken(idToken);
    } catch (error) {
      console.error('トークン取得エラー:', error);
      // フォールバック: ストアのトークンを使用
      idToken = useGameStore.getState().idToken;
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  console.log(`Attempting to send ${method} ${endpoint} request using fetch API...`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch (e) {
      // JSONパースエラーの場合はそのままテキストを使用
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log(`${method} ${endpoint} request sent successfully using fetch API. Response:`, data);
  return data;
};

// --- API呼び出し関数 ---

/**
 * 新しいゲームセッションを作成する
 * @returns { gameId: string, roomId: string }
 */
export const createGame = async () => {
  // body: JSON.stringify({}) を追加
  return callApi('/games', 'POST', {}); 
};

/**
 * 既存のゲームセッションに参加する
 * @param roomId 部屋ID
 * @returns { gameId: string }
 */
export const joinGame = async (roomId: string) => {
  return callApi(`/games/${roomId}/join`, 'POST');
};

/**
 * シナリオ投票を開始する
 * @param gameId ゲームID
 * @param options シナリオ生成オプション
 * @returns { message: string }
 */
export const startVoting = async (gameId: string, options?: {
  difficulty?: 'easy' | 'normal' | 'hard' | 'extreme';
  keywords?: string[];
  theme_preference?: string;
  opening_video_enabled?: boolean;
  epilogue_video_enabled?: boolean;
}) => {
  return callApi(`/games/${gameId}/start-voting`, 'POST', options || {});
};

/**
 * シナリオに投票する
 * @param gameId ゲームID
 * @param scenarioId シナリオID
 * @returns { message: string }
 */
export const voteForScenario = async (gameId: string, scenarioId: string) => {
  return callApi(`/games/${gameId}/vote`, 'POST', { scenarioId });
};

/**
 * キャラクターを作成する
 * @param gameId ゲームID
 * @param characterName キャラクター名
 * @param characterDescription キャラクターの説明
 * @param abilities キャラクターの能力値
 * @returns { characterImageUrl: string }
 */
export const createCharacter = async (gameId: string, characterName: string, characterDescription: string, abilities?: any) => {
  return callApi(`/games/${gameId}/create-character`, 'POST', { 
    characterName, 
    characterDescription,
    abilities 
  });
};

/**
 * ホストが準備完了段階に進む（キャラクター作成完了後）
 * @param gameId ゲームID
 * @returns { message: string }
 */
export const proceedToReady = async (gameId: string) => {
  return callApi(`/games/${gameId}/proceed-to-ready`, 'POST');
};

/**
 * プレイヤーの準備完了をマークする
 * @param gameId ゲームID
 * @returns { message: string }
 */
export const markPlayerReady = async (gameId: string) => {
  return callApi(`/games/${gameId}/ready`, 'POST');
};

/**
 * ゲームを開始する（ホストのみ）
 * @param gameId ゲームID
 * @returns { message: string, initialNarration: string }
 */
export const startGame = async (gameId: string) => {
  return callApi(`/games/${gameId}/start-game`, 'POST');
};

/**
 * プレイヤーのアクションを送信する
 * @param gameId ゲームID
 * @param actionText アクション内容
 * @returns { message: string }
 */
export const submitPlayerAction = async (gameId: string, actionText: string) => {
  return callApi(`/games/${gameId}/action`, 'POST', { actionText });
};

/**
 * 手動でダイスを振る
 * @param gameId ゲームID
 * @param numDice ダイスの数
 * @param numSides ダイスの面数
 * @param description ダイスロールの説明（任意）
 * @returns { message: string, result: { rolls: number[], total: number }, player_name: string }
 */
export const rollManualDice = async (gameId: string, numDice: number, numSides: number, description?: string) => {
  return callApi(`/games/${gameId}/manual-dice`, 'POST', { 
    num_dice: numDice, 
    num_sides: numSides, 
    description: description || "" 
  });
};

/**
 * GMとチャットする
 * @param gameId ゲームID
 * @param message GMへのメッセージ
 * @returns { message: string, gm_response: string, player_message: string, character_name: string }
 */
export const sendGMChat = async (gameId: string, message: string) => {
  return callApi(`/games/${gameId}/gm-chat`, 'POST', { message });
};

/**
 * エピローグのハイライト動画を生成する
 * @param gameId ゲームID
 * @returns { message: string, video_url: string }
 */
export const generateEpilogueVideo = async (gameId: string) => {
  return callApi(`/games/${gameId}/generate-epilogue-video`, 'POST');
};
