# AutoTrade - AI-Powered Multi-Platform Trading System

<div align="center">

[![Go Version](https://img.shields.io/badge/Go-1.19+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![Solidity Version](https://img.shields.io/badge/Solidity-0.8.x-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![React Version](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![LLM Powered](https://img.shields.io/badge/LLM-Powered-FF6F00?style=for-the-badge&logo=openai&logoColor=white)](https://autotransaction)

[Features](#-features) •
[Architecture](#%EF%B8%8F-architecture) •
[Installation](#-installation) •
[Documentation](#-documentation) •
[Roadmap](#-roadmap) •
[License](#-license)

</div>

## 📋 Overview

AutoTrade is a comprehensive multi-platform automated trading system that integrates advanced LLM technologies (Deepseek, Qwen3) with blockchain platforms (Ethereum, BSC, etc.). It features smart contracts and an intuitive React frontend to enable intelligent execution of quantitative trading strategies.

## ✨ Features

- **Real-time Market Data**: Fetch live price and volume data from both centralized and decentralized exchanges
- **Multi-Platform Support**: Seamlessly operate across Ethereum, BSC, and other blockchain platforms
- **Trading Strategies**: Execute built-in strategies with customizable parameters
- **Smart Contract Integration**: Implement efficient decentralized trading through smart contracts
- **Modern UI**: Responsive React-based interface with intuitive dashboards
- **LLM Integration**:
  - 🧠 AI Market Analysis Dashboard
  - 📈 Strategy Optimization with AI recommendations
  - 💬 Trading Assistant with natural language interaction
  - 🛡️ Intelligent Risk Assessment
  - 🔍 Smart Trading Opportunity Detection
- **Risk Management**: Advanced risk control mechanisms to ensure trading safety
- **Performance Monitoring**: Real-time system performance and trade execution tracking

## 🏗️ Architecture

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=AutoTrade+Architecture" alt="System Architecture">
</div>

The system consists of the following key components:

### Backend Core (Go)

- **Market Data Service**: Collects and processes real-time market data
- **Strategy Manager**: Manages and executes trading strategies
- **Risk Manager**: Monitors and controls trading risks
- **Execution Engine**: Handles order execution across platforms
- **LLM Service**: Provides AI-powered analysis and recommendations

### Blockchain Integration (Solidity)

- **Auto-Trade Contracts**: Smart contracts for on-chain trading
- **Multi-DEX Support**: Integration with various decentralized exchanges

### Frontend Interface (React)

- **Trading Dashboard**: Real-time portfolio and performance view
- **Strategy Management & AI Optimization**: Configure and optimize strategies
- **Trade History & Analytics**: Historical performance visualization
- **Position Management**: Current holdings and order management
- **AI Market Analysis**: LLM-powered market insights
- **Trading Assistant**: Natural language trading interface

## 📂 Project Structure

```
./
├── cmd/                # Command-line entry points
│   └── main.go         # Main application entry
├── config/             # Configuration management
│   └── config.go       # Configuration loading module
├── internal/           # Internal packages
│   ├── blockchain/     # Blockchain interaction
│   │   ├── dapp_api.go # DApp API endpoints
│   │   └── llm_controller.go # LLM API controller
│   ├── market/         # Market data collection
│   ├── strategy/       # Trading strategies
│   ├── execution/      # Trade execution
│   ├── risk/           # Risk management
│   └── llm/            # LLM services
│       ├── llm_service.go    # Core LLM service
│       └── llm_extensions.go # Extended LLM capabilities
├── pkg/                # Public packages
│   └── utils/          # Utility functions
├── dapp-autotrade/     # DApp directory
│   ├── contracts/      # Smart contracts
│   └── frontend/       # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── TradingAssistant.js # AI chat interface
│       │   │   └── Layout.js          # Main layout
│       │   ├── pages/
│       │   │   ├── LLMDashboard.js    # AI analysis dashboard
│       │   │   └── StrategyOptimization.js # AI strategy optimizer
│       │   └── services/
│       │       ├── api.js             # API service
│       │       └── llm.service.js     # LLM service client
│       └── public/
└── configs/            # Configuration files
    └── config.yaml     # Main configuration file
```

## 🚀 Installation

### Prerequisites

- Go 1.19+
- Node.js 16+
- npm or yarn
- MetaMask or other Web3 wallet
- Ethereum/BSC node access (local or remote)
- API keys for LLM services (Deepseek, Qwen3)

### Backend Setup

1. Clone the repository

```bash
git clone https://autotransaction.git
cd autotransaction
```

2. Configure the environment

```bash
cp configs/config.example.yaml configs/config.yaml
# Edit config.yaml to set up trading parameters, API keys, and blockchain configuration
```

3. Build and run

```bash
go build -o autotrade cmd/main.go
./autotrade
```

Alternatively, run directly:

```bash
go run cmd/main.go
```

### Smart Contract Deployment

1. Install dependencies

```bash
cd dapp-autotrade/contracts
npm install
```

2. Compile contracts

```bash
npx hardhat compile
```

3. Deploy contracts (choose network as needed)

```bash
npx hardhat run scripts/deploy.js --network ethereum  # Deploy to Ethereum
# or
npx hardhat run scripts/deploy.js --network bsc       # Deploy to BSC
```

### Frontend Application

1. Install dependencies

```bash
cd dapp-autotrade/frontend
npm install
```

2. Configure environment variables

```bash
cp .env.example .env
# Edit .env to set the backend API address and contract addresses
```

3. Start development server

```bash
npm start
```

4. Build for production

```bash
npm run build
```

## ⚙️ Configuration

The `configs/config.yaml` file allows you to configure:

```yaml
# Example configuration structure
server:
  port: 8080
  host: localhost

blockchain:
  networks:
    - name: ethereum
      rpc: https://mainnet.infura.io/v3/YOUR_API_KEY
      chainId: 1
    - name: bsc
      rpc: https://bsc-dataseed.binance.org/
      chainId: 56

trading:
  strategies:
    - name: MovingAverageCross
      params:
        shortPeriod: 9
        longPeriod: 21
    - name: BollingerBands
      params:
        period: 20
        deviation: 2

llm:
  providers:
    - name: deepseek
      apiKey: ${DEEPSEEK_API_KEY}
      model: deepseek-chat
    - name: qwen
      apiKey: ${QWEN_API_KEY}
      model: qwen-max
  features:
    marketAnalysis: true
    strategyOptimization: true
    tradingAssistant: true
```

## 📊 Trading Strategies

- **Moving Average Crossover**: Trade based on short and long-term moving average crossovers
- **Bollinger Bands Breakout**: Trade based on price breakouts from Bollinger Bands
- **Dollar-Cost Averaging**: Regularly purchase assets in fixed amounts
- **AI-Enhanced Strategies**: Strategies optimized by LLM recommendations
- **Custom Strategies**: Support for user-defined trading strategies

## 🛠️ Technology Stack

- **Backend**: Go, Ethereum Go Client (go-ethereum)
- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: React, Material-UI, Ethers.js, Chart.js
- **Blockchain**: Ethereum, BSC, Uniswap/PancakeSwap
- **AI**: Deepseek, Qwen3, LLM integration

## 📚 Documentation

### LLM Features

#### AI Market Analysis

The AI Market Analysis dashboard provides intelligent insights into market trends, sentiment analysis, and potential trading opportunities.

```go
// Example LLM market analysis request
response, err := llmService.AnalyzeMarket(ctx, &llm.AnalyzeMarketRequest{
    Assets: []string{"BTC", "ETH"},
    Timeframe: "4h",
    IncludeSentiment: true,
})
```

#### Strategy Optimization

The Strategy Optimization component uses LLM to suggest improvements to your trading strategies based on historical performance and market conditions.

```go
// Example strategy optimization request
optimizations, err := llmService.OptimizeStrategy(ctx, &llm.OptimizeStrategyRequest{
    StrategyName: "MovingAverageCross",
    CurrentParams: map[string]interface{}{
        "shortPeriod": 9,
        "longPeriod": 21,
    },
    HistoricalPerformance: performanceData,
})
```

#### Trading Assistant

The AI Trading Assistant provides a natural language interface for interacting with the trading system, getting insights, and executing trades.

```go
// Example trading assistant interaction
response, err := llmService.ChatWithAssistant(ctx, &llm.ChatRequest{
    Message: "What's the current market sentiment for Ethereum?",
    ConversationId: "user-123",
})
```

### API Reference

The system exposes RESTful APIs for interacting with all components:

- `/api/v1/market/data` - Get market data
- `/api/v1/strategies` - Manage trading strategies
- `/api/v1/trades` - View and execute trades
- `/api/v1/portfolio` - Manage portfolio
- `/api/v1/llm/analyze` - LLM market analysis
- `/api/v1/llm/optimize` - LLM strategy optimization
- `/api/v1/llm/chat` - Trading assistant chat

## 🧩 Extending the System

The system is designed with a modular architecture that makes it easy to extend with:

- New trading strategies
- Additional market data sources
- Support for more blockchain networks
- Enhanced user interface features
- Custom LLM integrations

## 📈 Roadmap

- [X] Core architecture and functionality
- [X] Moving Average Crossover strategy implementation
- [X] Ethereum blockchain integration
- [X] Basic UI implementation
- [X] LLM service integration
- [X] AI market analysis dashboard
- [X] Trading assistant chat interface
- [ ] Strategy optimization improvements
- [ ] Support for more blockchain platforms
- [ ] Additional strategy templates
- [ ] Strategy backtesting functionality
- [ ] Mobile app development
- [ ] Advanced risk management features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


<div align="center">
  <sub>Built with ❤️ by Dercy</sub>
</div>
