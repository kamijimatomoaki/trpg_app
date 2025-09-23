import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@mui/material';
import { styled } from '@mui/material/styles';

interface CardProps {
  children?: React.ReactNode;
  sx?: any;
  [key: string]: any;
}

interface AnimatedCardProps extends Omit<CardProps, 'component'> {
  children: React.ReactNode;
  hoverScale?: number;
  hoverShadow?: string;
  animationDelay?: number;
}

const StyledCard = styled(Card)<{ hoverShadow?: string }>(({ theme, hoverShadow }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    transition: 'left 0.5s',
    zIndex: 1,
  },
  
  '&:hover': {
    boxShadow: hoverShadow || '0 20px 40px rgba(0,0,0,0.15)',
    
    '&::before': {
      left: '100%',
    },
  },
}));

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverScale = 1.03,
  hoverShadow,
  animationDelay = 0,
  ...cardProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: animationDelay,
        ease: "easeOut" 
      }}
      whileHover={{ 
        scale: hoverScale,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.98 }}
    >
      <StyledCard hoverShadow={hoverShadow} {...cardProps}>
        {children}
      </StyledCard>
    </motion.div>
  );
};

export default AnimatedCard;