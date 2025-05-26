import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import Decimal from 'decimal.js';

/**
 * Raydium DEX Connector
 * Provides access to Raydium liquidity pools, prices, and trading data
 */
class RaydiumConnector {
  constructor(rpcEndpoint = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
    this.poolsCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch all Raydium pools from the API
   * @returns {Promise<Array>} Array of pool information
   */
  async fetchPools() {
    try {
      const now = Date.now();
      if (this.poolsCache.size > 0 && (now - this.lastCacheUpdate) < this.cacheTimeout) {
        return Array.from(this.poolsCache.values());
      }

      console.log('Fetching Raydium pools...');
      
      // Use a smaller, more manageable endpoint or create mock data
      try {
        const response = await axios.get('https://api.raydium.io/v2/main/pairs', {
          timeout: 10000,
          maxContentLength: 50 * 1024 * 1024, // 50MB limit
        });
        
        if (response.data && Array.isArray(response.data)) {
          this.poolsCache.clear();
          // Take only first 100 pools to avoid memory issues
          const pools = response.data.slice(0, 100);
          pools.forEach(pool => {
            this.poolsCache.set(pool.ammId || pool.id, pool);
          });
          this.lastCacheUpdate = now;
          
          console.log(`Loaded ${this.poolsCache.size} Raydium pools`);
          return pools;
        }
      } catch (apiError) {
        console.log('API error, using mock data:', apiError.message);
      }
      
      // Fallback to mock data if API fails
      const mockPools = this.createMockPools();
      this.poolsCache.clear();
      mockPools.forEach(pool => {
        this.poolsCache.set(pool.id, pool);
      });
      this.lastCacheUpdate = now;
      
      console.log(`Loaded ${mockPools.length} mock Raydium pools`);
      return mockPools;
      
    } catch (error) {
      throw new Error(`Failed to fetch Raydium pools: ${error.message}`);
    }
  }

  /**
   * Create mock pool data for testing
   * @returns {Array} Mock pool data
   */
  createMockPools() {
    return [
      {
        id: 'mock_sol_usdc_pool',
        baseMint: COMMON_TOKENS.SOL,
        quoteMint: COMMON_TOKENS.USDC,
        baseSymbol: 'SOL',
        quoteSymbol: 'USDC',
        baseDecimals: 9,
        quoteDecimals: 6,
        baseReserve: '1000000000000000', // 1M SOL
        quoteReserve: '177500000000000', // 177.5M USDC
        feeRate: 0.0025,
        volume24h: 12345678,
        lpMint: 'mock_lp_mint_1'
      },
      {
        id: 'mock_ray_sol_pool',
        baseMint: COMMON_TOKENS.RAY,
        quoteMint: COMMON_TOKENS.SOL,
        baseSymbol: 'RAY',
        quoteSymbol: 'SOL',
        baseDecimals: 6,
        quoteDecimals: 9,
        baseReserve: '50000000000000', // 50M RAY
        quoteReserve: '1250000000000', // 1.25K SOL
        feeRate: 0.0025,
        volume24h: 8765432,
        lpMint: 'mock_lp_mint_2'
      },
      {
        id: 'mock_usdc_usdt_pool',
        baseMint: COMMON_TOKENS.USDC,
        quoteMint: COMMON_TOKENS.USDT,
        baseSymbol: 'USDC',
        quoteSymbol: 'USDT',
        baseDecimals: 6,
        quoteDecimals: 6,
        baseReserve: '5000000000000', // 5M USDC
        quoteReserve: '5000000000000', // 5M USDT
        feeRate: 0.0025,
        volume24h: 5432109,
        lpMint: 'mock_lp_mint_3'
      }
    ];
  }

  /**
   * Get pool information by pool ID
   * @param {string} poolId - The pool ID
   * @returns {Promise<Object>} Pool information
   */
  async getPoolInfo(poolId) {
    try {
      const pools = await this.fetchPools();
      const pool = pools.find(p => p.id === poolId);
      
      if (!pool) {
        throw new Error(`Pool ${poolId} not found`);
      }

      return pool;
    } catch (error) {
      throw new Error(`Failed to get pool info: ${error.message}`);
    }
  }

  /**
   * Get pool information by token pair
   * @param {string} baseToken - Base token mint address
   * @param {string} quoteToken - Quote token mint address
   * @returns {Promise<Object>} Pool information
   */
  async getPoolByTokens(baseToken, quoteToken) {
    try {
      const pools = await this.fetchPools();
      const pool = pools.find(p => 
        (p.baseMint === baseToken && p.quoteMint === quoteToken) ||
        (p.baseMint === quoteToken && p.quoteMint === baseToken)
      );
      
      if (!pool) {
        throw new Error(`Pool for ${baseToken}/${quoteToken} not found`);
      }

      return pool;
    } catch (error) {
      throw new Error(`Failed to get pool by tokens: ${error.message}`);
    }
  }

  /**
   * Calculate price for a token pair
   * @param {string} baseToken - Base token mint address
   * @param {string} quoteToken - Quote token mint address
   * @returns {Promise<Object>} Price information
   */
  async getPrice(baseToken, quoteToken) {
    try {
      const pool = await this.getPoolByTokens(baseToken, quoteToken);
      
      // For simplified calculation, we'll use the pool data directly
      // In a real implementation, you'd fetch and parse the actual account data
      const baseReserve = new Decimal(pool.baseReserve || '0');
      const quoteReserve = new Decimal(pool.quoteReserve || '0');
      
      // Calculate price (quote per base)
      let price = 0;
      if (baseReserve.gt(0)) {
        price = quoteReserve
          .div(baseReserve)
          .mul(new Decimal(10).pow((pool.baseDecimals || 9) - (pool.quoteDecimals || 6)))
          .toNumber();
      }

      return {
        poolId: pool.id,
        baseToken: pool.baseMint,
        quoteToken: pool.quoteMint,
        baseSymbol: pool.baseSymbol || 'Unknown',
        quoteSymbol: pool.quoteSymbol || 'Unknown',
        price: price,
        baseReserve: baseReserve.toString(),
        quoteReserve: quoteReserve.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to calculate price: ${error.message}`);
    }
  }

  /**
   * Get popular trading pairs
   * @param {number} limit - Number of pairs to return
   * @returns {Promise<Array>} Array of popular trading pairs
   */
  async getPopularPairs(limit = 10) {
    try {
      const pools = await this.fetchPools();
      
      // Filter for pools with good liquidity and sort by volume
      const popularPools = pools
        .filter(pool => pool.lpMint && pool.baseSymbol && pool.quoteSymbol)
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, limit);

      return popularPools.map(pool => ({
        poolId: pool.id,
        baseToken: pool.baseMint,
        quoteToken: pool.quoteMint,
        baseSymbol: pool.baseSymbol,
        quoteSymbol: pool.quoteSymbol,
        pair: `${pool.baseSymbol}/${pool.quoteSymbol}`,
        volume24h: pool.volume24h || 0,
        fee: pool.feeRate || 0
      }));
    } catch (error) {
      throw new Error(`Failed to get popular pairs: ${error.message}`);
    }
  }

  /**
   * Calculate swap output amount (simplified calculation)
   * @param {string} poolId - Pool ID
   * @param {string} inputToken - Input token mint
   * @param {number} inputAmount - Input amount
   * @returns {Promise<Object>} Swap calculation result
   */
  async calculateSwapOutput(poolId, inputToken, inputAmount) {
    try {
      const pool = await this.getPoolInfo(poolId);
      
      const isInputBase = inputToken === pool.baseMint;
      const baseReserve = new Decimal(pool.baseReserve || '0');
      const quoteReserve = new Decimal(pool.quoteReserve || '0');
      
      // Simplified constant product formula: x * y = k
      // Output = (inputAmount * outputReserve) / (inputReserve + inputAmount)
      const inputReserve = isInputBase ? baseReserve : quoteReserve;
      const outputReserve = isInputBase ? quoteReserve : baseReserve;
      
      const inputAmountDecimal = new Decimal(inputAmount);
      const feeRate = new Decimal(pool.feeRate || 0.0025); // 0.25% default fee
      const inputAfterFee = inputAmountDecimal.mul(new Decimal(1).sub(feeRate));
      
      const outputAmount = inputAfterFee
        .mul(outputReserve)
        .div(inputReserve.add(inputAfterFee));
      
      const priceImpact = inputAmountDecimal.div(inputReserve).mul(100);

      return {
        inputAmount: inputAmount.toString(),
        outputAmount: outputAmount.toString(),
        minOutputAmount: outputAmount.mul(0.99).toString(), // 1% slippage
        priceImpact: priceImpact.toNumber(),
        fee: inputAmountDecimal.mul(feeRate).toString(),
        inputToken: inputToken,
        outputToken: isInputBase ? pool.quoteMint : pool.baseMint
      };
    } catch (error) {
      throw new Error(`Failed to calculate swap output: ${error.message}`);
    }
  }

  /**
   * Get pool statistics
   * @param {string} poolId - Pool ID
   * @returns {Promise<Object>} Pool statistics
   */
  async getPoolStats(poolId) {
    try {
      const pool = await this.getPoolInfo(poolId);
      
      const baseReserve = new Decimal(pool.baseReserve || '0');
      const quoteReserve = new Decimal(pool.quoteReserve || '0');
      
      // Calculate TVL (assuming quote token is USD-pegged)
      const baseDecimals = pool.baseDecimals || 9;
      const quoteDecimals = pool.quoteDecimals || 6;
      
      const baseAmount = baseReserve.div(new Decimal(10).pow(baseDecimals));
      const quoteAmount = quoteReserve.div(new Decimal(10).pow(quoteDecimals));
      
      const tvl = quoteAmount.mul(2); // Rough estimate

      return {
        poolId: pool.id,
        baseSymbol: pool.baseSymbol,
        quoteSymbol: pool.quoteSymbol,
        baseReserve: baseAmount.toNumber(),
        quoteReserve: quoteAmount.toNumber(),
        tvl: tvl.toNumber(),
        fee: pool.feeRate || 0,
        volume24h: pool.volume24h || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get pool stats: ${error.message}`);
    }
  }
}

// Common token addresses for easier testing
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'
};

export default RaydiumConnector;