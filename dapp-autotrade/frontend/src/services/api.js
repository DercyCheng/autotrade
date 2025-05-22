import axios from 'axios';

// Create an axios instance with default config
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API services for different resources
export const marketService = {
    getMarketData: () => api.get('/markets'),
    getMarketPair: (pair) => api.get(`/markets/${pair}`),
};

export const strategyService = {
    getStrategies: () => api.get('/strategies'),
    getStrategy: (id) => api.get(`/strategies/${id}`),
    createStrategy: (data) => api.post('/strategies', data),
    updateStrategy: (id, data) => api.put(`/strategies/${id}`, data),
    deleteStrategy: (id) => api.delete(`/strategies/${id}`),
    toggleStrategy: (id, status) => api.put(`/strategies/${id}/toggle`, { status }),
    getStrategyPerformance: (id) => api.get(`/strategies/${id}/performance`),
    getStrategyRecommendations: () => api.get('/strategies/recommendations'),
};

export const tradeService = {
    getTrades: (params) => api.get('/trades', { params }),
    getTrade: (id) => api.get(`/trades/${id}`),
    executeTrade: (data) => api.post('/trades', data),
    cancelTrade: (id) => api.put(`/trades/${id}/cancel`),
};

export const positionService = {
    getPositions: () => api.get('/positions'),
    getPosition: (id) => api.get(`/positions/${id}`),
    closePosition: (id) => api.put(`/positions/${id}/close`),
};

export const systemService = {
    getSystemStatus: () => api.get('/status'),
    getLLMAnalysis: (data) => api.post('/llm/analyze', data),
    getMarketSentiment: () => api.get('/llm/market-sentiment'),
    getStrategyOptimization: (id) => api.post(`/llm/optimize-strategy/${id}`),
    getTradeSuggestions: () => api.get('/llm/trade-suggestions'),
    getNewsAnalysis: () => api.get('/llm/news-analysis'),
};

// Websocket connection
export const createWebSocketConnection = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';
    return new WebSocket(wsUrl);
};

export default api;
