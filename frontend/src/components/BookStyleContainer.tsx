import React from 'react';
import { Box, Paper, Typography, GlobalStyles } from '@mui/material';

interface BookStyleContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  pageNumber?: number;
  totalPages?: number;
}

export const BookStyleContainer: React.FC<BookStyleContainerProps> = ({
  children,
  title,
  subtitle,
  pageNumber,
  totalPages
}) => {
  return (
    <>
      <GlobalStyles styles={{
        '@keyframes pageFlip': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(-90deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        '@keyframes paperTexture': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' }
        },
        '@keyframes inkFlow': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        // 本のページ風テクスチャ
        '.book-page': {
          background: `
            linear-gradient(135deg, #faf7f0 0%, #f5f1e8 25%, #f0ebe1 50%, #f5f1e8 75%, #faf7f0 100%),
            radial-gradient(circle at 20% 80%, rgba(255, 248, 220, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(245, 241, 232, 0.8) 0%, transparent 50%)
          `,
          backgroundSize: '400px 400px, 200px 200px, 300px 300px',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 24px,
                rgba(200, 200, 200, 0.1) 24px,
                rgba(200, 200, 200, 0.1) 25px
              )
            `,
            pointerEvents: 'none'
          }
        },
        // インクのような文字
        '.ink-text': {
          fontFamily: '"Merriweather", "Noto Serif JP", serif',
          color: '#2c2c2c',
          textShadow: '0.5px 0.5px 1px rgba(0, 0, 0, 0.1)',
          animation: 'inkFlow 0.8s ease-out'
        },
        // 羊皮紙風エフェクト
        '.parchment': {
          background: `
            linear-gradient(45deg, 
              #f4f1e8 0%, 
              #f7f4eb 25%, 
              #faf7f0 50%, 
              #f7f4eb 75%, 
              #f4f1e8 100%
            )
          `,
          backgroundSize: '20px 20px',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(160, 82, 45, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none'
          }
        }
      }} />

      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 50%, #5d4037 100%)',
          padding: { xs: 2, sm: 4, md: 6 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: { xs: 4, sm: 6, md: 8 },
          paddingBottom: { xs: 4, sm: 6, md: 8 } // 下部余白も追加
        }}
      >
        <Paper
          className="book-page"
          sx={{
            width: '100%',
            maxWidth: { xs: '95%', sm: '90%', md: '85%', lg: '80%' },
            minHeight: '100vh', // 最小高さのみ、自動拡張可能
            padding: { xs: 3, sm: 4, md: 6, lg: 8 },
            borderRadius: 0,
            boxShadow: `
              0 0 20px rgba(0, 0, 0, 0.3),
              inset 0 0 120px rgba(255, 248, 220, 0.5),
              inset 0 0 40px rgba(245, 241, 232, 0.8)
            `,
            border: '1px solid rgba(139, 69, 19, 0.2)',
            position: 'relative',
            transform: 'perspective(1000px) rotateX(2deg)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 30,
              width: 2,
              height: '100%',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 0, 0, 0.3) 50%, transparent 100%)',
              zIndex: 1
            }
          }}
        >
          {/* ページヘッダー */}
          {(title || pageNumber) && (
            <Box sx={{ mb: 4, textAlign: 'center', position: 'relative', zIndex: 2 }}>
              {title && (
                <Typography
                  variant="h3"
                  className="ink-text"
                  sx={{
                    fontWeight: 400,
                    mb: subtitle ? 1 : 2,
                    fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                    background: 'linear-gradient(45deg, #D69E2E, #ECC94B)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 0 20px rgba(214, 158, 46, 0.4)',
                    textAlign: 'center',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 100,
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #D69E2E, transparent)'
                    }
                  }}
                >
                  {title}
                </Typography>
              )}
              
              {subtitle && (
                <Typography
                  variant="h6"
                  className="ink-text"
                  sx={{
                    fontStyle: 'italic',
                    color: '#E2E8F0',
                    mb: 2,
                    opacity: 0.8
                  }}
                >
                  {subtitle}
                </Typography>
              )}

              {pageNumber && totalPages && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: 0,
                    color: '#8b4513',
                    fontFamily: '"Times New Roman", serif'
                  }}
                >
                  {pageNumber} / {totalPages}
                </Typography>
              )}
            </Box>
          )}

          {/* ページコンテンツ */}
          <Box
            className="ink-text"
            sx={{
              position: 'relative',
              zIndex: 2,
              '& .MuiTypography-root': {
                fontFamily: '"Merriweather", "Noto Serif JP", serif !important',
                color: '#2c2c2c',
                lineHeight: 1.8
              },
              '& .MuiCard-root': {
                background: 'rgba(255, 248, 220, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(139, 69, 19, 0.2)',
                boxShadow: `
                  0 2px 8px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              },
              '& .MuiButton-root': {
                fontFamily: '"Merriweather", serif',
                textTransform: 'none',
                fontWeight: 500
              }
            }}
          >
            {children}
          </Box>

          {/* ページ装飾 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 20,
              background: 'radial-gradient(ellipse, rgba(139, 69, 19, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }}
          />
        </Paper>
      </Box>
    </>
  );
};