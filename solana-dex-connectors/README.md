# Solana DEX Connectors

A comprehensive JavaScript library for interacting with Solana's leading decentralized exchanges: **Raydium** and **Orca**.

## 🚀 Features

### Raydium Connector
- ✅ Fetch all available liquidity pools
- ✅ Get real-time price data
- ✅ Calculate swap outputs with price impact
- ✅ Retrieve pool statistics and TVL
- ✅ Access popular trading pairs
- ✅ Live API integration with Raydium

### Orca Connector  
- ✅ Access Orca liquidity pools
- ✅ Get token pair prices
- ✅ Calculate swap quotes with slippage
- ✅ Pool statistics and TVL data
- ✅ Popular trading pairs by volume
- ✅ Token management utilities

## 📦 Installation

```bash
npm install
```

## 🔧 Dependencies

- `@solana/web3.js` - Solana blockchain interaction
- `axios` - HTTP client for API calls
- `decimal.js` - Precise decimal arithmetic
- `bn.js` - Big number handling

## 🏃‍♂️ Quick Start

```javascript
import { RaydiumConnector, OrcaConnector } from './index.js';

// Initialize connectors
const raydium = new RaydiumConnector();
const orca = new OrcaConnector();

// Get Raydium pools
const raydiumPools = await raydium.fetchPools();
console.log(`Found ${raydiumPools.length} Raydium pools`);

// Get Orca price
const price = await orca.getPrice('SOL', 'USDC');
console.log(`SOL/USDC: ${price.price} USDC per SOL`);
```

## 📖 API Documentation

### RaydiumConnector

#### Constructor
```javascript
const raydium = new RaydiumConnector(rpcEndpoint);
```
- `rpcEndpoint` (optional): Solana RPC endpoint (default: mainnet-beta)

#### Methods

##### `fetchPools()`
Fetches all available Raydium liquidity pools.
```javascript
const pools = await raydium.fetchPools();
```

##### `getPoolInfo(poolId)`
Gets detailed information for a specific pool.
```javascript
const pool = await raydium.getPoolInfo('pool_id_here');
```

##### `getPoolByTokens(baseToken, quoteToken)`
Finds a pool by token pair.
```javascript
const pool = await raydium.getPoolByTokens(
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
);
```

##### `getPrice(baseToken, quoteToken)`
Calculates the current price for a token pair.
```javascript
const price = await raydium.getPrice(baseToken, quoteToken);
// Returns: { poolId, baseToken, quoteToken, price, baseReserve, quoteReserve, timestamp }
```

##### `getPopularPairs(limit)`
Gets the most popular trading pairs by volume.
```javascript
const pairs = await raydium.getPopularPairs(10);
```

##### `calculateSwapOutput(poolId, inputToken, inputAmount)`
Calculates swap output using constant product formula.
```javascript
const swap = await raydium.calculateSwapOutput(poolId, inputToken, 1000000000);
// Returns: { inputAmount, outputAmount, minOutputAmount, priceImpact, fee }
```

##### `getPoolStats(poolId)`
Gets comprehensive pool statistics.
```javascript
const stats = await raydium.getPoolStats(poolId);
// Returns: { poolId, baseSymbol, quoteSymbol, baseReserve, quoteReserve, tvl, fee, volume24h }
```

### OrcaConnector

#### Constructor
```javascript
const orca = new OrcaConnector(rpcEndpoint);
```

#### Methods

##### `getPools()`
Gets all available Orca pools.
```javascript
const pools = await orca.getPools();
```

##### `getPoolByName(poolName)`
Gets pool by name (e.g., 'SOL/USDC').
```javascript
const pool = await orca.getPoolByName('SOL/USDC');
```

##### `getPoolByTokens(tokenA, tokenB)`
Finds pool by token symbols or mint addresses.
```javascript
const pool = await orca.getPoolByTokens('SOL', 'USDC');
```

##### `getPrice(tokenA, tokenB)`
Gets current price for token pair.
```javascript
const price = await orca.getPrice('SOL', 'USDC');
// Returns: { poolName, tokenA, tokenB, price, feeRate, timestamp }
```

