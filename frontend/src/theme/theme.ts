import { createTheme } from '@mui/material/styles';

// 「魔法の絵本」をテーマにしたカスタムテーマ
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5d4037', // 濃い茶色
    },
    secondary: {
      main: '#a1887f', // 明るい茶色
    },
    background: {
      default: '#fdfaf6', // 全体の背景色を少し温かみのある色に
      paper: '#fff8e1',   // 紙のような背景色（クリーム色）
    },
    text: {
      primary: '#424242',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Lora", "serif"', // 少し装飾的なセリフ体フォント
    h1: { fontFamily: '"Merriweather", "serif"', fontWeight: 700 },
    h2: { fontFamily: '"Merriweather", "serif"', fontWeight: 700 },
    h3: { fontFamily: '"Merriweather", "serif"', fontWeight: 700 },
    button: { fontFamily: '"Roboto", "sans-serif"', fontWeight: 500, textTransform: 'none' },
  },
  components: {
    // CssBaselineのスタイルを上書きして、body全体にテーマを適用する
    MuiCssBaseline: {
      styleOverrides: (themeParam) => `
        body {
          background-color: ${themeParam.palette.background.default};
          font-family: ${themeParam.typography.fontFamily};
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiContainer: {
        styleOverrides: {
            root: {
                paddingTop: '2rem',
                paddingBottom: '2rem',
            }
        }
    }
  },
});
