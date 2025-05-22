package llm

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"autotransaction/config"
)

// LLMService 提供大型语言模型服务
type LLMService struct {
	cfg           *config.Config
	httpClient    *http.Client
	deepseekAPI   string
	qwenAPI       string
	defaultEngine string
}

// LLMResponse 结构体用于存储LLM API的响应
type LLMResponse struct {
	Completion string                 `json:"completion"`
	Data       map[string]interface{} `json:"data"`
	Error      string                 `json:"error,omitempty"`
}

// NewLLMService 创建一个新的LLM服务
func NewLLMService(cfg *config.Config) *LLMService {
	return &LLMService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		deepseekAPI:   cfg.LLM.DeepseekAPI,
		qwenAPI:       cfg.LLM.QwenAPI,
		defaultEngine: cfg.LLM.DefaultEngine,
	}
}

// AnalyzeMarket 使用LLM分析市场情况
func (s *LLMService) AnalyzeMarket(marketData map[string]interface{}) (*LLMResponse, error) {
	prompt := "分析以下市场数据，提供市场趋势分析和交易建议：\n"

	marketDataJSON, err := json.Marshal(marketData)
	if err != nil {
		return nil, fmt.Errorf("市场数据序列化失败: %v", err)
	}

	prompt += string(marketDataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.2,
		"max_tokens":  1000,
	})
}

// OptimizeStrategy 优化交易策略
func (s *LLMService) OptimizeStrategy(strategyData map[string]interface{}) (*LLMResponse, error) {
	prompt := "分析以下交易策略的历史表现，并提供优化建议：\n"

	strategyDataJSON, err := json.Marshal(strategyData)
	if err != nil {
		return nil, fmt.Errorf("策略数据序列化失败: %v", err)
	}

	prompt += string(strategyDataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  1200,
	})
}

// GetTradingRecommendations 获取交易建议
func (s *LLMService) GetTradingRecommendations(marketData map[string]interface{}, userPreferences map[string]interface{}) (*LLMResponse, error) {
	prompt := "基于以下市场数据和用户偏好，提供个性化交易建议：\n"

	data := map[string]interface{}{
		"market_data":      marketData,
		"user_preferences": userPreferences,
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("数据序列化失败: %v", err)
	}

	prompt += string(dataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.4,
		"max_tokens":  1000,
	})
}

// AnswerQuestion 回答用户问题
func (s *LLMService) AnswerQuestion(question string, context map[string]interface{}) (*LLMResponse, error) {
	prompt := fmt.Sprintf("问题: %s\n\n上下文: ", question)

	if context != nil {
		contextJSON, err := json.Marshal(context)
		if err != nil {
			return nil, fmt.Errorf("上下文序列化失败: %v", err)
		}
		prompt += string(contextJSON)
	}

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.5,
		"max_tokens":  800,
	})
}

// AnalyzeNews 分析新闻情感
func (s *LLMService) AnalyzeNews(newsArticles []map[string]string) (*LLMResponse, error) {
	prompt := "分析以下加密货币相关新闻文章，提供情感分析和可能的市场影响：\n"

	for i, article := range newsArticles {
		prompt += fmt.Sprintf("\n文章 %d: %s\n内容: %s\n", i+1, article["title"], article["content"])
	}

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.2,
		"max_tokens":  1000,
	})
}

// ExplainTrade 解释交易
func (s *LLMService) ExplainTrade(tradeData map[string]interface{}) (*LLMResponse, error) {
	prompt := "以通俗易懂的语言解释以下交易的逻辑和执行情况：\n"

	tradeDataJSON, err := json.Marshal(tradeData)
	if err != nil {
		return nil, fmt.Errorf("交易数据序列化失败: %v", err)
	}

	prompt += string(tradeDataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  500,
	})
}

// AnalyzePortfolioRisk 分析投资组合风险
func (s *LLMService) AnalyzePortfolioRisk(portfolioData map[string]interface{}) (*LLMResponse, error) {
	prompt := "分析以下投资组合的风险状况，并提供风险管理建议：\n"

	portfolioDataJSON, err := json.Marshal(portfolioData)
	if err != nil {
		return nil, fmt.Errorf("投资组合数据序列化失败: %v", err)
	}

	prompt += string(portfolioDataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.2,
		"max_tokens":  800,
	})
}

// GetMarketSummary 获取市场摘要
func (s *LLMService) GetMarketSummary(marketData map[string]interface{}) (*LLMResponse, error) {
	prompt := "根据以下市场数据，提供简洁的市场趋势摘要：\n"

	marketDataJSON, err := json.Marshal(marketData)
	if err != nil {
		return nil, fmt.Errorf("市场数据序列化失败: %v", err)
	}

	prompt += string(marketDataJSON)

	return s.callLLM(prompt, map[string]interface{}{
		"temperature": 0.3,
		"max_tokens":  400,
	})
}

// callLLM 调用LLM API
func (s *LLMService) callLLM(prompt string, params map[string]interface{}) (*LLMResponse, error) {
	var apiURL string

	// 根据配置选择使用的LLM引擎
	switch s.defaultEngine {
	case "deepseek":
		apiURL = s.deepseekAPI
	case "qwen":
		apiURL = s.qwenAPI
	default:
		return nil, fmt.Errorf("未知的LLM引擎: %s", s.defaultEngine)
	}

	// 构建请求体
	requestBody := map[string]interface{}{
		"prompt": prompt,
	}

	// 添加其他参数
	for k, v := range params {
		requestBody[k] = v
	}

	requestJSON, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("请求体序列化失败: %v", err)
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(string(requestJSON)))
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if s.cfg.LLM.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+s.cfg.LLM.APIKey)
	}

	// 发送请求
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送LLM API请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 读取响应
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %v", err)
	}

	// 检查状态码
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("LLM API返回错误: %s, 状态码: %d", string(respBody), resp.StatusCode)
	}

	// 解析响应
	var llmResponse LLMResponse
	if err := json.Unmarshal(respBody, &llmResponse); err != nil {
		return nil, fmt.Errorf("解析LLM响应失败: %v, 响应体: %s", err, string(respBody))
	}

	return &llmResponse, nil
}
