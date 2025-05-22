import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useWeb3 } from '../contexts/Web3Context';

// Mock trades for demo
const mockTrades = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    pair: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ETH/BNB'][Math.floor(Math.random() * 4)],
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    price: parseFloat((Math.random() * 60000 + 1000).toFixed(2)),
    amount: parseFloat((Math.random() * 2).toFixed(3)),
    value: parseFloat((Math.random() * 50000).toFixed(2)),
    executedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    status: ['completed', 'completed', 'completed', 'failed', 'pending'][Math.floor(Math.random() * 5)],
    network: Math.random() > 0.5 ? 'Ethereum' : 'BSC',
    profit: parseFloat((Math.random() * 10 - 3).toFixed(2)),
}));

export default function Trades() {
    const { isConnected } = useWeb3();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        if (isConnected) {
            setLoading(true);
            // In a real app, we would fetch trades from the contract or API

            // For demo, we'll use mock data
            setTimeout(() => {
                setTrades(mockTrades);
                setLoading(false);
            }, 1000);
        } else {
            setTrades([]);
        }
    }, [isConnected]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };

    if (!isConnected) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="info">
                    Please connect your wallet to view your trading history.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Trade History
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        sx={{ mr: 1 }}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Pair</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Value</TableCell>
                                    <TableCell>Date & Time</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Network</TableCell>
                                    <TableCell align="right">Profit/Loss</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {trades
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((trade) => (
                                        <TableRow key={trade.id} hover>
                                            <TableCell>{trade.id}</TableCell>
                                            <TableCell>{trade.pair}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trade.type.toUpperCase()}
                                                    size="small"
                                                    color={trade.type === 'buy' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">${trade.price.toLocaleString()}</TableCell>
                                            <TableCell align="right">{trade.amount}</TableCell>
                                            <TableCell align="right">${trade.value.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {trade.executedAt.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trade.status.toUpperCase()}
                                                    size="small"
                                                    color={getStatusColor(trade.status)}
                                                />
                                            </TableCell>
                                            <TableCell>{trade.network}</TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color:
                                                        trade.profit > 0
                                                            ? 'success.main'
                                                            : trade.profit < 0
                                                                ? 'error.main'
                                                                : 'inherit',
                                                }}
                                            >
                                                {trade.profit > 0 ? '+' : ''}
                                                {trade.profit}%
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details">
                                                    <IconButton size="small">
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={trades.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Box>
    );
}
