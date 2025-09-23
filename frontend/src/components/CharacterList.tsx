import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { Person, Star } from '@mui/icons-material';

interface Player {
  uid: string;
  name: string;
  characterName?: string;
  characterDescription?: string;
  characterImageUrl?: string;
  isHost?: boolean;
  isReady?: boolean;
}

interface CharacterListProps {
  players: Record<string, Player>;
  currentUserId?: string | null;
  onCharacterClick: (playerId: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({ 
  players, 
  currentUserId, 
  onCharacterClick 
}) => {
  const playerList = Object.entries(players);

  if (playerList.length === 0) {
    return (
      <Paper elevation={2} sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #F5E6D3, #E8D5B7)',
        border: '2px solid #8B4513',
        borderRadius: 2
      }}>
        <Typography variant="body2" sx={{ 
          color: '#8B4513', 
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          参加中のプレイヤーはいません
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ 
      background: 'linear-gradient(135deg, #F5E6D3, #E8D5B7)',
      border: '2px solid #8B4513',
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(139, 69, 19, 0.3)',
        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.05))'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold', 
          color: '#8B4513',
          fontFamily: '"Cinzel", "Noto Serif JP", serif',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <Person sx={{ fontSize: '1.2rem' }} />
          冒険者一覧
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {playerList.map(([playerId, player], index) => (
          <React.Fragment key={playerId}>
            <ListItem sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => onCharacterClick(playerId)}
                sx={{
                  p: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.15), rgba(210, 105, 30, 0.1))',
                    transform: 'translateX(4px)'
                  },
                  '&:active': {
                    transform: 'translateX(2px)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar 
                      src={player.characterImageUrl}
                      sx={{ 
                        width: 48, 
                        height: 48,
                        border: '2px solid #8B4513',
                        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
                      }}
                    >
                      <Person sx={{ color: '#8B4513' }} />
                    </Avatar>
                    {player.isHost && (
                      <Star 
                        sx={{ 
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          color: '#DAA520',
                          fontSize: '1rem',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                        }} 
                      />
                    )}
                    {currentUserId === playerId && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #4CAF50, #2E7D32)',
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}
                      />
                    )}
                  </Box>
                </ListItemAvatar>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  {/* Primary content */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#8B4513',
                        fontFamily: '"Cinzel", "Noto Serif JP", serif'
                      }}
                    >
                      {player.characterName || '名無しの冒険者'}
                    </Typography>
                    {player.isHost && (
                      <Chip 
                        label="ホスト" 
                        size="small" 
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          background: 'linear-gradient(45deg, #DAA520, #B8860B)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    {currentUserId === playerId && (
                      <Chip 
                        label="あなた" 
                        size="small" 
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          background: 'linear-gradient(45deg, #4CAF50, #2E7D32)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Secondary content */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6B4423',
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    プレイヤー: {player.name || 'Unknown'}
                  </Typography>
                  {player.characterDescription && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#8B4513',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {player.characterDescription}
                    </Typography>
                  )}
                </Box>
              </ListItemButton>
            </ListItem>
            {index < playerList.length - 1 && (
              <Divider sx={{ borderColor: 'rgba(139, 69, 19, 0.2)' }} />
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid rgba(139, 69, 19, 0.3)',
        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.05), rgba(210, 105, 30, 0.02))'
      }}>
        <Typography variant="caption" sx={{ 
          color: '#8B4513',
          fontStyle: 'italic',
          textAlign: 'center',
          display: 'block'
        }}>
          キャラクターをクリックして詳細を表示
        </Typography>
      </Box>
    </Paper>
  );
};