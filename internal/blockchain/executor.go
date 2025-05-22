package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"sync"
	"time"

	"autotransaction/config"
	"autotransaction/internal/risk"
	"autotransaction/internal/strategy"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// BlockchainOrder 表示区块链上的交易订单
type BlockchainOrder struct {
	ID           string
	Symbol       string
	Direction    string // "buy" 或 "sell"
	Price        decimal.Decimal
	Quantity     decimal.Decimal
	Status       string // "pending", "confirmed", "failed"
	Network      string
	TxHash       string
	BlockNumber  uint64
	ErrorMessage string
	Timestamp    time.Time
}

// BlockchainPosition 表示区块链上的持仓
type BlockchainPosition struct {
	Symbol       string
	Network      string
	TokenAddress string
	Quantity     decimal.Decimal
	EntryPrice   decimal.Decimal
	CurrentPrice decimal.Decimal
	Timestamp    time.Time
}

// BlockchainExecutor 负责在区块链上执行交易
type BlockchainExecutor struct {
	cfg         *config.Config
	riskManager *risk.RiskManager
	clients     map[string]*ethclient.Client // 每个网络一个客户端
	privateKey  *ecdsa.PrivateKey
	positions   map[string]BlockchainPosition
	orders      map[string]BlockchainOrder
	mutex       sync.RWMutex
	ctx         context.Context
	cancel      context.CancelFunc
}

// NewBlockchainExecutor 创建一个新的区块链交易执行器
func NewBlockchainExecutor(cfg *config.Config, riskManager *risk.RiskManager) (*BlockchainExecutor, error) {
	ctx, cancel := context.WithCancel(context.Background())

	// 解析私钥
	privateKey, err := crypto.HexToECDSA(cfg.Blockchain.Contracts.WalletPrivateKey)
	if err != nil {
		return nil, fmt.Errorf("解析私钥失败: %v", err)
	}

	executor := &BlockchainExecutor{
		cfg:         cfg,
		riskManager: riskManager,
		clients:     make(map[string]*ethclient.Client),
		privateKey:  privateKey,
		positions:   make(map[string]BlockchainPosition),
		orders:      make(map[string]BlockchainOrder),
		ctx:         ctx,
		cancel:      cancel,
	}

	// 初始化每个区块链网络的客户端
	for _, network := range cfg.Blockchain.Networks {
		if !network.Enabled {
			continue
		}

		client, err := ethclient.Dial(network.RPCURL)
		if err != nil {
			return nil, fmt.Errorf("连接到区块链网络 %s 失败: %v", network.Name, err)
		}

		executor.clients[network.Name] = client
		logrus.Infof("已连接到区块链网络: %s", network.Name)
	}

	return executor, nil
}

// Start 启动区块链交易执行器
func (b *BlockchainExecutor) Start() error {
	logrus.Info("启动区块链交易执行器")

	// 启动订单状态更新协程
	go b.updateOrderStatus()

	return nil
}

// Stop 停止区块链交易执行器
func (b *BlockchainExecutor) Stop() {
	logrus.Info("停止区块链交易执行器")
	b.cancel()

	// 关闭所有客户端连接
	for name, client := range b.clients {
		client.Close()
		logrus.Infof("已断开与区块链网络 %s 的连接", name)
	}
}

// HandleSignal 实现 strategy.SignalHandler 接口
func (b *BlockchainExecutor) HandleSignal(signal strategy.Signal) {
	// 检查该交易对是否配置为区块链交易
	var blockchain, contractAddress string

	for _, pair := range b.cfg.Trading.Pairs {
		if pair.Symbol == signal.Symbol && pair.Blockchain != "" {
			blockchain = pair.Blockchain
			contractAddress = pair.ContractAddress
			break
		}
	}

	if blockchain == "" {
		// 不是区块链交易对，忽略
		return
	}

	// 检查风险控制
	if !b.riskManager.CheckSignal(signal) {
		logrus.Warnf("区块链信号 %s %s 未通过风险检查，已拒绝", signal.Symbol, signal.Direction)
		return
	}

	// 创建订单
	order := BlockchainOrder{
		ID:        generateBlockchainOrderID(),
		Symbol:    signal.Symbol,
		Direction: signal.Direction,
		Price:     signal.Price,
		Quantity:  signal.Quantity,
		Status:    "pending",
		Network:   blockchain,
		Timestamp: time.Now(),
	}

	// 执行区块链订单
	b.executeBlockchainOrder(order, contractAddress)
}

