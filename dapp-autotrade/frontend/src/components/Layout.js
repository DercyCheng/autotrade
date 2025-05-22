import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button,
    Divider,
    useMediaQuery,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StrategyIcon from '@mui/icons-material/Psychology';
import TradesIcon from '@mui/icons-material/SwapHoriz';
import MarketsIcon from '@mui/icons-material/ShowChart';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useTheme } from '../contexts/ThemeContext';
import { useWeb3 } from '../contexts/Web3Context';
import NetworkBadge from './NetworkBadge';
import TradingAssistant from './TradingAssistant';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Strategies', icon: <StrategyIcon />, path: '/strategies' },
    { text: 'Trades', icon: <TradesIcon />, path: '/trades' },
    { text: 'Markets', icon: <MarketsIcon />, path: '/markets' },
    { text: 'Positions', icon: <AccountBalanceWalletIcon />, path: '/positions' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const aiMenuItems = [
    { text: 'AI Market Analysis', icon: <SmartToyIcon />, path: '/ai-dashboard' },
    { text: 'AI Strategy Optimization', icon: <AutoFixHighIcon />, path: '/ai-strategy-optimization' },
];

export default function Layout({ children }) {
    const { theme, mode, toggleTheme } = useTheme();
    const { account, chainId, isConnected, connectWallet, disconnectWallet } = useWeb3();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const handleAccountMenuOpen = (event) => {
        setAccountMenuAnchor(event.currentTarget);
    };

    const handleAccountMenuClose = () => {
        setAccountMenuAnchor(null);
    };

    const handleDisconnect = () => {
        disconnectWallet();
        handleAccountMenuClose();
    };

    const truncateAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const drawer = (
        <div>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
                    AutoTrade DApp
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.action.selected,
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="textSecondary" sx={{ px: 3, py: 1, fontWeight: 'bold' }}>
                AI Powered Features
            </Typography>
            <List>
                {aiMenuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.action.selected,
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
                    </Typography>

                    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
                        <IconButton onClick={toggleTheme} color="inherit">
                            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                        </IconButton>
                    </Tooltip>

                    {isConnected ? (
                        <>
                            <NetworkBadge chainId={chainId} sx={{ mr: 2 }} />
                            <Button
                                onClick={handleAccountMenuOpen}
                                color="inherit"
                                startIcon={
                                    <Avatar sx={{ width: 24, height: 24, backgroundColor: theme.palette.primary.main }}>
                                        {account ? account.substring(2, 4) : ''}
                                    </Avatar>
                                }
                            >
                                {truncateAddress(account)}
                            </Button>
                            <Menu
                                anchorEl={accountMenuAnchor}
                                open={Boolean(accountMenuAnchor)}
                                onClose={handleAccountMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={handleDisconnect}>Disconnect Wallet</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Button color="inherit" onClick={connectWallet} startIcon={<AccountBalanceWalletIcon />}>
                            Connect Wallet
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                {children}
                <TradingAssistant />
            </Box>
        </Box>
    );
}
