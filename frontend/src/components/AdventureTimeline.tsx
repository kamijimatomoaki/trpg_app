import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Stack
} from '@mui/material';
import {
  SmartToy as GmIcon,
  Person as PlayerIcon,
  Casino as DiceIcon,
  Image as ImageIcon,
  PlayArrow as StartIcon,
  Flag as EndIcon
} from '@mui/icons-material';

interface GameLog {
  turn: number;
  type: 'gm_narration' | 'player_action' | 'gm_response' | 'dice_roll' | 'image_generation';
  content: string;
  playerId?: string;
  imageUrl?: string;
  timestamp?: string;
}

interface AdventureTimelineProps {
  gameLog: GameLog[];
  players: Record<string, { characterName: string; characterImageUrl?: string }>;
  scenarioTitle: string;
}

const AdventureTimeline: React.FC<AdventureTimelineProps> = ({ 
  gameLog, 
  players,
  scenarioTitle 
}) => {
  // ログをフィルタリングして重要なイベントのみ表示
  const importantLogs = gameLog.filter(log => 
    log.type === 'gm_narration' || 
    log.type === 'player_action' || 
    log.type === 'dice_roll' ||
    (log.type === 'gm_response' && log.content.length > 100) // 重要なGM応答のみ
  );

  const getLogIcon = (log: GameLog) => {
    switch (log.type) {
      case 'gm_narration':
        return <StartIcon />;
      case 'player_action':
        return <PlayerIcon />;
      case 'gm_response':
        return <GmIcon />;
      case 'dice_roll':
        return <DiceIcon />;
      case 'image_generation':
        return <ImageIcon />;
      default:
        return <GmIcon />;
    }
  };

  const getLogColor = (log: GameLog): "primary" | "secondary" | "error" | "warning" | "info" | "success" => {
    switch (log.type) {
      case 'gm_narration':
        return 'primary';
      case 'player_action':
        return 'info';
      case 'gm_response':
        return 'secondary';
      case 'dice_roll':
        return 'warning';
      case 'image_generation':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getPlayerName = (playerId?: string) => {
    if (!playerId || !players[playerId]) return 'Unknown';
    return players[playerId].characterName || 'Unknown';
  };

  const formatContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getTypeLabel = (log: GameLog) => {
    switch (log.type) {
      case 'gm_narration':
        return 'オープニング';
      case 'player_action':
        return 'プレイヤー行動';
      case 'gm_response':
        return 'GM応答';
      case 'dice_roll':
        return 'ダイス判定';
      case 'image_generation':
        return '画像生成';
      default:
        return '不明';
    }
  };

  if (importantLogs.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📜 冒険タイムライン
          </Typography>
          <Typography variant="body2" color="text.primary">
            まだ冒険のログがありません。
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <EndIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            📜 冒険タイムライン
          </Typography>
        </Box>
        
        <Typography variant="subtitle1" color="primary" gutterBottom>
          {scenarioTitle}
        </Typography>

        <List>
          {importantLogs.map((log, index) => (
            <React.Fragment key={`${log.turn}-${log.type}-${index}`}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getLogColor(log)}.main` }}>
                    {getLogIcon(log)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip 
                        label={`ターン ${log.turn}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={getTypeLabel(log)}
                        size="small"
                        color={getLogColor(log)}
                        variant="filled"
                      />
                      {log.type === 'player_action' && (
                        <Chip 
                          label={getPlayerName(log.playerId)}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Card 
                      elevation={1} 
                      sx={{ 
                        mt: 1,
                        backgroundColor: log.type === 'player_action' ? 'action.hover' : 'background.paper',
                        border: log.type === 'dice_roll' ? 2 : 1,
                        borderColor: log.type === 'dice_roll' ? 'warning.main' : 'divider'
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            lineHeight: 1.6,
                            fontFamily: log.type === 'gm_narration' || log.type === 'gm_response' 
                              ? '"Noto Serif JP", serif' 
                              : 'inherit'
                          }}
                        >
                          {formatContent(log.content)}
                        </Typography>
                        
                        {log.imageUrl && (
                          <Box mt={1}>
                            <Chip 
                              icon={<ImageIcon />}
                              label="画像生成"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  }
                />
              </ListItem>
              {index < importantLogs.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
          
          {/* 終了マーカー */}
          <Divider component="li" />
          <ListItem sx={{ px: 0 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <EndIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Card elevation={2} sx={{ backgroundColor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="body1" fontWeight="bold">
                      🏁 冒険完了
                    </Typography>
                    <Typography variant="body2">
                      素晴らしい冒険でした！
                    </Typography>
                  </CardContent>
                </Card>
              }
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

export default AdventureTimeline;