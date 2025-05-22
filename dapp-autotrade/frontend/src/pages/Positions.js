import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useWeb3 } from '../contexts/Web3Context';

// Mock positions data
const mockPositions = [
    {
        id: 1,
        asset: 'BTC',
        pair: 'BTC/USDT',
        entryPrice: 64532.78,
        currentPrice: 68432.21,
        quantity: 0.15,
        value: 10264.83,
        profitLoss: 585.90,
        profitLossPercentage: 6.05,
        type: 'SPOT',
        network: 'Centralized',
        exchange: 'Binance'
    },
    {
        id: 2,
        asset: 'ETH',
        pair: 'ETH/USDT',
        entryPrice: 4235.45,
        currentPrice: 4532.67,
        quantity: 2.5,
        value: 11331.68,
        profitLoss: 743.05,
        profitLossPercentage: 7.02,
        type: 'SPOT',
        network: 'Centralized',
        exchange: 'Binance'
    },
    {
        id: 3,
        asset: 'ETH',
        pair: 'ETH/BNB',
        entryPrice: 6.89,
        currentPrice: 7.05,
        quantity: 3.2,
        value: 22.56,
        profitLoss: 0.512,
        profitLossPercentage: 2.32,
        type: 'DEX',
        network: 'Ethereum',
        exchange: 'Uniswap'
    },
    {
        id: 4,
        asset: 'BNB',
        pair: 'BNB/USDT',
        entryPrice: 652.34,
        currentPrice: 642.89,
        quantity: 5.0,
        value: 3214.45,
        profitLoss: -47.25,
        profitLossPercentage: -1.45,
        type: 'SPOT',
        network: 'Centralized',
        exchange: 'Binance'
    },
];

export default function Positions() {
    const { isConnected } = useWeb3();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0,
        assetDistribution: {}
    });

    useEffect(() => {
        if (isConnected) {
            fetchPositions();
        } else {
            setPositions([]);
        }
    }, [isConnected]);

    const fetchPositions = () => {
        setLoading(true);
        // In a real app, we would fetch positions from the contract or API

        // For demo, we'll use mock data
        setTimeout(() => {
            setPositions(mockPositions);
            calculateStats(mockPositions);
            setLoading(false);
        }, 1000);
    };

    const calculateStats = (positionsData) => {
        let totalValue = 0;
        let totalProfitLoss = 0;
        const assetDistribution = {};

        positionsData.forEach(position => {
            totalValue += position.value;
            totalProfitLoss += position.profitLoss;

            if (assetDistribution[position.asset]) {
                assetDistribution[position.asset] += position.value;
            } else {
                assetDistribution[position.asset] = position.value;
            }
        });

        const totalProfitLossPercentage = (totalProfitLoss / (totalValue - totalProfitLoss)) * 100;

        setStats({
            totalValue,
            totalProfitLoss,
            totalProfitLossPercentage,
            assetDistribution
        });
    };

    const closePosition = (id) => {
        // In a real app, we would call the contract to close the position
        console.log(`Closing position ${id}`);

        // For demo, we'll just remove it from the UI
        setPositions(positions.filter(p => p.id !== id));
        calculateStats(positions.filter(p => p.id !== id));
    };

    if (!isConnected) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="info">
                    Please connect your wallet to view your open positions.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Open Positions
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Position Value
                                    </Typography>
                                    <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                                        ${stats.totalValue.toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Total Profit/Loss
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={stats.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                                        sx={{ mt: 1 }}
                                    >
                                        {stats.totalProfitLoss >= 0 ? '+' : ''}
                                        ${stats.totalProfitLoss.toLocaleString()}
                                        <Typography
                                            variant="body2"
                                            component="span"
                                            color={stats.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                                            sx={{ ml: 1 }}
                                        >
                                            ({stats.totalProfitLossPercentage.toFixed(2)}%)
                                        </Typography>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Asset Distribution
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {Object.entries(stats.assetDistribution).map(([asset, value]) => (
                                            <Chip
                                                key={asset}
                                                label={`${asset}: $${value.toLocaleString()}`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Asset</TableCell>
                                    <TableCell>Pair</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Entry Price</TableCell>
                                    <TableCell align="right">Current Price</TableCell>
                                    <TableCell align="right">Value</TableCell>
                                    <TableCell align="right">Profit/Loss</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Network</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {positions.map((position) => (
                                    <TableRow key={position.id} hover>
                                        <TableCell>{position.asset}</TableCell>
                                        <TableCell>{position.pair}</TableCell>
                                        <TableCell align="right">{position.quantity}</TableCell>
                                        <TableCell align="right">${position.entryPrice.toLocaleString()}</TableCell>
                                        <TableCell align="right">${position.currentPrice.toLocaleString()}</TableCell>
                                        <TableCell align="right">${position.value.toLocaleString()}</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color: position.profitLoss >= 0 ? 'success.main' : 'error.main',
                                                fontWeight: 'medium'
                                            }}
                                        >
                                            {position.profitLoss >= 0 ? '+' : ''}${Math.abs(position.profitLoss).toLocaleString()}
                                            <br />
                                            <Typography
                                                variant="caption"
                                                component="span"
                                                color={position.profitLoss >= 0 ? 'success.main' : 'error.main'}
                                            >
                                                ({position.profitLoss >= 0 ? '+' : ''}{position.profitLossPercentage.toFixed(2)}%)
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={position.type}
                                                size="small"
                                                color={position.type === 'DEX' ? 'primary' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{position.network}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Close Position">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => closePosition(position.id)}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
}
