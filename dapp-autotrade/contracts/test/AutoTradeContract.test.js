const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutoTradeContract", function () {
    let autoTradeContract;
    let owner;
    let executor;
    let user;
    let mockRouter;
    let mockToken;
    let mockBaseToken;

    beforeEach(async function () {
        // Get signers
        [owner, executor, user] = await ethers.getSigners();

        // Deploy mock router for testing
        const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
        mockRouter = await MockRouter.deploy();
        await mockRouter.deployed();

        // Deploy mock tokens
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MTK", ethers.utils.parseEther("1000000"));
        await mockToken.deployed();

        mockBaseToken = await MockToken.deploy("Mock USDT", "MUSDT", ethers.utils.parseEther("1000000"));
        await mockBaseToken.deployed();

        // Deploy AutoTradeContract
        const AutoTradeContract = await ethers.getContractFactory("AutoTradeContract");
        autoTradeContract = await AutoTradeContract.deploy(mockRouter.address);
        await autoTradeContract.deployed();

        // Fund the contract with tokens
        await mockToken.transfer(autoTradeContract.address, ethers.utils.parseEther("10000"));
        await mockBaseToken.transfer(autoTradeContract.address, ethers.utils.parseEther("10000"));

        // Set up mock router
        await mockRouter.setMockToken(mockToken.address, mockBaseToken.address);
    });

    it("Should deploy correctly", async function () {
        expect(await autoTradeContract.owner()).to.equal(owner.address);
        expect(await autoTradeContract.uniswapRouter()).to.equal(mockRouter.address);
    });

    it("Should add and remove approved executors", async function () {
        // Initially executor is not approved
        expect(await autoTradeContract.approvedExecutors(executor.address)).to.equal(false);

        // Add executor
        await autoTradeContract.addApprovedExecutor(executor.address);
        expect(await autoTradeContract.approvedExecutors(executor.address)).to.equal(true);

        // Remove executor
        await autoTradeContract.removeApprovedExecutor(executor.address);
        expect(await autoTradeContract.approvedExecutors(executor.address)).to.equal(false);
    });

    it("Should create a strategy", async function () {
        const tokens = [mockToken.address];

        await autoTradeContract.createStrategy(
            "Test Strategy",
            tokens,
            mockBaseToken.address
        );

        const strategy = await autoTradeContract.getStrategyDetails(0);

        expect(strategy.name).to.equal("Test Strategy");
        expect(strategy.tokens[0]).to.equal(mockToken.address);
        expect(strategy.baseToken).to.equal(mockBaseToken.address);
        expect(strategy.isActive).to.equal(true);
    });

    it("Should toggle strategy status", async function () {
        const tokens = [mockToken.address];

        await autoTradeContract.createStrategy(
            "Test Strategy",
            tokens,
            mockBaseToken.address
        );

        // Initially active
        let strategy = await autoTradeContract.getStrategyDetails(0);
        expect(strategy.isActive).to.equal(true);

        // Toggle to inactive
        await autoTradeContract.toggleStrategy(0, false);

        strategy = await autoTradeContract.getStrategyDetails(0);
        expect(strategy.isActive).to.equal(false);
    });

    // More tests would be added for trading functions, deposit/withdraw, etc.
});

// Mock contracts for testing
// These would be placed in separate files in a real test setup

// MockUniswapRouter.sol
/*
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    address public mockToken;
    address public mockBaseToken;

    function setMockToken(address _mockToken, address _mockBaseToken) external {
        mockToken = _mockToken;
        mockBaseToken = _mockBaseToken;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(deadline > block.timestamp, "Deadline expired");

        // Mock implementation - always succeeds with expected output
        uint[] memory result = new uint[](2);
        result[0] = amountIn;

        // Calculate output amount (mocked as 1:1 for simplicity)
        result[1] = amountIn;

        // Transfer tokens
        if (path[0] == mockBaseToken && path[1] == mockToken) {
            // Buying tokens
            IERC20(mockBaseToken).transferFrom(msg.sender, address(this), amountIn);
            IERC20(mockToken).transfer(to, amountIn);
        } else if (path[0] == mockToken && path[1] == mockBaseToken) {
            // Selling tokens
            IERC20(mockToken).transferFrom(msg.sender, address(this), amountIn);
            IERC20(mockBaseToken).transfer(to, amountIn);
        }

        return result;
    }
}
*/

// MockERC20.sol
/*
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
*/