// executeBlockchainOrder 执行区块链订单
func (b *BlockchainExecutor) executeBlockchainOrder(order BlockchainOrder, contractAddress string) {
	logrus.Infof("执行区块链订单: %s %s %s 价格: %s 数量: %s 网络: %s",
		order.ID, order.Symbol, order.Direction, order.Price.String(), order.Quantity.String(), order.Network)

	// 获取对应的客户端
	client, ok := b.clients[order.Network]
	if !ok {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("未找到网络 %s 的客户端", order.Network)
		b.updateOrderInMap(order)
		return
	}

	// 获取当前账户地址
	publicKey := b.privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		order.Status = "failed"
		order.ErrorMessage = "无法转换公钥"
		b.updateOrderInMap(order)
		return
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// 获取网络ID和nonce
	networkID, err := client.NetworkID(context.Background())
	if err != nil {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("获取网络ID失败: %v", err)
		b.updateOrderInMap(order)
		return
	}

	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("获取nonce失败: %v", err)
		b.updateOrderInMap(order)
		return
	}

	// 获取gas价格
	gasPrice, err := b.getGasPrice(client, order.Network)
	if err != nil {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("获取gas价格失败: %v", err)
		b.updateOrderInMap(order)
		return
	}

	// 创建交易（实际实现中，需要调用特定DEX的智能合约函数）
	// 这里简化为发送以太币交易作为示例
	contractAddr := common.HexToAddress(contractAddress)

	// 根据交易方向构建交易数据
	var data []byte
	var value *big.Int

	// 实际实现中，这里需要根据具体DEX的ABI构建交易数据
	// 以下是示例代码，实际项目中需要替换
	if order.Direction == "buy" {
		// 买入操作
		// 示例：调用DEX合约的swap函数
		data = []byte("buyTokens") // 应替换为实际的合约调用数据
		value = big.NewInt(0)      // 如果需要发送ETH，这里设置数量
	} else {
		// 卖出操作
		data = []byte("sellTokens") // 应替换为实际的合约调用数据
		value = big.NewInt(0)
	}

	// 获取网络的gas限制
	var gasLimit uint64
	for _, network := range b.cfg.Blockchain.Networks {
		if network.Name == order.Network {
			gasLimit = uint64(network.GasLimit)
			break
		}
	}

	// 创建交易
	tx := types.NewTransaction(
		nonce,
		contractAddr,
		value,
		gasLimit,
		gasPrice,
		data,
	)

	// 签名交易
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(networkID), b.privateKey)
	if err != nil {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("签名交易失败: %v", err)
		b.updateOrderInMap(order)
		return
	}

	// 发送交易
	err = client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		order.Status = "failed"
		order.ErrorMessage = fmt.Sprintf("发送交易失败: %v", err)
		b.updateOrderInMap(order)
		return
	}

	// 更新订单状态
	order.TxHash = signedTx.Hash().Hex()
	order.Status = "pending"
	b.updateOrderInMap(order)

	logrus.Infof("区块链交易已提交: %s", order.TxHash)
}

// updateOrderStatus 更新订单状态
func (b *BlockchainExecutor) updateOrderStatus() {
	ticker := time.NewTicker(time.Second * 15)
	defer ticker.Stop()

	for {
		select {
		case <-b.ctx.Done():
			return
		case <-ticker.C:
			b.mutex.RLock()
			pendingOrders := make([]BlockchainOrder, 0)
			for _, order := range b.orders {
				if order.Status == "pending" {
					pendingOrders = append(pendingOrders, order)
				}
			}
			b.mutex.RUnlock()

			for _, order := range pendingOrders {
				client, ok := b.clients[order.Network]
				if !ok {
					continue
				}

				// 检查交易状态
				if order.TxHash == "" {
					continue
				}

				txHash := common.HexToHash(order.TxHash)
				receipt, err := client.TransactionReceipt(context.Background(), txHash)
				if err != nil {
					// 交易可能还未被打包
					continue
				}

				// 更新订单状态
				order.BlockNumber = receipt.BlockNumber.Uint64()

				if receipt.Status == 1 {
					// 交易成功
					order.Status = "confirmed"

					// 更新持仓
					b.updateBlockchainPosition(order)
				} else {
					// 交易失败
					order.Status = "failed"
					order.ErrorMessage = "交易执行失败"
				}

				b.updateOrderInMap(order)
			}
		}
	}
}

