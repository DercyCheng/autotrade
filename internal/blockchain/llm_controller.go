package blockchain

import (
	"net/http"
	"strconv"

	"autotransaction/internal/llm"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// LLMController 处理与LLM相关的API请求
type LLMController struct {
	llmService *llm.LLMService
}

// NewLLMController 创建一个新的LLM控制器
func NewLLMController(llmService *llm.LLMService) *LLMController {
	return &LLMController{
		llmService: llmService,
	}
}

// AnalyzeMarket 分析市场情况
func (c *LLMController) AnalyzeMarket(ctx *gin.Context) {
	// 从marketService获取当前市场数据
	marketData := c.getMarketData()

	// 调用LLM服务分析市场
	response, err := c.llmService.AnalyzeMarket(marketData)
	if err != nil {
		logrus.Errorf("LLM市场分析失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "分析市场失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// OptimizeStrategy 优化交易策略
func (c *LLMController) OptimizeStrategy(ctx *gin.Context) {
	// 获取策略ID
	strategyIDStr := ctx.Param("id")
	strategyID, err := strconv.ParseUint(strategyIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的策略ID",
		})
		return
	}

	// 获取策略数据
	strategyData := c.getStrategyData(uint(strategyID))

	// 调用LLM服务优化策略
	response, err := c.llmService.OptimizeStrategy(strategyData)
	if err != nil {
		logrus.Errorf("LLM策略优化失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "优化策略失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GetTradingRecommendations 获取交易建议
func (c *LLMController) GetTradingRecommendations(ctx *gin.Context) {
	// 从请求体获取用户偏好
	var userPreferences map[string]interface{}
	if err := ctx.BindJSON(&userPreferences); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的请求数据",
		})
		return
	}

	// 获取市场数据
	marketData := c.getMarketData()

	// 调用LLM服务获取交易建议
	response, err := c.llmService.GetTradingRecommendations(marketData, userPreferences)
	if err != nil {
		logrus.Errorf("获取LLM交易建议失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取交易建议失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// AnswerQuestion 回答用户问题
func (c *LLMController) AnswerQuestion(ctx *gin.Context) {
	// 从请求体获取问题
	var request struct {
		Question string                 `json:"question"`
		Context  map[string]interface{} `json:"context,omitempty"`
	}

	if err := ctx.BindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的请求数据",
		})
		return
	}

	// 调用LLM服务回答问题
	response, err := c.llmService.AnswerQuestion(request.Question, request.Context)
	if err != nil {
		logrus.Errorf("LLM回答问题失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "回答问题失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// AnalyzeNewsSentiment 分析新闻情感
func (c *LLMController) AnalyzeNewsSentiment(ctx *gin.Context) {
	// 获取最新的新闻文章
	newsArticles := c.getLatestNews()

	// 调用LLM服务分析新闻
	response, err := c.llmService.AnalyzeNews(newsArticles)
	if err != nil {
		logrus.Errorf("LLM新闻分析失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "分析新闻失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// ExplainTrade 解释交易
func (c *LLMController) ExplainTrade(ctx *gin.Context) {
	// 获取交易ID
	tradeIDStr := ctx.Param("id")
	tradeID, err := strconv.ParseUint(tradeIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的交易ID",
		})
		return
	}

	// 获取交易数据
	tradeData := c.getTradeData(uint(tradeID))

	// 调用LLM服务解释交易
	response, err := c.llmService.ExplainTrade(tradeData)
	if err != nil {
		logrus.Errorf("LLM解释交易失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "解释交易失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// AnalyzePortfolioRisk 分析投资组合风险
func (c *LLMController) AnalyzePortfolioRisk(ctx *gin.Context) {
	// 从请求体获取投资组合数据
	var portfolioData map[string]interface{}
	if err := ctx.BindJSON(&portfolioData); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "无效的请求数据",
		})
		return
	}

	// 调用LLM服务分析投资组合风险
	response, err := c.llmService.AnalyzePortfolioRisk(portfolioData)
	if err != nil {
		logrus.Errorf("LLM投资组合风险分析失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "分析投资组合风险失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GetMarketSummary 获取市场摘要
func (c *LLMController) GetMarketSummary(ctx *gin.Context) {
	// 获取市场数据
	marketData := c.getMarketData()

	// 调用LLM服务获取市场摘要
	response, err := c.llmService.GetMarketSummary(marketData)
	if err != nil {
		logrus.Errorf("LLM市场摘要获取失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取市场摘要失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// 辅助方法

// getMarketData 获取市场数据
func (c *LLMController) getMarketData() map[string]interface{} {
	// 示例数据，实际应用中应该从marketService获取
	return map[string]interface{}{
		"btcUsdt": map[string]interface{}{
			"price":     68432.21,
			"change24h": 2.34,
			"volume":    12345.67,
		},
		"ethUsdt": map[string]interface{}{
			"price":     4532.67,
			"change24h": -1.12,
			"volume":    54321.98,
		},
		// 其他市场数据
	}
}

// getStrategyData 获取策略数据
func (c *LLMController) getStrategyData(strategyID uint) map[string]interface{} {
	// 示例数据，实际应用中应该从数据库或策略管理器获取
	return map[string]interface{}{
		"id":   strategyID,
		"name": "Moving Average Crossover",
		"params": map[string]interface{}{
			"shortPeriod": 5,
			"longPeriod":  20,
			"interval":    "1h",
		},
		"performance": map[string]interface{}{
			"totalTrades": 42,
			"winRate":     68,
			"avgProfit":   2.4,
			"totalProfit": 13.5,
		},
		"history": []map[string]interface{}{
			{
				"timestamp": 1621500000,
				"action":    "buy",
				"price":     42000.0,
				"amount":    0.1,
			},
			{
				"timestamp": 1621600000,
				"action":    "sell",
				"price":     43500.0,
				"amount":    0.1,
			},
			// 更多历史数据
		},
	}
}

// getTradeData 获取交易数据
func (c *LLMController) getTradeData(tradeID uint) map[string]interface{} {
	// 示例数据，实际应用中应该从数据库或交易管理器获取
	return map[string]interface{}{
		"id":        tradeID,
		"pair":      "BTC/USDT",
		"type":      "buy",
		"amount":    0.5,
		"price":     68432.21,
		"timestamp": 1621500000,
		"status":    "completed",
		"strategy": map[string]interface{}{
			"id":   1,
			"name": "Moving Average Crossover",
		},
		"reason": "短期移动平均线上穿长期移动平均线，触发买入信号",
	}
}

// getLatestNews 获取最新新闻
func (c *LLMController) getLatestNews() []map[string]string {
	// 示例数据，实际应用中应该从新闻API或数据库获取
	return []map[string]string{
		{
			"title":   "比特币突破7万美元大关",
			"content": "今日比特币价格突破7万美元大关，创下历史新高。分析师认为，这一上涨趋势可能会持续，因为机构投资者继续增加对加密货币的配置...",
			"source":  "CoinDesk",
			"date":    "2023-05-21",
		},
		{
			"title":   "以太坊ETH2.0升级即将完成",
			"content": "以太坊开发团队宣布，ETH2.0的最终升级阶段即将完成，这将使网络更加高效、安全和可扩展...",
			"source":  "CryptoNews",
			"date":    "2023-05-20",
		},
		// 更多新闻
	}
}
