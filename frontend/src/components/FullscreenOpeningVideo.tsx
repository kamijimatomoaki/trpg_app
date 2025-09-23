import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Fade,
  Backdrop,
  LinearProgress
} from '@mui/material';
import { PlayArrow, VolumeOff, VolumeUp, Close } from '@mui/icons-material';

interface FullscreenOpeningVideoProps {
  videoUrl: string;
  scenarioTitle: string;
  scenarioSummary: string;
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const FullscreenOpeningVideo: React.FC<FullscreenOpeningVideoProps> = ({
  videoUrl,
  scenarioTitle,
  scenarioSummary,
  isOpen,
  onComplete,
  onSkip
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showTitleCard, setShowTitleCard] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      // 動画の読み込み完了を待つ
      const video = videoRef.current;
      video.load();
    }
  }, [isOpen]);

  const handlePlay = () => {
    if (videoRef.current) {
      setShowTitleCard(false);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!isOpen) return null;

  return (
    <Backdrop open={isOpen} sx={{ zIndex: 2000, color: '#fff' }}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* タイトルカード */}
        <Fade in={showTitleCard} timeout={1000}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 10,
              padding: 4
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'Merriweather, serif',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #ffd700, #fff8dc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                mb: 4,
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' }
              }}
            >
              {scenarioTitle}
            </Typography>
            
            <Box
              sx={{
                maxWidth: 800,
                p: 3,
                mb: 6,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.8,
                  color: '#fff8dc',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {scenarioSummary}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handlePlay}
              sx={{
                fontSize: '1.2rem',
                py: 2,
                px: 4,
                background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                color: '#1a1a2e',
                fontWeight: 'bold',
                boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ffed4e, #ffd700)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              冒険を始める
            </Button>
          </Box>
        </Fade>

        {/* 動画 */}
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          muted={isMuted}
          playsInline
        />

        {/* 進行状況バー */}
        {isPlaying && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ffd700'
              }
            }}
          />
        )}

        {/* コントロール */}
        <Fade in={showControls} timeout={300}>
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              gap: 1,
              zIndex: 20
            }}
          >
            {isPlaying && (
              <IconButton
                onClick={toggleMute}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            )}
            <IconButton
              onClick={onSkip}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Fade>

        {/* スキップボタン */}
        {(showTitleCard || isPlaying) && (
          <Fade in={showControls} timeout={300}>
            <Button
              onClick={onSkip}
              sx={{
                position: 'absolute',
                bottom: 30,
                right: 30,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'transparent'
                },
                zIndex: 20
              }}
            >
              スキップ
            </Button>
          </Fade>
        )}
      </Box>
    </Backdrop>
  );
};