// updateOrderInMap 更新订单映射
func (b *BlockchainExecutor) updateOrderInMap(order BlockchainOrder) {
	b.mutex.Lock()
	defer b.mutex.Unlock()
	b.orders[order.ID] = order
}

// updateBlockchainPosition 更新区块链持仓信息
func (b *BlockchainExecutor) updateBlockchainPosition(order BlockchainOrder) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	key := fmt.Sprintf("%s-%s", order.Symbol, order.Network)
	position, exists := b.positions[key]

	if order.Direction == "buy" {
		if !exists {
			// 新建仓位
			position = BlockchainPosition{
				Symbol:       order.Symbol,
				Network:      order.Network,
				Quantity:     order.Quantity,
				EntryPrice:   order.Price,
				CurrentPrice: order.Price,
				Timestamp:    time.Now(),
			}
		} else {
			// 增加仓位
			totalValue := position.EntryPrice.Mul(position.Quantity).Add(order.Price.Mul(order.Quantity))
			newQuantity := position.Quantity.Add(order.Quantity)

			if newQuantity.IsPositive() {
				position.EntryPrice = totalValue.Div(newQuantity)
				position.Quantity = newQuantity
			}
			position.CurrentPrice = order.Price
			position.Timestamp = time.Now()
		}
	} else if order.Direction == "sell" {
		if !exists {
			logrus.Warnf("尝试卖出不存在的仓位: %s", key)
			return
		}

		// 减少仓位
		newQuantity := position.Quantity.Sub(order.Quantity)

		if newQuantity.LessThanOrEqual(decimal.Zero) {
			// 清仓
			delete(b.positions, key)
		} else {
			// 部分减仓
			position.Quantity = newQuantity
			position.CurrentPrice = order.Price
			position.Timestamp = time.Now()
			b.positions[key] = position
		}
	}

	if exists && position.Quantity.GreaterThan(decimal.Zero) {
		b.positions[key] = position
	}

	// 通知风险管理器更新持仓信息
	riskPosition := risk.Position{
		Symbol:       position.Symbol,
		Quantity:     position.Quantity,
		EntryPrice:   position.EntryPrice,
		CurrentPrice: position.CurrentPrice,
	}
	b.riskManager.UpdatePosition(riskPosition)
}

// getGasPrice 获取gas价格
func (b *BlockchainExecutor) getGasPrice(client *ethclient.Client, network string) (*big.Int, error) {
	// 查找网络配置
	var gasPrice string
	for _, net := range b.cfg.Blockchain.Networks {
		if net.Name == network {
			gasPrice = net.GasPrice
			break
		}
	}

	if gasPrice == "auto" {
		// 使用网络建议的gas价格
		return client.SuggestGasPrice(context.Background())
	}

	// 使用配置的固定gas价格
	// 假设格式为 "5gwei"
	// 实际实现应该解析单位，这里简化处理
	return big.NewInt(5000000000), nil
}

// GetBlockchainPositions 获取当前所有区块链持仓
func (b *BlockchainExecutor) GetBlockchainPositions() map[string]BlockchainPosition {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// 创建一个副本以避免并发问题
	result := make(map[string]BlockchainPosition)
	for k, v := range b.positions {
		result[k] = v
	}

	return result
}

// GetBlockchainOrders 获取所有区块链订单
func (b *BlockchainExecutor) GetBlockchainOrders() map[string]BlockchainOrder {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// 创建一个副本以避免并发问题
	result := make(map[string]BlockchainOrder)
	for k, v := range b.orders {
		result[k] = v
	}

	return result
}

// generateBlockchainOrderID 生成区块链订单ID
func generateBlockchainOrderID() string {
	return fmt.Sprintf("BLOCKCHAIN-ORDER-%d", time.Now().UnixNano())
}
