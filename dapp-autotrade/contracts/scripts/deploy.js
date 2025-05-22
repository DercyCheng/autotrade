// SPDX-License-Identifier: MIT

// Deploy script for Hardhat
// npx hardhat run scripts/deploy.js --network <network-name>

// hardhat.config.js
/*
module.exports = {
  solidity: "0.8.19",
  networks: {
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    bsc: {
      url: process.env.BSC_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    // Add other networks as needed
  }
};
*/

const hre = require("hardhat");

async function main() {
    // We get the contract factory to deploy
    const AutoTradeContract = await hre.ethers.getContractFactory("AutoTradeContract");

    // UniswapV2Router02 addresses
    const ROUTER_ADDRESSES = {
        ethereum: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
        bsc: "0x10ED43C718714eb63d5aA57B78B54704E256024E",      // PancakeSwap Router
    };

    // Get the network we're deploying to
    const network = hre.network.name;
    const routerAddress = ROUTER_ADDRESSES[network];

    if (!routerAddress) {
        throw new Error(`No router address configured for network: ${network}`);
    }

    console.log(`Deploying AutoTradeContract to ${network} using router: ${routerAddress}`);

    // Deploy the contract
    const autoTradeContract = await AutoTradeContract.deploy(routerAddress);

    // Wait for deployment to finish
    await autoTradeContract.deployed();

    console.log(`AutoTradeContract deployed to: ${autoTradeContract.address}`);

    // Verify contract on Etherscan (optional)
    if (network !== "localhost" && network !== "hardhat") {
        console.log("Waiting for block confirmations...");
        await autoTradeContract.deployTransaction.wait(6); // Wait for 6 confirmations

        console.log("Verifying contract on Etherscan...");
        await hre.run("verify:verify", {
            address: autoTradeContract.address,
            constructorArguments: [routerAddress],
        });
        console.log("Contract verified!");
    }
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
