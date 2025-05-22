package blockchain

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"autotransaction/config"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

// DAppAPIServer 为前端DApp提供API服务
type DAppAPIServer struct {
	cfg           *config.Config
	executor      *BlockchainExecutor
	marketService *BlockchainMarketDataService
	llmController *LLMController
	router        *gin.Engine
	clients       map[*websocket.Conn]bool
	clientsMutex  sync.RWMutex
	upgrader      websocket.Upgrader
	ctx           context.Context
	cancel        context.CancelFunc
}

// NewDAppAPIServer 创建一个新的DApp API服务器
func NewDAppAPIServer(cfg *config.Config, executor *BlockchainExecutor, marketService *BlockchainMarketDataService, llmController *LLMController) *DAppAPIServer {
	ctx, cancel := context.WithCancel(context.Background())
	router := gin.Default()

	// 设置CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	server := &DAppAPIServer{
		cfg:           cfg,
		executor:      executor,
		marketService: marketService,
		llmController: llmController,
		router:        router,
		clients:       make(map[*websocket.Conn]bool),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // 允许所有来源
			},
		},
		ctx:    ctx,
		cancel: cancel,
	}

	// 设置路由
	server.setupRoutes()

	return server
}

// Start 启动API服务器
func (s *DAppAPIServer) Start() error {
	go s.broadcastUpdates()

	port := s.cfg.System.DAppPort
	if port == 0 {
		port = 3000 // 默认端口
	}

	logrus.Infof("DApp API服务器开始监听在 :%d", port)
	return s.router.Run(fmt.Sprintf(":%d", port))
}

// Stop 停止API服务器
func (s *DAppAPIServer) Stop() {
	s.cancel()

	// 关闭所有WebSocket连接
	s.clientsMutex.Lock()
	for client := range s.clients {
		client.Close()
	}
	s.clientsMutex.Unlock()

	logrus.Info("DApp API服务器已停止")
}

// setupRoutes 设置API路由
func (s *DAppAPIServer) setupRoutes() {
	// WebSocket端点
	s.router.GET("/ws", s.handleWebSocket)

	// API端点
	api := s.router.Group("/api")
	{
		// 市场数据
		api.GET("/markets", s.getMarketData)

		// 策略
		strategies := api.Group("/strategies")
		{
			strategies.GET("", s.getStrategies)
			strategies.GET("/:id", s.getStrategy)
			strategies.POST("", s.createStrategy)
			strategies.PUT("/:id", s.updateStrategy)
			strategies.DELETE("/:id", s.deleteStrategy)
			strategies.PUT("/:id/toggle", s.toggleStrategy)
		}

		// 交易
		trades := api.Group("/trades")
		{
			trades.GET("", s.getTrades)
			trades.GET("/:id", s.getTrade)
			trades.POST("", s.executeTrade)
			trades.PUT("/:id/cancel", s.cancelTrade)
		}

		// 持仓
		api.GET("/positions", s.getPositions)

		// 系统状态
		api.GET("/status", s.getSystemStatus)

		// LLM 相关的端点
		llm := api.Group("/llm")
		{
			llm.GET("/market-analysis", s.llmController.AnalyzeMarket)
			llm.POST("/optimize-strategy/:id", s.llmController.OptimizeStrategy)
			llm.POST("/trading-recommendations", s.llmController.GetTradingRecommendations)
			llm.POST("/ask", s.llmController.AnswerQuestion)
			llm.GET("/news-sentiment", s.llmController.AnalyzeNewsSentiment)
			llm.GET("/explain-trade/:id", s.llmController.ExplainTrade)
			llm.POST("/portfolio-risk", s.llmController.AnalyzePortfolioRisk)
			llm.GET("/market-summary", s.llmController.GetMarketSummary)

			// 新增的LLM端点
			llm.GET("/trade-suggestions", s.llmController.GetTradeSuggestions)
			llm.GET("/market-sentiment", s.llmController.GetMarketSentiment)
			llm.POST("/strategy-recommendations", s.llmController.GetStrategyRecommendations)
			llm.GET("/explain-market-movements", s.llmController.ExplainMarketMovements)
			llm.GET("/portfolio-summary", s.llmController.GetPortfolioSummary)
			llm.GET("/news-analysis", s.llmController.GetNewsAnalysis)
		}
	}
}

// handleWebSocket 处理WebSocket连接
func (s *DAppAPIServer) handleWebSocket(c *gin.Context) {
	ws, err := s.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logrus.Errorf("升级WebSocket连接失败: %v", err)
		return
	}

	// 注册新客户端
	s.clientsMutex.Lock()
	s.clients[ws] = true
	s.clientsMutex.Unlock()

	logrus.Infof("新的WebSocket客户端已连接: %s", ws.RemoteAddr())

	// 处理断开连接
	defer func() {
		s.clientsMutex.Lock()
		delete(s.clients, ws)
		s.clientsMutex.Unlock()
		ws.Close()
		logrus.Infof("WebSocket客户端已断开连接: %s", ws.RemoteAddr())
	}()

	// 处理来自客户端的消息
	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			logrus.Debugf("读取WebSocket消息失败: %v", err)
			break
		}

		logrus.Debugf("收到WebSocket消息: %s", string(message))

		// 这里可以处理客户端发来的消息
		// 例如可以解析JSON命令并执行相应操作
	}
}

