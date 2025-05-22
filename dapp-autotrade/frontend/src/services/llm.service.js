import api from './api';

// LLM service for all LLM-related API calls
const LLMService = {
    // Market analysis with LLM
    analyzeMarket: async () => {
        try {
            const response = await api.get('/llm/market-analysis');
            return response.data;
        } catch (error) {
            console.error('Error analyzing market with LLM:', error);
            throw error;
        }
    },

    // Analyze trading strategy performance and suggest improvements
    optimizeStrategy: async (strategyId, strategyData) => {
        try {
            const response = await api.post(`/llm/optimize-strategy/${strategyId}`, strategyData);
            return response.data;
        } catch (error) {
            console.error('Error optimizing strategy with LLM:', error);
            throw error;
        }
    },

    // Get personalized trading recommendations based on market conditions and user preferences
    getTradingRecommendations: async (preferences) => {
        try {
            const response = await api.post('/llm/trading-recommendations', preferences);
            return response.data;
        } catch (error) {
            console.error('Error getting trading recommendations:', error);
            throw error;
        }
    },

    // Natural language query about market, assets, or strategies
    askQuestion: async (question, context = {}) => {
        try {
            const response = await api.post('/llm/ask', { question, context });
            return response.data;
        } catch (error) {
            console.error('Error asking question to LLM:', error);
            throw error;
        }
    },

    // News sentiment analysis
    analyzeNewsSentiment: async () => {
        try {
            const response = await api.get('/llm/news-sentiment');
            return response.data;
        } catch (error) {
            console.error('Error analyzing news sentiment:', error);
            throw error;
        }
    },

    // Generate natural language explanation of a particular trade or strategy
    explainTrade: async (tradeId) => {
        try {
            const response = await api.get(`/llm/explain-trade/${tradeId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting trade explanation:', error);
            throw error;
        }
    },

    // Risk analysis of current portfolio
    analyzePortfolioRisk: async (portfolioData) => {
        try {
            const response = await api.post('/llm/portfolio-risk', portfolioData);
            return response.data;
        } catch (error) {
            console.error('Error analyzing portfolio risk:', error);
            throw error;
        }
    },

    // Generate natural language summary of market trends
    getMarketSummary: async () => {
        try {
            const response = await api.get('/llm/market-summary');
            return response.data;
        } catch (error) {
            console.error('Error getting market summary:', error);
            throw error;
        }
    },

    // Generate AI-based trade suggestions
    getTradeSuggestions: async (params = {}) => {
        try {
            const response = await api.get('/llm/trade-suggestions', { params });
            return response.data;
        } catch (error) {
            console.error('Error getting trade suggestions:', error);
            throw error;
        }
    },

    // Analyze crypto news articles
    getNewsAnalysis: async () => {
        try {
            const response = await api.get('/llm/news-analysis');
            return response.data;
        } catch (error) {
            console.error('Error getting news analysis:', error);
            throw error;
        }
    },

    // Generate personalized strategy recommendations based on user preferences
    getStrategyRecommendations: async (preferences) => {
        try {
            const response = await api.post('/llm/strategy-recommendations', preferences);
            return response.data;
        } catch (error) {
            console.error('Error getting strategy recommendations:', error);
            throw error;
        }
    },

    // Analyze market sentiment across multiple exchanges and sources
    getMarketSentiment: async () => {
        try {
            const response = await api.get('/llm/market-sentiment');
            return response.data;
        } catch (error) {
            console.error('Error getting market sentiment analysis:', error);
            throw error;
        }
    },

    // Generate explanations for recent market movements
    explainMarketMovements: async (params = {}) => {
        try {
            const response = await api.get('/llm/explain-market-movements', { params });
            return response.data;
        } catch (error) {
            console.error('Error getting market movement explanations:', error);
            throw error;
        }
    },

    // Generate a natural language summary of current portfolio and positions
    getPortfolioSummary: async () => {
        try {
            const response = await api.get('/llm/portfolio-summary');
            return response.data;
        } catch (error) {
            console.error('Error getting portfolio summary:', error);
            throw error;
        }
    }
};

export default LLMService;
