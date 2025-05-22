package strategy

import (
	"fmt"
	"strconv"

	"github.com/dercyc/autotransaction/config"
	"github.com/dercyc/autotransaction/internal/market"
	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// MovingAverageCrossover 实现了移动平均线交叉策略
type MovingAverageCrossover struct {
	cfg           *config.Config
	marketData    *market.MarketDataService
	shortPeriod   int
	longPeriod    int
	interval      string
	priceHistory  map[string][]decimal.Decimal
	lastCrossover map[string]string // 记录上一次交叉方向: "up" 或 "down"
}

// NewMovingAverageCrossover 创建一个新的移动平均线交叉策略
func NewMovingAverageCrossover(cfg *config.Config, marketData *market.MarketDataService) *MovingAverageCrossover {
	// 从配置中获取参数
	shortPeriod, _ := strconv.Atoi(fmt.Sprintf("%v", cfg.Strategy.Params["short_period"]))
	longPeriod, _ := strconv.Atoi(fmt.Sprintf("%v", cfg.Strategy.Params["long_period"]))
	interval := fmt.Sprintf("%v", cfg.Strategy.Params["interval"])

	return &MovingAverageCrossover{
		cfg:           cfg,
		marketData:    marketData,
		shortPeriod:   shortPeriod,
		longPeriod:    longPeriod,
		interval:      interval,
		priceHistory:  make(map[string][]decimal.Decimal),
		lastCrossover: make(map[string]string),
	}
}

// Name 返回策略名称
func (ma *MovingAverageCrossover) Name() string {
	return "moving_average_crossover"
}

// Init 初始化策略
func (ma *MovingAverageCrossover) Init() error {
	logrus.Infof("初始化移动平均线交叉策略 (短期: %d, 长期: %d, 间隔: %s)",
		ma.shortPeriod, ma.longPeriod, ma.interval)

	// 为每个交易对加载历史数据
	for _, pair := range ma.cfg.Trading.Pairs {
		if !pair.Enabled {
			continue
		}

		// 获取足够长的历史数据以计算移动平均线
		histData, err := ma.marketData.GetHistoricalData(
			pair.Symbol, ma.interval, ma.longPeriod+10)
		if err != nil {
			return fmt.Errorf("获取 %s 的历史数据失败: %v", pair.Symbol, err)
		}

		// 提取收盘价
		prices := make([]decimal.Decimal, len(histData))
		for i, data := range histData {
			prices[i] = data.Close
		}

		ma.priceHistory[pair.Symbol] = prices

		// 计算初始交叉状态
		if len(prices) >= ma.longPeriod {
			shortMA := calculateMA(prices, ma.shortPeriod)
			longMA := calculateMA(prices, ma.longPeriod)

			if shortMA.GreaterThan(longMA) {
				ma.lastCrossover[pair.Symbol] = "up"
			} else {
				ma.lastCrossover[pair.Symbol] = "down"
			}
		}
	}

	return nil
}

// Process 处理新的市场数据
func (ma *MovingAverageCrossover) Process(data market.MarketData) ([]Signal, error) {
	// 更新价格历史
	prices, ok := ma.priceHistory[data.Symbol]
	if !ok {
		prices = make([]decimal.Decimal, 0)
	}

	// 添加新价格并保持数组长度
	prices = append(prices, data.Close)
	if len(prices) > ma.longPeriod+10 {
		prices = prices[1:]
	}
	ma.priceHistory[data.Symbol] = prices

	// 如果没有足够的数据来计算移动平均线，则返回空信号
	if len(prices) < ma.longPeriod {
		return []Signal{}, nil
	}

	// 计算短期和长期移动平均线
	shortMA := calculateMA(prices, ma.shortPeriod)
	longMA := calculateMA(prices, ma.longPeriod)

	// 检查是否发生交叉
	currentCross := ""
	if shortMA.GreaterThan(longMA) {
		currentCross = "up"
	} else {
		currentCross = "down"
	}

	// 如果交叉方向改变，生成交易信号
	lastCross, ok := ma.lastCrossover[data.Symbol]
	if ok && lastCross != currentCross {
		ma.lastCrossover[data.Symbol] = currentCross

		// 生成信号
		if currentCross == "up" {
			// 短期均线上穿长期均线，买入信号
			return []Signal{
				{
					Symbol:    data.Symbol,
					Direction: "buy",
					Price:     data.Close,
					Quantity:  calculateQuantity(data.Symbol, ma.cfg),
					Timestamp: data.Timestamp.Unix(),
				},
			}, nil
		} else {
			// 短期均线下穿长期均线，卖出信号
			return []Signal{
				{
					Symbol:    data.Symbol,
					Direction: "sell",
					Price:     data.Close,
					Quantity:  calculateQuantity(data.Symbol, ma.cfg),
					Timestamp: data.Timestamp.Unix(),
				},
			}, nil
		}
	}

	// 没有交叉发生，返回空信号
	return []Signal{}, nil
}

// calculateMA 计算移动平均线
func calculateMA(prices []decimal.Decimal, period int) decimal.Decimal {
	if len(prices) < period {
		return decimal.Zero
	}

	sum := decimal.Zero
	for i := len(prices) - period; i < len(prices); i++ {
		sum = sum.Add(prices[i])
	}

	return sum.Div(decimal.NewFromInt(int64(period)))
}

// calculateQuantity 计算交易数量
func calculateQuantity(symbol string, cfg *config.Config) decimal.Decimal {
	// 在实际应用中，这里应该根据账户余额和风险设置计算交易数量
	// 这里简单返回一个固定值作为示例
	return decimal.NewFromFloat(0.1)
}
