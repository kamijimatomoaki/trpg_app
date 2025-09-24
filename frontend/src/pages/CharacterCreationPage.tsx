import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper,
  Divider,
  LinearProgress,
  Grid,
  Chip,
  Tooltip,
  GlobalStyles
} from '@mui/material';
import { Casino, TrendingUp, Warning, Palette, AutoAwesome } from '@mui/icons-material';
import { useGameStore } from '../store/gameStore';
import { useGameSession } from '../hooks/useGameSession';
import { useAbilityScores } from '../hooks/useAbilityScores';
import { DiceRoller } from '../components/DiceRoller';
import { AbilityScoreHelp } from '../components/AbilityScoreHelp';
import { BookStyleContainer } from '../components/BookStyleContainer';
import { createCharacter, proceedToReady } from '../services/api';

export const CharacterCreationPage: React.FC = () => {
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
    isLoading, 
    error,
    setLoading,
    setError 
  } = useGameStore();

  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 能力値システム
  const {
    scores,
    rollingStates,
    rollSingleAbility,
    rollAllAbilities,
    getTotalScore,
    getTotalModifier,
    getScoreQuality,
    shouldRecommendReroll,
    canRollIndividual,
    canRollAll,
    getRemainingRolls,
    getRemainingAllRolls,
    MAX_INDIVIDUAL_ROLLS,
    MAX_ALL_ROLLS
  } = useAbilityScores();

  // 現在のプレイヤーのキャラクター作成状況を確認
  const currentPlayer = uid ? players[uid] : null;
  const hasCharacter = currentPlayer?.characterName && currentPlayer?.characterImageUrl;

  // 決定されたシナリオの情報を取得
  const selectedScenario = scenarioOptions?.find(s => s.id === decidedScenarioId);

  // ゲーム状態の変化を監視して自動遷移
  useEffect(() => {
    if (gameStatus && gameStatus !== 'creating_char') {
      if (gameStatus === 'ready_to_start') {
        navigate(`/game/${storedGameId}/ready`);
      }
    }
  }, [gameStatus, storedGameId, navigate]);

  // すでにキャラクターを作成済みの場合、データを表示
  useEffect(() => {
    if (hasCharacter) {
      setCharacterName(currentPlayer.characterName);
      setCharacterDescription(currentPlayer.characterDescription);
      setGeneratedImageUrl(currentPlayer.characterImageUrl);
      setHasSubmitted(true);
    }
  }, [hasCharacter, currentPlayer]);

  const handleGenerateCharacter = async () => {
    if (!characterName.trim() || !characterDescription.trim()) {
      setError('キャラクター名と特徴を入力してください。');
      return;
    }

    if (!storedGameId) {
      setError('ゲームIDが見つかりません。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // 能力値データを数値のみの形式に変換
      const abilitiesData = {
        strength: scores.strength.value,
        dexterity: scores.dexterity.value,
        intelligence: scores.intelligence.value,
        constitution: scores.constitution.value,
        wisdom: scores.wisdom.value,
        charisma: scores.charisma.value
      };
      
      const result = await createCharacter(storedGameId, characterName, characterDescription, abilitiesData);
      setGeneratedImageUrl(result.characterImageUrl);
      setHasSubmitted(true);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'キャラクター画像の生成に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setGeneratedImageUrl(null);
    setHasSubmitted(false);
    setError(null);
  };

  // ホストが準備完了段階に進む
  const handleProceedToReady = async () => {
    if (!storedGameId) {
      setError('ゲームIDが見つかりません。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await proceedToReady(storedGameId);
      // 成功時は自動的にready画面に遷移される
    } catch (err: any) {
      const message = err.message || '準備完了段階への移行に失敗しました。';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 全員がキャラクター作成完了したかチェック
  const allPlayersHaveCharacters = Object.values(players).every(
    player => player.characterName && player.characterImageUrl
  );

  // ホストかどうか判定
  const isHost = uid === hostId;

  if (isLoading && !scenarioOptions?.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !characterName && !characterDescription) {
    return (
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      <GlobalStyles styles={{
        '@keyframes artCreation': {
          '0%': { 
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            transform: 'scale(1)'
          },
          '33%': { 
            background: 'linear-gradient(45deg, #4ecdc4, #45b7d1)',
            transform: 'scale(1.05)'
          },
          '66%': { 
            background: 'linear-gradient(45deg, #45b7d1, #96ceb4)',
            transform: 'scale(0.95)'
          },
          '100%': { 
            background: 'linear-gradient(45deg, #96ceb4, #ff6b6b)',
            transform: 'scale(1)'
          }
        },
        '@keyframes sparkleRotate': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        '@keyframes fadeInOut': {
          '0%': { opacity: 0.7 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.7 }
        }
      }} />
      
      <BookStyleContainer 
        title="あなたの分身を創造しよう"
        subtitle={selectedScenario?.title ? `物語：${selectedScenario.title}` : undefined}
        pageNumber={1}
        totalPages={3}
      >
        <Container maxWidth="lg" sx={{ mt: 0, mb: 0 }}>

      {/* 進行状況表示 */}
      <Paper sx={{ 
        p: 2, 
        mb: 4, 
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 2
      }}>
        <Typography variant="subtitle1" gutterBottom sx={{ 
          color: 'text.primary',
          fontWeight: 'medium'
        }}>
          キャラクター作成進行状況
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ 
            minWidth: 120,
            color: 'text.primary',
            fontWeight: 'medium'
          }}>
            {Object.values(players).filter(p => p.characterName).length} / {Object.keys(players).length} 人完了
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(Object.values(players).filter(p => p.characterName).length / Object.keys(players).length) * 100}
            sx={{ flexGrow: 1, ml: 2, height: 8, borderRadius: 4 }}
          />
        </Box>
        
        {allPlayersHaveCharacters && isHost && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                全員のキャラクター作成が完了しました！準備完了段階に進みましょう。
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProceedToReady}
                disabled={isLoading}
                sx={{ ml: 2 }}
              >
                {isLoading ? '移行中...' : '準備段階に進む'}
              </Button>
            </Box>
          </Alert>
        )}
        
        {allPlayersHaveCharacters && !isHost && (
          <Alert severity="info" sx={{ mt: 2 }}>
            全員のキャラクター作成が完了しました！ホストが次の段階に進めるまでお待ちください。
          </Alert>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 6, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* 左側：キャラクター作成フォーム */}
        <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* キャラクター基本情報 */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                キャラクター設定
              </Typography>
            
            <TextField
              fullWidth
              label="キャラクター名"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              margin="normal"
              disabled={hasSubmitted}
              placeholder="例：エルフの弓使いアリア"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="キャラクターの特徴・設定"
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              margin="normal"
              disabled={hasSubmitted}
              placeholder="外見、性格、背景、特技などを自由に描写してください"
              sx={{ mb: 3 }}
            />

            {selectedScenario && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  世界観ヒント
                </Typography>
                <Typography variant="body2">
                  {selectedScenario.summary}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {hasSubmitted && (
                <Button
                  variant="outlined"
                  onClick={handleRetry}
                  disabled={isGenerating}
                >
                  やり直す
                </Button>
              )}
              
              <Button
                variant="contained"
                onClick={handleGenerateCharacter}
                disabled={!characterName.trim() || !characterDescription.trim() || isGenerating || hasSubmitted}
                sx={{ minWidth: 160 }}
              >
                {isGenerating ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    生成中...
                  </>
                ) : hasSubmitted ? (
                  '完了済み'
                ) : (
                  'キャラクターを生成'
                )}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            </CardContent>
          </Card>

          {/* TRPG能力値システム */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                    能力値
                  </Typography>
                  <AbilityScoreHelp 
                    maxIndividualRolls={MAX_INDIVIDUAL_ROLLS}
                    maxAllRolls={MAX_ALL_ROLLS}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={`全体振り直し残り: ${getRemainingAllRolls()}回`}
                    size="small"
                    color={getRemainingAllRolls() > 0 ? 'success' : 'error'}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    startIcon={<Casino />}
                    onClick={rollAllAbilities}
                    disabled={Object.values(rollingStates).some(Boolean) || hasSubmitted || !canRollAll()}
                    sx={{ 
                      background: canRollAll() 
                        ? 'linear-gradient(45deg, #ff6b6b, #feca57)'
                        : 'linear-gradient(45deg, #9e9e9e, #757575)',
                      '&:hover': { 
                        background: canRollAll() 
                          ? 'linear-gradient(45deg, #ff5252, #ffb74d)' 
                          : 'linear-gradient(45deg, #9e9e9e, #757575)'
                      }
                    }}
                  >
                    全サイコロ振り直し
                  </Button>
                </Box>
              </Box>

              {/* 能力値サマリー */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<TrendingUp />}
                  label={`合計: ${getTotalScore()}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`修正値計: ${getTotalModifier() >= 0 ? '+' : ''}${getTotalModifier()}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip 
                  label={getScoreQuality().description}
                  sx={{ 
                    backgroundColor: getScoreQuality().color + '20',
                    color: getScoreQuality().color,
                    borderColor: getScoreQuality().color
                  }}
                  variant="outlined"
                />
              </Box>

              {/* 振り直し推奨アラート */}
              {shouldRecommendReroll() && !hasSubmitted && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 3 }}
                  icon={<Warning />}
                >
                  能力値が低めです。「全サイコロ振り直し」で再挑戦することをお勧めします！
                </Alert>
              )}

              {/* 能力値グリッド */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {Object.entries(scores).map(([key, score]) => (
                  <Box key={key}>
                    <DiceRoller
                      label={score.name}
                      shortLabel={score.shortName}
                      value={score.value}
                      isRolling={rollingStates[key as keyof typeof rollingStates]}
                      onRoll={() => rollSingleAbility(key as keyof typeof scores)}
                      modifier={score.modifier}
                      remainingRolls={getRemainingRolls(key as keyof typeof scores)}
                      maxRolls={MAX_INDIVIDUAL_ROLLS}
                    />
                  </Box>
                ))}
              </Box>

              <Typography variant="caption" color="text.primary" sx={{ mt: 2, display: 'block' }}>
                各能力値は3D6（3つの6面サイコロ）で決定されます。個別振り直し{MAX_INDIVIDUAL_ROLLS}回、全体振り直し{MAX_ALL_ROLLS}回まで可能です。
                詳細は💡ヘルプボタンをご確認ください。
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 右側：キャラクター画像表示 */}
        <Box sx={{ flex: 2 }}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
              キャラクター画像
            </Typography>
            
            <Box sx={{ 
              height: 300, 
              backgroundColor: 'grey.100', 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2,
              overflow: 'hidden'
            }}>
              {isGenerating ? (
                <Box sx={{ 
                  textAlign: 'center',
                  p: 3,
                  background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.1), rgba(254, 202, 87, 0.1))',
                  borderRadius: 3,
                  animation: 'artCreation 4s ease-in-out infinite'
                }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                    <Palette sx={{ 
                      fontSize: 60, 
                      color: 'primary.main',
                      animation: 'sparkleRotate 2s ease-in-out infinite'
                    }} />
                    <CircularProgress 
                      size={80}
                      sx={{ 
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        color: 'secondary.main',
                        opacity: 0.7
                      }}
                    />
                    <AutoAwesome sx={{ 
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      color: 'warning.main',
                      animation: 'sparkleRotate 1.5s ease-in-out infinite reverse'
                    }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    mb: 1,
                    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    AIアーティスト作業中...
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.primary',
                    animation: 'fadeInOut 2s ease-in-out infinite',
                    fontStyle: 'italic'
                  }}>
                    あなたの理想のキャラクターを魔法で描き上げています
                  </Typography>
                </Box>
              ) : generatedImageUrl ? (
                <img 
                  src={generatedImageUrl} 
                  alt={characterName}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.primary">
                  キャラクターを設定して<br />
                  「キャラクターを生成」ボタンを<br />
                  押してください
                </Typography>
              )}
            </Box>

            {generatedImageUrl && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {characterName}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {characterDescription}
                </Typography>
              </Box>
            )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 他のプレイヤーの進行状況 */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            全プレイヤーの進行状況
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(players).map(([playerId, player]) => (
              <Box key={playerId} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                borderRadius: 1,
                backgroundColor: player.characterName ? 'success.light' : 'grey.100',
                color: player.characterName ? 'success.contrastText' : 'text.primary'
              }}>
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  {player.name || `プレイヤー ${playerId.substring(0, 8)}`}
                  {playerId === uid && ' (あなた)'}
                </Typography>
                <Typography variant="body2">
                  {player.characterName ? `✓ ${player.characterName}` : '作成中...'}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
        </Container>
      </BookStyleContainer>
    </>
  );
};