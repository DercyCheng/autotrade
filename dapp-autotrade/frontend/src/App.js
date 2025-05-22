import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Trades from './pages/Trades';
import Markets from './pages/Markets';
import Settings from './pages/Settings';
import Positions from './pages/Positions';
import LLMDashboard from './pages/LLMDashboard';
import StrategyOptimization from './pages/StrategyOptimization';

function App() {
    const { theme } = useTheme();

    return (
        <div className="App">
            <CssBaseline />
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/strategies" element={<Strategies />} />
                    <Route path="/trades" element={<Trades />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/positions" element={<Positions />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/ai-dashboard" element={<LLMDashboard />} />
                    <Route path="/ai-strategy-optimization" element={<StrategyOptimization />} />
                </Routes>
            </Layout>
        </div>
    );
}


export default App;
