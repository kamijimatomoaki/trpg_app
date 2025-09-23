import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Chip } from '@mui/material';
import { Casino, Refresh } from '@mui/icons-material';

interface DiceRollerProps {
  label: string;
  shortLabel: string;
  value: number;
  isRolling: boolean;
  onRoll: () => void;
  modifier: number;
  remainingRolls: number;
  maxRolls: number;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  label,
  shortLabel,
  value,
  isRolling,
  onRoll,
  modifier,
  remainingRolls,
  maxRolls
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 18) + 3);
        setAnimationStep(prev => prev + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(value);
        setAnimationStep(0);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRolling, value]);

  const getModifierColor = (mod: number) => {
    if (mod > 0) return 'success';
    if (mod < 0) return 'error';
    return 'default';
  };

  const getValueColor = (val: number) => {
    if (val >= 15) return '#4caf50'; // 緑（優秀）
    if (val >= 13) return '#2196f3'; // 青（良好）
    if (val >= 10) return '#ff9800'; // オレンジ（平均）
    if (val >= 8) return '#ff5722';  // 赤橙（低い）
    return '#f44336'; // 赤（非常に低い）
  };

  return (
    <Paper 
      elevation={isRolling ? 8 : 2}
      sx={{ 
        p: 2, 
        textAlign: 'center', 
        minHeight: 140,
        background: isRolling 
          ? 'linear-gradient(45deg, #ff6b6b, #feca57)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        transform: isRolling ? `rotate(${animationStep * 10}deg) scale(1.05)` : 'none',
        transition: 'all 0.1s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: isRolling ? undefined : 'scale(1.02)',
          boxShadow: isRolling ? undefined : '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
      onClick={onRoll}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
          {label}
        </Typography>
        <Chip 
          label={`${remainingRolls}/${maxRolls}`}
          size="small"
          sx={{ 
            height: 16,
            fontSize: '0.6rem',
            bgcolor: remainingRolls > 0 ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)',
            color: 'white'
          }}
        />
      </Box>
      
      <Box sx={{ my: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Casino 
          sx={{ 
            mr: 1, 
            fontSize: 24,
            animation: isRolling ? 'spin 0.1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} 
        />
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            color: getValueColor(displayValue),
            fontSize: isRolling ? '2.5rem' : '2.125rem',
            transition: 'all 0.2s'
          }}
        >
          {isRolling ? '?' : displayValue}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip 
          label={shortLabel}
          size="small"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'white',
            fontWeight: 'bold'
          }}
        />
        
        <Chip 
          label={modifier >= 0 ? `+${modifier}` : `${modifier}`}
          size="small"
          color={getModifierColor(modifier) as any}
          sx={{ 
            bgcolor: modifier > 0 ? 'rgba(76,175,80,0.8)' : 
                    modifier < 0 ? 'rgba(244,67,54,0.8)' : 'rgba(158,158,158,0.8)',
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      {!isRolling && (
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            if (remainingRolls > 0) onRoll();
          }}
          disabled={remainingRolls === 0}
          sx={{ 
            mt: 1, 
            color: remainingRolls > 0 ? 'white' : 'rgba(255,255,255,0.3)', 
            bgcolor: remainingRolls > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            '&:hover': { 
              bgcolor: remainingRolls > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' 
            },
            '&:disabled': {
              color: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          <Refresh fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
};