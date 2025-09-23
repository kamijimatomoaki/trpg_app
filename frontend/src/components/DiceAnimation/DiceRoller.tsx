import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Text } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Mesh } from 'three';
import { Box as MuiBox, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface DiceProps {
  result: number;
  isRolling: boolean;
  diceType: 'd20' | 'd6' | 'd8' | 'd10' | 'd12';
  material: 'wood' | 'metal' | 'crystal' | 'stone';
}

// 3Dダイスコンポーネント
const Dice3D: React.FC<DiceProps> = ({ result, isRolling, diceType, material }) => {
  const meshRef = useRef<Mesh>(null);
  const [rotation, setRotation] = useState([0, 0, 0]);

  useFrame((state, delta) => {
    if (meshRef.current && isRolling) {
      // ローリング中は激しく回転
      meshRef.current.rotation.x += delta * 10;
      meshRef.current.rotation.y += delta * 8;
      meshRef.current.rotation.z += delta * 6;
    } else if (meshRef.current && !isRolling) {
      // 結果に応じた回転で停止
      const targetRotation = getRotationForResult(result, diceType);
      meshRef.current.rotation.x += (targetRotation[0] - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (targetRotation[1] - meshRef.current.rotation.y) * 0.1;
      meshRef.current.rotation.z += (targetRotation[2] - meshRef.current.rotation.z) * 0.1;
    }
  });

  const getMaterialProps = () => {
    switch (material) {
      case 'wood':
        return { color: '#8B4513', roughness: 0.8, metalness: 0 };
      case 'metal':
        return { color: '#C0C0C0', roughness: 0.2, metalness: 0.8 };
      case 'crystal':
        return { color: '#E6E6FA', transparent: true, opacity: 0.8, roughness: 0.1 };
      case 'stone':
        return { color: '#696969', roughness: 0.9, metalness: 0 };
      default:
        return { color: '#FFFFFF', roughness: 0.5, metalness: 0.2 };
    }
  };

  const getDiceGeometry = () => {
    const materialProps = getMaterialProps();
    
    switch (diceType) {
      case 'd6':
        return (
          <Box ref={meshRef} args={[2, 2, 2]}>
            <meshStandardMaterial {...materialProps} />
            {!isRolling && (
              <Text
                position={[0, 0, 1.1]}
                fontSize={0.8}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {result}
              </Text>
            )}
          </Box>
        );
      case 'd20':
        return (
          <mesh ref={meshRef}>
            <icosahedronGeometry args={[1.5]} />
            <meshStandardMaterial {...materialProps} />
            {!isRolling && (
              <Text
                position={[0, 0, 1.8]}
                fontSize={0.5}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {result}
              </Text>
            )}
          </mesh>
        );
      default:
        return (
          <Sphere ref={meshRef} args={[1.5]}>
            <meshStandardMaterial {...materialProps} />
          </Sphere>
        );
    }
  };

  return getDiceGeometry();
};

// 結果に応じたダイスの回転を計算
const getRotationForResult = (result: number, diceType: string): [number, number, number] => {
  // 各面に対応する回転角度（簡略化）
  const rotations: { [key: string]: { [key: number]: [number, number, number] } } = {
    'd6': {
      1: [0, 0, 0],
      2: [Math.PI / 2, 0, 0],
      3: [0, Math.PI / 2, 0],
      4: [0, -Math.PI / 2, 0],
      5: [-Math.PI / 2, 0, 0],
      6: [Math.PI, 0, 0],
    },
    'd20': {
      // d20の場合は簡略化（実際は20面体の各面の位置が必要）
      ...Array.from({ length: 20 }, (_, i) => i + 1).reduce((acc, num) => {
        acc[num] = [
          (num * Math.PI) / 10,
          (num * Math.PI) / 8,
          (num * Math.PI) / 12
        ];
        return acc;
      }, {} as { [key: number]: [number, number, number] })
    }
  };

  return rotations[diceType]?.[result] || [0, 0, 0];
};

interface DiceRollerProps {
  onRoll: (result: number) => void;
  diceType?: 'd20' | 'd6' | 'd8' | 'd10' | 'd12';
  disabled?: boolean;
  staticResult?: number; // 既に出た結果を静的表示する場合
}

const DiceRoller: React.FC<DiceRollerProps> = ({ 
  onRoll, 
  diceType = 'd20', 
  disabled = false,
  staticResult
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(staticResult || null);
  const [material, setMaterial] = useState<'wood' | 'metal' | 'crystal' | 'stone'>('wood');
  const [selectedDiceType, setSelectedDiceType] = useState(diceType);
  const [webglError, setWebglError] = useState(false);

  // 静的結果モードの場合は設定UIを隠す
  const isStaticMode = staticResult !== undefined;

  // WebGL Context Lost処理
  const handleWebGLError = () => {
    console.warn('WebGL Context Lost - falling back to 2D display');
    setWebglError(true);
  };

  const rollDice = async () => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    setResult(null);

    // ローリング時間（2-3秒）
    const rollDuration = 2000 + Math.random() * 1000;
    
    setTimeout(() => {
      const maxValue = parseInt(selectedDiceType.slice(1)); // 'd20' -> 20
      const newResult = Math.floor(Math.random() * maxValue) + 1;
      
      setResult(newResult);
      setIsRolling(false);
      onRoll(newResult);
    }, rollDuration);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MuiBox
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 3,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* ダイス設定 - 静的モードでは非表示 */}
        {!isStaticMode && (
          <MuiBox sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ color: 'white' }}>ダイス</InputLabel>
              <Select
                value={selectedDiceType}
                onChange={(e) => setSelectedDiceType(e.target.value as any)}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                <MenuItem value="d6">D6</MenuItem>
                <MenuItem value="d8">D8</MenuItem>
                <MenuItem value="d10">D10</MenuItem>
                <MenuItem value="d12">D12</MenuItem>
                <MenuItem value="d20">D20</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ color: 'white' }}>素材</InputLabel>
              <Select
                value={material}
                onChange={(e) => setMaterial(e.target.value as any)}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                <MenuItem value="wood">🌳 木製</MenuItem>
                <MenuItem value="metal">⚔️ 金属</MenuItem>
                <MenuItem value="crystal">💎 水晶</MenuItem>
                <MenuItem value="stone">🗿 石製</MenuItem>
              </Select>
            </FormControl>
          </MuiBox>
        )}

        {/* 3Dダイス表示 */}
        <MuiBox
          sx={{
            width: 300,
            height: 200,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {webglError ? (
            // WebGLエラー時の2D表示
            <MuiBox
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #8B4513, #D2691E)',
                borderRadius: 2,
                color: '#FFF8DC',
                fontSize: '2rem',
                fontWeight: 'bold',
                border: '3px solid #DAA520',
                transform: isRolling ? 'rotate(360deg)' : 'none',
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              {result || '?'}
            </MuiBox>
          ) : (
            <Canvas
              camera={{ position: [0, 0, 5], fov: 75 }}
              style={{ background: 'transparent', width: '100%', height: '100%' }}
              onCreated={({ gl }) => {
                // WebGL Context Lostイベントリスナー追加
                gl.domElement.addEventListener('webglcontextlost', handleWebGLError);
                gl.domElement.addEventListener('webglcontextrestored', () => {
                  console.log('WebGL Context Restored');
                  setWebglError(false);
                });
              }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -5]} intensity={0.3} />
              
              <Dice3D
                result={result || 1}
                isRolling={isRolling}
                diceType={selectedDiceType}
                material={material}
              />
            </Canvas>
          )}

          {/* クリティカルエフェクト */}
          {result === parseInt(selectedDiceType.slice(1)) && !isRolling && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '2rem',
              }}
            >
              ⭐✨🎉
            </motion.div>
          )}

          {/* ファンブルエフェクト */}
          {result === 1 && !isRolling && selectedDiceType === 'd20' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                fontSize: '2rem',
              }}
            >
              💀💥😱
            </motion.div>
          )}
        </MuiBox>

        {/* ロール結果表示 */}
        {result !== null && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography
              variant="h4"
              sx={{
                color: result === parseInt(selectedDiceType.slice(1)) ? '#FFD700' : 
                       result === 1 && selectedDiceType === 'd20' ? '#FF6B6B' : '#FFFFFF',
                textAlign: 'center',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              }}
            >
              結果: {result}
            </Typography>
          </motion.div>
        )}

        {/* ロールボタン - 静的モードでは非表示 */}
        {!isStaticMode && (
          <Button
            variant="contained"
            onClick={rollDice}
            disabled={isRolling || disabled}
            sx={{
              background: isRolling ? 
                'linear-gradient(45deg, #FFB74D 30%, #FF9800 90%)' :
                'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF5252 30%, #FF7043 90%)',
                boxShadow: '0 6px 20px rgba(255, 107, 107, 0.6)',
              },
              '&:disabled': {
                background: '#555',
                color: '#999',
              },
            }}
          >
            {isRolling ? '🎲 ローリング中...' : '🎲 ダイスを振る'}
          </Button>
        )}

        {/* ローディングアニメーション */}
        {isRolling && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ fontSize: '2rem' }}
          >
            🎲
          </motion.div>
        )}
      </MuiBox>
    </motion.div>
  );
};

export default DiceRoller;