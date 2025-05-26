# Solana DEX Connectors - Usage Guide

This guide provides comprehensive examples of how to use the Raydium and Orca DEX connectors.

## 🚀 Quick Start

### Basic Setup

```javascript
import { RaydiumConnector, OrcaConnector, COMMON_TOKENS } from './index.js';

// Initialize connectors
const raydium = new RaydiumConnector();
const orca = new OrcaConnector();
```

### Custom RPC Endpoint

```javascript
const raydium = new RaydiumConnector('https://your-custom-rpc-endpoint.com');
const orca = new OrcaConnector('https://your-custom-rpc-endpoint.com');
```

## 📊 Raydium Connector Examples

### 1. Fetching Pool Data

```javascript
// Get all pools
const pools = await raydium.fetchPools();
console.log(`Found ${pools.length} pools`);

// Get specific pool
const poolInfo = await raydium.getPoolInfo('pool_id_here');
console.log('Pool info:', poolInfo);

// Find pool by tokens
const solUsdcPool = await raydium.getPoolByTokens(
  COMMON_TOKENS.SOL,
  COMMON_TOKENS.USDC
);
```

### 2. Price Information

```javascript
// Get current price
const priceInfo = await raydium.getPrice(
  COMMON_TOKENS.SOL,
  COMMON_TOKENS.USDC
);

console.log(`SOL/USDC Price: ${priceInfo.price}`);
console.log(`Base Reserve: ${priceInfo.baseReserve}`);
console.log(`Quote Reserve: ${priceInfo.quoteReserve}`);
```

### 3. Swap Calculations

```javascript
// Calculate swap output
const swapResult = await raydium.calculateSwapOutput(
  'pool_id',
  COMMON_TOKENS.SOL,
  1000000000 // 1 SOL in lamports
);

console.log(`Input: 1 SOL`);
console.log(`Output: ${swapResult.outputAmount} USDC`);
console.log(`Price Impact: ${swapResult.priceImpact}%`);
console.log(`Fee: ${swapResult.fee}`);
```

### 4. Pool Statistics

```javascript
// Get pool stats
const stats = await raydium.getPoolStats('pool_id');

console.log(`TVL: $${stats.tvl.toLocaleString()}`);
console.log(`24h Volume: $${stats.volume24h.toLocaleString()}`);
console.log(`Fee Rate: ${(stats.fee * 100).toFixed(3)}%`);
```

### 5. Popular Trading Pairs

```javascript
// Get top trading pairs
const popularPairs = await raydium.getPopularPairs(10);

popularPairs.forEach((pair, index) => {
  console.log(`${index + 1}. ${pair.pair} - Volume: $${pair.volume24h?.toLocaleString()}`);
});
```

## 🐋 Orca Connector Examples

### 1. Pool Management

```javascript
// Get all pools
const pools = await orca.getPools();
console.log(`Found ${pools.length} Orca pools`);

// Get pool by name
const solUsdcPool = await orca.getPoolByName('SOL/USDC');

// Get pool by tokens
const pool = await orca.getPoolByTokens('SOL', 'USDC');
```

### 2. Price Data

```javascript
// Get price information
const priceInfo = await orca.getPrice('SOL', 'USDC');

console.log(`Price: ${priceInfo.price} USDC per SOL`);
console.log(`Pool: ${priceInfo.poolName}`);
console.log(`Fee Rate: ${(priceInfo.feeRate * 100).toFixed(2)}%`);
```

### 3. Swap Quotes

```javascript
// Get swap quote with slippage protection
const quote = await orca.getSwapQuote('SOL', 'USDC', 1, 1); // 1 SOL, 1% slippage

console.log(`Input: ${quote.inputToken.amount} ${quote.inputToken.symbol}`);
console.log(`Expected Output: ${quote.outputToken.expectedAmount} ${quote.outputToken.symbol}`);
console.log(`Min Output: ${quote.outputToken.minAmount} ${quote.outputToken.symbol}`);
console.log(`Price Impact: ${quote.priceImpact}%`);
console.log(`Fee: ${quote.fee}`);
```

### 4. Pool Statistics

```javascript
// Get detailed pool stats
const stats = await orca.getPoolStats('SOL/USDC');

console.log(`Pool: ${stats.poolName}`);
console.log(`${stats.tokenA.symbol} Amount: ${stats.tokenA.amount.toLocaleString()}`);
console.log(`${stats.tokenB.symbol} Amount: ${stats.tokenB.amount.toLocaleString()}`);
console.log(`TVL: $${stats.tvl.toLocaleString()}`);
```

