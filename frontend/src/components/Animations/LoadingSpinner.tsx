import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  variant?: 'dice' | 'magic' | 'simple';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 60,
  message = "読み込み中...",
  variant = 'simple'
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'dice':
        return (
          <motion.div
            animate={{ 
              rotateX: [0, 360],
              rotateY: [0, 360],
              rotateZ: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear" 
            }}
            style={{
              fontSize: size,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            🎲
          </motion.div>
        );
        
      case 'magic':
        return (
          <motion.div
            style={{
              width: size,
              height: size,
              position: 'relative',
            }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 8,
                  height: 8,
                  background: `hsl(${i * 60}, 70%, 60%)`,
                  borderRadius: '50%',
                  transformOrigin: `${20}px 0`,
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                }}
              />
            ))}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: size * 0.4,
              }}
            >
              ✨
            </motion.div>
          </motion.div>
        );
        
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: size,
              height: size,
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
            }}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 3,
      }}
    >
      {renderSpinner()}
      
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.primary',
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            {message}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
};

export default LoadingSpinner;