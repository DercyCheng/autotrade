import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    CircularProgress,
    Paper,
    useTheme,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useWeb3 } from '../contexts/Web3Context';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// Mock data for performance chart
const generateChartData = (days = 30, theme) => {
    const labels = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const profitData = Array.from({ length: days }, (_, i) => {
        // Generate somewhat realistic looking profit data
        return (Math.sin(i / 5) + 1) * 500 + 1000 + Math.random() * 100;
    });

    return {
        labels,
        datasets: [
            {
                label: 'Portfolio Value (USD)',
                data: profitData,
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '33', // Add transparency
                fill: true,
                tension: 0.4,
            },
        ],
    };
};

// Mock recent trades data
const recentTradesMock = [
    { id: 1, pair: 'ETH/USDT', type: 'buy', amount: 0.5, price: 4532.21, time: '2h ago', profit: 2.3 },
    { id: 2, pair: 'BTC/USDT', type: 'sell', amount: 0.02, price: 68423.45, time: '4h ago', profit: -1.2 },
    { id: 3, pair: 'ETH/BNB', type: 'buy', amount: 1.2, price: 12.5, time: '6h ago', profit: 0.8 },
    { id: 4, pair: 'BTC/USDT', type: 'buy', amount: 0.01, price: 68213.78, time: '12h ago', profit: 1.5 },
];

export default function Dashboard() {
    const { isConnected, account, contract } = useWeb3();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [portfolioStats, setPortfolioStats] = useState({
        totalValue: 0,
        dailyProfit: 0,
        weeklyProfit: 0,
        monthlyProfit: 0,
    });
    const [chartData, setChartData] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Portfolio Performance (30 Days)',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: theme.palette.divider,
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    useEffect(() => {
        // Generate chart data based on current theme
        setChartData(generateChartData(30, theme));

        // Set mock recent trades
        setRecentTrades(recentTradesMock);

        // Mock portfolio stats
        setPortfolioStats({
            totalValue: 12485.32,
            dailyProfit: 145.23,
            dailyProfitPercentage: 1.2,
            weeklyProfit: 523.45,
            weeklyProfitPercentage: 4.5,
            monthlyProfit: 1832.67,
            monthlyProfitPercentage: 16.8,
        });

        // In a real app, we would fetch this data from the contract
        if (isConnected && contract) {
            setLoading(true);
            // Fetch data from contract
            // Example: contract.getPortfolioStats().then(data => {...})

            // For demo, we'll use a timeout to simulate fetching
            const timer = setTimeout(() => {
                setLoading(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isConnected, contract, theme]);

    if (!isConnected) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <AccountBalanceWalletIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" component="h2" gutterBottom>
                    Connect Your Wallet
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 3 }}>
                    Connect your wallet to view your dashboard, portfolio statistics, and trading activity.
                </Typography>
                <Button variant="contained" color="primary" size="large">
                    Connect Wallet
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Trading Dashboard
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Portfolio Stats Cards */}
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Total Portfolio Value
                                </Typography>
                                <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                                    ${portfolioStats.totalValue.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Daily Profit/Loss
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="h4" component="div" color={portfolioStats.dailyProfit >= 0 ? 'success.main' : 'error.main'}>
                                        ${Math.abs(portfolioStats.dailyProfit).toLocaleString()}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {portfolioStats.dailyProfit >= 0 ? (
                                            <TrendingUpIcon color="success" />
                                        ) : (
                                            <TrendingDownIcon color="error" />
                                        )}
                                        <Typography variant="body2" component="span" color={portfolioStats.dailyProfit >= 0 ? 'success.main' : 'error.main'}>
                                            {portfolioStats.dailyProfitPercentage}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Weekly Profit/Loss
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="h4" component="div" color={portfolioStats.weeklyProfit >= 0 ? 'success.main' : 'error.main'}>
                                        ${Math.abs(portfolioStats.weeklyProfit).toLocaleString()}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {portfolioStats.weeklyProfit >= 0 ? (
                                            <TrendingUpIcon color="success" />
                                        ) : (
                                            <TrendingDownIcon color="error" />
                                        )}
                                        <Typography variant="body2" component="span" color={portfolioStats.weeklyProfit >= 0 ? 'success.main' : 'error.main'}>
                                            {portfolioStats.weeklyProfitPercentage}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Monthly Profit/Loss
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="h4" component="div" color={portfolioStats.monthlyProfit >= 0 ? 'success.main' : 'error.main'}>
                                        ${Math.abs(portfolioStats.monthlyProfit).toLocaleString()}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {portfolioStats.monthlyProfit >= 0 ? (
                                            <TrendingUpIcon color="success" />
                                        ) : (
                                            <TrendingDownIcon color="error" />
                                        )}
                                        <Typography variant="body2" component="span" color={portfolioStats.monthlyProfit >= 0 ? 'success.main' : 'error.main'}>
                                            {portfolioStats.monthlyProfitPercentage}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Chart */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2 }}>
                            {chartData && <Line options={chartOptions} data={chartData} height={80} />}
                        </Paper>
                    </Grid>

                    {/* Recent Trades */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent Trades
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <List>
                                    {recentTrades.map((trade) => (
                                        <ListItem key={trade.id} sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: trade.type === 'buy' ? 'success.main' : 'error.main' }}>
                                                    <SwapHorizIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body1">{trade.pair}</Typography>
                                                        <Typography variant="body1" color={trade.profit >= 0 ? 'success.main' : 'error.main'}>
                                                            {trade.profit >= 0 ? '+' : ''}{trade.profit}%
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} @ ${trade.price.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {trade.time}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                    <Button color="primary">View All Trades</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