### 5. Token Management

```javascript
// Get available tokens
const tokens = orca.getAvailableTokens();

Object.keys(tokens).forEach(symbol => {
  const token = tokens[symbol];
  console.log(`${symbol}: ${token.mint}`);
});

// Get popular pairs
const popularPairs = await orca.getPopularPairs(5);
popularPairs.forEach(pair => {
  console.log(`${pair.pair} - TVL: $${pair.tvl.toLocaleString()}`);
});
```

## 🔄 Comparison Examples

### Price Comparison

```javascript
async function comparePrices(tokenA, tokenB) {
  try {
    // Raydium price
    const raydiumPrice = await raydium.getPrice(
      COMMON_TOKENS[tokenA],
      COMMON_TOKENS[tokenB]
    );
    
    // Orca price
    const orcaPrice = await orca.getPrice(tokenA, tokenB);
    
    console.log(`${tokenA}/${tokenB} Prices:`);
    console.log(`Raydium: ${raydiumPrice.price.toFixed(4)}`);
    console.log(`Orca: ${orcaPrice.price.toFixed(4)}`);
    
    const difference = Math.abs(raydiumPrice.price - orcaPrice.price);
    const percentDiff = (difference / raydiumPrice.price) * 100;
    console.log(`Difference: ${difference.toFixed(4)} (${percentDiff.toFixed(2)}%)`);
    
  } catch (error) {
    console.error('Price comparison error:', error.message);
  }
}

await comparePrices('SOL', 'USDC');
```

### Swap Comparison

```javascript
async function compareSwaps(inputToken, outputToken, amount) {
  try {
    // Find pools
    const raydiumPools = await raydium.fetchPools();
    const raydiumPool = raydiumPools.find(p => 
      p.baseSymbol === inputToken && p.quoteSymbol === outputToken
    );
    
    if (raydiumPool) {
      const raydiumSwap = await raydium.calculateSwapOutput(
        raydiumPool.id,
        COMMON_TOKENS[inputToken],
        amount
      );
      console.log(`Raydium: ${raydiumSwap.outputAmount} ${outputToken}`);
    }
    
    const orcaSwap = await orca.getSwapQuote(inputToken, outputToken, amount / 1e9);
    console.log(`Orca: ${orcaSwap.outputToken.expectedAmount} ${outputToken}`);
    
  } catch (error) {
    console.error('Swap comparison error:', error.message);
  }
}

await compareSwaps('SOL', 'USDC', 1000000000); // 1 SOL
```

## 🛠️ Advanced Usage

### Error Handling

```javascript
async function safeGetPrice(connector, tokenA, tokenB) {
  try {
    const price = await connector.getPrice(tokenA, tokenB);
    return price;
  } catch (error) {
    console.error(`Failed to get price for ${tokenA}/${tokenB}:`, error.message);
    return null;
  }
}

// Usage
const raydiumPrice = await safeGetPrice(raydium, 'SOL', 'USDC');
const orcaPrice = await safeGetPrice(orca, 'SOL', 'USDC');
```

### Caching and Performance

```javascript
class DEXAggregator {
  constructor() {
    this.raydium = new RaydiumConnector();
    this.orca = new OrcaConnector();
    this.priceCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }
  
  async getBestPrice(tokenA, tokenB) {
    const cacheKey = `${tokenA}/${tokenB}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    const [raydiumPrice, orcaPrice] = await Promise.allSettled([
      this.raydium.getPrice(COMMON_TOKENS[tokenA], COMMON_TOKENS[tokenB]),
      this.orca.getPrice(tokenA, tokenB)
    ]);
    
    const prices = [];
    if (raydiumPrice.status === 'fulfilled') {
      prices.push({ dex: 'Raydium', ...raydiumPrice.value });
    }
    if (orcaPrice.status === 'fulfilled') {
      prices.push({ dex: 'Orca', ...orcaPrice.value });
    }
    
    const bestPrice = prices.reduce((best, current) => 
      current.price > best.price ? current : best
    );
    
    this.priceCache.set(cacheKey, {
      data: { bestPrice, allPrices: prices },
      timestamp: Date.now()
    });
    
    return { bestPrice, allPrices: prices };
  }
}

