import { create } from 'zustand';

// シナリオオプションの型定義
interface ScenarioOption {
  id: string;
  title: string;
  summary: string;
}

// オープニング動画の状態
interface OpeningVideo {
  status: 'generating' | 'ready' | 'error';
  url?: string;
  prompt?: string;
}

// ゲームログエントリ
interface GameLog {
  turn: number;
  type: 'gm_narration' | 'initial_narration' | 'player_action' | 'gm_response' | 'dice_roll';
  content: string;
  playerId?: string;
  imageUrl?: string;
  timestamp?: any; // Firestore timestamp
  text?: string; // 代替フィールド
}

// アプリケーション全体で共有する状態の型を定義
interface GameState {
  gameId: string | null;
  roomId: string | null;
  hostId: string | null;
  gameStatus: string | null;
  players: Record<string, any>; // 簡易的にany型を使用。後でPlayerモデルを定義する
  uid: string | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
  // シナリオ投票関連
  scenarioOptions: ScenarioOption[] | null;
  votes: Record<string, string[]> | null; // scenarioId -> voterIds[]
  decidedScenarioId: string | null;
  // オープニング動画関連
  openingVideo: OpeningVideo | null;
  // 動画設定
  videoSettings: {
    openingVideoEnabled: boolean;
    epilogueVideoEnabled: boolean;
  } | null;
  // ゲームプレイ関連
  gameLog: GameLog[];
  currentTurn: number;
  playerActionsThisTurn: Record<string, string>; // playerId -> actionText
  // エピローグ関連
  epilogue: any | null; // エピローグデータ
  completionResult: any | null; // 完了結果
}

// 状態を更新するためのアクション（関数）の型を定義
interface GameActions {
  setAuth: (auth: { uid: string; idToken: string }) => void;
  setIdToken: (idToken: string) => void;
  setGame: (game: { gameId: string; roomId: string }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  clearGame: () => void;
}

// Zustandストアを作成
export const useGameStore = create<GameState & GameActions>((set) => ({
  // 初期状態
  gameId: null,
  roomId: null,
  hostId: null,
  gameStatus: null,
  players: {},
  uid: null,
  idToken: null,
  isLoading: false,
  error: null,
  scenarioOptions: null,
  votes: null,
  decidedScenarioId: null,
  openingVideo: null,
  videoSettings: null,
  gameLog: [],
  currentTurn: 1,
  playerActionsThisTurn: {},
  epilogue: null,
  completionResult: null,

  // アクションの実装
  setAuth: ({ uid, idToken }) => set({ uid, idToken }),
  setIdToken: (idToken) => set({ idToken }),
  setGame: ({ gameId, roomId }) => set({ gameId, roomId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ uid: null, idToken: null }),
  clearGame: () => set({ 
    gameId: null, 
    roomId: null, 
    hostId: null, 
    gameStatus: null, 
    players: {},
    scenarioOptions: null,
    votes: null,
    decidedScenarioId: null,
    openingVideo: null,
    gameLog: [],
    currentTurn: 1,
    playerActionsThisTurn: {},
    epilogue: null,
    completionResult: null
  }),
}));
