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
      await voteForScenario(storedGameId, scenarioId);
      setSelectedScenario(scenarioId);
    } catch (err: any) {
      const message = err.response?.data?.detail || '投票に失敗しました。';
      setError(message);
      console.error(err);
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
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      background: isSelected
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      transform: isHovered || isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: isSelected 
                        ? '0 0 30px rgba(102, 126, 234, 0.6)'
                        : isHovered 
                        ? '0 0 20px rgba(240, 147, 251, 0.4)'
                        : '0 8px 32px rgba(0, 0, 0, 0.12)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'scale(1.1)',
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
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '1.1rem'
                      }}>
                        {scenario.title}
                      </Typography>
                      
                      {isSelected && (
                        <Typography variant="caption" sx={{ 
                          mt: 1, 
                          opacity: 0.9,
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}>
                          選択中
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