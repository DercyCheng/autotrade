// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @title AutoTradeContract
 * @dev A smart contract for automated trading on DEXes
 */
contract AutoTradeContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Trade structure
    struct Trade {
        uint256 id;
        address token;
        address baseToken;
        uint256 amount;
        uint256 executedAmount;
        uint256 price;
        bool isBuy;
        uint256 timestamp;
        bool executed;
        bool cancelled;
    }

    // Strategy structure
    struct Strategy {
        uint256 id;
        string name;
        address[] tokens;
        address baseToken;
        bool isActive;
    }

    // Events
    event TradeExecuted(uint256 indexed tradeId, address indexed token, uint256 amount, uint256 price, bool isBuy);
    event TradeCancelled(uint256 indexed tradeId);
    event StrategyAdded(uint256 indexed strategyId, string name);
    event StrategyUpdated(uint256 indexed strategyId, bool isActive);
    event FundsWithdrawn(address token, uint256 amount);
    event FundsDeposited(address token, uint256 amount);

    // State variables
    uint256 private _tradeIdCounter;
    uint256 private _strategyIdCounter;
    mapping(uint256 => Trade) public trades;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => bool) public approvedExecutors;
    IUniswapV2Router02 public uniswapRouter;

    // Risk parameters
    uint256 public maxTradeAmount;
    uint256 public slippageTolerance; // in basis points (1/100 of 1%)
    uint256 public tradeCooldown; // minimum time between trades in seconds

    // Constructor
    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        maxTradeAmount = 1 ether; // Default max trade amount (to be adjusted)
        slippageTolerance = 50; // 0.5% default slippage
        tradeCooldown = 60; // 1 minute cooldown between trades
    }

    // Modifiers
    modifier onlyApprovedExecutor() {
        require(approvedExecutors[msg.sender] || msg.sender == owner(), "Not approved executor");
        _;
    }

    // Functions
    function addApprovedExecutor(address executor) external onlyOwner {
        approvedExecutors[executor] = true;
    }

    function removeApprovedExecutor(address executor) external onlyOwner {
        approvedExecutors[executor] = false;
    }

    function updateRiskParameters(
        uint256 _maxTradeAmount,
        uint256 _slippageTolerance,
        uint256 _tradeCooldown
    ) external onlyOwner {
        maxTradeAmount = _maxTradeAmount;
        slippageTolerance = _slippageTolerance;
        tradeCooldown = _tradeCooldown;
    }

    function createStrategy(
        string memory name,
        address[] memory tokens,
        address baseToken
    ) external onlyOwner returns (uint256) {
        uint256 strategyId = _strategyIdCounter++;
        
        strategies[strategyId] = Strategy({
            id: strategyId,
            name: name,
            tokens: tokens,
            baseToken: baseToken,
            isActive: true
        });
        
        emit StrategyAdded(strategyId, name);
        return strategyId;
    }

    function toggleStrategy(uint256 strategyId, bool isActive) external onlyOwner {
        require(strategies[strategyId].id == strategyId, "Strategy does not exist");
        strategies[strategyId].isActive = isActive;
        emit StrategyUpdated(strategyId, isActive);
    }

    function executeTrade(
        uint256 strategyId,
        address token,
        uint256 amount,
        uint256 price,
        bool isBuy
    ) external onlyApprovedExecutor nonReentrant returns (uint256) {
        require(strategies[strategyId].isActive, "Strategy is not active");
        require(amount <= maxTradeAmount, "Trade amount exceeds maximum");
        
        Strategy storage strategy = strategies[strategyId];
        bool validToken = false;
        
        for (uint256 i = 0; i < strategy.tokens.length; i++) {
            if (strategy.tokens[i] == token) {
                validToken = true;
                break;
            }
        }
        
        require(validToken, "Token not in strategy");
        
        uint256 tradeId = _tradeIdCounter++;
        
        trades[tradeId] = Trade({
            id: tradeId,
            token: token,
            baseToken: strategy.baseToken,
            amount: amount,
            executedAmount: 0,
            price: price,
            isBuy: isBuy,
            timestamp: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        // Execute the trade on Uniswap
        if (isBuy) {
            _executeBuy(tradeId, token, strategy.baseToken, amount, price);
        } else {
            _executeSell(tradeId, token, strategy.baseToken, amount, price);
        }
        
        return tradeId;
    }

    function _executeBuy(
        uint256 tradeId,
        address token,
        address baseToken,
        uint256 amount,
        uint256 price
    ) private {
        Trade storage trade = trades[tradeId];
        
        // Calculate min tokens to receive with slippage protection
        uint256 minTokensToReceive = (amount * (10000 - slippageTolerance)) / 10000;
        
        // Approve the router to spend base tokens
        IERC20(baseToken).safeApprove(address(uniswapRouter), amount);
        
        // Create the swap path
        address[] memory path = new address[](2);
        path[0] = baseToken;
        path[1] = token;
        
        // Execute the swap
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amount,
            minTokensToReceive,
            path,
            address(this),
            block.timestamp + 15 minutes
        );
        
        trade.executedAmount = amounts[1];
        trade.executed = true;
        
        emit TradeExecuted(tradeId, token, amounts[1], price, true);
    }

    function _executeSell(
        uint256 tradeId,
        address token,
        address baseToken,
        uint256 amount,
        uint256 price
    ) private {
        Trade storage trade = trades[tradeId];
        
        // Calculate min base tokens to receive with slippage protection
        uint256 expectedBaseTokens = amount * price / 1e18;
        uint256 minBaseTokensToReceive = (expectedBaseTokens * (10000 - slippageTolerance)) / 10000;
        
        // Approve the router to spend tokens
        IERC20(token).safeApprove(address(uniswapRouter), amount);
        
        // Create the swap path
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = baseToken;
        
        // Execute the swap
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amount,
            minBaseTokensToReceive,
            path,
            address(this),
            block.timestamp + 15 minutes
        );
        
        trade.executedAmount = amounts[1];
        trade.executed = true;
        
        emit TradeExecuted(tradeId, token, amount, price, false);
    }

    function cancelTrade(uint256 tradeId) external onlyApprovedExecutor {
        Trade storage trade = trades[tradeId];
        require(!trade.executed, "Trade already executed");
        require(!trade.cancelled, "Trade already cancelled");
        
        trade.cancelled = true;
        emit TradeCancelled(tradeId);
    }

    function depositTokens(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit FundsDeposited(token, amount);
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
        emit FundsWithdrawn(token, amount);
    }

    function getTradeDetails(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function getStrategyDetails(uint256 strategyId) external view returns (Strategy memory) {
        return strategies[strategyId];
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
