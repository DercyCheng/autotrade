import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    List,
    ListItem,
    Divider,
    CircularProgress,
    Fab,
    Zoom,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as SmartToyIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import LLMService from '../services/llm.service';

const TradingAssistant = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: '您好！我是您的 AI 交易助手。我可以帮您分析市场、优化策略或回答交易相关问题。请问有什么需要帮助的吗？',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (input.trim() === '') return;

        const userMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages([...messages, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const context = {
                previous_messages: messages.slice(-5).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }))
            };

            const response = await LLMService.askQuestion(input, context);

            const botMessage = {
                id: messages.length + 2,
                sender: 'bot',
                text: response.data.completion || '抱歉，我现在无法处理您的请求。请稍后再试。',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message to LLM:', error);

            const errorMessage = {
                id: messages.length + 2,
                sender: 'bot',
                text: '抱歉，发生了错误。请稍后再试。',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Zoom in={!open}>
                <Tooltip title="AI 交易助手" placement="left">
                    <Fab
                        color="primary"
                        aria-label="chat"
                        onClick={handleOpen}
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                        }}
                    >
                        <SmartToyIcon />
                    </Fab>
                </Tooltip>
            </Zoom>

            <Box
                sx={{
                    position: 'fixed',
                    bottom: open ? 20 : -500,
                    right: 20,
                    width: 350,
                    height: 500,
                    transition: 'bottom 0.3s ease-in-out',
                    zIndex: 1000,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SmartToyIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">AI 交易助手</Typography>
                        </Box>
                        <IconButton onClick={handleClose} color="inherit" size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            p: 2,
                            bgcolor: 'background.default',
                        }}
                    >
                        <List>
                            {messages.map((message, index) => (
                                <React.Fragment key={message.id}>
                                    <ListItem
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                            p: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                                                alignItems: 'flex-start',
                                                mb: 0.5,
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                                                    width: 32,
                                                    height: 32,
                                                    mr: message.sender === 'user' ? 0 : 1,
                                                    ml: message.sender === 'user' ? 1 : 0,
                                                }}
                                            >
                                                {message.sender === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                                            </Avatar>
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 1.5,
                                                    maxWidth: '80%',
                                                    bgcolor: message.sender === 'user' ? 'secondary.light' : 'background.paper',
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                                    {message.text}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                                                    {formatTime(message.timestamp)}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    </ListItem>
                                    {index < messages.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                            <div ref={messagesEndRef} />
                        </List>
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>

                    <Box
                        component="form"
                        noValidate
                        autoComplete="off"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        sx={{
                            p: 2,
                            bgcolor: 'background.paper',
                            borderTop: 1,
                            borderColor: 'divider',
                            display: 'flex',
                        }}
                    >
                        <TextField
                            fullWidth
                            placeholder="输入您的问题..."
                            variant="outlined"
                            size="small"
                            value={input}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            sx={{ mr: 1 }}
                            autoFocus
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={loading || input.trim() === ''}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};

export default TradingAssistant;
