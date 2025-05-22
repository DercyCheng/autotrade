package llm

import (
	"encoding/json"
	"fmt"
	"time"
)

// GetTradeSuggestions 使用LLM生成交易建议
func (s *LLMService) GetTradeSuggestions(marketData map[string]interface{}, userPreferences map[string]interface{}) (*LLMResponse, error) {
	prompt := "基于以下市场数据和用户偏好，提供具体的交易建议，包括应该买入或卖出的资产、价格和数量：\n"

	data := map[string]interface{}{
		"market_data":      marketData,
		"user_preferences": userPreferences,
		"timestamp":        time.Now().Unix(),
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  1000,
	})
}

// AnalyzeMarketSentiment 分析市场情绪
func (s *LLMService) AnalyzeMarketSentiment(marketData map[string]interface{}, newsData []map[string]string) (*LLMResponse, error) {
	prompt := "分析以下市场数据和新闻，提供关于整体市场情绪的评估（看涨、看跌或中性）及其原因：\n"

	data := map[string]interface{}{
		"market_data": marketData,
		"news_data":   newsData,
		"timestamp":   time.Now().Unix(),
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.2,
		"max_tokens":  800,
	})
}

// GetStrategyRecommendations 获取策略建议
func (s *LLMService) GetStrategyRecommendations(userPreferences map[string]interface{}, marketData map[string]interface{}) (*LLMResponse, error) {
	prompt := "基于以下用户偏好和当前市场状况，推荐适合的交易策略：\n"

	data := map[string]interface{}{
		"user_preferences": userPreferences,
		"market_data":      marketData,
		"timestamp":        time.Now().Unix(),
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.4,
		"max_tokens":  1200,
	})
}

// ExplainMarketMovements 解释市场走势
func (s *LLMService) ExplainMarketMovements(marketData map[string]interface{}, newsData []map[string]string) (*LLMResponse, error) {
	prompt := "基于以下市场数据和新闻，解释最近的市场走势及其可能的原因：\n"

	data := map[string]interface{}{
		"market_data": marketData,
		"news_data":   newsData,
		"timestamp":   time.Now().Unix(),
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  1000,
	})
}

// GetPortfolioSummary 获取投资组合摘要
func (s *LLMService) GetPortfolioSummary(portfolioData map[string]interface{}) (*LLMResponse, error) {
	prompt := "基于以下投资组合数据，提供简洁的自然语言摘要，包括总价值、主要资产、表现和风险评估：\n"

	dataJSON, err := json.Marshal(portfolioData)
	if err != nil {
		return nil, fmt.Errorf("投资组合数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.2,
		"max_tokens":  800,
	})
}
