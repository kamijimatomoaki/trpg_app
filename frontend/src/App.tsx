import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { novelTheme } from './theme/novelTheme';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import { VotePage } from './pages/VotePage';
import { CharacterCreationPage } from './pages/CharacterCreationPage';
import { ReadyPage } from './pages/ReadyPage';
import { GamePlayPage } from './pages/GamePlayPage';
import EpiloguePage from './pages/EpiloguePage';
import { useAuth } from './hooks/useAuth';
import PageTransition from './components/Animations/PageTransition';
import LoadingSpinner from './components/Animations/LoadingSpinner';

function App() {
  // アプリケーション起動時に認証プロセスを開始する
  const { isAuthLoading } = useAuth();

  // 認証が完了するまでローディング画面を表示
  if (isAuthLoading) {
    return (
      <ThemeProvider theme={novelTheme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: 'linear-gradient(135deg, #1A1B23 0%, #2D2E36 100%)'
          }}
        >
          <LoadingSpinner 
            variant="magic" 
            size={80} 
            message="AI TRPG Agent を起動中..." 
          />
        </Box>
      </ThemeProvider>
    );
  }

  // 認証完了後にメインコンテンツを表示
  return (
    <ThemeProvider theme={novelTheme}>
      <CssBaseline />
      <BrowserRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby/:gameId" element={<LobbyPage />} />
            <Route path="/game/:gameId/vote" element={<VotePage />} />
            <Route path="/game/:gameId/character-creation" element={<CharacterCreationPage />} />
            <Route path="/game/:gameId/ready" element={<ReadyPage />} />
            <Route path="/game/:gameId/play" element={<GamePlayPage />} />
            <Route path="/game/:gameId/epilogue" element={<EpiloguePage />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
