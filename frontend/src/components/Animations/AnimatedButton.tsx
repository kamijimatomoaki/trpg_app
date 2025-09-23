import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ButtonProps {
  children?: React.ReactNode;
  sx?: any;
  variant?: 'text' | 'outlined' | 'contained';
  [key: string]: any;
}

interface AnimatedButtonProps extends Omit<ButtonProps, 'component'> {
  children: React.ReactNode;
  rippleColor?: string;
  pulseEffect?: boolean;
}

const StyledButton = styled(Button)<{ rippleColor?: string; pulseEffect?: boolean }>(({ 
  theme, 
  rippleColor = 'rgba(255,255,255,0.3)',
  pulseEffect = false 
}) => ({
  position: 'relative',
  overflow: 'hidden',
  
  ...(pulseEffect && {
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)',
      },
      '70%': {
        boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
      },
    },
  }),

  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    background: rippleColor,
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.6s, height 0.6s',
  },

  '&:active::before': {
    width: '300px',
    height: '300px',
  },
}));

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  rippleColor,
  pulseEffect = false,
  ...buttonProps
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <StyledButton 
        rippleColor={rippleColor} 
        pulseEffect={pulseEffect}
        {...buttonProps}
      >
        {children}
      </StyledButton>
    </motion.div>
  );
};

export default AnimatedButton;