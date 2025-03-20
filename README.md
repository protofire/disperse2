# Disperse Contract

A smart contract for dispersing ETH and ERC20 tokens to multiple addresses in a single transaction. Supports both standard and non-standard (like USDT) ERC20 tokens.

## Features

- Disperse ETH to multiple addresses
- Disperse ERC20 tokens to multiple addresses
- Support for non-standard ERC20 tokens (like USDT)
- Gas-efficient batch transfers
- Fully tested with mainnet tokens

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and fill in your values:
```bash
cp .env.example .env
```

Required environment variables:
- `MAINNET_RPC_URL`: Your Ethereum mainnet RPC URL
- `PRIVATE_KEY`: Your deployer account's private key
- `ETHERSCAN_API_KEY`: Your Etherscan API key for contract verification
- `DISPERSE_CONTRACT_ADDRESS`: Address of the deployed Disperse contract
- Test account details (for disperse scripts):
  - `TEST_ACCOUNT_1_ADDRESS` and `TEST_ACCOUNT_1_PRIVATE_KEY`
  - `TEST_ACCOUNT_2_ADDRESS` and `TEST_ACCOUNT_2_PRIVATE_KEY`
  - `TEST_ACCOUNT_3_ADDRESS` and `TEST_ACCOUNT_3_PRIVATE_KEY`

## Available Commands

### Development Commands
```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Generate test coverage
npm run test:coverage
```

### Deployment Commands
```bash
# Deploy to local network
npm run deploy

# Deploy to mainnet
npm run deploy:mainnet

# Verify contract on Etherscan
npm run verify
```

### Fund Management Scripts
```bash
# Disperse funds (local network)
npm run disperse

# Disperse funds (mainnet)
npm run disperse:mainnet

# Return funds (local network)
npm run return

# Return funds (mainnet)
npm run return:mainnet
```

## Contract Functions

### disperseEther
Disperses ETH to multiple addresses in a single transaction.
```solidity
function disperseEther(address[] calldata recipients, uint256[] calldata values) external payable
```

### disperseToken
Disperses ERC20 tokens to multiple addresses using individual transfers.
```solidity
function disperseToken(address token, address[] calldata recipients, uint256[] calldata values) external
```

### disperseTokenSimple
Disperses ERC20 tokens to multiple addresses using batch transfer.
```solidity
function disperseTokenSimple(address token, address[] calldata recipients, uint256[] calldata values) external
```

## Security Considerations

1. The contract has been tested with major tokens (USDT, USDC)
2. Gas estimation includes safety margins
3. Token approvals are required before dispersing ERC20 tokens
4. Supports both standard and non-standard ERC20 implementations

## Testing

The test suite includes:
- Unit tests for all functions
- Integration tests with mainnet-forked environment
- Tests with actual USDT and USDC tokens
- Gas optimization tests

## License

MIT 