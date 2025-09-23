import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore,
  AutoAwesome,
  Psychology,
  TheaterComedy,
  School,
  Explore,
  DarkMode,
  EmojiEvents,
  Settings,
} from '@mui/icons-material';

interface GMPersonality {
  id: string;
  name: string;
  avatar: string;
  description: string;
  specialty: string[];
  voice: {
    tone: 'formal' | 'casual' | 'mysterious' | 'dramatic';
    style: string;
  };
  stats: {
    creativity: number;
    patience: number;
    challenge: number;
    humor: number;
  };
  narrativeStyle: {
    detail: 'minimal' | 'moderate' | 'verbose';
    atmosphere: 'serious' | 'humorous' | 'dark' | 'heroic';
    pacing: 'fast' | 'medium' | 'slow';
  };
}

const gmPresets: GMPersonality[] = [
  {
    id: 'wise_scholar',
    name: '賢者アルベルト',
    avatar: '🧙‍♂️',
    description: '古い魔法の知識と深い洞察を持つ学者型GM。詳細な世界観と魔法システムを重視します。',
    specialty: ['魔法', '知識', '謎解き', '古代史'],
    voice: { tone: 'formal', style: 'アカデミックで格調高い語り口' },
    stats: { creativity: 85, patience: 90, challenge: 70, humor: 40 },
    narrativeStyle: { detail: 'verbose', atmosphere: 'serious', pacing: 'slow' }
  },
  {
    id: 'adventurer_sara',
    name: '冒険家サラ',
    avatar: '⚔️',
    description: 'テンポよくアクション重視の展開を好む現代的なGM。プレイヤーの自由度を重視します。',
    specialty: ['戦闘', '探索', 'アクション', '冒険'],
    voice: { tone: 'casual', style: 'フレンドリーで親しみやすい' },
    stats: { creativity: 75, patience: 60, challenge: 85, humor: 80 },
    narrativeStyle: { detail: 'moderate', atmosphere: 'heroic', pacing: 'fast' }
  },
  {
    id: 'mystery_keeper',
    name: '神秘の語り部',
    avatar: '🌙',
    description: '雰囲気と心理描写を重視する芸術家肌のGM。恐怖と美しさを巧みに織り交ぜます。',
    specialty: ['ホラー', 'ミステリー', '心理戦', '雰囲気'],
    voice: { tone: 'mysterious', style: '詩的で含みのある表現' },
    stats: { creativity: 95, patience: 75, challenge: 80, humor: 30 },
    narrativeStyle: { detail: 'verbose', atmosphere: 'dark', pacing: 'medium' }
  },
  {
    id: 'comic_relief',
    name: 'お笑い師ボブ',
    avatar: '🎭',
    description: '楽しく笑えるセッションを心がける気さくなGM。緊張をほぐしつつ楽しい冒険を提供します。',
    specialty: ['コメディ', '日常', 'ほのぼの', 'パロディ'],
    voice: { tone: 'casual', style: 'ユーモアたっぷりで軽快' },
    stats: { creativity: 70, patience: 85, challenge: 50, humor: 95 },
    narrativeStyle: { detail: 'minimal', atmosphere: 'humorous', pacing: 'fast' }
  }
];

interface GMSelectorProps {
  onSelect: (gm: GMPersonality) => void;
  currentGM?: GMPersonality;
}

