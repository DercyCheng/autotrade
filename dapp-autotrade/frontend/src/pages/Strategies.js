import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import { useWeb3 } from '../contexts/Web3Context';

// Mock strategies for demo
const mockStrategies = [
    {
        id: 1,
        name: 'Moving Average Crossover',
        description: 'Trades based on the crossover of short and long moving averages',
        status: true,
        pairs: ['BTC/USDT', 'ETH/USDT'],
        params: {
            shortPeriod: 5,
            longPeriod: 20,
            interval: '1h',
        },
        performance: {
            totalTrades: 42,
            winRate: 68,
            avgProfit: 2.4,
            totalProfit: 13.5,
        },
    },
    {
        id: 2,
        name: 'Bollinger Band Breakout',
        description: 'Identifies breakouts from Bollinger Bands to enter positions',
        status: false,
        pairs: ['ETH/USDT', 'BNB/USDT'],
        params: {
            period: 20,
            stdDev: 2,
            interval: '30m',
        },
        performance: {
            totalTrades: 28,
            winRate: 54,
            avgProfit: 1.8,
            totalProfit: 8.2,
        },
    },
    {
        id: 3,
        name: 'DCA Bitcoin',
        description: 'Dollar-cost averaging strategy for Bitcoin accumulation',
        status: true,
        pairs: ['BTC/USDT'],
        params: {
            interval: '1d',
            amount: 100,
        },
        performance: {
            totalTrades: 365,
            winRate: 72,
            avgProfit: 0.5,
            totalProfit: 42.8,
        },
    },
];

