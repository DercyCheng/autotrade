import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useWeb3 } from '../contexts/Web3Context';

// Mock market data
const mockMarkets = [
    {
        pair: 'BTC/USDT',
        price: 68432.21,
        change24h: 2.34,
        volume24h: 1243589045,
        high24h: 68956.78,
        low24h: 66789.45,
        marketCap: 1324567890123,
        platform: 'Centralized',
        exchange: 'Binance'
    },
    {
        pair: 'ETH/USDT',
        price: 4532.67,
        change24h: -1.12,
        volume24h: 876543210,
        high24h: 4598.32,
        low24h: 4486.91,
        marketCap: 543210987654,
        platform: 'Centralized',
        exchange: 'Binance'
    },
    {
        pair: 'BNB/USDT',
        price: 642.89,
        change24h: 0.87,
        volume24h: 345678912,
        high24h: 649.32,
        low24h: 635.41,
        marketCap: 98765432109,
        platform: 'Centralized',
        exchange: 'Binance'
    },
    {
        pair: 'ETH/BNB',
        price: 7.05,
        change24h: -0.42,
        volume24h: 123456789,
        high24h: 7.12,
        low24h: 7.01,
        marketCap: 0,
        platform: 'DEX',
        exchange: 'PancakeSwap'
    },
    {
        pair: 'WBTC/ETH',
        price: 15.12,
        change24h: 1.68,
        volume24h: 87654321,
        high24h: 15.28,
        low24h: 14.95,
        marketCap: 0,
        platform: 'DEX',
        exchange: 'Uniswap'
    },
];

export default function Markets() {
    const { isConnected } = useWeb3();
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchMarketData();
    }, [isConnected]);

    const fetchMarketData = () => {
        setLoading(true);
        // In a real app, we would fetch market data from an API

        // For demo, we'll use mock data
        setTimeout(() => {
            setMarkets(mockMarkets);
            setLoading(false);
        }, 1000);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const filterMarkets = () => {
        if (tabValue === 0) return markets; // All markets
        if (tabValue === 1) return markets.filter(m => m.platform === 'Centralized'); // CEX
        if (tabValue === 2) return markets.filter(m => m.platform === 'DEX'); // DEX
        return markets;
    };

    const formatNumber = (num) => {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Markets
                </Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchMarketData}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="All Markets" />
                    <Tab label="Centralized Exchanges" />
                    <Tab label="Decentralized Exchanges" />
                </Tabs>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Pair</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">24h Change</TableCell>
                                <TableCell align="right">24h Volume</TableCell>
                                <TableCell align="right">24h High</TableCell>
                                <TableCell align="right">24h Low</TableCell>
                                <TableCell>Platform</TableCell>
                                <TableCell>Exchange</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filterMarkets().map((market) => (
                                <TableRow key={market.pair} hover>
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body1" fontWeight="medium">
                                            {market.pair}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        ${market.price.toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: market.change24h >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'medium'
                                        }}
                                    >
                                        {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                                    </TableCell>
                                    <TableCell align="right">
                                        ${formatNumber(market.volume24h)}
                                    </TableCell>
                                    <TableCell align="right">
                                        ${market.high24h.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        ${market.low24h.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={market.platform}
                                            size="small"
                                            color={market.platform === 'DEX' ? 'primary' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{market.exchange}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
