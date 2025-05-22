package market

import (
	"context"
	"sync"
	"time"

	"github.com/dercyc/autotransaction/config"
	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// MarketData 表示市场数据的结构
type MarketData struct {
	Symbol    string
	Timestamp time.Time
	Open      decimal.Decimal
	High      decimal.Decimal
	Low       decimal.Decimal
	Close     decimal.Decimal
	Volume    decimal.Decimal
}

// DataHandler 是处理市场数据的接口
type DataHandler interface {
	HandleData(data MarketData)
}

// MarketDataService 负责获取和分发市场数据
type MarketDataService struct {
	cfg           *config.Config
	handlers      []DataHandler
	handlersMutex sync.RWMutex
	ctx           context.Context
	cancel        context.CancelFunc
	wg            sync.WaitGroup
}

// NewMarketDataService 创建一个新的市场数据服务
func NewMarketDataService(cfg *config.Config) *MarketDataService {
	ctx, cancel := context.WithCancel(context.Background())
	return &MarketDataService{
		cfg:      cfg,
		handlers: make([]DataHandler, 0),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start 启动市场数据服务
func (m *MarketDataService) Start() error {
	logrus.Info("启动市场数据服务")

	// 为每个交易对启动一个数据获取协程
	for _, pair := range m.cfg.Trading.Pairs {
		if !pair.Enabled {
			continue
		}

		m.wg.Add(1)
		go m.fetchDataForPair(pair.Symbol)
	}

	return nil
}

// Stop 停止市场数据服务
func (m *MarketDataService) Stop() {
	logrus.Info("停止市场数据服务")
	m.cancel()
	m.wg.Wait()
}

// RegisterHandler 注册一个数据处理器
func (m *MarketDataService) RegisterHandler(handler DataHandler) {
	m.handlersMutex.Lock()
	defer m.handlersMutex.Unlock()
	m.handlers = append(m.handlers, handler)
}

// fetchDataForPair 为特定交易对获取数据
func (m *MarketDataService) fetchDataForPair(symbol string) {
	defer m.wg.Done()

	logrus.Infof("开始获取 %s 的市场数据", symbol)

	ticker := time.NewTicker(time.Minute) // 每分钟获取一次数据
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			logrus.Infof("停止获取 %s 的市场数据", symbol)
			return
		case <-ticker.C:
			// 这里应该调用交易所API获取实际数据
			// 为了演示，我们生成模拟数据
			data := m.generateMockData(symbol)
			m.distributeData(data)
		}
	}
}

// distributeData 将数据分发给所有处理器
func (m *MarketDataService) distributeData(data MarketData) {
	m.handlersMutex.RLock()
	defer m.handlersMutex.RUnlock()

	for _, handler := range m.handlers {
		handler.HandleData(data)
	}
}

// generateMockData 生成模拟市场数据（仅用于演示）
func (m *MarketDataService) generateMockData(symbol string) MarketData {
	price := decimal.NewFromFloat(float64(time.Now().Unix() % 1000))
	return MarketData{
		Symbol:    symbol,
		Timestamp: time.Now(),
		Open:      price,
		High:      price.Add(decimal.NewFromFloat(10)),
		Low:       price.Sub(decimal.NewFromFloat(5)),
		Close:     price.Add(decimal.NewFromFloat(2)),
		Volume:    decimal.NewFromFloat(100000),
	}
}

// GetHistoricalData 获取历史数据
func (m *MarketDataService) GetHistoricalData(symbol string, interval string, limit int) ([]MarketData, error) {
	// 实际实现中应该调用交易所API获取历史数据
	// 这里返回模拟数据
	result := make([]MarketData, limit)

	baseTime := time.Now()
	for i := 0; i < limit; i++ {
		timePoint := baseTime.Add(-time.Duration(i) * time.Hour)
		price := decimal.NewFromFloat(float64(timePoint.Unix() % 1000))

		result[i] = MarketData{
			Symbol:    symbol,
			Timestamp: timePoint,
			Open:      price,
			High:      price.Add(decimal.NewFromFloat(10)),
			Low:       price.Sub(decimal.NewFromFloat(5)),
			Close:     price.Add(decimal.NewFromFloat(2)),
			Volume:    decimal.NewFromFloat(100000),
		}
	}

	return result, nil
}
