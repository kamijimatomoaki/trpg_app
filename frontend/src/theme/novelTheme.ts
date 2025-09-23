import { createTheme } from '@mui/material/styles';

// ノベルゲーム風のカラーパレット
const novelPalette = {
  // 深い夜空のようなベース色
  primary: {
    main: '#4A5568', // スレートグレー
    light: '#718096',
    dark: '#2D3748',
    contrastText: '#FFFFFF'
  },
  // 暖かい金色のアクセント
  secondary: {
    main: '#D69E2E', // ゴールド
    light: '#ECC94B',
    dark: '#B7791F',
    contrastText: '#1A202C'
  },
  // エレガントな背景色
  background: {
    default: '#1A1B23', // 深い紺色
    paper: '#2D2E36', // 少し明るい紙色
  },
  // 洗練されたテキスト色（可視性向上）
  text: {
    primary: '#F7FAFC', // より明るい白に近いグレー
    secondary: '#CBD5E0', // より明るい中間グレー
    disabled: '#A0AEC0' // 無効化テキストもより明るく
  },
  // 状態色もノベルゲーム風に
  success: {
    main: '#48BB78',
    light: '#68D391',
    dark: '#2F855A'
  },
  warning: {
    main: '#ED8936',
    light: '#F6AD55',
    dark: '#C05621'
  },
  error: {
    main: '#F56565',
    light: '#FC8181',
    dark: '#C53030'
  },
  info: {
    main: '#4299E1',
    light: '#63B3ED',
    dark: '#2B6CB0'
  },
  // カスタムカラー
  custom: {
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      gold: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      magic: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    glow: {
      primary: '0 0 20px rgba(102, 126, 234, 0.3)',
      secondary: '0 0 20px rgba(214, 158, 46, 0.3)',
      magic: '0 0 30px rgba(168, 237, 234, 0.4)'
    }
  }
};

// タイポグラフィ - エレガントなフォント設定
const novelTypography = {
  fontFamily: [
    '"Noto Serif JP"',
    '"Crimson Text"',
    '"Times New Roman"',
    'serif'
  ].join(','),
  h1: {
    fontSize: '3.5rem',
    fontWeight: 300,
    letterSpacing: '0.02em',
    fontFamily: '"Cinzel", "Noto Serif JP", serif'
  },
  h2: {
    fontSize: '2.5rem',
    fontWeight: 400,
    letterSpacing: '0.01em',
    fontFamily: '"Cinzel", "Noto Serif JP", serif'
  },
  h3: {
    fontSize: '2rem',
    fontWeight: 400,
    letterSpacing: '0.01em'
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    letterSpacing: '0.01em'
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500
  },
  h6: {
    fontSize: '1.1rem',
    fontWeight: 600
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.7,
    letterSpacing: '0.01em'
  },
  body2: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
    letterSpacing: '0.01em'
  },
  button: {
    fontSize: '1rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
    textTransform: 'none' as const
  }
};

// コンポーネントのカスタムスタイル
const novelComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        padding: '12px 24px',
        transition: 'all 0.3s ease',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transition: 'left 0.5s',
        },
        '&:hover::before': {
          left: '100%',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        }
      },
      contained: {
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '16px',
        background: 'rgba(45, 46, 54, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(113, 128, 150, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(214, 158, 46, 0.3)',
        }
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: 'rgba(26, 27, 35, 0.6)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(26, 27, 35, 0.8)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(26, 27, 35, 0.9)',
            boxShadow: '0 0 15px rgba(102, 126, 234, 0.3)',
          }
        }
      }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
        border: '1px solid rgba(102, 126, 234, 0.3)',
        color: '#F7FAFC', // より明るい文字色
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))',
          transform: 'scale(1.05)',
        }
      }
    }
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: '10px',
        height: '8px',
        backgroundColor: 'rgba(113, 128, 150, 0.2)',
      },
      bar: {
        borderRadius: '10px',
        background: 'linear-gradient(90deg, #667eea, #764ba2)',
      }
    }
  }
};

// カスタムブレークポイント
const novelBreakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// メインテーマ作成
export const novelTheme = createTheme({
  palette: novelPalette,
  typography: novelTypography,
  components: novelComponents,
  breakpoints: novelBreakpoints,
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.1)',
    '0 4px 8px rgba(0,0,0,0.12)',
    '0 8px 16px rgba(0,0,0,0.14)',
    '0 12px 24px rgba(0,0,0,0.16)',
    '0 16px 32px rgba(0,0,0,0.18)',
    '0 20px 40px rgba(0,0,0,0.20)',
    '0 24px 48px rgba(0,0,0,0.22)',
    '0 28px 56px rgba(0,0,0,0.24)',
    '0 32px 64px rgba(0,0,0,0.26)',
    '0 36px 72px rgba(0,0,0,0.28)',
    '0 40px 80px rgba(0,0,0,0.30)',
    '0 44px 88px rgba(0,0,0,0.32)',
    '0 48px 96px rgba(0,0,0,0.34)',
    '0 52px 104px rgba(0,0,0,0.36)',
    '0 56px 112px rgba(0,0,0,0.38)',
    '0 60px 120px rgba(0,0,0,0.40)',
    '0 64px 128px rgba(0,0,0,0.42)',
    '0 68px 136px rgba(0,0,0,0.44)',
    '0 72px 144px rgba(0,0,0,0.46)',
    '0 76px 152px rgba(0,0,0,0.48)',
    '0 80px 160px rgba(0,0,0,0.50)',
    '0 84px 168px rgba(0,0,0,0.52)',
    '0 88px 176px rgba(0,0,0,0.54)',
    '0 92px 184px rgba(0,0,0,0.56)'
  ],
});

// テーマ拡張のためのモジュール宣言
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      gradient: {
        primary: string;
        secondary: string;
        gold: string;
        magic: string;
      };
      glow: {
        primary: string;
        secondary: string;
        magic: string;
      };
    };
  }

  interface PaletteOptions {
    custom?: {
      gradient?: {
        primary?: string;
        secondary?: string;
        gold?: string;
        magic?: string;
      };
      glow?: {
        primary?: string;
        secondary?: string;
        magic?: string;
      };
    };
  }
}

export default novelTheme;