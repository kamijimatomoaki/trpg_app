import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Chip,
  Fade,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider
} from '@mui/material';
import { 
  Send, 
  AutoFixHigh, 
  Face, 
  Casino,
  SmartToy,
  Person,
  Movie,
  Flag
} from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { submitPlayerAction, manualCompleteGame } from '../services/api';
import { BookStyleContainer } from '../components/BookStyleContainer';
import DiceRoller from '../components/DiceAnimation/DiceRoller';
import { CharacterList } from '../components/CharacterList';

export const GamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  useGameSession(gameId);

  const { 
    uid,
    gameId: storedGameId, 
    players,
    gameStatus,
    gameLog,
    currentTurn,
    playerActionsThisTurn,
    completionResult,
    epilogue,
    isLoading, 
    error,
    setError 
  } = useGameStore();

  const [playerAction, setPlayerAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<string | null>(null);
  const [isManualCompleting, setIsManualCompleting] = useState(false);

  // 現在のプレイヤーの取得
  const currentPlayer = uid ? players[uid] : null;
  const hasActedThisTurn = uid ? !!playerActionsThisTurn[uid] : false;
  
  // ホスト判定
  const gameSession = useGameSession(gameId || '');
  const gameData = gameSession?.gameData;
  const isHost = gameData?.hostId === uid;

  // デバッグ用ログ出力（簡略化）
  useEffect(() => {
    console.log('GamePlayPage:', {
      gameLogLength: gameLog?.length || 0,
      gameStatus,
      uid: uid ? 'authenticated' : 'none'
    });
  }, [gameLog?.length, gameStatus, uid]);

  // ヘルパー関数：ログアイコンの取得
  const getLogIcon = React.useCallback((log: any) => {
    switch (log.type) {
      case 'gm_narration':
      case 'initial_narration':
        return <AutoFixHigh sx={{ color: '#D69E2E', fontSize: 28 }} />;
      case 'gm_response':
        return <SmartToy sx={{ color: '#D69E2E', fontSize: 28 }} />;
      case 'player_action':
        return <Person sx={{ color: '#4FC3F7', fontSize: 28 }} />;
      case 'dice_roll':
        return <Casino sx={{ color: '#FF9800', fontSize: 28 }} />;
      default:
        return <Face sx={{ color: '#A0AEC0', fontSize: 28 }} />;
    }
  }, []);

  // ヘルパー関数：ログタイトルの取得
  const getLogTitle = React.useCallback((log: any) => {
    switch (log.type) {
      case 'gm_narration':
      case 'initial_narration':
        return 'ゲームマスター';
      case 'gm_response':
        return 'ゲームマスター';
      case 'player_action':
        const playerName = log.playerId && players[log.playerId] 
          ? (players[log.playerId].characterName || players[log.playerId].name || 'プレイヤー')
          : 'プレイヤー';
        return playerName;
      case 'dice_roll':
        return 'ダイス判定';
      default:
        return 'システム';
    }
  }, [players]);

  // ゲームログのレンダリングを最適化（useMemoでメモ化）
  const renderedGameLogs = useMemo(() => {
    console.log('🔍 GameLog rendering - gameLog:', gameLog);
    if (!gameLog || gameLog.length === 0) {
      console.log('⚠️ GameLog is empty or null');
      return (
        <ListItem>
          <Typography variant="body2" sx={{ color: '#8B4513', fontStyle: 'italic' }}>
            冒険の記録はまだありません。物語を始めましょう！
          </Typography>
        </ListItem>
      );
    }

    const renderedItems = gameLog.map((log, index) => {
      try {
        // 安定したkeyの生成（timestampがない場合はインデックスのみ使用）
        const stableKey = log.timestamp?.seconds 
          ? `log-${log.turn || 0}-${log.type}-${log.timestamp.seconds}-${index}`
          : `log-${log.turn || 0}-${log.type}-${index}`;

        // ログアイコンの取得（インライン化）
        let logIcon;
        switch (log.type) {
          case 'gm_narration':
          case 'initial_narration':
            logIcon = <AutoFixHigh sx={{ color: '#D69E2E', fontSize: 28 }} />;
            break;
          case 'gm_response':
            logIcon = <SmartToy sx={{ color: '#D69E2E', fontSize: 28 }} />;
            break;
          case 'player_action':
            logIcon = <Person sx={{ color: '#4FC3F7', fontSize: 28 }} />;
            break;
          case 'dice_roll':
            logIcon = <Casino sx={{ color: '#FF9800', fontSize: 28 }} />;
            break;
          default:
            logIcon = <Face sx={{ color: '#A0AEC0', fontSize: 28 }} />;
        }

        // ログタイトルの取得（インライン化）
        let logTitle;
        switch (log.type) {
          case 'gm_narration':
          case 'initial_narration':
          case 'gm_response':
            logTitle = 'ゲームマスター';
            break;
          case 'player_action':
            const playerName = log.playerId && players[log.playerId] 
              ? (players[log.playerId].characterName || players[log.playerId].name || 'プレイヤー')
              : 'プレイヤー';
            logTitle = playerName;
            break;
          case 'dice_roll':
            logTitle = 'ダイス判定';
            break;
          default:
            logTitle = 'システム';
        }
        
        return (
          <ListItem 
            key={stableKey}
            sx={{ 
              mb: 2,
              p: 0,
              display: 'block'
            }}
          >
            <Paper sx={{
              p: 2.5,
              background: (log.type.includes('gm') || log.type === 'initial_narration')
                ? 'linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))'
                : log.type === 'dice_roll'
                ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(184, 134, 11, 0.05))'
                : 'linear-gradient(135deg, rgba(72, 61, 139, 0.08), rgba(106, 90, 205, 0.05))',
              border: `2px solid ${(log.type.includes('gm') || log.type === 'initial_narration') ? 'rgba(139, 69, 19, 0.3)' : 
                                log.type === 'dice_roll' ? 'rgba(218, 165, 32, 0.4)' : 'rgba(72, 61, 139, 0.3)'}`,
              borderRadius: 2,
              position: 'relative',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(139, 69, 19, 0.1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(139, 69, 19, 0.15)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: (log.type.includes('gm') || log.type === 'initial_narration')
                  ? 'linear-gradient(180deg, #8B4513, #D2691E)'
                  : log.type === 'dice_roll'
                  ? 'linear-gradient(180deg, #DAA520, #B8860B)'
                  : 'linear-gradient(180deg, #483D8B, #6A5ACD)',
                borderRadius: '0 2px 2px 0'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pl: 1 }}>
                <Box sx={{ 
                  minWidth: 40,
                  pt: 0.3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  {React.cloneElement(logIcon, {
                    sx: {
                      ...logIcon.props.sx,
                      fontSize: 24,
                      color: (log.type.includes('gm') || log.type === 'initial_narration') ? '#8B4513' : 
                             log.type === 'dice_roll' ? '#DAA520' : '#483D8B'
                    }
                  })}
                  {log.turn > 0 && (
                    <Chip 
                      label={`${log.turn}`} 
                      size="small" 
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                        color: '#FFF8DC',
                        fontWeight: 'bold',
                        minWidth: '24px'
                      }}
                    />
                  )}
                </Box>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: (log.type.includes('gm') || log.type === 'initial_narration') ? '#8B4513' : 
                             log.type === 'dice_roll' ? '#DAA520' : '#483D8B',
                      fontFamily: '"Cinzel", "Noto Serif JP", serif',
                      letterSpacing: '0.02em'
                    }}>
                      {logTitle}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-wrap', 
                      color: '#2F1B14',
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      fontFamily: '"Noto Serif JP", serif'
                    }}>
                      {log.content || log.text || 'コンテンツが見つかりません'}
                    </Typography>
                    
                    {/* 画像がある場合は表示 */}
                    {log.imageUrl && (
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={log.imageUrl}
                          alt="シーンの画像"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(139, 69, 19, 0.2)',
                            border: '2px solid rgba(139, 69, 19, 0.3)'
                          }}
                          onError={(e) => {
                            // 画像読み込みエラー時はプレースホルダーを表示
                            e.currentTarget.style.display = 'none';
                            console.warn(`画像の読み込みに失敗しました: ${log.imageUrl}`);
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </ListItem>
        );
      } catch (error) {
        console.error(`Error rendering log ${index}:`, error, log);
        // nullの代わりにエラー表示のListItemを返却
        return (
          <ListItem key={`error-${index}`} sx={{ mb: 2, p: 0, display: 'block' }}>
            <Paper sx={{ p: 2, bgcolor: '#ffebee', border: '1px solid #f44336' }}>
              <Typography variant="body2" color="error">
                ログエントリ #{index + 1} の表示でエラーが発生しました。
              </Typography>
            </Paper>
          </ListItem>
        );
      }
    });
    
    // デバッグログを簡略化
    console.log('🚨 renderedItems length:', renderedItems.length);
    console.log('🚨 renderedItems keys:', renderedItems.map(item => item?.key || 'no-key'));
    
    // nullアイテムがないことを確認してフィルタリング
    const validItems = renderedItems.filter(item => item !== null);
    console.log('🚨 valid items length:', validItems.length);
    
    return validItems;
  }, [gameLog, players]);

  // ゲーム終了状態の監視
  useEffect(() => {
    if (gameStatus === 'completed' && completionResult) {
      // エピローグページに遷移
      navigate(`/game/${gameId}/epilogue`);
    }
  }, [gameStatus, completionResult, gameId, navigate]);

  // アクション送信処理
  const handleSubmitAction = async () => {
    if (!gameId || !playerAction.trim()) return;
    
    setIsSubmitting(true);
    setIsAIThinking(true);
    setError(null);
    
    try {
      await submitPlayerAction(gameId, playerAction.trim());
      setPlayerAction('');
    } catch (err: any) {
      console.error('プレイヤーアクション送信エラー:', err);
      setError(err.message || 'アクションの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
      // AI思考中の状態は、新しいGM応答を受け取るまで継続
    }
  };

  // GM応答を受信したらAI思考中状態をクリア
  useEffect(() => {
    if (gameLog && gameLog.length > 0) {
      const lastLog = gameLog[gameLog.length - 1];
      if (lastLog.type === 'gm_response' || lastLog.type === 'gm_narration') {
        setIsAIThinking(false);
      }
    }
  }, [gameLog]);

  // 手動シナリオ完了処理
  const handleManualComplete = async () => {
    if (!gameId || !isHost) return;

    const confirmMessage = "シナリオを手動で完了してエピローグに進みますか？\n\n注意: この操作は取り消せません。";
    if (!window.confirm(confirmMessage)) return;

    setIsManualCompleting(true);
    try {
      await manualCompleteGame(gameId);
      // 成功時は自動的にエピローグページに遷移される（useEffectで監視）
      alert('シナリオを手動で完了しました。エピローグページに移動します。');
    } catch (err: any) {
      console.error('手動完了エラー:', err);
      alert(`エラー: ${err.message}`);
    } finally {
      setIsManualCompleting(false);
    }
  };


  if (isLoading) {
    return (
      <BookStyleContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} sx={{ color: '#8B4513' }} />
        </Box>
      </BookStyleContainer>
    );
  }

  if (error) {
    return (
      <BookStyleContainer>
        <Alert severity="error" sx={{ mb: 3 }}>
          エラー: {error}
        </Alert>
      </BookStyleContainer>
    );
  }

  return (
    <BookStyleContainer>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh', // 最小高さのみ設定
        width: '100%',
        padding: 2 // 余白も追加
      }}>
        {/* ヘッダー */}
        <Paper elevation={2} sx={{ 
          p: 2, 
          mb: 2,
          background: 'linear-gradient(135deg, #F5E6D3, #E8D5B7)',
          border: '2px solid #8B4513',
          borderRadius: 2
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#8B4513',
            fontFamily: '"Cinzel", "Noto Serif JP", serif',
            textAlign: 'center',
            mb: 1
          }}>
            冒険の記録
          </Typography>
          {currentPlayer && (
            <Typography variant="body2" sx={{ 
              color: '#6B4423',
              textAlign: 'center'
            }}>
              現在のプレイヤー: {currentPlayer.characterName || currentPlayer.name || '名無しの冒険者'}
            </Typography>
          )}
        </Paper>

        {/* メインコンテンツエリア */}
        <Box sx={{ 
          width: '100%',
          height: 'auto', // 自動高さ
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* ゲームログ表示エリア */}
          <Paper elevation={1} sx={{ 
            width: '100%',
            minHeight: '600px', // 最小高さのみ設定
            p: 3,
            background: 'linear-gradient(135deg, #FFF8DC, #F5E6D3)',
            border: '2px solid #D2B48C',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              width: '100%',
              height: '500px', // 固定高さでスクロール領域確保
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(139, 69, 19, 0.1)',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'linear-gradient(45deg, #A0522D, #CD853F)'
              }
            }}>
              <List sx={{ p: 0, m: 0 }}>
                {/* 最適化されたゲームログレンダリング */}
                {renderedGameLogs}

                {/* AI応答待機中のUI */}
                {isAIThinking && (
                  <ListItem 
                    sx={{ 
                      mb: 3,
                      p: 0,
                      display: 'block'
                    }}
                  >
                    <Paper sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))',
                      border: '2px solid rgba(139, 69, 19, 0.3)',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <CircularProgress size={20} sx={{ color: '#8B4513' }} />
                        <Typography sx={{ color: '#8B4513', fontStyle: 'italic' }}>
                          ゲームマスターが考えています...
                        </Typography>
                      </Box>
                    </Paper>
                  </ListItem>
                )}
              </List>
            </Box>
          </Paper>

          {/* アクション入力エリア */}
          <Paper elevation={2} sx={{ 
            mt: 2,
            p: 3,
            background: 'linear-gradient(135deg, #F5E6D3, #E8D5B7)',
            border: '2px solid #8B4513',
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                label="あなたの行動を入力してください"
                value={playerAction}
                onChange={(e) => setPlayerAction(e.target.value)}
                disabled={isSubmitting || hasActedThisTurn}
                placeholder={hasActedThisTurn ? 'このターンは既に行動済みです' : '例: 洞窟の奥に向かって静かに進む'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFF8DC',
                    '& fieldset': {
                      borderColor: '#D2B48C'
                    },
                    '&:hover fieldset': {
                      borderColor: '#8B4513'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8B4513'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#8B4513'
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAction();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSubmitAction}
                disabled={isSubmitting || !playerAction.trim() || hasActedThisTurn}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                sx={{
                  minWidth: '120px',
                  height: '56px',
                  background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                  color: '#FFF8DC',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #A0522D, #CD853F)',
                    boxShadow: '0 6px 16px rgba(139, 69, 19, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(139, 69, 19, 0.3)',
                    color: 'rgba(255, 248, 220, 0.5)'
                  }
                }}
              >
                {isSubmitting ? '送信中...' : '送信'}
              </Button>
            </Box>
            
            {hasActedThisTurn && (
              <Typography variant="caption" sx={{ 
                color: '#8B4513',
                mt: 1,
                display: 'block',
                fontStyle: 'italic'
              }}>
                このターンは既に行動済みです。他のプレイヤーの行動をお待ちください。
              </Typography>
            )}

            {/* 手動完了ボタン（ホストのみ表示） */}
            {isHost && gameStatus === 'playing' && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={handleManualComplete}
                  disabled={isManualCompleting}
                  startIcon={isManualCompleting ? <CircularProgress size={16} /> : <Flag />}
                  sx={{
                    color: '#D2691E',
                    borderColor: '#D2691E',
                    '&:hover': {
                      borderColor: '#8B4513',
                      backgroundColor: 'rgba(139, 69, 19, 0.04)'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(139, 69, 19, 0.3)',
                      color: 'rgba(139, 69, 19, 0.3)'
                    }
                  }}
                >
                  {isManualCompleting ? 'シナリオ完了中...' : 'シナリオを手動で完了'}
                </Button>
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  color: '#8B4513',
                  mt: 0.5,
                  fontStyle: 'italic'
                }}>
                  ※ AIが終了を判定しない場合のみ使用してください
                </Typography>
              </Box>
            )}
          </Paper>

          {/* ダイスローラー */}
          <Box sx={{ mt: 2 }}>
            <DiceRoller 
              onRoll={(result) => console.log('Dice rolled:', result)}
              diceType="d20"
              disabled={false}
            />
          </Box>

          {/* キャラクター一覧 */}
          <Box sx={{ mt: 2 }}>
            <CharacterList
              players={players}
              currentUserId={uid}
              onCharacterClick={(playerId) => setSelectedPlayerForDetail(playerId)}
            />
          </Box>
        </Box>

        {/* プレイヤー詳細ダイアログ */}
        <Dialog 
          open={!!selectedPlayerForDetail} 
          onClose={() => setSelectedPlayerForDetail(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #F5E6D3, #E8D5B7)',
            color: '#8B4513',
            fontFamily: '"Cinzel", "Noto Serif JP", serif'
          }}>
            プレイヤー詳細
          </DialogTitle>
          <DialogContent sx={{ 
            background: 'linear-gradient(135deg, #FFF8DC, #F5E6D3)',
            p: 3
          }}>
            {selectedPlayerForDetail && players[selectedPlayerForDetail] && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  {players[selectedPlayerForDetail].characterImageUrl && (
                    <Avatar 
                      src={players[selectedPlayerForDetail].characterImageUrl}
                      sx={{ width: 80, height: 80 }}
                    />
                  )}
                  <Box>
                    <Typography variant="h6" sx={{ color: '#8B4513', fontWeight: 'bold' }}>
                      {players[selectedPlayerForDetail].characterName || '名無しの冒険者'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B4423' }}>
                      プレイヤー: {players[selectedPlayerForDetail].name || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2, borderColor: 'rgba(139, 69, 19, 0.3)' }} />
                
                <Typography variant="body1" sx={{ 
                  color: '#2F1B14',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap'
                }}>
                  {players[selectedPlayerForDetail].characterDescription || 'キャラクターの説明がありません。'}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </BookStyleContainer>
  );
};