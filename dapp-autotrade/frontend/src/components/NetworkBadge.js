import React from 'react';
import { Chip, Tooltip } from '@mui/material';

// Network configuration
const NETWORKS = {
    1: {
        name: 'Ethereum',
        color: '#627EEA', // Ethereum blue
        icon: '⟠',
    },
    56: {
        name: 'BSC',
        color: '#F3BA2F', // Binance yellow
        icon: 'B',
    },
    // Add more networks as needed
};

// Default for unknown networks
const DEFAULT_NETWORK = {
    name: 'Unknown Network',
    color: '#FF5733',
    icon: '?',
};

export default function NetworkBadge({ chainId, sx }) {
    const network = NETWORKS[chainId] || DEFAULT_NETWORK;

    return (
        <Tooltip title={`Connected to ${network.name}`}>
            <Chip
                label={network.name}
                sx={{
                    backgroundColor: network.color,
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    ...sx,
                }}
                avatar={
                    <div style={{
                        backgroundColor: network.color,
                        color: 'white',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                    }}>
                        {network.icon}
                    </div>
                }
                size="small"
            />
        </Tooltip>
    );
}
