import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Casino as DiceIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

interface PlayerContribution {
  player_id: string;
  character_name: string;
  key_actions: string[];
  dice_rolls: Array<{ content: string; turn: number }>;
  highlight_moments: string[];
}

interface PlayerHighlightsProps {
  playerContributions: PlayerContribution[];
  players: Record<string, { 
    characterName: string; 
    characterImageUrl?: string; 
    characterDescription?: string;
  }>;
  totalTurns: number;
}

const PlayerHighlights: React.FC<PlayerHighlightsProps> = ({
  playerContributions,
  players,
  totalTurns
}) => {
  // プレイヤー統計を計算
  const calculatePlayerStats = (contrib: PlayerContribution) => {
    const actionCount = contrib.key_actions.length;
    const diceCount = contrib.dice_rolls.length;
    const highlightCount = contrib.highlight_moments.length;
    
    // 活躍度スコア計算（行動数、ダイス数、ハイライト数から）
    const activityScore = Math.min(100, (actionCount / totalTurns) * 100);
    
    // ダイス結果分析
    const diceResults = contrib.dice_rolls.map(roll => {
      const match = roll.content.match(/\[(\d+)\]/);
      return match ? parseInt(match[1]) : 0;
    }).filter(val => val > 0);
    
    const averageDiceRoll = diceResults.length > 0 
      ? (diceResults.reduce((sum, val) => sum + val, 0) / diceResults.length).toFixed(1)
      : '0';
    
    const maxDiceRoll = diceResults.length > 0 ? Math.max(...diceResults) : 0;
    const minDiceRoll = diceResults.length > 0 ? Math.min(...diceResults) : 0;
    
    return {
      actionCount,
      diceCount,
      highlightCount,
      activityScore,
      averageDiceRoll,
      maxDiceRoll,
      minDiceRoll,
      diceResults
    };
  };

  // 称号を決定
  const getPlayerTitle = (contrib: PlayerContribution, stats: ReturnType<typeof calculatePlayerStats>) => {
    if (stats.maxDiceRoll >= 18) return { title: '🎯 神秘の幸運児', color: 'success' as const };
    if (stats.actionCount >= totalTurns * 0.8) return { title: '⚡ 積極的な冒険者', color: 'primary' as const };
    if (stats.highlightCount >= 3) return { title: '✨ 印象的な英雄', color: 'secondary' as const };
    if (stats.diceCount >= 5) return { title: '🎲 運命の挑戦者', color: 'warning' as const };
    if (stats.averageDiceRoll && parseFloat(stats.averageDiceRoll) >= 12) return { title: '🍀 幸運の持ち主', color: 'info' as const };
    return { title: '🗡️ 勇敢な冒険者', color: 'primary' as const };
  };

  const formatActionText = (action: string, maxLength: number = 80) => {
    if (action.length <= maxLength) return action;
    return action.substring(0, maxLength) + '...';
  };

  if (playerContributions.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            👥 プレイヤーハイライト
          </Typography>
          <Typography variant="body2" color="text.primary">
            プレイヤーデータがありません。
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <TrophyIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            👥 プレイヤーハイライト
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {playerContributions.map((contrib, index) => {
            const stats = calculatePlayerStats(contrib);
            const title = getPlayerTitle(contrib, stats);
            const playerData = players[contrib.player_id];

            return (
              <Grid item xs={12} md={playerContributions.length === 1 ? 12 : 6} key={contrib.player_id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    border: 2,
                    borderColor: `${title.color}.light`,
                    backgroundColor: `${title.color}.light`,
                    color: `${title.color}.contrastText`
                  }}
                >
                  <CardContent>
                    {/* プレイヤーヘッダー */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Badge
                        badgeContent={<StarIcon sx={{ fontSize: 16 }} />}
                        color={title.color}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar
                          src={playerData?.characterImageUrl}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {contrib.character_name}
                        </Typography>
                        <Chip
                          label={title.title}
                          color={title.color}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    {/* 活躍度メーター */}
                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom>
                        活躍度
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={stats.activityScore}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(0,0,0,0.1)'
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {stats.activityScore.toFixed(1)}% ({stats.actionCount}/{totalTurns} ターン)
                      </Typography>
                    </Box>

                    {/* 統計情報 */}
                    <Grid container spacing={1} mb={2}>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold">
                            {stats.actionCount}
                          </Typography>
                          <Typography variant="caption">行動回数</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold">
                            {stats.diceCount}
                          </Typography>
                          <Typography variant="caption">ダイス回数</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold">
                            {stats.averageDiceRoll}
                          </Typography>
                          <Typography variant="caption">平均出目</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />

                    {/* 詳細アコーディオン */}
                    <Accordion 
                      elevation={0}
                      sx={{ 
                        backgroundColor: 'transparent',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">詳細を見る</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        {/* ハイライトモーメント */}
                        {contrib.highlight_moments.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              ✨ ハイライトモーメント
                            </Typography>
                            <List dense>
                              {contrib.highlight_moments.map((moment, idx) => (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemAvatar>
                                    <StarIcon sx={{ color: 'warning.main' }} />
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary={moment}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {/* 主要な行動 */}
                        {contrib.key_actions.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              🗡️ 主要な行動
                            </Typography>
                            <List dense>
                              {contrib.key_actions.slice(0, 3).map((action, idx) => (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemAvatar>
                                    <PsychologyIcon sx={{ color: 'info.main' }} />
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary={formatActionText(action)}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {/* ダイス履歴 */}
                        {contrib.dice_rolls.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              🎲 ダイス履歴
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {contrib.dice_rolls.slice(0, 5).map((roll, idx) => {
                                const match = roll.content.match(/\[(\d+)\]/);
                                const result = match ? parseInt(match[1]) : 0;
                                const color = result >= 15 ? 'success' : result >= 10 ? 'info' : 'error';
                                
                                return (
                                  <Chip
                                    key={idx}
                                    icon={<DiceIcon />}
                                    label={`T${roll.turn}: ${result}`}
                                    size="small"
                                    color={color}
                                    variant="outlined"
                                  />
                                );
                              })}
                            </Box>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              最高出目: {stats.maxDiceRoll} | 最低出目: {stats.minDiceRoll}
                            </Typography>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PlayerHighlights;