// Usage
const aggregator = new DEXAggregator();
const result = await aggregator.getBestPrice('SOL', 'USDC');
console.log(`Best price: ${result.bestPrice.price} on ${result.bestPrice.dex}`);
```

### Batch Operations

```javascript
async function getBatchPrices(pairs) {
  const results = await Promise.allSettled(
    pairs.map(async ([tokenA, tokenB]) => {
      const [raydiumPrice, orcaPrice] = await Promise.allSettled([
        raydium.getPrice(COMMON_TOKENS[tokenA], COMMON_TOKENS[tokenB]),
        orca.getPrice(tokenA, tokenB)
      ]);
      
      return {
        pair: `${tokenA}/${tokenB}`,
        raydium: raydiumPrice.status === 'fulfilled' ? raydiumPrice.value.price : null,
        orca: orcaPrice.status === 'fulfilled' ? orcaPrice.value.price : null
      };
    })
  );
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}

// Usage
const pairs = [['SOL', 'USDC'], ['SOL', 'USDT'], ['RAY', 'SOL']];
const prices = await getBatchPrices(pairs);
console.table(prices);
```

## 📈 Real-time Monitoring

```javascript
class PriceMonitor {
  constructor(pairs, interval = 30000) {
    this.pairs = pairs;
    this.interval = interval;
    this.raydium = new RaydiumConnector();
    this.orca = new OrcaConnector();
    this.isRunning = false;
  }
  
  async start() {
    this.isRunning = true;
    console.log('Starting price monitor...');
    
    while (this.isRunning) {
      for (const [tokenA, tokenB] of this.pairs) {
        try {
          const [raydiumPrice, orcaPrice] = await Promise.allSettled([
            this.raydium.getPrice(COMMON_TOKENS[tokenA], COMMON_TOKENS[tokenB]),
            this.orca.getPrice(tokenA, tokenB)
          ]);
          
          console.log(`\n${tokenA}/${tokenB} - ${new Date().toLocaleTimeString()}`);
          if (raydiumPrice.status === 'fulfilled') {
            console.log(`  Raydium: ${raydiumPrice.value.price.toFixed(4)}`);
          }
          if (orcaPrice.status === 'fulfilled') {
            console.log(`  Orca: ${orcaPrice.value.price.toFixed(4)}`);
          }
          
        } catch (error) {
          console.error(`Error monitoring ${tokenA}/${tokenB}:`, error.message);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
  }
  
  stop() {
    this.isRunning = false;
    console.log('Price monitor stopped');
  }
}

// Usage
const monitor = new PriceMonitor([['SOL', 'USDC'], ['SOL', 'USDT']]);
// monitor.start(); // Uncomment to start monitoring
```

## 🔧 Configuration

### Custom Configuration

```javascript
const config = {
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  timeout: 10000,
  retries: 3,
  cacheTimeout: 300000 // 5 minutes
};

class ConfigurableConnector extends RaydiumConnector {
  constructor(config) {
    super(config.rpcEndpoint);
    this.config = config;
    this.cacheTimeout = config.cacheTimeout;
  }
  
  async fetchWithRetry(fn, retries = this.config.retries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
}
```

## 📝 Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Rate Limiting**: Implement delays between requests to avoid rate limits
3. **Caching**: Cache frequently accessed data to improve performance
4. **Validation**: Validate token addresses and amounts before making calls
5. **Monitoring**: Log important operations for debugging and monitoring
6. **Fallbacks**: Implement fallback mechanisms when APIs are unavailable

## 🚨 Common Issues

### Issue: "Pool not found"
```javascript
// Solution: Check if tokens exist and pool is available
const pools = await connector.getPools();
const availablePairs = pools.map(p => `${p.tokenA.symbol}/${p.tokenB.symbol}`);
console.log('Available pairs:', availablePairs);
```

### Issue: "Rate limit exceeded"
```javascript
// Solution: Implement delays and caching
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
```

### Issue: "Invalid token address"
```javascript
// Solution: Use COMMON_TOKENS or validate addresses
import { COMMON_TOKENS } from './raydium-connector.js';
const solAddress = COMMON_TOKENS.SOL; // Use predefined addresses
```

This usage guide covers the most common scenarios and advanced patterns for using the Solana DEX connectors effectively.