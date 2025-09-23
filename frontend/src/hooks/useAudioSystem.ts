import { useRef, useCallback, useEffect, useState } from 'react';

export interface AudioTrack {
  id: string;
  name: string;
  url?: string;
  volume?: number;
  loop?: boolean;
  category: 'bgm' | 'se' | 'voice';
}

interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

const useAudioSystem = () => {
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [seVolume, setSeVolume] = useState(0.8);
  const [voiceVolume, setVoiceVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStates, setAudioStates] = useState<Map<string, AudioState>>(new Map());

  // プリセット音源定義
  const presetTracks: AudioTrack[] = [
    // BGM
    {
      id: 'tavern_ambience',
      name: '酒場の雰囲気',
      category: 'bgm',
      loop: true,
      volume: 0.3
    },
    {
      id: 'dungeon_exploration',
      name: 'ダンジョン探索',
      category: 'bgm',
      loop: true,
      volume: 0.4
    },
    {
      id: 'battle_theme',
      name: '戦闘テーマ',
      category: 'bgm',
      loop: true,
      volume: 0.6
    },
    {
      id: 'peaceful_village',
      name: '平和な村',
      category: 'bgm',
      loop: true,
      volume: 0.3
    },
    {
      id: 'mysterious_forest',
      name: '神秘の森',
      category: 'bgm',
      loop: true,
      volume: 0.4
    },
    
    // SE
    {
      id: 'dice_roll',
      name: 'ダイスロール',
      category: 'se',
      volume: 0.6
    },
    {
      id: 'sword_clang',
      name: '剣の音',
      category: 'se',
      volume: 0.7
    },
    {
      id: 'magic_cast',
      name: '魔法詠唱',
      category: 'se',
      volume: 0.5
    },
    {
      id: 'treasure_found',
      name: '宝物発見',
      category: 'se',
      volume: 0.8
    },
    {
      id: 'door_open',
      name: '扉を開く',
      category: 'se',
      volume: 0.5
    },
    {
      id: 'footsteps',
      name: '足音',
      category: 'se',
      volume: 0.4
    },
    {
      id: 'notification',
      name: '通知音',
      category: 'se',
      volume: 0.6
    },
    {
      id: 'critical_hit',
      name: 'クリティカルヒット',
      category: 'se',
      volume: 0.8
    },
    {
      id: 'healing',
      name: '回復音',
      category: 'se',
      volume: 0.5
    }
  ];

  // Web Audio APIを使った音源生成
  const generateTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer => {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * (duration / 1000);
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      let value = 0;

      switch (type) {
        case 'sine':
          value = Math.sin(2 * Math.PI * frequency * time);
          break;
        case 'square':
          value = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1;
          break;
        case 'triangle':
          value = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * time));
          break;
        case 'sawtooth':
          value = 2 * (frequency * time - Math.floor(frequency * time + 0.5));
          break;
      }

      // エンベロープ適用（アタック・ディケイ・リリース）
      const attack = 0.1;
      const decay = 0.2;
      const sustain = 0.7;
      const release = 0.3;
      
      const totalTime = duration / 1000;
      let envelope = 1;

      if (time < attack) {
        envelope = time / attack;
      } else if (time < attack + decay) {
        envelope = 1 - (1 - sustain) * (time - attack) / decay;
      } else if (time < totalTime - release) {
        envelope = sustain;
      } else {
        envelope = sustain * (totalTime - time) / release;
      }

      data[i] = value * envelope * 0.3; // 音量調整
    }

    return buffer;
  }, []);

  // 効果音生成
  const generateSoundEffect = useCallback((type: string): string => {
    const audioContext = new AudioContext();
    
    switch (type) {
      case 'dice_roll':
        // ダイスのような音
        const diceFreqs = [400, 500, 600, 700];
        // TODO: 複数の周波数を組み合わせた効果音を生成
        return URL.createObjectURL(new Blob()); // プレースホルダー
        
      case 'magic_cast':
        // 魔法のような幻想的な音
        // TODO: 周波数変調とエコー効果
        return URL.createObjectURL(new Blob()); // プレースホルダー
        
      case 'sword_clang':
        // 金属音
        // TODO: ノイズとメタリックな音を組み合わせ
        return URL.createObjectURL(new Blob()); // プレースホルダー
        
      default:
        return '';
    }
  }, []);

  // 音源の読み込み
  const loadTrack = useCallback(async (track: AudioTrack): Promise<void> => {
    if (audioElements.current.has(track.id)) {
      return; // 既に読み込み済み
    }

    const audio = new Audio();
    
    // プリセット音源の場合は生成音源を使用
    if (!track.url) {
      const generatedUrl = generateSoundEffect(track.id);
      if (generatedUrl) {
        audio.src = generatedUrl;
      } else {
        // フォールバック: サイレント音源
        audio.src = 'data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAAC';
      }
    } else {
      audio.src = track.url;
    }

    audio.loop = track.loop || false;
    audio.volume = (track.volume || 1) * getCategoryVolume(track.category) * masterVolume;
    audio.preload = 'auto';

    // イベントリスナー設定
    audio.addEventListener('loadeddata', () => {
      setAudioStates(prev => new Map(prev.set(track.id, {
        isLoaded: true,
        isPlaying: false,
        volume: audio.volume,
        currentTime: 0,
        duration: audio.duration
      })));
    });

    audio.addEventListener('timeupdate', () => {
      setAudioStates(prev => {
        const current = prev.get(track.id);
        if (current) {
          return new Map(prev.set(track.id, {
            ...current,
            currentTime: audio.currentTime,
            isPlaying: !audio.paused
          }));
        }
        return prev;
      });
    });

    audioElements.current.set(track.id, audio);
  }, [masterVolume, generateSoundEffect]);

  // カテゴリ別音量取得
  const getCategoryVolume = useCallback((category: AudioTrack['category']): number => {
    switch (category) {
      case 'bgm': return bgmVolume;
      case 'se': return seVolume;
      case 'voice': return voiceVolume;
      default: return 1;
    }
  }, [bgmVolume, seVolume, voiceVolume]);

  // 音源再生
  const playTrack = useCallback(async (trackId: string, options?: { fadeIn?: number; volume?: number }) => {
    const audio = audioElements.current.get(trackId);
    if (!audio) return;

    if (isMuted) return;

    const track = presetTracks.find(t => t.id === trackId);
    if (!track) return;

    audio.volume = (options?.volume || track.volume || 1) * getCategoryVolume(track.category) * masterVolume;
    
    try {
      await audio.play();
      
      // フェードイン効果
      if (options?.fadeIn) {
        const originalVolume = audio.volume;
        audio.volume = 0;
        const fadeSteps = 20;
        const fadeInterval = options.fadeIn / fadeSteps;
        const volumeStep = originalVolume / fadeSteps;
        
        let step = 0;
        const fadeInInterval = setInterval(() => {
          step++;
          audio.volume = Math.min(volumeStep * step, originalVolume);
          
          if (step >= fadeSteps) {
            clearInterval(fadeInInterval);
          }
        }, fadeInterval);
      }
    } catch (error) {
      console.warn('Audio play failed:', error);
    }
  }, [isMuted, getCategoryVolume, masterVolume, presetTracks]);

  // 音源停止
  const stopTrack = useCallback((trackId: string, options?: { fadeOut?: number }) => {
    const audio = audioElements.current.get(trackId);
    if (!audio) return;

    if (options?.fadeOut) {
      const originalVolume = audio.volume;
      const fadeSteps = 20;
      const fadeInterval = options.fadeOut / fadeSteps;
      const volumeStep = originalVolume / fadeSteps;
      
      let step = 0;
      const fadeOutInterval = setInterval(() => {
        step++;
        audio.volume = Math.max(originalVolume - volumeStep * step, 0);
        
        if (step >= fadeSteps || audio.volume <= 0) {
          clearInterval(fadeOutInterval);
          audio.pause();
          audio.currentTime = 0;
        }
      }, fadeInterval);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // 全音源停止
  const stopAllTracks = useCallback((category?: AudioTrack['category']) => {
    audioElements.current.forEach((audio, trackId) => {
      if (!category) {
        audio.pause();
        audio.currentTime = 0;
      } else {
        const track = presetTracks.find(t => t.id === trackId);
        if (track && track.category === category) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
  }, [presetTracks]);

  // 音量更新
  useEffect(() => {
    audioElements.current.forEach((audio, trackId) => {
      const track = presetTracks.find(t => t.id === trackId);
      if (track) {
        audio.volume = (track.volume || 1) * getCategoryVolume(track.category) * masterVolume;
      }
    });
  }, [masterVolume, bgmVolume, seVolume, voiceVolume, getCategoryVolume, presetTracks]);

  // ミュート処理
  useEffect(() => {
    audioElements.current.forEach(audio => {
      audio.muted = isMuted;
    });
  }, [isMuted]);

  // プリセット音源の初期化
  useEffect(() => {
    presetTracks.forEach(track => {
      loadTrack(track);
    });
  }, [loadTrack, presetTracks]);

  return {
    // 音源管理
    loadTrack,
    playTrack,
    stopTrack,
    stopAllTracks,
    
    // 音量制御
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
    
    // 状態
    audioStates,
    presetTracks
  };
};

export default useAudioSystem;