import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  Fade,
  Slide,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { 
  AutoStories as BookIcon,
  Groups as GroupIcon,
  Casino as DiceIcon,
  Videocam as VideoIcon,
  Stars as SparkleIcon,
  PlayArrow as PlayIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { createGame, joinGame } from '../services/api';
import { useGameStore } from '../store/gameStore';
import AnimatedCard from '../components/Animations/AnimatedCard';
import AnimatedButton from '../components/Animations/AnimatedButton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setGame, setLoading, setError, isLoading, error } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);

  console.log("HomePage rendered. isLoading:", isLoading);

  useEffect(() => {
    // フェードインアニメーション用
    const timer = setTimeout(() => setShowFeatures(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateGame = async () => {
    console.log("handleCreateGame called");
    setLoading(true);
    setError(null);
    try {
      const gameData = await createGame();
      setGame({ gameId: gameData.gameId, roomId: gameData.roomId });
      navigate(`/lobby/${gameData.gameId}`);
    } catch (err: any) {
      const message = err.response?.data?.detail || '部屋の作成に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    console.log("handleJoinGame called");
    if (!roomIdInput.trim()) {
      setError('部屋IDを入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const gameData = await joinGame(roomIdInput.trim());
      setGame({ gameId: gameData.gameId, roomId: roomIdInput.trim() });
      navigate(`/lobby/${gameData.gameId}`);
    } catch (err: any) {
      const message = err.response?.data?.detail || '部屋への参加に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <SparkleIcon />,
      title: "AI駆動の物語",
      description: "Gemini 2.5が織りなす無限の冒険"
    },
    {
      icon: <DiceIcon />,
      title: "自動ダイス判定",
      description: "Function Callingで自然な判定システム"
    },
    {
      icon: <VideoIcon />,
      title: "Veo動画生成",
      description: "エピローグのハイライトを動画で記録"
    },
    {
      icon: <BookIcon />,
      title: "冒険の記録",
      description: "旅の思い出をダウンロード保存"
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1B23 0%, #2D2E36 50%, #1A1B23 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装飾 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(214, 158, 46, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(168, 237, 234, 0.1) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />
      
      <Container maxWidth="xl" sx={{ position: 'relative', pt: 8, pb: 4 }}>
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            {/* メインタイトル */}
            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #E2E8F0 0%, #D69E2E 50%, #E2E8F0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 30px rgba(214, 158, 46, 0.3)',
                animation: 'glow 3s ease-in-out infinite alternate'
              }}
            >
              AI TRPG Agent
            </Typography>
            
            {/* サブタイトル */}
            <Slide direction="up" in timeout={1200}>
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 4,
                  color: 'text.primary',
                  fontWeight: 300,
                  letterSpacing: '0.02em'
                }}
              >
                AIエージェント群が紡ぐ、仲間と挑む、あなただけの物語体験
              </Typography>
            </Slide>

            {/* 特徴チップ */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 6 }}>
              <Chip label="マルチプレイヤー対応" color="primary" />
              <Chip label="リアルタイム同期" color="secondary" />
              <Chip label="AI画像・動画生成" />
            </Box>
          </Box>
        </Fade>

        {/* メインアクション */}
        <Fade in timeout={1500}>
          <Grid container spacing={6} justifyContent="center" sx={{ mb: 8 }}>
            <Grid size={{ xs: 12, md: 5, lg: 5 }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 30px rgba(102, 126, 234, 0.3)',
                  transform: 'translateY(-8px)',
                }
              }}>
                <CardContent sx={{ p: 5, textAlign: 'center' }}>
                  <PlayIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    新しい冒険を始める
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
                    あなたがホストとなって仲間を集め、新たな物語を紡ぎましょう
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={handleCreateGame}
                    disabled={isLoading}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : '部屋を作る'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5, lg: 5 }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(214, 158, 46, 0.1), rgba(240, 147, 251, 0.1))',
                border: '1px solid rgba(214, 158, 46, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 30px rgba(214, 158, 46, 0.3)',
                  transform: 'translateY(-8px)',
                }
              }}>
                <CardContent sx={{ p: 5, textAlign: 'center' }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    冒険に参加する
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
                    友達から招待された部屋IDで既存の冒険に参加
                  </Typography>
                  <TextField 
                    label="部屋ID"
                    variant="outlined" 
                    fullWidth
                    sx={{ mb: 2 }}
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                  />
                  <Button 
                    variant="contained" 
                    size="large"
                    fullWidth
                    onClick={handleJoinGame}
                    disabled={isLoading}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e082e9 0%, #e3465a 100%)',
                      }
                    }}
                  >
                    部屋に入る
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>

        {/* エラー表示 */}
        {error && (
          <Fade in timeout={300}>
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                mb: 4, 
                maxWidth: 600, 
                mx: 'auto',
                borderRadius: 3,
                backgroundColor: 'rgba(245, 101, 101, 0.1)',
                border: '1px solid rgba(245, 101, 101, 0.3)'
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* 機能紹介 */}
        <Fade in={showFeatures} timeout={2000}>
          <Box sx={{ mt: 8 }}>
            <Typography 
              variant="h4" 
              textAlign="center" 
              sx={{ 
                mb: 6,
                color: 'text.primary',
                fontWeight: 300
              }}
            >
              なぜAI TRPG Agentなのか？
            </Typography>
            
            <Grid container spacing={6}>
              {features.map((feature, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Slide direction="up" in={showFeatures} timeout={1000 + index * 200}>
                    <Paper sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      minHeight: 280,
                      background: 'rgba(45, 46, 54, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(113, 128, 150, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(214, 158, 46, 0.3)',
                      }
                    }}>
                      <Box sx={{ 
                        color: 'secondary.main', 
                        mb: 2,
                        '& > svg': { fontSize: 40 }
                      }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* アニメーション定義 */}
      <style>
        {`
          @keyframes glow {
            0% { text-shadow: 0 0 20px rgba(214, 158, 46, 0.3); }
            100% { text-shadow: 0 0 40px rgba(214, 158, 46, 0.6), 0 0 60px rgba(214, 158, 46, 0.3); }
          }
          
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default HomePage;