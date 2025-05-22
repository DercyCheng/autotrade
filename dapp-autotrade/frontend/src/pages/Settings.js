import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Slider,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import { useWeb3 } from '../contexts/Web3Context';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
    const { isConnected, account, chainId } = useWeb3();
    const { mode, toggleTheme } = useTheme();
    const [settings, setSettings] = useState({
        // Trading settings
        maxTradeAmount: 1000,
        maxOpenPositions: 5,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        slippageTolerance: 0.5,

        // Notification settings
        emailNotifications: true,
        pushNotifications: false,
        tradeAlerts: true,
        priceAlerts: true,

        // Network settings
        defaultNetwork: 'ethereum',
        gasPrice: 'medium',
        maxGasPrice: 100,

        // UI settings
        language: 'en',
        currency: 'USD',
        darkMode: mode === 'dark',
    });

    const [saveStatus, setSaveStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSliderChange = (name) => (e, value) => {
        setSettings({
            ...settings,
            [name]: value,
        });
    };

    const handleThemeModeChange = (e) => {
        const darkMode = e.target.checked;
        setSettings({
            ...settings,
            darkMode,
        });
        toggleTheme(); // Update the theme
    };

    const handleSaveSettings = () => {
        // In a real app, we would save settings to backend or blockchain
        console.log('Saving settings:', settings);
        setSaveStatus('success');

        // Clear the success message after 3 seconds
        setTimeout(() => {
            setSaveStatus(null);
        }, 3000);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            {saveStatus === 'success' && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Your settings have been saved successfully.
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccountBalanceIcon sx={{ mr: 1 }} /> Trading Settings
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography id="max-trade-label" gutterBottom>
                                        Maximum Trade Amount (USD): {settings.maxTradeAmount}
                                    </Typography>
                                    <Slider
                                        value={settings.maxTradeAmount}
                                        onChange={handleSliderChange('maxTradeAmount')}
                                        aria-labelledby="max-trade-label"
                                        valueLabelDisplay="auto"
                                        min={100}
                                        max={10000}
                                        step={100}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography id="max-positions-label" gutterBottom>
                                        Maximum Open Positions: {settings.maxOpenPositions}
                                    </Typography>
                                    <Slider
                                        value={settings.maxOpenPositions}
                                        onChange={handleSliderChange('maxOpenPositions')}
                                        aria-labelledby="max-positions-label"
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={20}
                                        step={1}
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography id="stop-loss-label" gutterBottom>
                                        Stop Loss (%): {settings.stopLossPercentage}
                                    </Typography>
                                    <Slider
                                        value={settings.stopLossPercentage}
                                        onChange={handleSliderChange('stopLossPercentage')}
                                        aria-labelledby="stop-loss-label"
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={20}
                                        step={0.5}
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography id="take-profit-label" gutterBottom>
                                        Take Profit (%): {settings.takeProfitPercentage}
                                    </Typography>
                                    <Slider
                                        value={settings.takeProfitPercentage}
                                        onChange={handleSliderChange('takeProfitPercentage')}
                                        aria-labelledby="take-profit-label"
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={50}
                                        step={0.5}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography id="slippage-label" gutterBottom>
                                        Slippage Tolerance (%): {settings.slippageTolerance}
                                    </Typography>
                                    <Slider
                                        value={settings.slippageTolerance}
                                        onChange={handleSliderChange('slippageTolerance')}
                                        aria-labelledby="slippage-label"
                                        valueLabelDisplay="auto"
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <LanguageIcon sx={{ mr: 1 }} /> Network Settings
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel id="default-network-label">Default Network</InputLabel>
                                        <Select
                                            labelId="default-network-label"
                                            name="defaultNetwork"
                                            value={settings.defaultNetwork}
                                            label="Default Network"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="ethereum">Ethereum</MenuItem>
                                            <MenuItem value="bsc">Binance Smart Chain</MenuItem>
                                            <MenuItem value="polygon">Polygon</MenuItem>
                                            <MenuItem value="avalanche">Avalanche</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel id="gas-price-label">Gas Price</InputLabel>
                                        <Select
                                            labelId="gas-price-label"
                                            name="gasPrice"
                                            value={settings.gasPrice}
                                            label="Gas Price"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="low">Low</MenuItem>
                                            <MenuItem value="medium">Medium</MenuItem>
                                            <MenuItem value="high">High</MenuItem>
                                            <MenuItem value="custom">Custom</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {settings.gasPrice === 'custom' && (
                                    <Grid item xs={12}>
                                        <Typography id="max-gas-label" gutterBottom>
                                            Maximum Gas Price (Gwei): {settings.maxGasPrice}
                                        </Typography>
                                        <Slider
                                            value={settings.maxGasPrice}
                                            onChange={handleSliderChange('maxGasPrice')}
                                            aria-labelledby="max-gas-label"
                                            valueLabelDisplay="auto"
                                            min={10}
                                            max={500}
                                            step={5}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <NotificationsIcon sx={{ mr: 1 }} /> Notification Settings
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Email Notifications"
                                        secondary="Receive trade notifications via email"
                                    />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            edge="end"
                                            name="emailNotifications"
                                            checked={settings.emailNotifications}
                                            onChange={handleChange}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem>
                                    <ListItemText
                                        primary="Push Notifications"
                                        secondary="Receive push notifications in your browser"
                                    />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            edge="end"
                                            name="pushNotifications"
                                            checked={settings.pushNotifications}
                                            onChange={handleChange}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem>
                                    <ListItemText
                                        primary="Trade Alerts"
                                        secondary="Get notified when trades are executed"
                                    />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            edge="end"
                                            name="tradeAlerts"
                                            checked={settings.tradeAlerts}
                                            onChange={handleChange}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>

                                <ListItem>
                                    <ListItemText
                                        primary="Price Alerts"
                                        secondary="Get notified when significant price changes occur"
                                    />
                                    <ListItemSecondaryAction>
                                        <Switch
                                            edge="end"
                                            name="priceAlerts"
                                            checked={settings.priceAlerts}
                                            onChange={handleChange}
                                        />
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                <SecurityIcon sx={{ mr: 1 }} /> Security & Interface
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel id="language-label">Language</InputLabel>
                                        <Select
                                            labelId="language-label"
                                            name="language"
                                            value={settings.language}
                                            label="Language"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="en">English</MenuItem>
                                            <MenuItem value="zh">中文 (Chinese)</MenuItem>
                                            <MenuItem value="es">Español (Spanish)</MenuItem>
                                            <MenuItem value="ru">Русский (Russian)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel id="currency-label">Display Currency</InputLabel>
                                        <Select
                                            labelId="currency-label"
                                            name="currency"
                                            value={settings.currency}
                                            label="Display Currency"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="USD">USD ($)</MenuItem>
                                            <MenuItem value="EUR">EUR (€)</MenuItem>
                                            <MenuItem value="GBP">GBP (£)</MenuItem>
                                            <MenuItem value="JPY">JPY (¥)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.darkMode}
                                                onChange={handleThemeModeChange}
                                                name="darkMode"
                                            />
                                        }
                                        label="Dark Mode"
                                    />
                                </Grid>

                                {isConnected && (
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ mt: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                    Connected Wallet
                                                </Typography>
                                                <Typography variant="body2">
                                                    Address: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Network: {chainId === 1 ? 'Ethereum' : chainId === 56 ? 'BSC' : 'Unknown'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                        >
                            Save Settings
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
