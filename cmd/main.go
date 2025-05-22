package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/dercyc/autotransaction/config"
	"github.com/dercyc/autotransaction/internal/blockchain"
	"github.com/dercyc/autotransaction/internal/execution"
	"github.com/dercyc/autotransaction/internal/llm"
	"github.com/dercyc/autotransaction/internal/market"
	"github.com/dercyc/autotransaction/internal/risk"
	"github.com/dercyc/autotransaction/internal/strategy"
	"github.com/sirupsen/logrus"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig("./configs/config.yaml")
	if err != nil {
		fmt.Printf("加载配置失败: %v\n", err)
		os.Exit(1)
	}

	// 设置日志级别
	setLogLevel(cfg.System.LogLevel)

	// 初始化各个模块
	marketData := market.NewMarketDataService(cfg)
	riskManager := risk.NewRiskManager(cfg)
	strategyManager := strategy.NewStrategyManager(cfg, marketData)
	executor := execution.NewExecutor(cfg, riskManager)

	// 初始化区块链组件
	blockchainMarket, err := blockchain.NewBlockchainMarketDataService(cfg)
	if err != nil {
		logrus.Fatalf("初始化区块链市场数据服务失败: %v", err)
	}

	blockchainExecutor, err := blockchain.NewBlockchainExecutor(cfg, riskManager)
	if err != nil {
		logrus.Fatalf("初始化区块链交易执行器失败: %v", err)
	}

	// 初始化LLM服务
	llmService := llm.NewLLMService(cfg)

	// 初始化LLM控制器
	llmController := blockchain.NewLLMController(llmService)

	// 初始化DApp API服务器
	dappServer := blockchain.NewDAppAPIServer(cfg, blockchainExecutor, blockchainMarket, llmController)

	// 启动市场数据服务
	if err := marketData.Start(); err != nil {
		logrus.Fatalf("启动市场数据服务失败: %v", err)
	}

	// 启动策略管理器
	if err := strategyManager.Start(); err != nil {
		logrus.Fatalf("启动策略管理器失败: %v", err)
	}

	// 启动交易执行器
	if err := executor.Start(); err != nil {
		logrus.Fatalf("启动交易执行器失败: %v", err)
	}

	// 启动区块链服务
	if err := blockchainMarket.Start(); err != nil {
		logrus.Fatalf("启动区块链市场数据服务失败: %v", err)
	}

	if err := blockchainExecutor.Start(); err != nil {
		logrus.Fatalf("启动区块链交易执行器失败: %v", err)
	}

	// 启动DApp API服务器
	go func() {
		if err := dappServer.Start(); err != nil {
			logrus.Errorf("DApp API服务器启动失败: %v", err)
		}
	}()

	logrus.Info("自动交易系统已启动")

	// 等待中断信号
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	// 优雅关闭
	logrus.Info("正在关闭自动交易系统...")
	dappServer.Stop()
	blockchainExecutor.Stop()
	blockchainMarket.Stop()
	executor.Stop()
	strategyManager.Stop()
	marketData.Stop()
	logrus.Info("自动交易系统已关闭")
}

func setLogLevel(level string) {
	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}