export default function Strategies() {
    const { isConnected, contract } = useWeb3();
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentStrategy, setCurrentStrategy] = useState(null);
    const [error, setError] = useState(null);

    // Load strategies
    useEffect(() => {
        if (isConnected) {
            setLoading(true);
            // In a real app, we would fetch strategies from the contract
            // Example: contract.getStrategies().then(...)

            // For demo, we'll use mock data
            setTimeout(() => {
                setStrategies(mockStrategies);
                setLoading(false);
            }, 1000);
        } else {
            setStrategies([]);
        }
    }, [isConnected, contract]);

    // Open dialog for creating/editing a strategy
    const handleOpenDialog = (strategy = null) => {
        setCurrentStrategy(strategy);
        setOpenDialog(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentStrategy(null);
    };

    // Toggle strategy status
    const handleToggleStatus = (id, newStatus) => {
        // In a real app, we would call the contract
        // Example: contract.toggleStrategy(id, newStatus).then(...)

        // For demo, we'll update the local state
        setStrategies((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
    };

    // Save strategy
    const handleSaveStrategy = (formData) => {
        // In a real app, we would call the contract
        // Example: contract.saveStrategy(formData).then(...)

        // For demo, we'll update the local state
        if (currentStrategy) {
            // Edit existing
            setStrategies((prev) =>
                prev.map((s) => (s.id === currentStrategy.id ? { ...s, ...formData } : s))
            );
        } else {
            // Create new
            const newStrategy = {
                id: strategies.length + 1,
                ...formData,
                status: true,
                performance: {
                    totalTrades: 0,
                    winRate: 0,
                    avgProfit: 0,
                    totalProfit: 0,
                },
            };
            setStrategies((prev) => [...prev, newStrategy]);
        }

        handleCloseDialog();
    };

    // Delete strategy
    const handleDeleteStrategy = (id) => {
        // In a real app, we would call the contract
        // Example: contract.deleteStrategy(id).then(...)

        // For demo, we'll update the local state
        setStrategies((prev) => prev.filter((s) => s.id !== id));
    };

    // Strategy form component
    const StrategyForm = ({ strategy, onSave, onCancel }) => {
        const [formData, setFormData] = useState(
            strategy || {
                name: '',
                description: '',
                pairs: [],
                params: {},
            }
        );

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
        };

        const handleParamChange = (e) => {
            const { name, value } = e.target;
            setFormData((prev) => ({
                ...prev,
                params: { ...prev.params, [name]: value },
            }));
        };

        const handlePairsChange = (e) => {
            const pairs = e.target.value.split(',').map((p) => p.trim());
            setFormData((prev) => ({ ...prev, pairs }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Strategy Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={2}
                    />
                    <TextField
                        margin="dense"
                        name="pairs"
                        label="Trading Pairs (comma separated)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.pairs.join(', ')}
                        onChange={handlePairsChange}
                        required
                    />

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Strategy Parameters
                    </Typography>

                    {formData.name === 'Moving Average Crossover' && (
                        <>
                            <TextField
                                margin="dense"
                                name="shortPeriod"
                                label="Short Period"
                                type="number"
                                variant="outlined"
                                value={formData.params.shortPeriod || ''}
                                onChange={handleParamChange}
                                sx={{ mr: 1, width: '30%' }}
                            />
                            <TextField
                                margin="dense"
                                name="longPeriod"
                                label="Long Period"
                                type="number"
                                variant="outlined"
                                value={formData.params.longPeriod || ''}
                                onChange={handleParamChange}
                                sx={{ mr: 1, width: '30%' }}
                            />
                            <TextField
                                margin="dense"
                                name="interval"
                                label="Interval"
                                type="text"
                                variant="outlined"
                                value={formData.params.interval || ''}
                                onChange={handleParamChange}
                                sx={{ width: '30%' }}
                            />
                        </>
                    )}

                    {formData.name === 'Bollinger Band Breakout' && (
                        <>
                            <TextField
                                margin="dense"
                                name="period"
                                label="Period"
                                type="number"
                                variant="outlined"
                                value={formData.params.period || ''}
                                onChange={handleParamChange}
                                sx={{ mr: 1, width: '30%' }}
                            />
                            <TextField
                                margin="dense"
                                name="stdDev"
                                label="Standard Deviation"
                                type="number"
                                variant="outlined"
                                value={formData.params.stdDev || ''}
                                onChange={handleParamChange}
                                sx={{ mr: 1, width: '30%' }}
                            />
                            <TextField
                                margin="dense"
                                name="interval"
                                label="Interval"
                                type="text"
                                variant="outlined"
                                value={formData.params.interval || ''}
                                onChange={handleParamChange}
                                sx={{ width: '30%' }}
                            />
                        </>
                    )}

                    {formData.name === 'DCA Bitcoin' && (
                        <>
                            <TextField
                                margin="dense"
                                name="interval"
                                label="Interval"
                                type="text"
                                variant="outlined"
                                value={formData.params.interval || ''}
                                onChange={handleParamChange}
                                sx={{ mr: 1, width: '45%' }}
                            />
                            <TextField
                                margin="dense"
                                name="amount"
                                label="Amount (USD)"
                                type="number"
                                variant="outlined"
                                value={formData.params.amount || ''}
                                onChange={handleParamChange}
                                sx={{ width: '45%' }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="submit" variant="contained">
                        {strategy ? 'Update Strategy' : 'Create Strategy'}
                    </Button>
                </DialogActions>
            </form>
        );
    };

    if (!isConnected) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="info">
                    Please connect your wallet to view and manage your trading strategies.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Trading Strategies
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    New Strategy
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {strategies.map((strategy) => (
                        <Grid item xs={12} md={6} lg={4} key={strategy.id}>
                            <Card>
                                <CardHeader
                                    title={strategy.name}
                                    action={
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={strategy.status}
                                                    onChange={(e) => handleToggleStatus(strategy.id, e.target.checked)}
                                                    color="primary"
                                                />
                                            }
                                            label={strategy.status ? 'Active' : 'Inactive'}
                                        />
                                    }
                                />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {strategy.description}
                                    </Typography>

                                    <Typography variant="subtitle2" gutterBottom>
                                        Trading Pairs:
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        {strategy.pairs.map((pair) => (
                                            <Chip
                                                key={pair}
                                                label={pair}
                                                size="small"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Typography variant="subtitle2" gutterBottom>
                                        Performance:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Win Rate:
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {strategy.performance.winRate}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Trades:
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {strategy.performance.totalTrades}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Avg. Profit:
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                fontWeight="medium"
                                                color={strategy.performance.avgProfit > 0 ? 'success.main' : 'error.main'}
                                            >
                                                {strategy.performance.avgProfit > 0 ? '+' : ''}
                                                {strategy.performance.avgProfit}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Profit:
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                fontWeight="medium"
                                                color={strategy.performance.totalProfit > 0 ? 'success.main' : 'error.main'}
                                            >
                                                {strategy.performance.totalProfit > 0 ? '+' : ''}
                                                {strategy.performance.totalProfit}%
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Button
                                            startIcon={<InfoIcon />}
                                            size="small"
                                        >
                                            Details
                                        </Button>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(strategy)}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteStrategy(strategy.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create/Edit Strategy Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {currentStrategy ? 'Edit Strategy' : 'Create New Strategy'}
                </DialogTitle>
                <StrategyForm
                    strategy={currentStrategy}
                    onSave={handleSaveStrategy}
                    onCancel={handleCloseDialog}
                />
            </Dialog>
        </Box>
    );
}
