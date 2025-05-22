package utils

import (
	"fmt"
	"time"

	"github.com/shopspring/decimal"
	"github.com/sirupsen/logrus"
)

// FormatDecimal 格式化小数，保留指定位数
func FormatDecimal(value decimal.Decimal, places int32) string {
	return value.StringFixed(places)
}

// FormatPrice 格式化价格，通常保留2位小数
func FormatPrice(price decimal.Decimal) string {
	return FormatDecimal(price, 2)
}

// FormatQuantity 格式化数量，通常保留6位小数
func FormatQuantity(quantity decimal.Decimal) string {
	return FormatDecimal(quantity, 6)
}

// CalculateProfitLoss 计算盈亏百分比
func CalculateProfitLoss(entryPrice, currentPrice decimal.Decimal) decimal.Decimal {
	if entryPrice.IsZero() {
		return decimal.Zero
	}
	return currentPrice.Sub(entryPrice).Div(entryPrice).Mul(decimal.NewFromInt(100))
}

// FormatTimestamp 格式化时间戳为可读字符串
func FormatTimestamp(timestamp time.Time) string {
	return timestamp.Format("2006-01-02 15:04:05")
}

// SetupLogger 设置日志格式和级别
func SetupLogger(level string) {
	// 设置日志格式
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
	})

	// 设置日志级别
	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}

// GenerateID 生成唯一ID
func GenerateID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}
