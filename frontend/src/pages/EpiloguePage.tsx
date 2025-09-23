import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Assessment as StatsIcon,
  Home as HomeIcon,
  Replay as ReplayIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  Videocam as VideocamIcon,
  PlayCircle as PlayCircleIcon
} from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { generateEpilogueVideo } from '../services/api';
import AdventureTimeline from '../components/AdventureTimeline';
import PlayerHighlights from '../components/PlayerHighlights';

interface EpilogueData {
  ending_narrative: string;
  ending_type: 'great_success' | 'success' | 'failure' | 'disaster';
  player_contributions: Array<{
    player_id: string;
    character_name: string;
    key_actions: string[];
    dice_rolls: Array<{ content: string; turn: number }>;
    highlight_moments: string[];
  }>;
  adventure_summary: string;
  total_turns: number;
  completion_percentage: number;
  generated_at: any;
  video_url?: string;
}

const EpiloguePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { idToken } = useGameStore();
  const gameSession = useGameSession(gameId || '');
  const { gameData, loading, error } = gameSession || { gameData: null, loading: true, error: null };
  const [isGeneratingEpilogue, setIsGeneratingEpilogue] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  console.log('EpiloguePage Debug:', {
    gameId,
    gameSession,
    gameData,
    loading,
    error,
    idToken
  });

  const currentUid = useGameStore.getState().uid;
  const epilogue = gameData?.epilogue as EpilogueData | undefined;
  const isHost = gameData?.hostId === currentUid;
  
  console.log('Host Debug:', {
    gameDataHostId: gameData?.hostId,
    currentUid: currentUid,
    isHost: isHost,
    gameStatus: gameData?.gameStatus
  });

  // 終了タイプに応じたテーマカラーと表示
  const getEndingTheme = (endingType: string) => {
    switch (endingType) {
      case 'great_success':
        return { color: '#4caf50', label: '大成功', icon: '🏆' };
      case 'success':
        return { color: '#2196f3', label: '成功', icon: '🎉' };
      case 'tragic_success':
        return { color: '#9c27b0', label: '悲劇的成功', icon: '⚰️' };
      case 'failure':
        return { color: '#ff9800', label: '失敗', icon: '😓' };
      case 'disaster':
        return { color: '#f44336', label: '大失敗', icon: '💀' };
      default:
        return { color: '#9e9e9e', label: '不明', icon: '❓' };
    }
  };

  const handleGenerateEpilogue = async () => {
    if (!gameId || !idToken) return;

    setIsGeneratingEpilogue(true);
    try {
      const response = await fetch(`http://localhost:8000/games/${gameId}/generate-epilogue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('エピローグの生成に失敗しました');
      }

      // 成功したらページを再読み込みして最新データを取得
      window.location.reload();
    } catch (err) {
      console.error('エピローグ生成エラー:', err);
      alert('エピローグの生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGeneratingEpilogue(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // エピローグ動画生成
  const handleGenerateVideo = async () => {
    if (!gameId || !idToken) return;

    setIsGeneratingVideo(true);
    setVideoError(null);
    
    try {
      const response = await generateEpilogueVideo(gameId);
      console.log('動画生成完了:', response);
      
      // ページを再読み込みして最新のエピローグデータ（video_url付き）を取得
      window.location.reload();
    } catch (err: any) {
      console.error('動画生成エラー:', err);
      setVideoError(err.response?.data?.detail || '動画の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // エピローグをテキストファイルとしてダウンロード
  const handleDownloadAdventureRecord = () => {
    if (!epilogue || !gameData) return;

    const scenario = gameData.scenarioOptions?.find(s => s.id === gameData.decidedScenarioId);
    const endingTheme = getEndingTheme(epilogue.ending_type);
    
    // テキストコンテンツを生成
    let content = '='.repeat(60) + '\n';
    content += '冒険の記録\n';
    content += '='.repeat(60) + '\n\n';
    
    // 基本情報
    content += `シナリオ: ${scenario?.title || '不明'}\n`;
    content += `結果: ${endingTheme.label}\n`;
    content += `達成率: ${epilogue.completion_percentage.toFixed(1)}%\n`;
    content += `総ターン数: ${epilogue.total_turns}\n`;
    content += `参加プレイヤー: ${epilogue.player_contributions.length}人\n`;
    content += `生成日時: ${new Date(epilogue.generated_at?.seconds * 1000 || Date.now()).toLocaleString('ja-JP')}\n\n`;
    
    // エピローグナレーション
    content += '-'.repeat(40) + '\n';
    content += 'エピローグ\n';
    content += '-'.repeat(40) + '\n';
    content += epilogue.ending_narrative + '\n\n';
    
    // 冒険要約
    content += '-'.repeat(40) + '\n';
    content += '冒険の概要\n';
    content += '-'.repeat(40) + '\n';
    content += epilogue.adventure_summary + '\n\n';
    
    // プレイヤー貢献
    content += '-'.repeat(40) + '\n';
    content += 'プレイヤーの活躍\n';
    content += '-'.repeat(40) + '\n';
    epilogue.player_contributions.forEach((contribution, index) => {
      content += `${index + 1}. ${contribution.character_name}\n`;
      content += `   主な行動:\n`;
      contribution.key_actions.forEach(action => {
        content += `   - ${action}\n`;
      });
      content += `   ハイライト:\n`;
      contribution.highlight_moments.forEach(moment => {
        content += `   - ${moment}\n`;
      });
      content += '\n';
    });
    
    // ゲームログ（簡略版）
    if (gameData.gameLog && gameData.gameLog.length > 0) {
      content += '-'.repeat(40) + '\n';
      content += '冒険の軌跡\n';
      content += '-'.repeat(40) + '\n';
      gameData.gameLog.forEach((log, index) => {
        const logType = log.type === 'gm_narration' ? 'GM' : 
                       log.type === 'gm_response' ? 'GM' :
                       log.type === 'player_action' ? 'プレイヤー' : 'システム';
        content += `[ターン${log.turn}] ${logType}: ${log.content}\n`;
      });
    }
    
    // ファイルとしてダウンロード
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `冒険の記録_${scenario?.title || 'Unknown'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Container>
    );
  }

  if (error || !gameData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          ゲームデータの読み込みに失敗しました。{error}
        </Alert>
      </Container>
    );
  }

  // ゲームがエピローグ状態でない場合
  if (gameData.gameStatus !== 'epilogue' && gameData.gameStatus !== 'finished' && gameData.gameStatus !== 'completed') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          このゲームはまだエピローグフェーズに到達していません。
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
          sx={{ mt: 2 }}
        >
          ホームに戻る
        </Button>
      </Container>
    );
  }

  // エピローグが未生成の場合
  if (!epilogue) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <TrophyIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            冒険完了！
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph>
            お疲れ様でした！シナリオの完了が確認されました。
            エピローグを生成して、この冒険を振り返りましょう。
          </Typography>

          {isHost ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerateEpilogue}
              disabled={isGeneratingEpilogue}
              startIcon={<TimelineIcon />}
              sx={{ mt: 2 }}
            >
              {isGeneratingEpilogue ? 'エピローグ生成中...' : 'エピローグを生成'}
            </Button>
          ) : (
            <Typography variant="body2" color="text.primary">
              ホストがエピローグを生成するまでお待ちください...
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
            >
              ホームに戻る
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const endingTheme = getEndingTheme(epilogue.ending_type);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          {endingTheme.icon} 冒険の記録
        </Typography>
        <Chip
          label={endingTheme.label}
          sx={{
            backgroundColor: endingTheme.color,
            color: 'white',
            fontSize: '1.1rem',
            px: 2,
            py: 1
          }}
        />
      </Box>

      <Grid container spacing={4}>
        {/* エピローグナレーション */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <TimelineIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  エピローグ
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  fontFamily: '"Noto Serif JP", serif'
                }}
              >
                {epilogue.ending_narrative}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 冒険統計 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StatsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">冒険統計</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.primary">
                  達成率
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={epilogue.completion_percentage}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: endingTheme.color
                    }
                  }}
                />
                <Typography variant="h6" sx={{ mt: 1, color: endingTheme.color }}>
                  {epilogue.completion_percentage.toFixed(1)}%
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.primary">
                総ターン数: <strong>{epilogue.total_turns}</strong>
              </Typography>
              <Typography variant="body2" color="text.primary">
                参加プレイヤー: <strong>{epilogue.player_contributions.length}人</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 詳細なプレイヤーハイライト */}
        <Grid item xs={12}>
          <PlayerHighlights
            playerContributions={epilogue.player_contributions}
            players={gameData?.players || {}}
            totalTurns={epilogue.total_turns}
          />
        </Grid>

        {/* エピローグ動画 */}
        {epilogue.video_url && (
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <PlayCircleIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5" component="h2">
                    冒険のハイライト動画
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <video 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxHeight: '400px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    <source src={epilogue.video_url} type="video/mp4" />
                    お使いのブラウザは動画の再生をサポートしていません。
                  </video>
                </Box>
                <Typography variant="body2" color="text.primary" textAlign="center">
                  🎬 AI生成による冒険のハイライトシーン（8秒）
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 冒険タイムライン */}
        <Grid item xs={12}>
          <AdventureTimeline
            gameLog={gameData?.gameLog || []}
            players={gameData?.players || {}}
            scenarioTitle={gameData?.scenarioOptions?.find(s => s.id === gameData?.decidedScenarioId)?.title || 'Unknown Scenario'}
          />
        </Grid>

        {/* アクションボタン */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
            {/* 動画生成ボタン（ホストのみ・未生成時のみ表示） */}
            {isHost && !epilogue.video_url && (
              <>
                <Alert severity="info" sx={{ mb: 2, maxWidth: 600 }}>
                  <Typography variant="body2">
                    <strong>動画生成について：</strong><br />
                    • Vertex AI Veo 3を使用して最大8秒のハイライト動画を生成します<br />
                    • 生成には最大10分程度かかる場合があります<br />
                    • APIエラーが発生した場合、代わりにダミー動画が表示されることがあります<br />
                    • 動画生成は1回のみ可能です
                  </Typography>
                </Alert>
                <Button
                variant="contained"
                startIcon={<VideocamIcon />}
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                size="large"
                color="warning"
                sx={{ 
                  background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                  '&:hover': { background: 'linear-gradient(45deg, #f57c00, #ef6c00)' }
                }}
              >
                {isGeneratingVideo ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    動画生成中...（最大10分）
                  </>
                ) : (
                  'ハイライト動画を生成'
                )}
                </Button>
              </>
            )}
            
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadAdventureRecord}
              size="large"
              color="secondary"
              sx={{ 
                background: 'linear-gradient(45deg, #9c27b0, #e91e63)',
                '&:hover': { background: 'linear-gradient(45deg, #7b1fa2, #c2185b)' }
              }}
            >
              冒険の記録をダウンロード
            </Button>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              size="large"
            >
              ホームに戻る
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={() => navigate('/')}
              size="large"
            >
              新しい冒険を始める
            </Button>
          </Box>
          
          {/* 動画生成エラー表示 */}
          {videoError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {videoError}
            </Alert>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default EpiloguePage;