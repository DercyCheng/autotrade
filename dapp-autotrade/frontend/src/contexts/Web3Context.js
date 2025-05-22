import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AutoTradeContractABI from '../contracts/AutoTradeContract.json';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
    // Ethereum Mainnet
    1: '0xYourContractAddressOnEthereum',
    // BSC Mainnet
    56: '0xYourContractAddressOnBSC',
    // Add more networks as needed
};

const Web3Context = createContext();

export function useWeb3() {
    return useContext(Web3Context);
}

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Get the current chain ID
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainId = parseInt(chainIdHex, 16);

            // Create provider and signer
            const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
            const ethersSigner = ethersProvider.getSigner();

            // Get the contract instance
            const contractAddress = CONTRACT_ADDRESSES[currentChainId];
            let contractInstance = null;

            if (contractAddress) {
                contractInstance = new ethers.Contract(
                    contractAddress,
                    AutoTradeContractABI.abi,
                    ethersSigner
                );
            }

            setAccount(accounts[0]);
            setChainId(currentChainId);
            setProvider(ethersProvider);
            setSigner(ethersSigner);
            setContract(contractInstance);
            setIsConnected(true);
        } catch (err) {
            console.error('Error connecting to wallet:', err);
            setError(err.message || 'Failed to connect to wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setChainId(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setIsConnected(false);
    };

    // Handle account and chain changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                // User disconnected their wallet
                disconnectWallet();
            } else if (isConnected) {
                // Account changed
                setAccount(accounts[0]);
            }
        };

        const handleChainChanged = (chainIdHex) => {
            const newChainId = parseInt(chainIdHex, 16);
            setChainId(newChainId);

            // Update contract instance for the new chain
            if (isConnected && signer) {
                const contractAddress = CONTRACT_ADDRESSES[newChainId];
                if (contractAddress) {
                    const contractInstance = new ethers.Contract(
                        contractAddress,
                        AutoTradeContractABI.abi,
                        signer
                    );
                    setContract(contractInstance);
                } else {
                    setContract(null);
                }
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [isConnected, signer]);

    // Check if already connected
    useEffect(() => {
        const checkConnection = async () => {
            if (!window.ethereum) return;

            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    // User is already connected
                    connectWallet();
                }
            } catch (err) {
                console.error('Error checking connection:', err);
            }
        };

        checkConnection();
    }, []);

    const value = {
        account,
        chainId,
        provider,
        signer,
        contract,
        isConnected,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}
