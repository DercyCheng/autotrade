package blockchain

import (
	"context"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/dercyc/autotransaction/config"
	"github.com/dercyc/autotransaction/internal/market"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// BlockchainMarketDataService 从区块链获取市场数据
type BlockchainMarketDataService struct {
	cfg           *config.Config
	clients       map[string]*ethclient.Client // 每个网络一个客户端
	handlers      []market.DataHandler
	handlersMutex sync.RWMutex
	ctx           context.Context
	cancel        context.CancelFunc
	wg            sync.WaitGroup
}

// NewBlockchainMarketDataService 创建一个新的区块链市场数据服务
func NewBlockchainMarketDataService(cfg *config.Config) (*BlockchainMarketDataService, error) {
	ctx, cancel := context.WithCancel(context.Background())
	service := &BlockchainMarketDataService{
		cfg:      cfg,
		clients:  make(map[string]*ethclient.Client),
		handlers: make([]market.DataHandler, 0),
		ctx:      ctx,
		cancel:   cancel,
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

		service.clients[network.Name] = client
		logrus.Infof("已连接到区块链网络: %s", network.Name)
	}

	return service, nil
}

// Start 启动区块链市场数据服务
func (b *BlockchainMarketDataService) Start() error {
	logrus.Info("启动区块链市场数据服务")

	// 为每个区块链交易对启动一个数据获取协程
	for _, pair := range b.cfg.Trading.Pairs {
		if !pair.Enabled || pair.Blockchain == "" {
			continue
		}

		// 检查对应的区块链网络是否已连接
		if _, ok := b.clients[pair.Blockchain]; !ok {
			logrus.Warnf("交易对 %s 的区块链网络 %s 未连接，跳过", pair.Symbol, pair.Blockchain)
			continue
		}

		b.wg.Add(1)
		go b.fetchDataForPair(pair.Symbol, pair.Blockchain, pair.ContractAddress)
	}

	return nil
}

// Stop 停止区块链市场数据服务
func (b *BlockchainMarketDataService) Stop() {
	logrus.Info("停止区块链市场数据服务")
	b.cancel()
	b.wg.Wait()

	// 关闭所有客户端连接
	for name, client := range b.clients {
		client.Close()
		logrus.Infof("已断开与区块链网络 %s 的连接", name)
	}
}

// RegisterHandler 注册一个数据处理器
func (b *BlockchainMarketDataService) RegisterHandler(handler market.DataHandler) {
	b.handlersMutex.Lock()
	defer b.handlersMutex.Unlock()
	b.handlers = append(b.handlers, handler)
}

// fetchDataForPair 为特定交易对获取区块链数据
func (b *BlockchainMarketDataService) fetchDataForPair(symbol string, blockchain string, contractAddress string) {
	defer b.wg.Done()

	logrus.Infof("开始获取区块链 %s 上 %s 的市场数据", blockchain, symbol)

	// 获取对应的客户端
	client := b.clients[blockchain]
	contract := common.HexToAddress(contractAddress)

	ticker := time.NewTicker(time.Minute) // 每分钟获取一次数据
	defer ticker.Stop()

	for {
		select {
		case <-b.ctx.Done():
			logrus.Infof("停止获取区块链 %s 上 %s 的市场数据", blockchain, symbol)
			return
		case <-ticker.C:
			// 获取区块链上的价格数据
			// 这里是示例实现，实际中需要根据具体的DEX合约调用相应方法获取价格
			price, err := b.getTokenPrice(client, contract)
			if err != nil {
				logrus.Errorf("获取 %s 价格失败: %v", symbol, err)
				continue
			}

			// 创建市场数据并分发
			data := market.MarketData{
				Symbol:    symbol,
				Timestamp: time.Now(),
				Open:      price,
				High:      price,
				Low:       price,
				Close:     price,
				Volume:    decimal.NewFromInt(0), // 区块链上难以准确获取交易量
			}

			b.distributeData(data)
		}
	}
}

// distributeData 将数据分发给所有处理器
func (b *BlockchainMarketDataService) distributeData(data market.MarketData) {
	b.handlersMutex.RLock()
	defer b.handlersMutex.RUnlock()

	for _, handler := range b.handlers {
		handler.HandleData(data)
	}
}

// getTokenPrice 从区块链获取代币价格（示例实现）
func (b *BlockchainMarketDataService) getTokenPrice(client *ethclient.Client, tokenAddress common.Address) (decimal.Decimal, error) {
	// 实际实现中，需要调用特定DEX的智能合约来获取价格
	// 这里为了示例，返回一个模拟价格

	// 获取最新区块
	blockNumber, err := client.BlockNumber(context.Background())
	if err != nil {
		return decimal.Zero, err
	}

	// 简单的模拟价格生成逻辑，使用区块号的最后3位
	price := decimal.NewFromBigInt(big.NewInt(int64(blockNumber%1000)), 0)
	return price, nil
}

// GetHistoricalData 获取区块链上的历史数据
func (b *BlockchainMarketDataService) GetHistoricalData(symbol string, blockchain string, interval string, limit int) ([]market.MarketData, error) {
	// 实际实现中，可能需要查询区块链上的历史事件来获取价格历史
	// 这里返回模拟数据

	result := make([]market.MarketData, limit)
	baseTime := time.Now()

	for i := 0; i < limit; i++ {
		timePoint := baseTime.Add(-time.Duration(i) * time.Hour)
		price := decimal.NewFromFloat(float64(timePoint.Unix() % 1000))

		result[i] = market.MarketData{
			Symbol:    symbol,
			Timestamp: timePoint,
			Open:      price,
			High:      price.Add(decimal.NewFromFloat(5)),
			Low:       price.Sub(decimal.NewFromFloat(5)),
			Close:     price,
			Volume:    decimal.NewFromFloat(10000),
		}
	}

	return result, nil
}
