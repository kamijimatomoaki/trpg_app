import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  LinearProgress,
  Grid,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import { PlayArrow, CheckCircle, Schedule, Movie, Group } from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { markPlayerReady, startGame } from '../services/api';
import { FullscreenOpeningVideo } from '../components/FullscreenOpeningVideo';
import { BookStyleContainer } from '../components/BookStyleContainer';

export const ReadyPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  useGameSession(gameId);

  const { 
    uid,
    gameId: storedGameId, 
    hostId,
    decidedScenarioId,
    scenarioOptions,
    players,
    gameStatus,
    openingVideo,
    videoSettings,
    isLoading, 
    error,
    setError 
  } = useGameStore();

  const [isMarkingReady, setIsMarkingReady] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);

  // 現在のプレイヤーの準備状況
  const currentPlayer = uid ? players[uid] : null;
  const isPlayerReady = currentPlayer?.isReady || false;
  
  // ホスト判定
  const isHost = uid === hostId;

  // 決定されたシナリオの情報を取得
  const selectedScenario = scenarioOptions?.find(s => s.id === decidedScenarioId);

  // 全プレイヤーの準備完了チェック
  const allPlayersReady = Object.values(players).every(player => player.isReady);
  
  // オープニング動画の状況
  const videoStatus = openingVideo?.status || 'generating';
  const videoReady = videoStatus === 'ready';
  const openingVideoEnabledSetting = videoSettings?.openingVideoEnabled ?? true;
  const videoEnabled = openingVideoEnabledSetting && videoStatus !== 'error' && videoStatus !== 'disabled' && openingVideo?.url && !openingVideo?.url.includes('placeholder');

  // ゲーム開始可能かチェック
  const canStartGame = allPlayersReady && (videoReady || !videoEnabled) && isHost;

  // ゲーム状態の変化を監視して自動遷移
  useEffect(() => {
    if (gameStatus === 'playing') {
      navigate(`/game/${storedGameId}/play`);
    }
  }, [gameStatus, storedGameId, navigate]);

  const handleMarkReady = async () => {
    if (!storedGameId || isPlayerReady) return;

    setIsMarkingReady(true);
    setError(null);
    
    try {
      await markPlayerReady(storedGameId);
    } catch (err: any) {
      const message = err.response?.data?.detail || '準備完了の登録に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setIsMarkingReady(false);
    }
  };

  const handleStartGame = async () => {
    if (!storedGameId || !canStartGame) return;

    // 動画が有効な場合のみ全画面動画を表示、そうでなければ直接ゲーム開始
    if (videoEnabled) {
      setShowFullscreenVideo(true);
    } else {
      // 動画なしでゲーム開始
      handleVideoComplete();
    }
  };

  const handleVideoComplete = async () => {
    setShowFullscreenVideo(false);
    setIsStartingGame(true);
    setError(null);
    
    try {
      await startGame(storedGameId!);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'ゲームの開始に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleVideoSkip = () => {
    setShowFullscreenVideo(false);
    // スキップした場合も直接ゲーム開始
    handleVideoComplete();
  };

  const getVideoStatusInfo = () => {
    // 動画設定がオフの場合
    if (!openingVideoEnabledSetting) {
      return {
        icon: <Movie sx={{ color: 'text.disabled' }} />,
        text: 'オープニング動画：無効',
        color: 'info' as const
      };
    }
    
    switch (videoStatus) {
      case 'disabled':
        return {
          icon: <Movie sx={{ color: 'text.disabled' }} />,
          text: 'オープニング動画：無効',
          color: 'info' as const
        };
      case 'generating':
        return {
          icon: <Schedule sx={{ color: 'warning.main' }} />,
          text: 'オープニング動画を生成中...',
          color: 'warning' as const
        };
      case 'ready':
        return {
          icon: <Movie sx={{ color: 'success.main' }} />,
          text: 'オープニング動画準備完了',
          color: 'success' as const
        };
      case 'error':
        return {
          icon: <Movie sx={{ color: 'error.main' }} />,
          text: '動画生成でエラーが発生しました',
          color: 'error' as const
        };
      default:
        return {
          icon: <Schedule sx={{ color: 'info.main' }} />,
          text: '動画準備中...',
          color: 'info' as const
        };
    }
  };

  const videoStatusInfo = getVideoStatusInfo();

  if (isLoading && !scenarioOptions?.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <>
      {/* 全画面オープニング動画 */}
      {selectedScenario && videoEnabled && (
        <FullscreenOpeningVideo
          videoUrl={openingVideo.url}
          scenarioTitle={selectedScenario.title}
          scenarioSummary={selectedScenario.summary}
          isOpen={showFullscreenVideo}
          onComplete={handleVideoComplete}
          onSkip={handleVideoSkip}
        />
      )}

      <BookStyleContainer 
        title="冒険の準備を整えよう"
        subtitle={selectedScenario?.title ? `物語：${selectedScenario.title}` : undefined}
        pageNumber={1}
        totalPages={3}
      >

      {/* シナリオ情報カード */}
      {selectedScenario && (
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {selectedScenario.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {selectedScenario.summary}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
        {/* 左側：準備状況と動画生成状況 */}
        <Box>
          {/* プレイヤー準備状況 */}
          <Card sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))',
            border: '3px solid rgba(139, 69, 19, 0.4)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Group sx={{ mr: 1, color: '#8B4513' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: '#8B4513',
                  fontFamily: '"Cinzel", "Noto Serif JP", serif'
                }}>
                  プレイヤー準備状況
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ 
                  color: '#2F1B14', 
                  fontWeight: 'medium',
                  fontFamily: '"Noto Serif JP", serif'
                }} gutterBottom>
                  {Object.values(players).filter(p => p.isReady).length} / {Object.keys(players).length} 人準備完了
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(Object.values(players).filter(p => p.isReady).length / Object.keys(players).length) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(139, 69, 19, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(45deg, #8B4513, #D2691E)'
                    }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(players).map(([playerId, player]) => (
                  <Box key={playerId} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2, 
                    borderRadius: 2,
                    backgroundColor: player.isReady 
                      ? 'rgba(139, 69, 19, 0.1)' 
                      : 'rgba(139, 69, 19, 0.05)',
                    border: player.isReady 
                      ? '2px solid rgba(139, 69, 19, 0.3)' 
                      : '1px solid rgba(139, 69, 19, 0.2)',
                    color: '#2F1B14'
                  }}>
                    <Avatar 
                      src={player.characterImageUrl || undefined}
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        border: '2px solid #8B4513',
                        background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                        color: '#FFF8DC'
                      }}
                    >
                      {player.characterName?.[0] || player.name?.[0] || '?'}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 'bold',
                        color: '#2F1B14',
                        fontFamily: '"Noto Serif JP", serif'
                      }}>
                        {player.characterName || `プレイヤー ${playerId.substring(0, 8)}`}
                        {playerId === uid && ' (あなた)'}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#8B4513',
                        fontFamily: '"Noto Serif JP", serif'
                      }}>
                        {player.name}
                      </Typography>
                    </Box>
                    
                    {player.isReady ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : (
                      <Schedule sx={{ color: 'warning.main' }} />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* オープニング動画生成状況 */}
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))',
            border: '3px solid rgba(139, 69, 19, 0.4)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {React.cloneElement(videoStatusInfo.icon, { sx: { color: '#D69E2E' } })}
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  ml: 1, 
                  color: '#8B4513',
                  fontFamily: '"Cinzel", "Noto Serif JP", serif'
                }}>
                  オープニング動画
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ 
                  flexGrow: 1, 
                  color: '#2F1B14',
                  fontFamily: '"Noto Serif JP", serif'
                }}>
                  {videoStatusInfo.text}
                </Typography>
                <Chip 
                  label={videoStatus === 'ready' ? '完了' : videoStatus === 'generating' ? '生成中' : 'エラー'}
                  color={videoStatusInfo.color}
                  variant={videoStatus === 'ready' ? 'filled' : 'outlined'}
                />
              </Box>

              {videoStatus === 'generating' && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress sx={{
                    backgroundColor: 'rgba(139, 69, 19, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(45deg, #D69E2E, #FF8C00)'
                    }
                  }} />
                  <Typography variant="caption" sx={{ 
                    mt: 1, 
                    display: 'block', 
                    color: '#8B4513',
                    fontFamily: '"Noto Serif JP", serif',
                    fontStyle: 'italic'
                  }}>
                    AIがあなたたちの冒険のオープニング映像を制作しています...
                  </Typography>
                </Box>
              )}

              {videoStatus === 'ready' && openingVideo?.url && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <video 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
                    }}
                    poster="https://picsum.photos/400/225?random=video"
                  >
                    <source src={openingVideo.url} type="video/mp4" />
                    お使いのブラウザは動画再生に対応していません。
                  </video>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* 右側：アクションボタンとステータス */}
        <Box>
          <Card sx={{ 
            height: 'fit-content',
            background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))',
            border: '3px solid rgba(139, 69, 19, 0.4)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold', 
                color: '#8B4513',
                fontFamily: '"Cinzel", "Noto Serif JP", serif'
              }}>
                準備状況
              </Typography>
              
              <Divider sx={{ my: 2, borderColor: 'rgba(139, 69, 19, 0.3)' }} />
              
              {!isPlayerReady ? (
                <Box>
                  <Typography variant="body2" sx={{ 
                    mb: 3, 
                    color: '#2F1B14',
                    fontFamily: '"Noto Serif JP", serif',
                    lineHeight: 1.6
                  }}>
                    冒険の準備はよろしいですか？<br />
                    準備完了ボタンを押してください。
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={handleMarkReady}
                    disabled={isMarkingReady}
                    sx={{ 
                      mb: 2,
                      background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                      color: '#FFF8DC',
                      fontFamily: '"Noto Serif JP", serif',
                      fontWeight: 'bold',
                      '&:hover': { 
                        background: 'linear-gradient(45deg, #A0522D, #FF8C00)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 16px rgba(139, 69, 19, 0.3)'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #A0A0A0, #C0C0C0)',
                        color: '#E0E0E0'
                      }
                    }}
                  >
                    {isMarkingReady ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        登録中...
                      </>
                    ) : (
                      '準備完了'
                    )}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <CheckCircle sx={{ fontSize: 48, color: '#8B4513', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 'bold',
                    color: '#8B4513',
                    fontFamily: '"Cinzel", "Noto Serif JP", serif'
                  }}>
                    準備完了！
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    mb: 3, 
                    color: '#2F1B14',
                    fontFamily: '"Noto Serif JP", serif',
                    lineHeight: 1.6
                  }}>
                    他のプレイヤーとオープニング動画の準備をお待ちください。
                  </Typography>
                </Box>
              )}

              {/* ホストのゲーム開始ボタン */}
              {isHost && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2, borderColor: 'rgba(139, 69, 19, 0.3)' }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    fontWeight: 'bold', 
                    color: '#D69E2E',
                    fontFamily: '"Cinzel", "Noto Serif JP", serif'
                  }}>
                    ホスト専用
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleStartGame}
                    disabled={!canStartGame || isStartingGame}
                    sx={{ 
                      background: canStartGame 
                        ? 'linear-gradient(45deg, #D69E2E, #FF8C00)'
                        : 'linear-gradient(45deg, #A0A0A0, #C0C0C0)',
                      color: '#FFF8DC',
                      fontFamily: '"Noto Serif JP", serif',
                      fontWeight: 'bold',
                      '&:hover': { 
                        background: canStartGame 
                          ? 'linear-gradient(45deg, #FF8C00, #FFD700)' 
                          : 'linear-gradient(45deg, #A0A0A0, #C0C0C0)',
                        transform: canStartGame ? 'translateY(-1px)' : 'none',
                        boxShadow: canStartGame ? '0 4px 16px rgba(214, 158, 46, 0.3)' : 'none'
                      }
                    }}
                  >
                    {isStartingGame ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        開始中...
                      </>
                    ) : (
                      'ゲーム開始'
                    )}
                  </Button>
                  
                  {!canStartGame && (
                    <Typography variant="caption" sx={{ 
                      mt: 1, 
                      display: 'block', 
                      color: '#8B4513',
                      fontFamily: '"Noto Serif JP", serif',
                      fontStyle: 'italic'
                    }}>
                      {!allPlayersReady && '全プレイヤーの準備完了待ち'}
                      {allPlayersReady && !videoReady && 'オープニング動画の準備待ち'}
                    </Typography>
                  )}
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 進行状況サマリー */}
          <Paper sx={{ 
            mt: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))',
            border: '3px solid rgba(139, 69, 19, 0.4)',
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#8B4513',
              fontFamily: '"Cinzel", "Noto Serif JP", serif'
            }}>
              ゲーム開始まで
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ 
                  color: '#2F1B14',
                  fontFamily: '"Noto Serif JP", serif'
                }}>プレイヤー準備</Typography>
                <Chip 
                  label={allPlayersReady ? '完了' : `${Object.values(players).filter(p => p.isReady).length}/${Object.keys(players).length}`}
                  size="small"
                  color={allPlayersReady ? 'success' : 'warning'}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ 
                  color: '#2F1B14',
                  fontFamily: '"Noto Serif JP", serif'
                }}>オープニング動画</Typography>
                <Chip 
                  label={videoReady ? '完了' : videoStatus}
                  size="small"
                  color={videoReady ? 'success' : videoStatus === 'generating' ? 'warning' : 'error'}
                />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
      </BookStyleContainer>
    </>
  );
};