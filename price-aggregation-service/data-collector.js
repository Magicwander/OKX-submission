import axios from 'axios';
import Decimal from 'decimal.js';

/**
 * Data Collector for Price Aggregation Service
 * Collects price and volume data from multiple sources
 */
export default class DataCollector {
  constructor(aggregationService, config = {}) {
    this.aggregationService = aggregationService;
    this.config = {
      collectInterval: config.collectInterval || 30000, // 30 seconds
      enableOKX: config.enableOKX !== false,
      enableBinance: config.enableBinance !== false,
      enableCoinGecko: config.enableCoinGecko !== false,
      enableMockData: config.enableMockData !== false,
      retryAttempts: config.retryAttempts || 3,
      timeout: config.timeout || 10000,
      ...config
    };
    
    this.isCollecting = false;
    this.collectInterval = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastCollection: null
    };
    
    // Token mappings for different exchanges
    this.tokenMappings = {
      'SOL/USDC': {
        okx: 'SOL-USDC',
        binance: 'SOLUSDC',
        coingecko: 'solana'
      },
      'BTC/USDT': {
        okx: 'BTC-USDT',
        binance: 'BTCUSDT',
        coingecko: 'bitcoin'
      },
      'ETH/USDT': {
        okx: 'ETH-USDT',
        binance: 'ETHUSDT',
        coingecko: 'ethereum'
      }
    };
  }
  
  /**
   * Start data collection
   */
  startCollection() {
    if (this.isCollecting) {
      console.log('Data collection already running');
      return;
    }
    
    this.isCollecting = true;
    console.log('Starting data collection...');
    
    // Initial collection
    this.collectAllData();
    
    // Set up interval
    this.collectInterval = setInterval(() => {
      this.collectAllData();
    }, this.config.collectInterval);
  }
  
  /**
   * Stop data collection
   */
  stopCollection() {
    if (!this.isCollecting) {
      console.log('Data collection not running');
      return;
    }
    
    this.isCollecting = false;
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }
    
    console.log('Data collection stopped');
  }
  
  /**
   * Collect data from all enabled sources
   */
  async collectAllData() {
    try {
      console.log('Collecting data from all sources...');
      
      const tokens = Object.keys(this.tokenMappings);
      const promises = [];
      
      for (const token of tokens) {
        if (this.config.enableOKX) {
          promises.push(this.collectOKXData(token));
        }
        
        if (this.config.enableBinance) {
          promises.push(this.collectBinanceData(token));
        }
        
        if (this.config.enableCoinGecko) {
          promises.push(this.collectCoinGeckoData(token));
        }
        
        if (this.config.enableMockData) {
          promises.push(this.collectMockData(token));
        }
      }
      
      // Execute all collections in parallel
      const results = await Promise.allSettled(promises);
      
      // Process results
      let successful = 0;
      let failed = 0;
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successful++;
        } else {
          failed++;
          console.error('Collection error:', result.reason);
        }
      });
      
      this.stats.totalRequests += promises.length;
      this.stats.successfulRequests += successful;
      this.stats.failedRequests += failed;
      this.stats.lastCollection = Date.now();
      
      console.log(`Collection completed: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error('Error in collectAllData:', error.message);
    }
  }
  
  /**
   * Collect data from OKX
   * @param {string} token - Token symbol
   */
  async collectOKXData(token) {
    try {
      const mapping = this.tokenMappings[token];
      if (!mapping || !mapping.okx) return;
      
      const symbol = mapping.okx;
      
      // Get ticker data
      const tickerResponse = await this.makeRequest(
        `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`
      );
      
      if (tickerResponse.data && tickerResponse.data.length > 0) {
        const ticker = tickerResponse.data[0];
        
        this.aggregationService.addPriceData(token, {
          price: parseFloat(ticker.last),
          volume: parseFloat(ticker.vol24h),
          timestamp: Date.now(),
          source: 'okx',
          metadata: {
            bid: parseFloat(ticker.bidPx),
            ask: parseFloat(ticker.askPx),
            high24h: parseFloat(ticker.high24h),
            low24h: parseFloat(ticker.low24h),
            change24h: parseFloat(ticker.chg24h)
          }
        });
      }
      
    } catch (error) {
      throw new Error(`OKX collection failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Collect data from Binance
   * @param {string} token - Token symbol
   */
  async collectBinanceData(token) {
    try {
      const mapping = this.tokenMappings[token];
      if (!mapping || !mapping.binance) return;
      
      const symbol = mapping.binance;
      
      // Get 24hr ticker statistics
      const response = await this.makeRequest(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
      );
      
      if (response) {
        this.aggregationService.addPriceData(token, {
          price: parseFloat(response.lastPrice),
          volume: parseFloat(response.volume),
          timestamp: Date.now(),
          source: 'binance',
          metadata: {
            bid: parseFloat(response.bidPrice),
            ask: parseFloat(response.askPrice),
            high24h: parseFloat(response.highPrice),
            low24h: parseFloat(response.lowPrice),
            change24h: parseFloat(response.priceChangePercent)
          }
        });
      }
      
    } catch (error) {
      throw new Error(`Binance collection failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Collect data from CoinGecko
   * @param {string} token - Token symbol
   */
  async collectCoinGeckoData(token) {
    try {
      const mapping = this.tokenMappings[token];
      if (!mapping || !mapping.coingecko) return;
      
      const coinId = mapping.coingecko;
      
      // Get simple price data
      const response = await this.makeRequest(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
      );
      
      if (response && response[coinId]) {
        const data = response[coinId];
        
        this.aggregationService.addPriceData(token, {
          price: data.usd,
          volume: data.usd_24h_vol || 0,
          timestamp: Date.now(),
          source: 'coingecko',
          metadata: {
            change24h: data.usd_24h_change || 0
          }
        });
      }
      
    } catch (error) {
      throw new Error(`CoinGecko collection failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Generate mock data for testing
   * @param {string} token - Token symbol
   */
  async collectMockData(token) {
    try {
      // Base prices for different tokens
      const basePrices = {
        'SOL/USDC': 177.5,
        'BTC/USDT': 109855.90,
        'ETH/USDT': 2572.07
      };
      
      const basePrice = basePrices[token] || 100;
      
      // Add some realistic variation (±2%)
      const variation = (Math.random() - 0.5) * 0.04; // ±2%
      const price = basePrice * (1 + variation);
      
      // Generate realistic volume
      const baseVolume = {
        'SOL/USDC': 1000000,
        'BTC/USDT': 500,
        'ETH/USDT': 10000
      };
      
      const volume = (baseVolume[token] || 10000) * (0.5 + Math.random());
      
      this.aggregationService.addPriceData(token, {
        price: price,
        volume: volume,
        timestamp: Date.now(),
        source: 'mock',
        metadata: {
          generated: true,
          basePrice: basePrice,
          variation: variation
        }
      });
      
    } catch (error) {
      throw new Error(`Mock data generation failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Make HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  async makeRequest(url, options = {}) {
    const config = {
      timeout: this.config.timeout,
      ...options
    };
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await axios.get(url, config);
        return response.data;
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Add custom token mapping
   * @param {string} token - Token symbol
   * @param {Object} mappings - Exchange mappings
   */
  addTokenMapping(token, mappings) {
    this.tokenMappings[token] = {
      ...this.tokenMappings[token],
      ...mappings
    };
  }
  
  /**
   * Get collection statistics
   * @returns {Object} Collection statistics
   */
  getStats() {
    return {
      ...this.stats,
      isCollecting: this.isCollecting,
      config: this.config,
      tokenMappings: this.tokenMappings,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Manually trigger data collection for a specific token
   * @param {string} token - Token symbol
   */
  async collectTokenData(token) {
    const promises = [];
    
    if (this.config.enableOKX) {
      promises.push(this.collectOKXData(token));
    }
    
    if (this.config.enableBinance) {
      promises.push(this.collectBinanceData(token));
    }
    
    if (this.config.enableCoinGecko) {
      promises.push(this.collectCoinGeckoData(token));
    }
    
    if (this.config.enableMockData) {
      promises.push(this.collectMockData(token));
    }
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Token ${token} collection: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, total: promises.length };
  }
}