// broadcastUpdates 定期向所有WebSocket客户端广播更新
func (s *DAppAPIServer) broadcastUpdates() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			// 获取最新数据
			update := map[string]interface{}{
				"type":       "marketUpdate",
				"timestamp":  time.Now().Unix(),
				"marketData": s.getLatestMarketData(),
			}

			data, err := json.Marshal(update)
			if err != nil {
				logrus.Errorf("序列化市场数据更新失败: %v", err)
				continue
			}

			// 广播给所有客户端
			s.clientsMutex.RLock()
			for client := range s.clients {
				err := client.WriteMessage(websocket.TextMessage, data)
				if err != nil {
					logrus.Debugf("向WebSocket客户端发送消息失败: %v", err)
					client.Close()
					delete(s.clients, client)
				}
			}
			s.clientsMutex.RUnlock()
		}
	}
}

// getLatestMarketData 获取最新的市场数据
func (s *DAppAPIServer) getLatestMarketData() []map[string]interface{} {
	// 这里应该从marketService获取最新的市场数据
	// 示例数据
	return []map[string]interface{}{
		{
			"pair":      "BTC/USDT",
			"price":     68432.21,
			"change24h": 2.34,
		},
		{
			"pair":      "ETH/USDT",
			"price":     4532.67,
			"change24h": -1.12,
		},
	}
}

// API端点处理函数

func (s *DAppAPIServer) getMarketData(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"data": s.getLatestMarketData(),
	})
}

func (s *DAppAPIServer) getStrategies(c *gin.Context) {
	// 实现获取所有策略的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": []map[string]interface{}{
			{
				"id":          1,
				"name":        "Moving Average Crossover",
				"description": "Trades based on MA crossovers",
				"status":      true,
			},
		},
	})
}

func (s *DAppAPIServer) getStrategy(c *gin.Context) {
	id := c.Param("id")
	// 实现获取特定策略的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":          id,
			"name":        "Moving Average Crossover",
			"description": "Trades based on MA crossovers",
			"status":      true,
			"params": map[string]interface{}{
				"shortPeriod": 5,
				"longPeriod":  20,
				"interval":    "1h",
			},
		},
	})
}

func (s *DAppAPIServer) createStrategy(c *gin.Context) {
	var strategy map[string]interface{}
	if err := c.BindJSON(&strategy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 实现创建策略的逻辑
	c.JSON(http.StatusCreated, gin.H{
		"data": map[string]interface{}{
			"id":      999, // 使用一个示例ID
			"message": "Strategy created successfully",
		},
	})
}

func (s *DAppAPIServer) updateStrategy(c *gin.Context) {
	id := c.Param("id")
	var strategy map[string]interface{}
	if err := c.BindJSON(&strategy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 实现更新策略的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":      id,
			"message": "Strategy updated successfully",
		},
	})
}

func (s *DAppAPIServer) deleteStrategy(c *gin.Context) {
	id := c.Param("id")

	// 实现删除策略的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":      id,
			"message": "Strategy deleted successfully",
		},
	})
}

func (s *DAppAPIServer) toggleStrategy(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status bool `json:"status"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 实现开启/关闭策略的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":      id,
			"status":  body.Status,
			"message": "Strategy status updated successfully",
		},
	})
}

func (s *DAppAPIServer) getTrades(c *gin.Context) {
	// 实现获取所有交易的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": []map[string]interface{}{
			{
				"id":        1,
				"pair":      "BTC/USDT",
				"type":      "buy",
				"amount":    0.5,
				"price":     68432.21,
				"timestamp": time.Now().Add(-2 * time.Hour).Unix(),
				"status":    "completed",
			},
		},
	})
}

func (s *DAppAPIServer) getTrade(c *gin.Context) {
	id := c.Param("id")
	// 实现获取特定交易的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":        id,
			"pair":      "BTC/USDT",
			"type":      "buy",
			"amount":    0.5,
			"price":     68432.21,
			"timestamp": time.Now().Add(-2 * time.Hour).Unix(),
			"status":    "completed",
		},
	})
}

func (s *DAppAPIServer) executeTrade(c *gin.Context) {
	var trade map[string]interface{}
	if err := c.BindJSON(&trade); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 实现执行交易的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":      999, // 使用一个示例ID
			"message": "Trade executed successfully",
		},
	})
}

func (s *DAppAPIServer) cancelTrade(c *gin.Context) {
	id := c.Param("id")

	// 实现取消交易的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"id":      id,
			"message": "Trade cancelled successfully",
		},
	})
}

func (s *DAppAPIServer) getPositions(c *gin.Context) {
	// 实现获取所有持仓的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": []map[string]interface{}{
			{
				"id":           1,
				"asset":        "BTC",
				"pair":         "BTC/USDT",
				"amount":       0.15,
				"entryPrice":   64532.78,
				"currentPrice": 68432.21,
				"value":        10264.83,
				"profitLoss":   585.90,
			},
		},
	})
}

func (s *DAppAPIServer) getSystemStatus(c *gin.Context) {
	// 实现获取系统状态的逻辑
	c.JSON(http.StatusOK, gin.H{
		"data": map[string]interface{}{
			"status":       "running",
			"uptime":       12345, // 秒
			"version":      "1.0.0",
			"strategies":   3,
			"activeTrades": 2,
			"performance": map[string]interface{}{
				"daily":   2.34,
				"weekly":  5.67,
				"monthly": 12.45,
			},
		},
	})
}

// RegisterMetricsHandler 注册Prometheus指标处理器
func (s *DAppAPIServer) RegisterMetricsHandler(handler http.Handler) error {
	// 添加指标路由
	s.router.GET("/metrics", func(c *gin.Context) {
		handler.ServeHTTP(c.Writer, c.Request)
	})

	logrus.Info("Prometheus指标端点已注册在 /metrics")
	return nil
}
