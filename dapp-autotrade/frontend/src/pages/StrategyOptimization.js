import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Typography, Grid, CircularProgress, Button, TextField,
    Divider, Box, Paper, List, ListItem, ListItemText, Chip, Alert, FormControl,
    InputLabel, Select, MenuItem
} from '@mui/material';
import { Science, AutoFixHigh, Insights, CheckCircle, Warning } from '@mui/icons-material';
import LLMService from '../services/llm.service';
import { strategyService } from '../services/api';

const StrategyOptimization = () => {
    const [strategies, setStrategies] = useState([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState('');
    const [optimizationResult, setOptimizationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingStrategies, setFetchingStrategies] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchStrategies();
    }, []);

    const fetchStrategies = async () => {
        setFetchingStrategies(true);
        try {
            const response = await strategyService.getStrategies();
            if (response && response.data) {
                setStrategies(response.data);
                if (response.data.length > 0) {
                    setSelectedStrategyId(response.data[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching strategies:', err);
            setError('无法获取策略列表，请稍后再试');
        } finally {
            setFetchingStrategies(false);
        }
    };

    const handleStrategyChange = (event) => {
        setSelectedStrategyId(event.target.value);
    };

    const handleOptimizeStrategy = async () => {
        if (!selectedStrategyId) {
            setError('请先选择一个策略');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setOptimizationResult(null);

        try {
            const strategy = strategies.find(s => s.id === selectedStrategyId);
            const response = await LLMService.optimizeStrategy(selectedStrategyId, strategy);
            setOptimizationResult(response.data);
            setSuccess('策略优化分析完成');
        } catch (err) {
            console.error('Error optimizing strategy:', err);
            setError('策略优化失败，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    const applyOptimizations = async () => {
        if (!optimizationResult || !optimizationResult.data || !optimizationResult.data.recommendations) {
            setError('没有可应用的优化建议');
            return;
        }

        setLoading(true);
        try {
            // 找到当前策略
            const strategy = strategies.find(s => s.id === selectedStrategyId);
            if (!strategy) {
                throw new Error('找不到所选策略');
            }

            // 应用推荐的参数
            const updatedStrategy = { ...strategy };
            if (updatedStrategy.params && optimizationResult.data.recommended_params) {
                updatedStrategy.params = {
                    ...updatedStrategy.params,
                    ...optimizationResult.data.recommended_params
                };
            }

            // 更新策略
            await strategyService.updateStrategy(selectedStrategyId, updatedStrategy);
            setSuccess('已成功应用优化建议');

            // 刷新策略列表
            await fetchStrategies();
        } catch (err) {
            console.error('Error applying optimizations:', err);
            setError('应用优化建议失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">AI 策略优化</Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                选择策略
                                {fetchingStrategies && <CircularProgress size={20} sx={{ ml: 2 }} />}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <FormControl fullWidth disabled={fetchingStrategies || loading}>
                                <InputLabel id="strategy-select-label">策略</InputLabel>
                                <Select
                                    labelId="strategy-select-label"
                                    value={selectedStrategyId}
                                    label="策略"
                                    onChange={handleStrategyChange}
                                >
                                    {strategies.map(strategy => (
                                        <MenuItem key={strategy.id} value={strategy.id}>
                                            {strategy.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AutoFixHigh />}
                                    fullWidth
                                    onClick={handleOptimizeStrategy}
                                    disabled={fetchingStrategies || loading || !selectedStrategyId}
                                >
                                    {loading ? '优化中...' : '使用AI优化策略'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {selectedStrategyId && strategies.length > 0 && (
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    当前策略详情
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {strategies
                                    .filter(s => s.id === selectedStrategyId)
                                    .map(strategy => (
                                        <Box key={strategy.id}>
                                            <Typography variant="subtitle1">
                                                {strategy.name}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                {strategy.description || '无描述'}
                                            </Typography>

                                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                                参数设置:
                                            </Typography>
                                            <List dense>
                                                {strategy.params && Object.keys(strategy.params).map(key => (
                                                    <ListItem key={key}>
                                                        <ListItemText
                                                            primary={`${key}: ${strategy.params[key]}`}
                                                            secondary={getParameterDescription(key)}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    ))}
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                <Grid item xs={12} md={8}>
                    {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                            <CircularProgress size={60} />
                            <Typography sx={{ mt: 2 }}>AI正在分析您的策略并生成优化建议...</Typography>
                        </Box>
                    ) : optimizationResult ? (
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Science color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">
                                        优化分析结果
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />

                                <Typography variant="body1" paragraph>
                                    {optimizationResult.completion}
                                </Typography>

                                {optimizationResult.data && (
                                    <>
                                        <Box sx={{ mt: 3, mb: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                性能问题
                                            </Typography>
                                            <List>
                                                {optimizationResult.data.issues && optimizationResult.data.issues.map((issue, index) => (
                                                    <ListItem key={index}>
                                                        <Warning color="warning" sx={{ mr: 1 }} />
                                                        <ListItemText primary={issue} />
                                                    </ListItem>
                                                ))}
                                                {(!optimizationResult.data.issues || optimizationResult.data.issues.length === 0) && (
                                                    <ListItem>
                                                        <CheckCircle color="success" sx={{ mr: 1 }} />
                                                        <ListItemText primary="未发现重大性能问题" />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </Box>

                                        <Box sx={{ mt: 3, mb: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                推荐优化
                                            </Typography>
                                            <List>
                                                {optimizationResult.data.recommendations && optimizationResult.data.recommendations.map((rec, index) => (
                                                    <ListItem key={index}>
                                                        <Insights color="info" sx={{ mr: 1 }} />
                                                        <ListItemText primary={rec} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>

                                        {optimizationResult.data.recommended_params && (
                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    推荐参数
                                                </Typography>
                                                <Paper sx={{ p: 2 }}>
                                                    <Grid container spacing={2}>
                                                        {Object.keys(optimizationResult.data.recommended_params).map(key => (
                                                            <Grid item xs={12} sm={6} md={4} key={key}>
                                                                <Box>
                                                                    <Typography variant="subtitle2">{key}</Typography>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <Typography>
                                                                            {optimizationResult.data.recommended_params[key]}
                                                                        </Typography>
                                                                        <Chip
                                                                            size="small"
                                                                            label="推荐"
                                                                            color="primary"
                                                                            sx={{ ml: 1 }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Paper>

                                                <Box sx={{ mt: 3 }}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<CheckCircle />}
                                                        onClick={applyOptimizations}
                                                        disabled={loading}
                                                    >
                                                        应用推荐参数
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Science sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">
                                选择一个策略并点击"使用AI优化策略"按钮
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                AI将分析您的策略历史表现并提供优化建议
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </div>
    );
};

// 辅助函数 - 获取参数描述
const getParameterDescription = (paramName) => {
    const descriptions = {
        shortPeriod: '短期移动平均线周期',
        longPeriod: '长期移动平均线周期',
        interval: '时间间隔',
        stopLoss: '止损百分比',
        takeProfit: '止盈百分比',
        rsiPeriod: 'RSI周期',
        rsiOverbought: 'RSI超买阈值',
        rsiOversold: 'RSI超卖阈值'
    };

    return descriptions[paramName] || '参数描述';
};

export default StrategyOptimization;