const GMSelector: React.FC<GMSelectorProps> = ({ onSelect, currentGM }) => {
  const [selectedGM, setSelectedGM] = useState<GMPersonality>(currentGM || gmPresets[0]);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [customGM, setCustomGM] = useState<GMPersonality>(selectedGM);

  const getStatColor = (value: number) => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FF9800';
    return '#F44336';
  };

  const handleCustomize = () => {
    setCustomGM(selectedGM);
    setCustomizationOpen(true);
  };

  const handleSaveCustomization = () => {
    onSelect(customGM);
    setCustomizationOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        textAlign: 'center',
        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        backgroundClip: 'text',
        color: 'transparent',
        mb: 4
      }}>
        🧙‍♂️ AI ゲームマスターを選択
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {gmPresets.map((gm, index) => (
          <Box key={gm.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedGM.id === gm.id ? '2px solid #667eea' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                  background: selectedGM.id === gm.id 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))'
                    : 'background.paper'
                }}
                onClick={() => setSelectedGM(gm)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        fontSize: '2rem',
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                      }}
                    >
                      {gm.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {gm.name}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                        {gm.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>専門分野</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {gm.specialty.map((spec) => (
                        <Chip 
                          key={spec} 
                          label={spec} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>特性</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      {Object.entries(gm.stats).map(([stat, value]) => (
                        <Box key={stat}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ minWidth: 40, fontSize: '0.7rem', color: '#F7FAFC' }}>
                              {stat === 'creativity' ? '創造性' :
                               stat === 'patience' ? '忍耐力' :
                               stat === 'challenge' ? '挑戦性' : 'ユーモア'}
                            </Typography>
                            <Box
                              sx={{
                                width: 60,
                                height: 4,
                                background: '#e0e0e0',
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${value}%`,
                                  height: '100%',
                                  background: getStatColor(value),
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              {value}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.primary" sx={{ fontStyle: 'italic' }}>
                    💬 {gm.voice.style}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={handleCustomize}
          sx={{ px: 4 }}
        >
          カスタマイズ
        </Button>
        
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={() => onSelect(selectedGM)}
          sx={{ 
            px: 4,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            }
          }}
        >
          この GMを選択
        </Button>
      </Box>

      {/* カスタマイズダイアログ */}
      <Dialog 
        open={customizationOpen} 
        onClose={() => setCustomizationOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">GMカスタマイズ</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>性格調整</Typography>
            
            {Object.entries(customGM.stats).map(([stat, value]) => (
              <Box key={stat} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {stat === 'creativity' ? '🎨 創造性' :
                   stat === 'patience' ? '⏰ 忍耐力' :
                   stat === 'challenge' ? '⚡ 挑戦性' : '😄 ユーモア'} ({value})
                </Typography>
                <Slider
                  value={value}
                  onChange={(_, newValue) => {
                    setCustomGM({
                      ...customGM,
                      stats: { ...customGM.stats, [stat]: newValue as number }
                    });
                  }}
                  min={0}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    color: getStatColor(value),
                    '& .MuiSlider-thumb': {
                      boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                    },
                  }}
                />
              </Box>
            ))}

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              ナレーションスタイル
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>詳細度</InputLabel>
                  <Select
                    value={customGM.narrativeStyle.detail}
                    onChange={(e) => setCustomGM({
                      ...customGM,
                      narrativeStyle: { 
                        ...customGM.narrativeStyle, 
                        detail: e.target.value as any 
                      }
                    })}
                  >
                    <MenuItem value="minimal">簡潔</MenuItem>
                    <MenuItem value="moderate">普通</MenuItem>
                    <MenuItem value="verbose">詳細</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>雰囲気</InputLabel>
                  <Select
                    value={customGM.narrativeStyle.atmosphere}
                    onChange={(e) => setCustomGM({
                      ...customGM,
                      narrativeStyle: { 
                        ...customGM.narrativeStyle, 
                        atmosphere: e.target.value as any 
                      }
                    })}
                  >
                    <MenuItem value="serious">シリアス</MenuItem>
                    <MenuItem value="humorous">ユーモラス</MenuItem>
                    <MenuItem value="dark">ダーク</MenuItem>
                    <MenuItem value="heroic">ヒロイック</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
                <FormControl fullWidth size="small">
                  <InputLabel>テンポ</InputLabel>
                  <Select
                    value={customGM.narrativeStyle.pacing}
                    onChange={(e) => setCustomGM({
                      ...customGM,
                      narrativeStyle: { 
                        ...customGM.narrativeStyle, 
                        pacing: e.target.value as any 
                      }
                    })}
                  >
                    <MenuItem value="fast">高速</MenuItem>
                    <MenuItem value="medium">普通</MenuItem>
                    <MenuItem value="slow">ゆっくり</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomizationOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSaveCustomization}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GMSelector;