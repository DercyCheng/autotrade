import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Button, Chip, Divider, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Lightbulb, Refresh } from '@mui/icons-material';
import LLMService from '../services/llm.service';
import { systemService } from '../services/api';

const LLMDashboard = () => {
    const [loading, setLoading] = useState({
        marketSummary: false,
        sentiment: false,
        suggestions: false,
        news: false
    });
    const [marketSummary, setMarketSummary] = useState(null);
    const [marketSentiment, setMarketSentiment] = useState(null);
    const [tradeSuggestions, setTradeSuggestions] = useState(null);
    const [newsAnalysis, setNewsAnalysis] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            await Promise.all([
                fetchMarketSummary(),
                fetchMarketSentiment(),
                fetchTradeSuggestions(),
                fetchNewsAnalysis()
            ]);
        } catch (err) {
            setError(err.message);
            console.error('Error loading LLM data:', err);
        }
    };

    const fetchMarketSummary = async () => {
        setLoading(prev => ({ ...prev, marketSummary: true }));
        try {
            const response = await LLMService.getMarketSummary();
            setMarketSummary(response.data);
        } catch (err) {
            console.error('Error fetching market summary:', err);
        } finally {
            setLoading(prev => ({ ...prev, marketSummary: false }));
        }
    };

    const fetchMarketSentiment = async () => {
        setLoading(prev => ({ ...prev, sentiment: true }));
        try {
            const response = await LLMService.getMarketSentiment();
            setMarketSentiment(response.data);
        } catch (err) {
            console.error('Error fetching market sentiment:', err);
        } finally {
            setLoading(prev => ({ ...prev, sentiment: false }));
        }
    };

    const fetchTradeSuggestions = async () => {
        setLoading(prev => ({ ...prev, suggestions: true }));
        try {
            const response = await LLMService.getTradeSuggestions();
            setTradeSuggestions(response.data);
        } catch (err) {
            console.error('Error fetching trade suggestions:', err);
        } finally {
            setLoading(prev => ({ ...prev, suggestions: false }));
        }
    };

    const fetchNewsAnalysis = async () => {
        setLoading(prev => ({ ...prev, news: true }));
        try {
            const response = await LLMService.getNewsAnalysis();
            setNewsAnalysis(response.data);
        } catch (err) {
            console.error('Error fetching news analysis:', err);
        } finally {
            setLoading(prev => ({ ...prev, news: false }));
        }
    };

    const getSentimentIcon = (sentiment) => {
        if (!sentiment) return <TrendingFlat />;

        const sentimentLower = sentiment.toLowerCase();
        if (sentimentLower.includes('bullish') || sentimentLower.includes('positive')) {
            return <TrendingUp color="success" />;
        } else if (sentimentLower.includes('bearish') || sentimentLower.includes('negative')) {
            return <TrendingDown color="error" />;
        } else {
            return <TrendingFlat color="warning" />;
        }
    };

    const askQuestion = async (question) => {
        try {
            const response = await LLMService.askQuestion(question);
            // Handle the response - could show in a dialog or add to the UI
            console.log('AI Response:', response);
            return response;
        } catch (err) {
            console.error('Error asking question:', err);
            return null;
        }
    };

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">AI 市场分析</Typography>
                <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={loadAllData}
                    disabled={Object.values(loading).some(v => v)}
                >
                    刷新分析
                </Button>
            </Box>

            {error && (
                <Box sx={{ mb: 2 }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            )}

            <Grid container spacing={3}>
                {/* 市场摘要 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                市场概况
                                {loading.marketSummary && <CircularProgress size={20} sx={{ ml: 2 }} />}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {marketSummary ? (
                                <Typography variant="body1">
                                    {marketSummary.completion || '暂无市场概况数据'}
                                </Typography>
                            ) : !loading.marketSummary ? (
                                <Typography color="textSecondary">暂无市场概况数据</Typography>
                            ) : (
                                <CircularProgress />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* 市场情绪 */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                市场情绪分析
                                {loading.sentiment && <CircularProgress size={20} sx={{ ml: 2 }} />}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {marketSentiment ? (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        {getSentimentIcon(marketSentiment.data?.sentiment)}
                                        <Chip
                                            label={marketSentiment.data?.sentiment || '中性'}
                                            color={
                                                marketSentiment.data?.sentiment?.toLowerCase().includes('bullish') ? 'success' :
                                                    marketSentiment.data?.sentiment?.toLowerCase().includes('bearish') ? 'error' : 'warning'
                                            }
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                    <Typography variant="body1">
                                        {marketSentiment.completion || '暂无市场情绪数据'}
                                    </Typography>
                                </Box>
                            ) : !loading.sentiment ? (
                                <Typography color="textSecondary">暂无市场情绪数据</Typography>
                            ) : (
                                <CircularProgress />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* 交易建议 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI 交易建议
                                {loading.suggestions && <CircularProgress size={20} sx={{ ml: 2 }} />}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {tradeSuggestions ? (
                                <Box>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {tradeSuggestions.completion || '暂无交易建议数据'}
                                    </Typography>
                                    {tradeSuggestions.data?.suggestions && (
                                        <Grid container spacing={2}>
                                            {tradeSuggestions.data.suggestions.map((suggestion, index) => (
                                                <Grid item xs={12} md={4} key={index}>
                                                    <Card variant="outlined">
                                                        <CardContent>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                <Lightbulb color="primary" />
                                                                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                                                                    {suggestion.action} {suggestion.asset}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" color="textSecondary">
                                                                价格: {suggestion.price}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                原因: {suggestion.reason}
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>
                            ) : !loading.suggestions ? (
                                <Typography color="textSecondary">暂无交易建议数据</Typography>
                            ) : (
                                <CircularProgress />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* 新闻分析 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                加密货币新闻分析
                                {loading.news && <CircularProgress size={20} sx={{ ml: 2 }} />}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            {newsAnalysis ? (
                                <Box>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        {newsAnalysis.completion || '暂无新闻分析数据'}
                                    </Typography>
                                    {newsAnalysis.data?.news_items && (
                                        <Grid container spacing={2}>
                                            {newsAnalysis.data.news_items.map((item, index) => (
                                                <Grid item xs={12} md={6} key={index}>
                                                    <Card variant="outlined">
                                                        <CardContent>
                                                            <Typography variant="subtitle1">
                                                                {item.title}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    情感:
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={item.sentiment}
                                                                    color={
                                                                        item.sentiment.toLowerCase().includes('positive') ? 'success' :
                                                                            item.sentiment.toLowerCase().includes('negative') ? 'error' : 'warning'
                                                                    }
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            </Box>
                                                            <Typography variant="body2">
                                                                {item.summary}
                                                            </Typography>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>
                            ) : !loading.news ? (
                                <Typography color="textSecondary">暂无新闻分析数据</Typography>
                            ) : (
                                <CircularProgress />
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default LLMDashboard;
