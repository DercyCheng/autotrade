package blockchain

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// GetTradeSuggestions 获取交易建议
func (c *LLMController) GetTradeSuggestions(ctx *gin.Context) {
	// 获取市场数据
	marketData := c.getMarketData()

	// 构建用户偏好
	userPreferences := map[string]interface{}{
		"risk_tolerance":     "medium", // 默认值
		"investment_horizon": "medium_term",
		"preferred_assets":   []string{"BTC", "ETH"},
	}

	// 调用LLM服务获取交易建议
	response, err := c.llmService.GetTradeSuggestions(marketData, userPreferences)
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

// GetMarketSentiment 获取市场情绪分析
func (c *LLMController) GetMarketSentiment(ctx *gin.Context) {
	// 获取市场数据
	marketData := c.getMarketData()

	// 获取新闻数据
	newsData := c.getLatestNews()

	// 调用LLM服务分析市场情绪
	response, err := c.llmService.AnalyzeMarketSentiment(marketData, newsData)
	if err != nil {
		logrus.Errorf("LLM市场情绪分析失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "分析市场情绪失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GetStrategyRecommendations 获取策略建议
func (c *LLMController) GetStrategyRecommendations(ctx *gin.Context) {
	// 从请求体获取用户偏好
	var userPreferences map[string]interface{}
	if err := ctx.BindJSON(&userPreferences); err != nil {
		// 如果请求体为空，使用默认值
		userPreferences = map[string]interface{}{
			"risk_tolerance":     "medium",
			"investment_horizon": "medium_term",
			"preferred_assets":   []string{"BTC", "ETH"},
		}
	}

	// 获取市场数据
	marketData := c.getMarketData()

	// 调用LLM服务获取策略建议
	response, err := c.llmService.GetStrategyRecommendations(userPreferences, marketData)
	if err != nil {
		logrus.Errorf("获取LLM策略建议失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取策略建议失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// ExplainMarketMovements 解释市场走势
func (c *LLMController) ExplainMarketMovements(ctx *gin.Context) {
	// 获取市场数据
	marketData := c.getMarketData()

	// 获取新闻数据
	newsData := c.getLatestNews()

	// 调用LLM服务解释市场走势
	response, err := c.llmService.ExplainMarketMovements(marketData, newsData)
	if err != nil {
		logrus.Errorf("LLM解释市场走势失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "解释市场走势失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GetPortfolioSummary 获取投资组合摘要
func (c *LLMController) GetPortfolioSummary(ctx *gin.Context) {
	// 获取投资组合数据
	portfolioData := map[string]interface{}{
		"assets": []map[string]interface{}{
			{
				"symbol": "BTC",
				"amount": 0.15,
				"value":  10264.83,
				"profit": 585.90,
			},
			{
				"symbol": "ETH",
				"amount": 2.5,
				"value":  11331.68,
				"profit": 331.68,
			},
		},
		"total_value":       21596.51,
		"total_profit":      917.58,
		"profit_percentage": 4.43,
	}

	// 调用LLM服务获取投资组合摘要
	response, err := c.llmService.GetPortfolioSummary(portfolioData)
	if err != nil {
		logrus.Errorf("LLM获取投资组合摘要失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "获取投资组合摘要失败: " + err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// GetNewsAnalysis 获取新闻分析
func (c *LLMController) GetNewsAnalysis(ctx *gin.Context) {
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
