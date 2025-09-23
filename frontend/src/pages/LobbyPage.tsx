import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Button, Box, Card, CardContent, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, CircularProgress, Alert, 
  FormControl, InputLabel, Select, MenuItem, TextField, Chip, Divider,
  Grid, FormHelperText, FormControlLabel, Switch
} from '@mui/material';
import { Settings, TrendingUp, Lightbulb, Casino, Videocam, Groups as GroupIcon, Psychology } from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { startVoting } from '../services/api'; // startVotingをインポート
import GMSelector from '../components/GMPersonality/GMSelector';

const LobbyPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  useGameSession(gameId);

  const { uid, gameId: storedGameId, roomId, hostId, players, gameStatus, isLoading, error, setLoading, setError } = useGameStore();

  const isHost = uid === hostId;
  const numPlayers = Object.keys(players).length;

  // シナリオ設定用のstate
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'extreme'>('normal');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [themePreference, setThemePreference] = useState('');
  const [enableOpeningVideo, setEnableOpeningVideo] = useState(true);
  const [enableEpilogueVideo, setEnableEpilogueVideo] = useState(false);
  
  // GM設定用のstate
  const [selectedGM, setSelectedGM] = useState<any>(null);
  const [showGMSelector, setShowGMSelector] = useState(false);

  // ゲームの状態が投票フェーズに変わったら、投票ページにリダイレクトする
  useEffect(() => {
    if (gameStatus === 'voting') {
      // シナリオ投票画面へ遷移
      navigate(`/game/${storedGameId}/vote`);
    }
  }, [gameStatus, storedGameId, navigate]);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim()) && keywords.length < 5) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleStartVoting = async () => {
    if (!storedGameId) {
      setError('ゲームIDが見つかりません。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('🎬 フロントエンド: 動画設定送信', {
        opening_video_enabled: enableOpeningVideo,
        epilogue_video_enabled: enableEpilogueVideo
      });
      
      await startVoting(storedGameId, {
        difficulty,
        keywords,
        theme_preference: themePreference,
        opening_video_enabled: enableOpeningVideo,
        epilogue_video_enabled: enableEpilogueVideo
      });
      // API呼び出し成功後、gameStatusが'voting'に更新され、useEffectで遷移する
    } catch (err: any) {
      const message = err.response?.data?.detail || '冒険の準備を開始できませんでした。';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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

  if (!storedGameId) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="info">ゲーム情報が読み込まれていません。トップページに戻ってください。</Alert>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>トップページへ</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1B23 0%, #2D2E36 50%, #1A1B23 100%)',
      position: 'relative',
      overflow: 'hidden',
      pt: 6
    }}>
      {/* 背景装飾 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 30% 40%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 10%, rgba(214, 158, 46, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(168, 237, 234, 0.08) 0%, transparent 50%)
        `,
        animation: 'float 25s ease-in-out infinite'
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        {/* ヘッダー */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              mb: 2,
              background: 'linear-gradient(135deg, #E2E8F0 0%, #D69E2E 50%, #E2E8F0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 300,
              letterSpacing: '0.02em'
            }}
          >
            冒険の準備室
          </Typography>
          <Chip 
            label={`部屋ID: ${roomId}`}
            sx={{ 
              fontSize: '1.1rem',
              py: 1,
              px: 3,
              background: 'linear-gradient(135deg, rgba(214, 158, 46, 0.2), rgba(102, 126, 234, 0.2))',
              border: '1px solid rgba(214, 158, 46, 0.3)',
              color: 'text.primary'
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' }, gap: 6 }}>
          {/* 左側：プレイヤー一覧 */}
          <Box>
            <Card sx={{ 
              background: 'rgba(45, 46, 54, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(113, 128, 150, 0.2)',
              minHeight: 400
            }}>
              <CardContent sx={{ p: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <GroupIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ fontWeight: 300 }}>
                    参加者 ({numPlayers}人)
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3, borderColor: 'rgba(113, 128, 150, 0.2)' }} />
                
                <List sx={{ p: 0 }}>
                  {Object.entries(players).map(([playerId, player], index) => (
                    <ListItem 
                      key={playerId}
                      sx={{ 
                        mb: 2,
                        p: 2,
                        borderRadius: 3,
                        background: playerId === hostId 
                          ? 'linear-gradient(135deg, rgba(214, 158, 46, 0.15), rgba(240, 147, 251, 0.15))'
                          : 'rgba(113, 128, 150, 0.1)',
                        border: '1px solid',
                        borderColor: playerId === hostId ? 'rgba(214, 158, 46, 0.3)' : 'rgba(113, 128, 150, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: playerId === hostId ? 'secondary.main' : 'primary.main',
                          width: 48,
                          height: 48,
                          fontSize: '1.2rem'
                        }}>
                          {player.name ? player.name[0].toUpperCase() : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                              {player.name || `プレイヤー ${playerId.substring(0, 4)}...`}
                            </Typography>
                            {playerId === hostId && (
                              <Chip 
                                label="ホスト" 
                                size="small" 
                                color="secondary"
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* 右側：シナリオ設定 */}
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {/* AI GMパーソナリティ選択 */}
              <Card sx={{ 
                background: 'rgba(45, 46, 54, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(113, 128, 150, 0.2)'
              }}>
                <CardContent sx={{ p: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Psychology sx={{ mr: 2, color: 'secondary.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 300 }}>
                      AI ゲームマスター
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(113, 128, 150, 0.2)' }} />
                  
                  {isHost ? (
                    <Box>
                      {selectedGM ? (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '2rem' }}>
                              {selectedGM.avatar}
                            </Typography>
                            <Box>
                              <Typography variant="h6">{selectedGM.name}</Typography>
                              <Typography variant="body2" color="text.primary">
                                {selectedGM.voice.style}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {selectedGM.specialty.slice(0, 3).map((spec) => (
                              <Chip 
                                key={spec} 
                                label={spec} 
                                size="small" 
                                variant="outlined"
                                color="secondary"
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                            冒険を導くAI GMを選択してください
                          </Typography>
                        </Box>
                      )}
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Psychology />}
                        onClick={() => setShowGMSelector(true)}
                        sx={{ 
                          py: 1.5,
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          '&:hover': {
                            borderColor: 'secondary.light',
                            background: 'rgba(214, 158, 46, 0.08)'
                          }
                        }}
                      >
                        {selectedGM ? 'GMを変更' : 'GMを選択'}
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                        ホストがAI GMを選択中...
                      </Typography>
                      {selectedGM && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <span style={{ fontSize: '1.5rem' }}>{selectedGM.avatar}</span>
                            {selectedGM.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* シナリオ設定 */}
              <Card sx={{ 
                background: 'rgba(45, 46, 54, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(113, 128, 150, 0.2)'
              }}>
                <CardContent sx={{ p: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Settings sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 300 }}>
                      シナリオ設定
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(113, 128, 150, 0.2)' }} />
                
                {isHost ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* 難易度設定 */}
              <Box>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={difficulty}
                    label="難易度"
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'normal' | 'hard' | 'extreme')}
                    startAdornment={<TrendingUp sx={{ mr: 1, color: 'text.primary' }} />}
                  >
                    <MenuItem value="easy">
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">かんたん</Typography>
                        <Typography variant="caption" color="text.primary">
                          最大40ターン・成功率60%
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="normal">
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">ふつう</Typography>
                        <Typography variant="caption" color="text.primary">
                          最大30ターン・成功率75%
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="hard">
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">むずかしい</Typography>
                        <Typography variant="caption" color="text.primary">
                          最大25ターン・成功率80%
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="extreme">
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">地獄級</Typography>
                        <Typography variant="caption" color="text.primary">
                          最大20ターン・成功率90%
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                  <FormHelperText>
                    クリア条件の難しさを調整します
                  </FormHelperText>
                </FormControl>
              </Box>

              {/* テーマ設定 */}
              <Box>
                <TextField
                  fullWidth
                  label="物語のテーマ"
                  value={themePreference}
                  onChange={(e) => setThemePreference(e.target.value)}
                  placeholder="例：ファンタジー、サイバーパンク、ホラー"
                  InputProps={{
                    startAdornment: <Lightbulb sx={{ mr: 1, color: 'text.primary' }} />
                  }}
                  helperText="どんな雰囲気の物語にしたいか（任意）"
                />
              </Box>

              {/* キーワード設定 */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Box>
                  <TextField
                    fullWidth
                    label="物語に含めたいキーワード"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="例：魔法の剣、古代遺跡、謎の商人"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    InputProps={{
                      startAdornment: <Casino sx={{ mr: 1, color: 'text.primary' }} />,
                      endAdornment: (
                        <Button 
                          onClick={handleAddKeyword}
                          disabled={!keywordInput.trim() || keywords.includes(keywordInput.trim()) || keywords.length >= 5}
                          size="small"
                          variant="outlined"
                        >
                          追加
                        </Button>
                      )
                    }}
                    helperText={`物語に登場させたい要素を追加できます（最大5個） ${keywords.length}/5`}
                  />
                  
                  {keywords.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {keywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          onDelete={() => handleRemoveKeyword(keyword)}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 動画生成設定 */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                {/* オープニング動画設定 */}
                <Box sx={{ 
                  p: 3, 
                  mb: 2,
                  border: '1px solid',
                  borderColor: enableOpeningVideo ? 'secondary.main' : 'rgba(113, 128, 150, 0.3)',
                  borderRadius: 2,
                  background: enableOpeningVideo 
                    ? 'linear-gradient(135deg, rgba(214, 158, 46, 0.1), rgba(240, 147, 251, 0.1))' 
                    : 'rgba(45, 46, 54, 0.5)'
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableOpeningVideo}
                        onChange={(e) => setEnableOpeningVideo(e.target.checked)}
                        color="secondary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Videocam color={enableOpeningVideo ? 'secondary' : 'disabled'} />
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          オープニング動画生成
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography variant="body2" sx={{ ml: 4.5, mt: 1, color: 'text.primary' }}>
                    {enableOpeningVideo 
                      ? 'シナリオ開始時にAIが演出動画を生成します（約$4のコスト）'
                      : 'オープニング動画を無効にしてコストを節約できます'
                    }
                  </Typography>
                  {enableOpeningVideo && (
                    <Typography variant="caption" sx={{ ml: 4.5, mt: 0.5, color: 'warning.main', display: 'block' }}>
                      ※ Veo 3 APIエラーが発生した場合、ダミー動画が表示される可能性があります
                    </Typography>
                  )}
                </Box>

                {/* エピローグ動画設定 */}
                <Box sx={{ 
                  p: 3, 
                  border: '1px solid',
                  borderColor: enableEpilogueVideo ? 'primary.main' : 'rgba(113, 128, 150, 0.3)',
                  borderRadius: 2,
                  background: enableEpilogueVideo 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' 
                    : 'rgba(45, 46, 54, 0.5)'
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableEpilogueVideo}
                        onChange={(e) => setEnableEpilogueVideo(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Videocam color={enableEpilogueVideo ? 'primary' : 'disabled'} />
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          エピローグ動画生成
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography variant="body2" sx={{ ml: 4.5, mt: 1, color: 'text.primary' }}>
                    {enableEpilogueVideo 
                      ? '冒険完了時にAIが8秒のハイライト動画を生成します（約$4のコスト）'
                      : '動画生成を無効にしてコストを節約できます'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                      <Button 
                        variant="contained" 
                        size="large" 
                        onClick={handleStartVoting}
                        disabled={numPlayers < 1 || isLoading}
                        sx={{ 
                          minWidth: 250,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : '🗡️ 冒険の準備を始める'}
                      </Button>
                      {numPlayers < 1 && (
                        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.primary' }}>
                          （冒険を開始するには2人以上のプレイヤーが必要です）
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
                      ホストが冒険の設定を行っています...
                    </Typography>
                    <CircularProgress size={32} />
                  </Box>
                )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* GM選択ダイアログ */}
        {showGMSelector && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}>
            <Box sx={{
              background: 'rgba(45, 46, 54, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              border: '1px solid rgba(113, 128, 150, 0.2)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              <Button
                onClick={() => setShowGMSelector(false)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1,
                  minWidth: 'auto',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'text.primary',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                ✕
              </Button>
              <GMSelector
                onSelect={(gm) => {
                  setSelectedGM(gm);
                  setShowGMSelector(false);
                }}
                currentGM={selectedGM}
              />
            </Box>
          </Box>
        )}
      </Container>

      {/* アニメーション定義 */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(20px, -20px) rotate(120deg); }
            66% { transform: translate(-15px, 15px) rotate(240deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default LobbyPage;
