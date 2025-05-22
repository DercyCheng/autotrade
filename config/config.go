package config

import (
	"github.com/spf13/viper"
)

// Config 结构体包含整个应用的配置信息
type Config struct {
	Exchange   ExchangeConfig   `mapstructure:"exchange"`
	Blockchain BlockchainConfig `mapstructure:"blockchain"`
	Trading    TradingConfig    `mapstructure:"trading"`
	Strategy   StrategyConfig   `mapstructure:"strategy"`
	Risk       RiskConfig       `mapstructure:"risk"`
	System     SystemConfig     `mapstructure:"system"`
	LLM        LLMConfig        `mapstructure:"llm"`
}

// ExchangeConfig 交易所配置
type ExchangeConfig struct {
	Name      string `mapstructure:"name"`
	APIKey    string `mapstructure:"api_key"`
	APISecret string `mapstructure:"api_secret"`
	BaseURL   string `mapstructure:"base_url"`
}

// LLMConfig LLM服务配置
type LLMConfig struct {
	Enabled        bool    `mapstructure:"enabled"`
	APIKey         string  `mapstructure:"api_key"`
	DefaultEngine  string  `mapstructure:"default_engine"`
	DeepseekAPI    string  `mapstructure:"deepseek_api"`
	QwenAPI        string  `mapstructure:"qwen_api"`
	Temperature    float64 `mapstructure:"temperature"`
	MaxTokens      int     `mapstructure:"max_tokens"`
	RetryAttempts  int     `mapstructure:"retry_attempts"`
	TimeoutSeconds int     `mapstructure:"timeout_seconds"`
}

// BlockchainConfig 区块链配置
type BlockchainConfig struct {
	Networks  []NetworkConfig `mapstructure:"networks"`
	Contracts ContractsConfig `mapstructure:"contracts"`
}

// NetworkConfig 区块链网络配置
type NetworkConfig struct {
	Name     string `mapstructure:"name"`
	Enabled  bool   `mapstructure:"enabled"`
	RPCURL   string `mapstructure:"rpc_url"`
	ChainID  int    `mapstructure:"chain_id"`
	GasLimit int    `mapstructure:"gas_limit"`
	GasPrice string `mapstructure:"gas_price"`
}

// ContractsConfig 智能合约配置
type ContractsConfig struct {
	TradingContract  string `mapstructure:"trading_contract"`
	WalletPrivateKey string `mapstructure:"wallet_private_key"`
}

// TradingConfig 交易配置
type TradingConfig struct {
	Pairs        []PairConfig `mapstructure:"pairs"`
	BaseCurrency string       `mapstructure:"base_currency"`
}

// PairConfig 交易对配置
type PairConfig struct {
	Symbol          string `mapstructure:"symbol"`
	Enabled         bool   `mapstructure:"enabled"`
	Blockchain      string `mapstructure:"blockchain,omitempty"`
	ContractAddress string `mapstructure:"contract_address,omitempty"`
}

// StrategyConfig 策略配置
type StrategyConfig struct {
	Name   string                 `mapstructure:"name"`
	Params map[string]interface{} `mapstructure:"params"`
}

// RiskConfig 风险管理配置
type RiskConfig struct {
	MaxPositionSize   float64 `mapstructure:"max_position_size"`
	StopLoss          float64 `mapstructure:"stop_loss"`
	TakeProfit        float64 `mapstructure:"take_profit"`
	MaxOpenPositions  int     `mapstructure:"max_open_positions"`
	MaxGasPrice       string  `mapstructure:"max_gas_price"`
	SlippageTolerance float64 `mapstructure:"slippage_tolerance"`
}

// SystemConfig 系统配置
type SystemConfig struct {
	LogLevel     string `mapstructure:"log_level"`
	DataDir      string `mapstructure:"data_dir"`
	BacktestMode bool   `mapstructure:"backtest_mode"`
	DAppPort     int    `mapstructure:"dapp_port"`
}

// LoadConfig 从指定路径加载配置文件
func LoadConfig(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath)

	err := viper.ReadInConfig()
	if err != nil {
		return nil, err
	}

	var config Config
	err = viper.Unmarshal(&config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
