import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import Decimal from 'decimal.js';

/**
 * Orca DEX Connector
 * Provides access to Orca liquidity pools, prices, and trading data
 */
class OrcaConnector {
  constructor(rpcEndpoint = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
    this.poolsCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Common Orca pool configurations (simplified)
    this.commonPools = {
      'SOL/USDC': {
        name: 'SOL/USDC',
        tokenA: { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
        tokenB: { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
        poolAccount: '2p7nYbtPBgtmY69NsE8DAW6szpRJn7tQvDnqvoEWQvjY'
      },
      'SOL/USDT': {
        name: 'SOL/USDT',
        tokenA: { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
        tokenB: { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
        poolAccount: 'Dqk7mHQBx2ZWExmyrR2S8X6UG75CrbbpK2FSBZsNYsw6'
      },
      'ORCA/SOL': {
        name: 'ORCA/SOL',
        tokenA: { symbol: 'ORCA', mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', decimals: 6 },
        tokenB: { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
        poolAccount: '2ZnVuidTHpi5WWKUwFXauYGhvdT9jRKYv5MDahtbwtYr'
      }
    };
  }

  /**
   * Get all available Orca pools
   * @returns {Promise<Array>} Array of pool configurations
   */
  async getPools() {
    try {
      const now = Date.now();
      if (this.poolsCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheTimeout) {
        return Array.from(this.poolsCache.values());
      }

      console.log('Loading Orca pools...');
      const pools = [];
      
      // Use our simplified pool configurations
      for (const [poolName, poolConfig] of Object.entries(this.commonPools)) {
        const poolData = {
          name: poolName,
          tokenA: poolConfig.tokenA,
          tokenB: poolConfig.tokenB,
          poolAccount: poolConfig.poolAccount,
          feeRate: 0.003 // 0.3% default fee
        };
        pools.push(poolData);
        this.poolsCache.set(poolName, poolData);
      }

      this.lastCacheUpdate = now;
      console.log(`Loaded ${pools.length} Orca pools`);
      return pools;
    } catch (error) {
      throw new Error(`Failed to get Orca pools: ${error.message}`);
    }
  }

  /**
   * Get pool by name
   * @param {string} poolName - Pool name (e.g., 'SOL/USDC')
   * @returns {Promise<Object>} Pool information
   */
  async getPoolByName(poolName) {
    try {
      const pools = await this.getPools();
      const pool = pools.find(p => p.name === poolName);
      
      if (!pool) {
        throw new Error(`Pool ${poolName} not found`);
      }

      return pool;
    } catch (error) {
      throw new Error(`Failed to get pool by name: ${error.message}`);
    }
  }

  /**
   * Get pool by token pair
   * @param {string} tokenA - First token symbol or mint
   * @param {string} tokenB - Second token symbol or mint
   * @returns {Promise<Object>} Pool information
   */
  async getPoolByTokens(tokenA, tokenB) {
    try {
      const pools = await this.getPools();
      
      // Try to find by symbol first
      let pool = pools.find(p => 
        (p.tokenA.symbol === tokenA && p.tokenB.symbol === tokenB) ||
        (p.tokenA.symbol === tokenB && p.tokenB.symbol === tokenA)
      );

      // If not found by symbol, try by mint address
      if (!pool) {
        pool = pools.find(p => 
          (p.tokenA.mint === tokenA && p.tokenB.mint === tokenB) ||
          (p.tokenA.mint === tokenB && p.tokenB.mint === tokenA)
        );
      }
      
      if (!pool) {
        throw new Error(`Pool for ${tokenA}/${tokenB} not found`);
      }

      return pool;
    } catch (error) {
      throw new Error(`Failed to get pool by tokens: ${error.message}`);
    }
  }

  /**
   * Get price for a token pair
   * @param {string} tokenA - First token symbol or mint
   * @param {string} tokenB - Second token symbol or mint
   * @returns {Promise<Object>} Price information
   */
  async getPrice(tokenA, tokenB) {
    try {
      const poolData = await this.getPoolByTokens(tokenA, tokenB);
      
      // For demonstration, we'll use a mock price calculation
      // In a real implementation, you'd fetch the actual pool account data
      const mockPrices = {
        'SOL/USDC': 177.50,
        'SOL/USDT': 177.45,
        'ORCA/SOL': 0.025
      };
      
      const price = mockPrices[poolData.name] || 1.0;

      return {
        poolName: poolData.name,
        tokenA: {
          symbol: poolData.tokenA.symbol,
          mint: poolData.tokenA.mint,
          amount: '1000000000' // Mock amount
        },
        tokenB: {
          symbol: poolData.tokenB.symbol,
          mint: poolData.tokenB.mint,
          amount: '177500000' // Mock amount
        },
        price: price,
        feeRate: poolData.feeRate,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get price: ${error.message}`);
    }
  }

  /**
   * Calculate swap quote
   * @param {string} inputToken - Input token symbol or mint
   * @param {string} outputToken - Output token symbol or mint
   * @param {number} inputAmount - Input amount (in token units)
   * @param {number} slippage - Slippage tolerance (default 1%)
   * @returns {Promise<Object>} Swap quote
   */
  async getSwapQuote(inputToken, outputToken, inputAmount, slippage = 1) {
    try {
      const poolData = await this.getPoolByTokens(inputToken, outputToken);
      
      // Determine input/output tokens
      const isInputTokenA = poolData.tokenA.symbol === inputToken || 
                           poolData.tokenA.mint === inputToken;
      
      const inputTokenInfo = isInputTokenA ? poolData.tokenA : poolData.tokenB;
      const outputTokenInfo = isInputTokenA ? poolData.tokenB : poolData.tokenA;
      
      // Simplified swap calculation using constant product formula
      const mockReserveA = new Decimal('1000000'); // Mock reserve
      const mockReserveB = new Decimal('177500000'); // Mock reserve
      
      const inputReserve = isInputTokenA ? mockReserveA : mockReserveB;
      const outputReserve = isInputTokenA ? mockReserveB : mockReserveA;
      
      const inputAmountDecimal = new Decimal(inputAmount);
      const feeRate = new Decimal(poolData.feeRate);
      const inputAfterFee = inputAmountDecimal.mul(new Decimal(1).sub(feeRate));
      
      const outputAmount = inputAfterFee
        .mul(outputReserve)
        .div(inputReserve.add(inputAfterFee));
      
      const minOutputAmount = outputAmount.mul(new Decimal(1).sub(new Decimal(slippage).div(100)));
      const priceImpact = inputAmountDecimal.div(inputReserve).mul(100);

      return {
        poolName: poolData.name,
        inputToken: {
          symbol: inputTokenInfo.symbol,
          mint: inputTokenInfo.mint,
          amount: inputAmount
        },
        outputToken: {
          symbol: outputTokenInfo.symbol,
          mint: outputTokenInfo.mint,
          expectedAmount: outputAmount.toNumber(),
          minAmount: minOutputAmount.toNumber()
        },
        priceImpact: priceImpact.toNumber(),
        fee: inputAmountDecimal.mul(feeRate).toString(),
        slippage: slippage,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  /**
   * Get pool statistics
   * @param {string} poolName - Pool name
   * @returns {Promise<Object>} Pool statistics
   */
  async getPoolStats(poolName) {
    try {
      const poolData = await this.getPoolByName(poolName);
      
      // Mock pool statistics for demonstration
      const mockStats = {
        'SOL/USDC': { tokenAAmount: 1000, tokenBAmount: 177500, tvl: 355000 },
        'SOL/USDT': { tokenAAmount: 800, tokenBAmount: 141960, tvl: 283920 },
        'ORCA/SOL': { tokenAAmount: 50000, tokenBAmount: 1250, tvl: 443750 }
      };
      
      const stats = mockStats[poolName] || { tokenAAmount: 100, tokenBAmount: 100, tvl: 200 };

      return {
        poolName: poolData.name,
        tokenA: {
          symbol: poolData.tokenA.symbol,
          amount: stats.tokenAAmount,
          mint: poolData.tokenA.mint
        },
        tokenB: {
          symbol: poolData.tokenB.symbol,
          amount: stats.tokenBAmount,
          mint: poolData.tokenB.mint
        },
        tvl: stats.tvl,
        feeRate: poolData.feeRate,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get pool stats: ${error.message}`);
    }
  }

  /**
   * Get popular trading pairs
   * @param {number} limit - Number of pairs to return
   * @returns {Promise<Array>} Array of popular trading pairs
   */
  async getPopularPairs(limit = 10) {
    try {
      const pools = await this.getPools();
      
      const result = [];
      for (const poolData of pools.slice(0, limit)) {
        try {
          const stats = await this.getPoolStats(poolData.name);
          result.push({
            poolName: poolData.name,
            tokenA: poolData.tokenA.symbol,
            tokenB: poolData.tokenB.symbol,
            pair: `${poolData.tokenA.symbol}/${poolData.tokenB.symbol}`,
            tvl: stats.tvl,
            feeRate: poolData.feeRate
          });
        } catch (error) {
          console.warn(`Failed to get stats for ${poolData.name}:`, error.message);
        }
      }

      return result.sort((a, b) => b.tvl - a.tvl);
    } catch (error) {
      throw new Error(`Failed to get popular pairs: ${error.message}`);
    }
  }

  /**
   * Get available tokens
   * @returns {Object} Available tokens
   */
  getAvailableTokens() {
    const tokens = {};
    for (const pool of Object.values(this.commonPools)) {
      tokens[pool.tokenA.symbol] = pool.tokenA;
      tokens[pool.tokenB.symbol] = pool.tokenB;
    }
    return tokens;
  }
}

// Common Orca pool names for easier testing
export const COMMON_POOLS = {
  'SOL/USDC': 'SOL/USDC',
  'SOL/USDT': 'SOL/USDT',
  'ORCA/SOL': 'ORCA/SOL',
  'ORCA/USDC': 'ORCA/USDC',
  'ETH/SOL': 'ETH/SOL',
  'ETH/USDC': 'ETH/USDC',
  'BTC/SOL': 'BTC/SOL',
  'mSOL/SOL': 'mSOL/SOL',
  'stSOL/SOL': 'stSOL/SOL',
  'USDC/USDT': 'USDC/USDT'
};

export default OrcaConnector;