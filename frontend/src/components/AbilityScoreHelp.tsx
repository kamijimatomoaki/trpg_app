import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Help, Close, ExpandMore, Casino, TrendingUp } from '@mui/icons-material';

interface AbilityScoreHelpProps {
  maxIndividualRolls: number;
  maxAllRolls: number;
}

export const AbilityScoreHelp: React.FC<AbilityScoreHelpProps> = ({
  maxIndividualRolls,
  maxAllRolls
}) => {
  const [open, setOpen] = useState(false);

  const abilityDescriptions = [
    {
      name: '筋力 (STR)',
      description: '物理的な力と運動能力。近接攻撃のダメージや重い物を持ち上げる能力に影響します。',
      examples: '剣での攻撃力、重い扉を押し開ける、鎧を着こなす'
    },
    {
      name: '敏捷 (DEX)',
      description: '素早さと器用さ。回避能力や遠距離攻撃の精度、細かい作業に影響します。',
      examples: '弓矢の命中率、罠の回避、盗賊技能、バランス感覚'
    },
    {
      name: '知力 (INT)',
      description: '論理的思考力と学習能力。魔法の理解や知識判定に影響します。',
      examples: '魔法の習得、古代文字の解読、戦術の立案、調査技能'
    },
    {
      name: '体力 (CON)',
      description: '肉体の頑強さと持久力。ヒットポイントや毒・病気への耐性に影響します。',
      examples: '生命力、毒への耐性、長時間の行軍、集中力の維持'
    },
    {
      name: '精神 (WIS)',
      description: '洞察力と直感。気配察知や精神的な攻撃への耐性に影響します。',
      examples: '危険の察知、動物との意思疎通、治癒魔法、瞑想'
    },
    {
      name: '魅力 (CHA)',
      description: '社交性とカリスマ性。交渉や指導力、一部の魔法に影響します。',
      examples: '交渉術、指導力、威圧、芸能、神聖魔法'
    }
  ];

  const modifierTable = [
    { score: '3', modifier: '-4', description: '非常に低い' },
    { score: '4-5', modifier: '-3', description: '非常に低い' },
    { score: '6-7', modifier: '-2', description: '低い' },
    { score: '8-9', modifier: '-1', description: 'やや低い' },
    { score: '10-11', modifier: '±0', description: '平均' },
    { score: '12-13', modifier: '+1', description: 'やや高い' },
    { score: '14-15', modifier: '+2', description: '高い' },
    { score: '16-17', modifier: '+3', description: '非常に高い' },
    { score: '18', modifier: '+4', description: '例外的' }
  ];

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        size="small"
        sx={{ 
          color: 'primary.main',
          bgcolor: 'rgba(25, 118, 210, 0.1)',
          '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
        }}
      >
        <Help />
      </IconButton>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Casino />
            <Typography variant="h6">TRPG能力値システム ヘルプ</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* 基本ルール */}
          <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6">🎲 基本ルール</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1">
                  • 各能力値は <strong>3D6</strong>（3つの6面サイコロ）で決定され、3-18の値になります
                </Typography>
                <Typography variant="body1">
                  • 修正値は <strong>(能力値 - 10) ÷ 2</strong> で計算されます（小数点以下切り捨て）
                </Typography>
                <Typography variant="body1">
                  • 振り直し制限：個別 <Chip label={`${maxIndividualRolls}回`} size="small" sx={{ mx: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />、
                  全体 <Chip label={`${maxAllRolls}回`} size="small" sx={{ mx: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 能力値説明 */}
          <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6">📚 能力値の詳細</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {abilityDescriptions.map((ability, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                      {ability.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                      {ability.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      例：{ability.examples}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 修正値表 */}
          <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6">📊 修正値表</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>能力値</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>修正値</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>評価</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modifierTable.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: 'white' }}>{row.score}</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{row.modifier}</TableCell>
                        <TableCell sx={{ color: 'white' }}>{row.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          {/* 戦略とコツ */}
          <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
              <Typography variant="h6">💡 戦略とコツ</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1">
                  🎯 <strong>バランス重視：</strong> 全能力値が平均以上（10+）を目指しましょう
                </Typography>
                <Typography variant="body1">
                  ⚔️ <strong>特化型：</strong> 1-2つの能力値を高く（15+）し、役割を明確にする
                </Typography>
                <Typography variant="body1">
                  🎲 <strong>振り直しタイミング：</strong> 合計60未満や6以下の能力値がある場合は振り直し推奨
                </Typography>
                <Typography variant="body1">
                  🧙 <strong>職業考慮：</strong> 戦士なら筋力・体力、魔法使いなら知力・精神を重視
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpen(false)} 
            variant="contained"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};