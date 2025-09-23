import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Paper,
  Avatar,
  Divider
} from '@mui/material';
import { Send, SmartToy, Person, Close } from '@mui/icons-material';
import { sendGMChat } from '../services/api';

interface GMChatDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  playerName: string;
}

interface ChatMessage {
  id: string;
  type: 'player' | 'gm';
  content: string;
  timestamp: Date;
}

export const GMChatDialog: React.FC<GMChatDialogProps> = ({ 
  open, 
  onClose, 
  gameId, 
  playerName 
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSubmitting) return;

    const playerMessage: ChatMessage = {
      id: `player-${Date.now()}`,
      type: 'player',
      content: message.trim(),
      timestamp: new Date()
    };

    // プレイヤーメッセージを即座に追加
    setChatHistory(prev => [...prev, playerMessage]);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await sendGMChat(gameId, message.trim());
      
      // GMの応答を追加
      const gmMessage: ChatMessage = {
        id: `gm-${Date.now()}`,
        type: 'gm',
        content: response.gm_response,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, gmMessage]);
      setMessage(''); // メッセージクリア
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'GMとの通信に失敗しました。';
      setError(errorMessage);
      console.error('GM chat error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))',
          border: '3px solid rgba(139, 69, 19, 0.4)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(139, 69, 19, 0.3)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.08))',
        borderBottom: '2px solid rgba(139, 69, 19, 0.3)',
        color: '#8B4513',
        fontWeight: 'bold',
        fontFamily: '"Cinzel", "Noto Serif JP", serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SmartToy sx={{ color: '#D69E2E', fontSize: 32 }} />
          <Typography variant="h5" sx={{ 
            fontFamily: '"Cinzel", "Noto Serif JP", serif',
            fontWeight: 'bold'
          }}>
            ゲームマスターとの相談
          </Typography>
        </Box>
        <Button
          onClick={handleClose}
          sx={{ 
            minWidth: 'auto',
            color: '#8B4513',
            '&:hover': { background: 'rgba(139, 69, 19, 0.1)' }
          }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '60vh' }}>
        {/* チャット履歴表示エリア */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          background: 'linear-gradient(180deg, rgba(252, 251, 247, 0.8), rgba(247, 240, 230, 0.9))'
        }}>
          {chatHistory.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#8B4513',
              textAlign: 'center',
              gap: 2
            }}>
              <SmartToy sx={{ fontSize: 64, color: '#D69E2E' }} />
              <Typography variant="h6" sx={{ 
                fontFamily: '"Cinzel", "Noto Serif JP", serif',
                fontWeight: 'bold'
              }}>
                ゲームマスターに何でも相談してください
              </Typography>
              <Typography variant="body1" sx={{ 
                fontFamily: '"Noto Serif JP", serif',
                color: '#8B4513'
              }}>
                ルールの質問、物語の相談、キャラクターの行動についてなど、<br />
                どんなことでもお気軽にお聞きください。
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {chatHistory.map((chat, index) => (
                <ListItem key={chat.id} sx={{ 
                  mb: 2, 
                  p: 0,
                  display: 'block'
                }}>
                  <Paper sx={{
                    p: 2.5,
                    background: chat.type === 'gm' 
                      ? 'linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))'
                      : 'linear-gradient(135deg, rgba(72, 61, 139, 0.08), rgba(106, 90, 205, 0.05))',
                    border: `2px solid ${chat.type === 'gm' ? 'rgba(139, 69, 19, 0.3)' : 'rgba(72, 61, 139, 0.3)'}`,
                    borderRadius: 2,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: chat.type === 'gm' 
                        ? 'linear-gradient(135deg, #8B4513, #D2691E)'
                        : 'linear-gradient(135deg, #483D8B, #6A5ACD)',
                      borderRadius: '0 2px 2px 0'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 2,
                        background: chat.type === 'gm' 
                          ? 'linear-gradient(135deg, #8B4513, #D2691E)'
                          : 'linear-gradient(135deg, #483D8B, #6A5ACD)'
                      }}>
                        {chat.type === 'gm' ? <SmartToy /> : <Person />}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 'bold', 
                          color: '#2F1B14',
                          fontFamily: '"Cinzel", "Noto Serif JP", serif',
                          mb: 0.5
                        }}>
                          {chat.type === 'gm' ? 'ゲームマスター' : playerName}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ 
                          color: '#2F1B14',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          fontFamily: '"Noto Serif JP", serif'
                        }}>
                          {chat.content}
                        </Typography>
                        
                        <Typography variant="caption" sx={{ 
                          color: '#8B4513',
                          fontStyle: 'italic',
                          display: 'block',
                          mt: 1,
                          textAlign: 'right'
                        }}>
                          {chat.timestamp.toLocaleTimeString('ja-JP')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}

          {/* GM思考中表示 */}
          {isSubmitting && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 2,
              background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.08), rgba(210, 105, 30, 0.05))',
              border: '2px dashed rgba(139, 69, 19, 0.3)',
              borderRadius: 2,
              mt: 2
            }}>
              <CircularProgress 
                size={24} 
                sx={{ 
                  color: '#8B4513',
                  mr: 2
                }} 
              />
              <Typography sx={{ 
                color: '#8B4513',
                fontStyle: 'italic',
                fontFamily: '"Noto Serif JP", serif'
              }}>
                ゲームマスターが考えています...
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ background: 'rgba(139, 69, 19, 0.2)' }} />

        {/* メッセージ入力エリア */}
        <Box sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, rgba(252, 251, 247, 0.98), rgba(247, 240, 230, 0.95))'
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ゲームマスターへの質問や相談をここに入力してください..."
            disabled={isSubmitting}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                fontFamily: '"Noto Serif JP", serif',
                '& fieldset': {
                  borderColor: 'rgba(139, 69, 19, 0.3)',
                  borderWidth: '2px'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(139, 69, 19, 0.5)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#8B4513'
                }
              },
              '& .MuiInputBase-input': {
                color: '#2F1B14',
                fontFamily: '"Noto Serif JP", serif'
              }
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSendMessage}
              disabled={!message.trim() || isSubmitting}
              sx={{
                background: 'linear-gradient(45deg, #8B4513, #D2691E)',
                color: '#FFF8DC',
                fontWeight: 'bold',
                fontFamily: '"Noto Serif JP", serif',
                px: 3,
                py: 1,
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
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  送信中...
                </>
              ) : (
                '送信'
              )}
            </Button>
            
            <Typography variant="body2" sx={{ 
              color: '#8B4513',
              fontStyle: 'italic',
              fontFamily: '"Noto Serif JP", serif'
            }}>
              Enterキーで送信 (Shift+Enterで改行)
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};