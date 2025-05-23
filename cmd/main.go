package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"autotransaction/config"
	"autotransaction/internal/blockchain"
	"autotransaction/internal/execution"
	"autotransaction/internal/llm"
	"autotransaction/internal/market"
	"autotransaction/internal/risk"
	"autotransaction/internal/strategy"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig("./configs/config.yaml")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
			"file":  "./configs/config.yaml",
		}).Fatal("加载配置失败")
	}

	// 设置日志级别
	setLogLevel(cfg.System.LogLevel)

	// 初始化上下文和取消函数
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 使用ctx初始化各个模块
	marketData := market.NewMarketDataService(cfg)
	riskManager := risk.NewRiskManager(cfg)
	strategyManager := strategy.NewStrategyManager(cfg, marketData)
	executor := execution.NewExecutor(cfg, riskManager)

	// 将上下文传递给需要的模块（示例）
	go func() {
		<-ctx.Done()
		logrus.Info("检测到上下文取消信号")
	}()

	// 初始化LLM服务
	llmService := llm.NewLLMService(cfg)

	// 初始化Prometheus监控
	prometheusRegistry := prometheus.NewRegistry()
	prometheusRegistry.MustRegister(
		prometheus.NewGoCollector(),
		prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}),
	)

	// 初始化LLM控制器
	llmController := blockchain.NewLLMController(llmService)

	var (
		blockchainMarket   *blockchain.BlockchainMarketDataService
		blockchainExecutor *blockchain.BlockchainExecutor
		dappServer         *blockchain.DAppAPIServer
	)

	// 检查是否有启用的区块链网络
	hasEnabledNetwork := false
	for _, network := range cfg.Blockchain.Networks {
		if network.Enabled {
			hasEnabledNetwork = true
			break
		}
	}

	if hasEnabledNetwork {
		logrus.Info("初始化区块链组件...")

		var err error
		blockchainMarket, err = blockchain.NewBlockchainMarketDataService(cfg)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"error":  err,
				"module": "blockchainMarket",
			}).Fatal("初始化区块链市场数据服务失败")
		}

		blockchainExecutor, err = blockchain.NewBlockchainExecutor(cfg, riskManager)
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"error":  err,
				"module": "blockchainExecutor",
			}).Fatal("初始化区块链交易执行器失败")
		}

		dappServer = blockchain.NewDAppAPIServer(cfg, blockchainExecutor, blockchainMarket, llmController)
	} else {
		logrus.Info("区块链组件已禁用")
		dappServer = blockchain.NewDAppAPIServer(cfg, nil, nil, llmController)
	}

	// 注册Prometheus指标端点
	err = dappServer.RegisterMetricsHandler(promhttp.HandlerFor(
		prometheusRegistry,
		promhttp.HandlerOpts{EnableOpenMetrics: true},
	))
	if err != nil {
		logrus.WithError(err).Fatal("注册监控指标端点失败")
	}

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
