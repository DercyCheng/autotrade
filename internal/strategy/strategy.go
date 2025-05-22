package strategy

import (
	"context"
	"fmt"
	"sync"

	"autotransaction/config"
	"autotransaction/internal/market"

	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// Signal 表示交易信号
type Signal struct {
	Symbol    string
	Direction string // "buy" 或 "sell"
	Price     decimal.Decimal
	Quantity  decimal.Decimal
	Timestamp int64
}

// Strategy 是交易策略的接口
type Strategy interface {
	Init() error
	Process(data market.MarketData) ([]Signal, error)
	Name() string
}

// SignalHandler 是处理交易信号的接口
type SignalHandler interface {
	HandleSignal(signal Signal)
}

// StrategyManager 管理所有交易策略
type StrategyManager struct {
	cfg            *config.Config
	marketData     *market.MarketDataService
	strategies     map[string]Strategy
	signalHandlers []SignalHandler
	handlersMutex  sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
}

// NewStrategyManager 创建一个新的策略管理器
func NewStrategyManager(cfg *config.Config, marketData *market.MarketDataService) *StrategyManager {
	ctx, cancel := context.WithCancel(context.Background())
	return &StrategyManager{
		cfg:            cfg,
		marketData:     marketData,
		strategies:     make(map[string]Strategy),
		signalHandlers: make([]SignalHandler, 0),
		ctx:            ctx,
		cancel:         cancel,
	}
}

// Start 启动策略管理器
func (sm *StrategyManager) Start() error {
	logrus.Info("启动策略管理器")

	// 创建并初始化策略
	strategy, err := sm.createStrategy(sm.cfg.Strategy.Name)
	if err != nil {
		return fmt.Errorf("创建策略失败: %v", err)
	}

	err = strategy.Init()
	if err != nil {
		return fmt.Errorf("初始化策略失败: %v", err)
	}

	sm.strategies[strategy.Name()] = strategy

	// 注册为市场数据的处理器
	sm.marketData.RegisterHandler(sm)

	return nil
}

// Stop 停止策略管理器
func (sm *StrategyManager) Stop() {
	logrus.Info("停止策略管理器")
	sm.cancel()
}

// RegisterSignalHandler 注册一个信号处理器
func (sm *StrategyManager) RegisterSignalHandler(handler SignalHandler) {
	sm.handlersMutex.Lock()
	defer sm.handlersMutex.Unlock()
	sm.signalHandlers = append(sm.signalHandlers, handler)
}

// HandleData 实现 market.DataHandler 接口
func (sm *StrategyManager) HandleData(data market.MarketData) {
	// 将市场数据传递给每个策略处理
	for _, strategy := range sm.strategies {
		signals, err := strategy.Process(data)
		if err != nil {
			logrus.Errorf("策略 %s 处理数据失败: %v", strategy.Name(), err)
			continue
		}

		// 分发生成的信号
		for _, signal := range signals {
			sm.distributeSignal(signal)
		}
	}
}

// distributeSignal 将信号分发给所有处理器
func (sm *StrategyManager) distributeSignal(signal Signal) {
	sm.handlersMutex.RLock()
	defer sm.handlersMutex.RUnlock()

	logrus.Infof("生成交易信号: %s %s 价格: %s 数量: %s",
		signal.Symbol, signal.Direction, signal.Price.String(), signal.Quantity.String())

	for _, handler := range sm.signalHandlers {
		handler.HandleSignal(signal)
	}
}

// createStrategy 根据策略名称创建相应的策略实例
func (sm *StrategyManager) createStrategy(name string) (Strategy, error) {
	switch name {
	case "moving_average_crossover":
		return NewMovingAverageCrossover(sm.cfg, sm.marketData), nil
	default:
		return nil, fmt.Errorf("未知的策略: %s", name)
	}
}
