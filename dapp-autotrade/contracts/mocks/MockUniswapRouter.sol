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
