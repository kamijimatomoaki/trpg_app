import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  PlayArrow,
  Stop,
  ExpandMore,
  ExpandLess,
  MusicNote,
  RecordVoiceOver,
  Videocam,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import useAudioSystem, { type AudioTrack } from '../../hooks/useAudioSystem';

interface AudioControlsProps {
  showAdvanced?: boolean;
  compact?: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  showAdvanced = true,
  compact = false
}) => {
  const {
    masterVolume,
    setMasterVolume,
    bgmVolume,
    setBgmVolume,
    seVolume,
    setSeVolume,
    voiceVolume,
    setVoiceVolume,
    isMuted,
    setIsMuted,
    playTrack,
    stopTrack,
    stopAllTracks,
    audioStates,
    presetTracks
  } = useAudioSystem();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const categoryIcons = {
    bgm: <MusicNote />,
    se: <Videocam />,
    voice: <RecordVoiceOver />
  };

  const categoryNames = {
    bgm: 'BGM',
    se: '効果音',
    voice: 'ボイス'
  };

  const getCategoryTracks = (category: AudioTrack['category']) => {
    return presetTracks.filter(track => track.category === category);
  };

  const isTrackPlaying = (trackId: string) => {
    const state = audioStates.get(trackId);
    return state?.isPlaying || false;
  };

  const handleCategoryToggle = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleTrackPlay = (trackId: string) => {
    if (isTrackPlaying(trackId)) {
      stopTrack(trackId, { fadeOut: 500 });
    } else {
      // 同カテゴリの他の音源を停止（BGMの場合）
      const track = presetTracks.find(t => t.id === trackId);
      if (track?.category === 'bgm') {
        stopAllTracks('bgm');
      }
      playTrack(trackId, { fadeIn: 500 });
    }
  };

  if (compact) {
    return (
      <Card sx={{ 
        background: 'rgba(45, 46, 54, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(113, 128, 150, 0.2)'
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setIsMuted(!isMuted)}
              sx={{ color: isMuted ? 'error.main' : 'primary.main' }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            
            <Box sx={{ flex: 1, minWidth: 100 }}>
              <Slider
                value={masterVolume * 100}
                onChange={(_, value) => setMasterVolume((value as number) / 100)}
                size="small"
                disabled={isMuted}
                sx={{
                  color: isMuted ? 'grey.500' : 'primary.main',
                  '& .MuiSlider-thumb': {
                    boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                  },
                }}
              />
            </Box>
            
            <Typography variant="caption" sx={{ minWidth: 30, color: '#F7FAFC' }}>
              {Math.round(masterVolume * 100)}%
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      background: 'rgba(45, 46, 54, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(113, 128, 150, 0.2)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🎵 音響コントロール
          </Typography>
          
          {showAdvanced && (
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              size="small"
              sx={{ color: 'text.primary' }}
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Box>

        {/* マスター音量 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <IconButton
              onClick={() => setIsMuted(!isMuted)}
              sx={{ color: isMuted ? 'error.main' : 'primary.main' }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 80, color: '#F7FAFC' }}>
              マスター音量
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Slider
                value={masterVolume * 100}
                onChange={(_, value) => setMasterVolume((value as number) / 100)}
                disabled={isMuted}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{
                  color: isMuted ? 'grey.500' : 'primary.main',
                  '& .MuiSlider-thumb': {
                    boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* 詳細設定 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Divider sx={{ mb: 2, borderColor: 'rgba(113, 128, 150, 0.2)' }} />
              
              {/* カテゴリ別音量 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  カテゴリ別音量
                </Typography>
                
                {Object.entries(categoryNames).map(([category, name]) => (
                  <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ color: 'secondary.main', minWidth: 24 }}>
                      {categoryIcons[category as keyof typeof categoryIcons]}
                    </Box>
                    <Typography variant="body2" sx={{ minWidth: 60, color: '#F7FAFC' }}>
                      {name}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Slider
                        value={
                          category === 'bgm' ? bgmVolume * 100 :
                          category === 'se' ? seVolume * 100 :
                          voiceVolume * 100
                        }
                        onChange={(_, value) => {
                          const vol = (value as number) / 100;
                          if (category === 'bgm') setBgmVolume(vol);
                          else if (category === 'se') setSeVolume(vol);
                          else setVoiceVolume(vol);
                        }}
                        disabled={isMuted}
                        size="small"
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                        sx={{
                          color: 'secondary.main',
                          '& .MuiSlider-thumb': {
                            boxShadow: '0 0 0 6px rgba(214, 158, 46, 0.16)',
                          },
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* 音源一覧 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  音源一覧
                </Typography>
                
                {Object.entries(categoryNames).map(([category, name]) => (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => handleCategoryToggle(category)}
                      sx={{ 
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        color: 'text.primary'
                      }}
                      endIcon={expandedCategory === category ? <ExpandLess /> : <ExpandMore />}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {categoryIcons[category as keyof typeof categoryIcons]}
                        {name}
                        <Chip 
                          label={getCategoryTracks(category as AudioTrack['category']).length} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Button>
                    
                    <Collapse in={expandedCategory === category}>
                      <List dense>
                        {getCategoryTracks(category as AudioTrack['category']).map((track) => (
                          <ListItem key={track.id} sx={{ pl: 4 }}>
                            <ListItemText 
                              primary={track.name}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                onClick={() => handleTrackPlay(track.id)}
                                sx={{ 
                                  color: isTrackPlaying(track.id) ? 'error.main' : 'primary.main'
                                }}
                              >
                                {isTrackPlaying(track.id) ? <Stop /> : <PlayArrow />}
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                ))}
              </Box>

              {/* 全停止ボタン */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => stopAllTracks()}
                  startIcon={<Stop />}
                  sx={{ 
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      background: 'rgba(244, 67, 54, 0.08)'
                    }
                  }}
                >
                  全音源停止
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AudioControls;