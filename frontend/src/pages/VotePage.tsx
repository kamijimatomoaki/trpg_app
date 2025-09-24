import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActionArea,
  Avatar,
  AvatarGroup,
  CircularProgress, 
  Alert,
  Fade,
  Tooltip
} from '@mui/material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { voteForScenario } from '../services/api';

interface ScenarioOption {
  id: string;
  title: string;
  summary: string;
}

export const VotePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  useGameSession(gameId);

  const { 
    uid, 
    gameId: storedGameId, 
    scenarioOptions, 
    votes, 
    players, 
    gameStatus, 
    isLoading, 
    error,
    setLoading,
    setError 
  } = useGameStore();

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  // ゲーム状態の変化を監視して自動遷移
  useEffect(() => {
    if (gameStatus && gameStatus !== 'voting') {
      if (gameStatus === 'creating_char') {
        navigate(`/game/${storedGameId}/character-creation`);
      }
    }
  }, [gameStatus, storedGameId, navigate]);

  // 現在のユーザーの投票を確認
  useEffect(() => {
    if (votes && uid) {
      for (const [scenarioId, voters] of Object.entries(votes)) {
        if (voters.includes(uid)) {
          setSelectedScenario(scenarioId);
          break;
        }
      }
    }
  }, [votes, uid]);

  const handleVote = async (scenarioId: string) => {
    if (!storedGameId || selectedScenario === scenarioId) return;

    setLoading(true);
    setError(null);
    try {
      console.log(`🗳️ 投票開始: gameId=${storedGameId}, scenarioId=${scenarioId}`);
      await voteForScenario(storedGameId, scenarioId);
      console.log(`✅ 投票成功: scenarioId=${scenarioId}`);
      setSelectedScenario(scenarioId);
    } catch (err: any) {
      // 詳細なエラーログ
      console.error('❌ 投票エラー詳細:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        gameId: storedGameId,
        scenarioId: scenarioId
      });
      
      const message = err.response?.data?.detail || '投票に失敗しました。詳細はコンソールを確認してください。';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 各シナリオに投票したプレイヤーのアバターを取得
  const getVotersForScenario = (scenarioId: string) => {
    if (!votes || !votes[scenarioId]) return [];
    return votes[scenarioId].map(voterId => ({
      id: voterId,
      name: players[voterId]?.name || voterId.substring(0, 4),
      isCurrentUser: voterId === uid
    }));
  };

  // 全員が投票完了したかチェック
  const allPlayersVoted = () => {
    if (!votes || !players) return false;
    const totalVotes = Object.values(votes).flat().length;
    return totalVotes === Object.keys(players).length;
  };

  if (isLoading && !scenarioOptions?.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!scenarioOptions?.length) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="info">シナリオ候補を読み込んでいます...</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center', minHeight: '100vh' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        fontFamily: 'Merriweather',
        background: 'linear-gradient(45deg, #9c27b0, #673ab7)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        textShadow: '0 0 30px rgba(156, 39, 176, 0.3)'
      }}>
        夢のオーブから物語を選ぼう
      </Typography>
      
      <Typography variant="h6" color="text.primary" gutterBottom sx={{ mb: 4 }}>
        気になるオーブをクリックして、あなたの冒険を始めましょう
      </Typography>

      {/* 魔法のオーブエリア */}
      <Box sx={{ 
        mt: 6, 
        mb: 4,
        minHeight: '400px',
        position: 'relative',
        background: 'radial-gradient(ellipse at center, rgba(63, 81, 181, 0.1) 0%, transparent 70%)',
        borderRadius: '20px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 3,
        p: 4
      }}>
        {scenarioOptions.map((scenario, index) => {
          const voters = getVotersForScenario(scenario.id);
          const isSelected = selectedScenario === scenario.id;
          const isHovered = hoveredScenario === scenario.id;
          
          return (
            <Fade in timeout={1000 + index * 300} key={scenario.id}>
              <Box sx={{ position: 'relative' }}>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {scenario.title}
                      </Typography>
                      <Typography variant="body2">{scenario.summary}</Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Card
                    component={CardActionArea}
                    onClick={() => handleVote(scenario.id)}
                    onMouseEnter={() => setHoveredScenario(scenario.id)}
                    onMouseLeave={() => setHoveredScenario(null)}
                    sx={{
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      background: isSelected
                        ? `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 30%, transparent 70%), 
                           linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%)`
                        : `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 30%, transparent 70%),
                           linear-gradient(135deg, #8B4513 0%, #CD853F 30%, #DAA520 70%, #FFD700 100%)`,
                      transform: isHovered || isSelected ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: isSelected 
                        ? `inset 0 -8px 16px rgba(0,0,0,0.3),
                           inset 0 8px 16px rgba(255,255,255,0.2),
                           0 0 40px rgba(102, 126, 234, 0.8),
                           0 8px 25px rgba(0,0,0,0.4)`
                        : isHovered 
                        ? `inset 0 -8px 16px rgba(0,0,0,0.3),
                           inset 0 8px 16px rgba(255,255,255,0.2),
                           0 0 30px rgba(255, 215, 0, 0.6),
                           0 8px 25px rgba(0,0,0,0.4)`
                        : `inset 0 -8px 16px rgba(0,0,0,0.2),
                           inset 0 8px 16px rgba(255,255,255,0.15),
                           0 12px 30px rgba(0, 0, 0, 0.3)`,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'visible',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: '15%',
                        left: '20%',
                        width: '30%',
                        height: '25%',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
                        filter: 'blur(2px)',
                        zIndex: 1
                      },
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, 
                                      rgba(255,255,255,0.3) 0%, 
                                      transparent 30%, 
                                      transparent 70%, 
                                      rgba(0,0,0,0.2) 100%)`,
                        pointerEvents: 'none'
                      },
                      '&:hover': {
                        transform: 'scale(1.08)',
                      },
                      // 浮遊アニメーション
                      animation: `float-${index} 3s ease-in-out infinite`,
                      '@keyframes float-0': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-10px)' },
                      },
                      '@keyframes float-1': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-15px)' },
                      },
                      '@keyframes float-2': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-8px)' },
                      },
                    }}
                  >
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: '100%',
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        textShadow: `0 2px 8px rgba(0,0,0,0.6),
                                     0 0 20px rgba(255,255,255,0.3)`,
                        fontSize: '1.2rem',
                        background: isSelected 
                          ? 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 100%)'
                          : 'linear-gradient(45deg, #fff5e1 30%, #ffffff 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                        fontFamily: 'Georgia, serif'
                      }}>
                        {scenario.title}
                      </Typography>
                      
                      {isSelected && (
                        <Typography variant="caption" sx={{ 
                          mt: 1, 
                          opacity: 0.95,
                          textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                          color: '#e3f2fd',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 0.9 },
                            '50%': { opacity: 1 }
                          }
                        }}>
                          ✨ 選択中 ✨
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Tooltip>

                {/* 投票者のアバター表示 */}
                {voters.length > 0 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: -40, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <AvatarGroup max={4} sx={{ 
                      '& .MuiAvatar-root': { 
                        width: 32, 
                        height: 32,
                        border: '2px solid white',
                        fontSize: '0.8rem'
                      }
                    }}>
                      {voters.map(voter => (
                        <Avatar 
                          key={voter.id}
                          sx={{ 
                            bgcolor: voter.isCurrentUser ? 'primary.main' : 'secondary.main',
                            fontWeight: voter.isCurrentUser ? 'bold' : 'normal'
                          }}
                        >
                          {voter.name[0].toUpperCase()}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Box>
                )}
              </Box>
            </Fade>
          );
        })}
      </Box>

      {/* 投票状況表示 */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" gutterBottom>
          投票状況 ({Object.values(votes || {}).flat().length} / {Object.keys(players).length}人)
        </Typography>
        
        {allPlayersVoted() && (
          <Alert severity="success" sx={{ mt: 2 }}>
            全員の投票が完了しました！まもなくキャラクター作成画面に移動します...
          </Alert>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Container>
  );
};