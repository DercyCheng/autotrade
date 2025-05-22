package risk

import (
	"sync"

	"autotransaction/config"
	"autotransaction/internal/strategy"

	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// Position 表示持仓信息
type Position struct {
	Symbol       string
	Quantity     decimal.Decimal
	EntryPrice   decimal.Decimal
	CurrentPrice decimal.Decimal
}

// RiskManager 负责风险管理
type RiskManager struct {
	cfg       *config.Config
	positions map[string]Position
	mutex     sync.RWMutex
}

// NewRiskManager 创建一个新的风险管理器
func NewRiskManager(cfg *config.Config) *RiskManager {
	return &RiskManager{
		cfg:       cfg,
		positions: make(map[string]Position),
	}
}

// CheckSignal 检查交易信号是否符合风险控制要求
func (rm *RiskManager) CheckSignal(signal strategy.Signal) bool {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	// 检查最大持仓数量
	if signal.Direction == "buy" {
		// 如果是买入信号，检查当前持仓数量是否已达到最大值
		if len(rm.positions) >= rm.cfg.Risk.MaxOpenPositions {
			logrus.Warnf("达到最大持仓数量限制 (%d)，拒绝买入信号", rm.cfg.Risk.MaxOpenPositions)
			return false
		}
	}

	// 检查单个交易对的最大仓位比例
	if signal.Direction == "buy" {
		// 在实际应用中，这里应该检查账户余额，确保不超过最大仓位比例
		// 这里简化处理，假设每个交易对的仓位不超过配置的最大值
		position, exists := rm.positions[signal.Symbol]
		if exists {
			// 如果已有仓位，检查增加后是否超过限制
			// 这里需要根据实际情况计算仓位比例
			// 简化处理，假设数量直接对应比例
			newQuantity := position.Quantity.Add(signal.Quantity)
			maxAllowed := decimal.NewFromFloat(rm.cfg.Risk.MaxPositionSize)

			if newQuantity.GreaterThan(maxAllowed) {
				logrus.Warnf("超过最大仓位比例限制 (%f)，拒绝买入信号", rm.cfg.Risk.MaxPositionSize)
				return false
			}
		}
	}

	// 如果是卖出信号，检查是否有足够的持仓
	if signal.Direction == "sell" {
		position, exists := rm.positions[signal.Symbol]
		if !exists || position.Quantity.LessThan(signal.Quantity) {
			logrus.Warnf("没有足够的持仓，拒绝卖出信号")
			return false
		}
	}

	return true
}

// UpdatePosition 更新持仓信息
func (rm *RiskManager) UpdatePosition(position Position) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	if position.Quantity.LessThanOrEqual(decimal.Zero) {
		// 如果数量为0或负数，删除该持仓
		delete(rm.positions, position.Symbol)
	} else {
		// 更新持仓信息
		rm.positions[position.Symbol] = position
	}

	// 检查止损和止盈
	rm.checkStopLossAndTakeProfit(position)
}

// checkStopLossAndTakeProfit 检查是否触发止损或止盈
func (rm *RiskManager) checkStopLossAndTakeProfit(position Position) {
	// 如果没有持仓，直接返回
	if position.Quantity.LessThanOrEqual(decimal.Zero) {
		return
	}

	// 计算当前盈亏比例
	entryValue := position.EntryPrice.Mul(position.Quantity)
	currentValue := position.CurrentPrice.Mul(position.Quantity)
	profitLoss := currentValue.Sub(entryValue).Div(entryValue)

	// 检查止损
	stopLoss := decimal.NewFromFloat(-rm.cfg.Risk.StopLoss)
	if profitLoss.LessThanOrEqual(stopLoss) {
		logrus.Warnf("%s 触发止损，当前亏损: %s%%", position.Symbol, profitLoss.Mul(decimal.NewFromInt(100)).String())
		// 在实际应用中，这里应该触发卖出操作
		// 由于这是示例，我们只记录日志
	}

	// 检查止盈
	takeProfit := decimal.NewFromFloat(rm.cfg.Risk.TakeProfit)
	if profitLoss.GreaterThanOrEqual(takeProfit) {
		logrus.Infof("%s 触发止盈，当前盈利: %s%%", position.Symbol, profitLoss.Mul(decimal.NewFromInt(100)).String())
		// 在实际应用中，这里应该触发卖出操作
		// 由于这是示例，我们只记录日志
	}
}

// GetPositions 获取当前所有持仓
func (rm *RiskManager) GetPositions() map[string]Position {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	// 创建一个副本以避免并发问题
	result := make(map[string]Position)
	for k, v := range rm.positions {
		result[k] = v
	}

	return result
}
