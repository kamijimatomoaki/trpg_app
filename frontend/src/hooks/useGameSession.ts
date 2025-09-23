import { useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useGameStore } from '../store/gameStore';

export const useGameSession = (gameId: string | undefined) => {
  const setError = useGameStore((state) => state.setError); // setErrorのみ個別に取得
  
  // Zustandストアから必要なデータを個別に取得（オブジェクト生成を避ける）
  const storedGameId = useGameStore((state) => state.gameId);
  const roomId = useGameStore((state) => state.roomId);
  const hostId = useGameStore((state) => state.hostId);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const players = useGameStore((state) => state.players);
  const scenarioOptions = useGameStore((state) => state.scenarioOptions);
  const votes = useGameStore((state) => state.votes);
  const decidedScenarioId = useGameStore((state) => state.decidedScenarioId);
  const openingVideo = useGameStore((state) => state.openingVideo);
  const gameLog = useGameStore((state) => state.gameLog);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const playerActionsThisTurn = useGameStore((state) => state.playerActionsThisTurn);
  const epilogue = useGameStore((state) => state.epilogue);
  const completionResult = useGameStore((state) => state.completionResult);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);

  useEffect(() => {
    if (!gameId) {
      setError('Game IDが指定されていません。');
      return;
    }

    const gameRef = doc(db, 'games', gameId);

    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const gameData = docSnapshot.data();
        // Zustandストアを直接更新
        useGameStore.setState({
          gameId: docSnapshot.id,
          roomId: gameData?.roomId || null,
          hostId: gameData?.hostId || null,
          gameStatus: gameData?.gameStatus || null,
          players: gameData?.players || {},
          scenarioOptions: gameData?.scenarioOptions || null,
          votes: gameData?.votes || null,
          decidedScenarioId: gameData?.decidedScenarioId || null,
          openingVideo: gameData?.openingVideo || null,
          gameLog: gameData?.gameLog || [],
          currentTurn: gameData?.currentTurn || 1,
          playerActionsThisTurn: gameData?.playerActionsThisTurn || {},
          epilogue: gameData?.epilogue || null, // エピローグデータ
          completionResult: gameData?.completionResult || null, // 完了結果
          isLoading: false, // データが取得できたのでローディング終了
          error: null, // エラーをクリア
        });
      } else {
        setError('ゲームが見つかりません。');
        useGameStore.getState().clearGame();
        useGameStore.setState({ isLoading: false }); // エラー時もローディング終了
      }
    }, (error) => {
      console.error('Firestoreの監視エラー:', error);
      setError('ゲーム情報の取得中にエラーが発生しました。');
      useGameStore.setState({ isLoading: false }); // エラー時もローディング終了
    });

    // コンポーネントがアンマウントされるときに監視を停止
    return () => unsubscribe();
  }, [gameId, setError]); // 依存配列から個々のアクションを削除
  
  // フック戻り値をメモ化
  const gameData = useMemo(() => {
    if (!storedGameId) return null;
    return {
      gameId: storedGameId,
      roomId,
      hostId,
      gameStatus,
      players,
      scenarioOptions,
      votes,
      decidedScenarioId,
      openingVideo,
      gameLog,
      currentTurn,
      playerActionsThisTurn,
      epilogue,
      completionResult
    };
  }, [storedGameId, roomId, hostId, gameStatus, players, scenarioOptions, votes, decidedScenarioId, openingVideo, gameLog, currentTurn, playerActionsThisTurn, epilogue, completionResult]);

  return useMemo(() => ({
    gameData,
    loading: isLoading,
    error
  }), [gameData, isLoading, error]);
};