##### `getSwapQuote(inputToken, outputToken, inputAmount, slippage)`
Calculates swap quote with slippage protection.
```javascript
const quote = await orca.getSwapQuote('SOL', 'USDC', 1, 1); // 1 SOL, 1% slippage
// Returns: { poolName, inputToken, outputToken, priceImpact, fee, slippage }
```

##### `getPopularPairs(limit)`
Gets popular pairs sorted by TVL.
```javascript
const pairs = await orca.getPopularPairs(5);
```

##### `getPoolStats(poolName)`
Gets pool statistics.
```javascript
const stats = await orca.getPoolStats('SOL/USDC');
// Returns: { poolName, tokenA, tokenB, tvl, feeRate, timestamp }
```

##### `getAvailableTokens()`
Gets all available tokens.
```javascript
const tokens = orca.getAvailableTokens();
```

## 🧪 Testing

Run individual connector tests:
```bash
npm run test-raydium
npm run test-orca
npm run test-all
```

Or run the main demo:
```bash
npm start
```

## 📊 Example Output

### Raydium Test Results
```
🚀 Testing Raydium DEX Connector

📊 Fetching Raydium pools...
✅ Found 1,247 pools

🔥 Getting popular trading pairs...
Popular pairs:
1. SOL/USDC - Volume: $12,345,678
2. RAY/SOL - Volume: $8,765,432
3. USDC/USDT - Volume: $5,432,109

💰 Getting price for SOL/USDC...
Price: 177.5000 USDC per SOL
Base Reserve: 1000000000000
Quote Reserve: 177500000000

🔄 Calculating swap output...
Input: 1 SOL
Output: 176.73 USDC
Price Impact: 0.0010%
```

### Orca Test Results
```
🐋 Testing Orca DEX Connector

📊 Getting Orca pools...
✅ Found 3 pools:
1. SOL/USDC (SOL/USDC)
2. SOL/USDT (SOL/USDT)
3. ORCA/SOL (ORCA/SOL)

💰 Getting price for SOL/USDC...
Price: 177.5000 USDC per SOL
Pool: SOL/USDC
Fee Rate: 0.30%

🔄 Getting swap quote for 1 SOL -> USDC...
Input: 1 SOL
Expected Output: 176.73 USDC
Min Output: 175.00 USDC
Price Impact: 0.0010%
```

## 🔗 Common Token Addresses

```javascript
import { COMMON_TOKENS } from './raydium-connector.js';

// Available tokens:
COMMON_TOKENS.SOL    // So11111111111111111111111111111111111111112
COMMON_TOKENS.USDC   // EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
COMMON_TOKENS.USDT   // Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
COMMON_TOKENS.RAY    // 4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R
COMMON_TOKENS.SRM    // SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt
COMMON_TOKENS.MSOL   // mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
```

## ⚠️ Important Notes

1. **Rate Limiting**: Both connectors implement caching to avoid API rate limits
2. **Error Handling**: All methods include comprehensive error handling
3. **Precision**: Uses Decimal.js for precise financial calculations
4. **Mock Data**: Some methods use mock data for demonstration purposes
5. **Production Use**: For production, implement proper account data parsing

## 🛠️ Development

### Project Structure
```
solana-dex-connectors/
├── raydium-connector.js    # Raydium DEX connector
├── orca-connector.js       # Orca DEX connector
├── index.js               # Main entry point
├── test-raydium.js        # Raydium tests
├── test-orca.js           # Orca tests
├── test-all.js            # Comparison tests
├── package.json           # Dependencies
└── README.md              # Documentation
```

### Adding New Features

1. **New DEX Support**: Create a new connector following the same pattern
2. **Additional Methods**: Add methods to existing connectors
3. **Enhanced Calculations**: Improve price and swap calculations
4. **Real-time Data**: Add WebSocket support for live updates

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test files for examples

---

**Built for the Solana DeFi ecosystem** 🌟