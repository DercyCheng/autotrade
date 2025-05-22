package execution

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/dercyc/autotransaction/config"
	"github.com/dercyc/autotransaction/internal/risk"
	"github.com/dercyc/autotransaction/internal/strategy"
	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// Order 表示交易订单
type Order struct {
	ID        string
	Symbol    string
	Direction string // "buy" 或 "sell"
	Price     decimal.Decimal
	Quantity  decimal.Decimal
	Status    string // "pending", "filled", "canceled", "rejected"
	Timestamp time.Time
}

// Position 表示持仓
type Position struct {
	Symbol       string
	Quantity     decimal.Decimal
	EntryPrice   decimal.Decimal
	CurrentPrice decimal.Decimal
	Timestamp    time.Time
}

// Executor 负责执行交易
type Executor struct {
	cfg         *config.Config
	riskManager *risk.RiskManager
	positions   map[string]Position
	orders      map[string]Order
	mutex       sync.RWMutex
	ctx         context.Context
	cancel      context.CancelFunc
}

// NewExecutor 创建一个新的交易执行器
func NewExecutor(cfg *config.Config, riskManager *risk.RiskManager) *Executor {
	ctx, cancel := context.WithCancel(context.Background())
	return &Executor{
		cfg:         cfg,
		riskManager: riskManager,
		positions:   make(map[string]Position),
		orders:      make(map[string]Order),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start 启动交易执行器
func (e *Executor) Start() error {
	logrus.Info("启动交易执行器")

	// 注册为策略信号的处理器
	// 注意：这里需要在外部将Executor注册到StrategyManager

	// 启动订单状态更新协程
	go e.updateOrderStatus()

	return nil
}

// Stop 停止交易执行器
func (e *Executor) Stop() {
	logrus.Info("停止交易执行器")
	e.cancel()
}

// HandleSignal 实现 strategy.SignalHandler 接口
func (e *Executor) HandleSignal(signal strategy.Signal) {
	// 检查风险控制
	if !e.riskManager.CheckSignal(signal) {
		logrus.Warnf("信号 %s %s 未通过风险检查，已拒绝", signal.Symbol, signal.Direction)
		return
	}

	// 创建订单
	order := Order{
		ID:        generateOrderID(),
		Symbol:    signal.Symbol,
		Direction: signal.Direction,
		Price:     signal.Price,
		Quantity:  signal.Quantity,
		Status:    "pending",
		Timestamp: time.Now(),
	}

	// 执行订单
	e.executeOrder(order)
}

// executeOrder 执行订单
func (e *Executor) executeOrder(order Order) {
	// 在实际应用中，这里应该调用交易所API执行订单
	logrus.Infof("执行订单: %s %s %s 价格: %s 数量: %s",
		order.ID, order.Symbol, order.Direction, order.Price.String(), order.Quantity.String())

	// 模拟订单执行
	order.Status = "filled"

	// 更新订单状态
	e.mutex.Lock()
	e.orders[order.ID] = order
	e.mutex.Unlock()

	// 更新持仓
	e.updatePosition(order)
}

// updatePosition 更新持仓信息
func (e *Executor) updatePosition(order Order) {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	position, exists := e.positions[order.Symbol]

	if order.Direction == "buy" {
		if !exists {
			// 新建仓位
			position = Position{
				Symbol:       order.Symbol,
				Quantity:     order.Quantity,
				EntryPrice:   order.Price,
				CurrentPrice: order.Price,
				Timestamp:    time.Now(),
			}
		} else {
			// 增加仓位
			totalValue := position.EntryPrice.Mul(position.Quantity).Add(order.Price.Mul(order.Quantity))
			newQuantity := position.Quantity.Add(order.Quantity)

			position.EntryPrice = totalValue.Div(newQuantity)
			position.Quantity = newQuantity
			position.CurrentPrice = order.Price
			position.Timestamp = time.Now()
		}
	} else if order.Direction == "sell" {
		if !exists {
			logrus.Warnf("尝试卖出不存在的仓位: %s", order.Symbol)
			return
		}

		// 减少仓位
		newQuantity := position.Quantity.Sub(order.Quantity)

		if newQuantity.LessThanOrEqual(decimal.Zero) {
			// 清仓
			delete(e.positions, order.Symbol)
			logrus.Infof("已清仓: %s", order.Symbol)
		} else {
			// 部分减仓
			position.Quantity = newQuantity
			position.CurrentPrice = order.Price
			position.Timestamp = time.Now()
			e.positions[order.Symbol] = position
		}
	}

	if exists && position.Quantity.GreaterThan(decimal.Zero) {
		e.positions[order.Symbol] = position
	}

	// 通知风险管理器更新持仓信息
	riskPosition := risk.Position{
		Symbol:       position.Symbol,
		Quantity:     position.Quantity,
		EntryPrice:   position.EntryPrice,
		CurrentPrice: position.CurrentPrice,
	}
	e.riskManager.UpdatePosition(riskPosition)
}

// updateOrderStatus 更新订单状态
func (e *Executor) updateOrderStatus() {
	ticker := time.NewTicker(time.Second * 5)
	defer ticker.Stop()

	for {
		select {
		case <-e.ctx.Done():
			return
		case <-ticker.C:
			// 在实际应用中，这里应该查询交易所API获取订单状态
			// 这里只是简单模拟
			e.mutex.RLock()
			pendingOrders := make([]Order, 0)
			for _, order := range e.orders {
				if order.Status == "pending" {
					pendingOrders = append(pendingOrders, order)
				}
			}
			e.mutex.RUnlock()

			// 更新挂起订单的状态
			for _, order := range pendingOrders {
				// 模拟订单成交
				order.Status = "filled"

				e.mutex.Lock()
				e.orders[order.ID] = order
				e.mutex.Unlock()

				// 更新持仓
				e.updatePosition(order)
			}
		}
	}
}

// GetPositions 获取当前所有持仓
func (e *Executor) GetPositions() map[string]Position {
	e.mutex.RLock()
	defer e.mutex.RUnlock()

	// 创建一个副本以避免并发问题
	result := make(map[string]Position)
	for k, v := range e.positions {
		result[k] = v
	}

	return result
}

// GetOrders 获取所有订单
func (e *Executor) GetOrders() map[string]Order {
	e.mutex.RLock()
	defer e.mutex.RUnlock()

	// 创建一个副本以避免并发问题
	result := make(map[string]Order)
	for k, v := range e.orders {
		result[k] = v
	}

	return result
}

// generateOrderID 生成订单ID
func generateOrderID() string {
	// 在实际应用中，应该生成唯一的订单ID
	return fmt.Sprintf("ORDER-%d", time.Now().UnixNano())
}
