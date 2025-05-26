import Decimal from 'decimal.js';
import { standardDeviation, mean, median, quantile } from 'simple-statistics';

/**
 * Advanced Price Aggregation Service
 * Implements VWAP, TWAP, and outlier detection for reliable price data
 */
export default class PriceAggregationService {
  constructor(config = {}) {
    this.config = {
      // Outlier detection settings
      zScoreThreshold: config.zScoreThreshold || 2.5,
      iqrMultiplier: config.iqrMultiplier || 1.5,
      minDataPoints: config.minDataPoints || 3,
      maxAge: config.maxAge || 300000, // 5 minutes
      
      // TWAP settings
      twapWindow: config.twapWindow || 3600000, // 1 hour
      twapInterval: config.twapInterval || 60000, // 1 minute
      
      // VWAP settings
      vwapWindow: config.vwapWindow || 3600000, // 1 hour
      minVolume: config.minVolume || 0.01,
      
      // General settings
      maxHistorySize: config.maxHistorySize || 1000,
      enableLogging: config.enableLogging || true
    };
    
    // Data storage
    this.priceHistory = new Map(); // token -> array of price data
    this.volumeHistory = new Map(); // token -> array of volume data
    this.sourceWeights = new Map(); // source -> weight
    
    // Initialize source weights
    this.initializeSourceWeights();
    
    // Statistics tracking
    this.stats = {
      totalPricesProcessed: 0,
      outliersDetected: 0,
      vwapCalculations: 0,
      twapCalculations: 0,
      lastUpdate: null
    };
  }
  
  /**
   * Initialize source weights for different data providers
   */
  initializeSourceWeights() {
    this.sourceWeights.set('okx', 1.0);
    this.sourceWeights.set('raydium', 0.8);
    this.sourceWeights.set('orca', 0.8);
    this.sourceWeights.set('binance', 1.0);
    this.sourceWeights.set('coinbase', 0.9);
  }
  
  /**
   * Add price data point
   * @param {string} token - Token symbol (e.g., 'SOL/USDC')
   * @param {Object} priceData - Price data object
   */
  addPriceData(token, priceData) {
    try {
      const normalizedData = this.normalizePriceData(priceData);
      
      if (!this.priceHistory.has(token)) {
        this.priceHistory.set(token, []);
        this.volumeHistory.set(token, []);
      }
      
      const history = this.priceHistory.get(token);
      const volumeHistory = this.volumeHistory.get(token);
      
      // Add to history
      history.push(normalizedData);
      if (normalizedData.volume) {
        volumeHistory.push({
          volume: normalizedData.volume,
          price: normalizedData.price,
          timestamp: normalizedData.timestamp,
          source: normalizedData.source
        });
      }
      
      // Cleanup old data
      this.cleanupOldData(token);
      
      this.stats.totalPricesProcessed++;
      this.stats.lastUpdate = Date.now();
      
      if (this.config.enableLogging) {
        console.log(`Added price data for ${token}: ${normalizedData.price} from ${normalizedData.source}`);
      }
      
    } catch (error) {
      console.error(`Error adding price data for ${token}:`, error.message);
    }
  }
  
  /**
   * Normalize price data to standard format
   * @param {Object} priceData - Raw price data
   * @returns {Object} Normalized price data
   */
  normalizePriceData(priceData) {
    return {
      price: new Decimal(priceData.price || 0),
      volume: priceData.volume ? new Decimal(priceData.volume) : null,
      timestamp: priceData.timestamp || Date.now(),
      source: priceData.source || 'unknown',
      weight: this.sourceWeights.get(priceData.source) || 0.5,
      metadata: priceData.metadata || {}
    };
  }
  
  /**
   * Clean up old data points
   * @param {string} token - Token symbol
   */
  cleanupOldData(token) {
    const now = Date.now();
    const maxAge = this.config.maxAge;
    const maxSize = this.config.maxHistorySize;
    
    // Clean price history
    const history = this.priceHistory.get(token);
    if (history) {
      // Remove old data
      const filtered = history.filter(data => (now - data.timestamp) <= maxAge);
      
      // Limit size
      if (filtered.length > maxSize) {
        filtered.splice(0, filtered.length - maxSize);
      }
      
      this.priceHistory.set(token, filtered);
    }
    
    // Clean volume history
    const volumeHistory = this.volumeHistory.get(token);
    if (volumeHistory) {
      const filtered = volumeHistory.filter(data => (now - data.timestamp) <= maxAge);
      
      if (filtered.length > maxSize) {
        filtered.splice(0, filtered.length - maxSize);
      }
      
      this.volumeHistory.set(token, filtered);
    }
  }
  
  /**
   * Calculate Volume Weighted Average Price (VWAP)
   * @param {string} token - Token symbol
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} VWAP calculation result
   */
  calculateVWAP(token, windowMs = null) {
    try {
      windowMs = windowMs || this.config.vwapWindow;
      const now = Date.now();
      const cutoffTime = now - windowMs;
      
      const volumeHistory = this.volumeHistory.get(token);
      if (!volumeHistory || volumeHistory.length === 0) {
        throw new Error(`No volume data available for ${token}`);
      }
      
      // Filter data within time window
      const relevantData = volumeHistory.filter(data => 
        data.timestamp >= cutoffTime && 
        data.volume && 
        data.volume.gte(this.config.minVolume)
      );
      
      if (relevantData.length < this.config.minDataPoints) {
        throw new Error(`Insufficient data points for VWAP calculation: ${relevantData.length}`);
      }
      
      // Remove outliers
      const cleanData = this.removeOutliers(relevantData, 'price');
      
      if (cleanData.length === 0) {
        throw new Error('No valid data after outlier removal');
      }
      
      // Calculate VWAP
      let totalVolumePrice = new Decimal(0);
      let totalVolume = new Decimal(0);
      
      for (const data of cleanData) {
        const volumePrice = data.price.mul(data.volume);
        totalVolumePrice = totalVolumePrice.add(volumePrice);
        totalVolume = totalVolume.add(data.volume);
      }
      
      if (totalVolume.eq(0)) {
        throw new Error('Total volume is zero');
      }
      
      const vwap = totalVolumePrice.div(totalVolume);
      
      this.stats.vwapCalculations++;
      
      return {
        vwap: vwap.toNumber(),
        totalVolume: totalVolume.toNumber(),
        dataPoints: cleanData.length,
        outliers: relevantData.length - cleanData.length,
        timeWindow: windowMs,
        timestamp: now,
        sources: [...new Set(cleanData.map(d => d.source))],
        confidence: this.calculateConfidence(cleanData),
        metadata: {
          minPrice: Math.min(...cleanData.map(d => d.price.toNumber())),
          maxPrice: Math.max(...cleanData.map(d => d.price.toNumber())),
          avgVolume: totalVolume.div(cleanData.length).toNumber()
        }
      };
      
    } catch (error) {
      throw new Error(`VWAP calculation failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Calculate Time Weighted Average Price (TWAP)
   * @param {string} token - Token symbol
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} TWAP calculation result
   */
  calculateTWAP(token, windowMs = null) {
    try {
      windowMs = windowMs || this.config.twapWindow;
      const now = Date.now();
      const cutoffTime = now - windowMs;
      
      const history = this.priceHistory.get(token);
      if (!history || history.length === 0) {
        throw new Error(`No price data available for ${token}`);
      }
      
      // Filter data within time window and sort by timestamp
      const relevantData = history
        .filter(data => data.timestamp >= cutoffTime)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      if (relevantData.length < this.config.minDataPoints) {
        throw new Error(`Insufficient data points for TWAP calculation: ${relevantData.length}`);
      }
      
      // Remove outliers
      const cleanData = this.removeOutliers(relevantData, 'price');
      
      if (cleanData.length === 0) {
        throw new Error('No valid data after outlier removal');
      }
      
      // Calculate time-weighted average
      let weightedSum = new Decimal(0);
      let totalWeight = new Decimal(0);
      
      for (let i = 0; i < cleanData.length; i++) {
        const current = cleanData[i];
        let timeWeight;
        
        if (i === cleanData.length - 1) {
          // Last data point - weight until now
          timeWeight = new Decimal(now - current.timestamp);
        } else {
          // Weight until next data point
          const next = cleanData[i + 1];
          timeWeight = new Decimal(next.timestamp - current.timestamp);
        }
        
        // Apply source weight
        const sourceWeight = new Decimal(current.weight);
        const finalWeight = timeWeight.mul(sourceWeight);
        
        weightedSum = weightedSum.add(current.price.mul(finalWeight));
        totalWeight = totalWeight.add(finalWeight);
      }
      
      if (totalWeight.eq(0)) {
        throw new Error('Total weight is zero');
      }
      
      const twap = weightedSum.div(totalWeight);
      
      this.stats.twapCalculations++;
      
      return {
        twap: twap.toNumber(),
        dataPoints: cleanData.length,
        outliers: relevantData.length - cleanData.length,
        timeWindow: windowMs,
        timestamp: now,
        sources: [...new Set(cleanData.map(d => d.source))],
        confidence: this.calculateConfidence(cleanData),
        metadata: {
          minPrice: Math.min(...cleanData.map(d => d.price.toNumber())),
          maxPrice: Math.max(...cleanData.map(d => d.price.toNumber())),
          priceStdDev: this.calculateStandardDeviation(cleanData.map(d => d.price.toNumber())),
          timeSpread: cleanData[cleanData.length - 1].timestamp - cleanData[0].timestamp
        }
      };
      
    } catch (error) {
      throw new Error(`TWAP calculation failed for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Remove outliers using multiple methods
   * @param {Array} data - Array of data points
   * @param {string} field - Field to analyze for outliers
   * @returns {Array} Filtered data without outliers
   */
  removeOutliers(data, field) {
    if (data.length < this.config.minDataPoints) {
      return data;
    }
    
    const values = data.map(d => d[field].toNumber());
    
    // Method 1: Z-Score
    const zScoreFiltered = this.removeOutliersZScore(data, values);
    
    // Method 2: IQR (Interquartile Range)
    const iqrFiltered = this.removeOutliersIQR(zScoreFiltered, field);
    
    const outliersRemoved = data.length - iqrFiltered.length;
    if (outliersRemoved > 0) {
      this.stats.outliersDetected += outliersRemoved;
      
      if (this.config.enableLogging) {
        console.log(`Removed ${outliersRemoved} outliers from ${data.length} data points`);
      }
    }
    
    return iqrFiltered;
  }
  
  /**
   * Remove outliers using Z-Score method
   * @param {Array} data - Data points
   * @param {Array} values - Numeric values for analysis
   * @returns {Array} Filtered data
   */
  removeOutliersZScore(data, values) {
    if (values.length < 3) return data;
    
    const meanValue = mean(values);
    const stdDev = standardDeviation(values);
    
    if (stdDev === 0) return data;
    
    return data.filter((_, index) => {
      const zScore = Math.abs((values[index] - meanValue) / stdDev);
      return zScore <= this.config.zScoreThreshold;
    });
  }
  
  /**
   * Remove outliers using IQR method
   * @param {Array} data - Data points
   * @param {string} field - Field to analyze
   * @returns {Array} Filtered data
   */
  removeOutliersIQR(data, field) {
    if (data.length < 4) return data;
    
    const values = data.map(d => d[field].toNumber()).sort((a, b) => a - b);
    
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    
    const lowerBound = q1 - (this.config.iqrMultiplier * iqr);
    const upperBound = q3 + (this.config.iqrMultiplier * iqr);
    
    return data.filter(d => {
      const value = d[field].toNumber();
      return value >= lowerBound && value <= upperBound;
    });
  }
  
  /**
   * Calculate confidence score for aggregated price
   * @param {Array} data - Data points used in calculation
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(data) {
    if (data.length === 0) return 0;
    
    // Factors affecting confidence:
    // 1. Number of data points
    // 2. Number of different sources
    // 3. Price consistency (low standard deviation)
    // 4. Source weights
    
    const dataPointsFactor = Math.min(data.length / 10, 1); // Max at 10 points
    const sourcesFactor = Math.min([...new Set(data.map(d => d.source))].length / 3, 1); // Max at 3 sources
    
    const prices = data.map(d => d.price.toNumber());
    const priceStdDev = this.calculateStandardDeviation(prices);
    const avgPrice = mean(prices);
    const consistencyFactor = avgPrice > 0 ? Math.max(0, 1 - (priceStdDev / avgPrice)) : 0;
    
    const avgWeight = mean(data.map(d => d.weight));
    const weightFactor = avgWeight;
    
    // Weighted average of factors
    const confidence = (
      dataPointsFactor * 0.3 +
      sourcesFactor * 0.3 +
      consistencyFactor * 0.3 +
      weightFactor * 0.1
    );
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Calculate standard deviation
   * @param {Array} values - Numeric values
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(values) {
    if (values.length < 2) return 0;
    return standardDeviation(values);
  }
  
  /**
   * Get aggregated price using multiple methods
   * @param {string} token - Token symbol
   * @param {Object} options - Aggregation options
   * @returns {Object} Aggregated price data
   */
  getAggregatedPrice(token, options = {}) {
    try {
      const results = {};
      
      // Calculate VWAP if volume data available
      try {
        results.vwap = this.calculateVWAP(token, options.vwapWindow);
      } catch (error) {
        results.vwapError = error.message;
      }
      
      // Calculate TWAP
      try {
        results.twap = this.calculateTWAP(token, options.twapWindow);
      } catch (error) {
        results.twapError = error.message;
      }
      
      // Simple weighted average as fallback
      try {
        results.weightedAverage = this.calculateWeightedAverage(token);
      } catch (error) {
        results.weightedAverageError = error.message;
      }
      
      // Determine best price
      results.recommendedPrice = this.selectBestPrice(results);
      
      return {
        token,
        timestamp: Date.now(),
        ...results,
        metadata: {
          dataPoints: this.priceHistory.get(token)?.length || 0,
          volumePoints: this.volumeHistory.get(token)?.length || 0,
          sources: this.getActiveSources(token)
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to get aggregated price for ${token}: ${error.message}`);
    }
  }
  
  /**
   * Calculate simple weighted average
   * @param {string} token - Token symbol
   * @returns {Object} Weighted average result
   */
  calculateWeightedAverage(token) {
    const history = this.priceHistory.get(token);
    if (!history || history.length === 0) {
      throw new Error(`No price data available for ${token}`);
    }
    
    const recentData = history.slice(-10); // Last 10 data points
    const cleanData = this.removeOutliers(recentData, 'price');
    
    if (cleanData.length === 0) {
      throw new Error('No valid data after outlier removal');
    }
    
    let weightedSum = new Decimal(0);
    let totalWeight = new Decimal(0);
    
    for (const data of cleanData) {
      const weight = new Decimal(data.weight);
      weightedSum = weightedSum.add(data.price.mul(weight));
      totalWeight = totalWeight.add(weight);
    }
    
    const weightedAverage = weightedSum.div(totalWeight);
    
    return {
      price: weightedAverage.toNumber(),
      dataPoints: cleanData.length,
      confidence: this.calculateConfidence(cleanData),
      timestamp: Date.now()
    };
  }
  
  /**
   * Select the best price from available calculations
   * @param {Object} results - Calculation results
   * @returns {Object} Best price recommendation
   */
  selectBestPrice(results) {
    const candidates = [];
    
    if (results.vwap && !results.vwapError) {
      candidates.push({
        type: 'vwap',
        price: results.vwap.vwap,
        confidence: results.vwap.confidence,
        dataPoints: results.vwap.dataPoints
      });
    }
    
    if (results.twap && !results.twapError) {
      candidates.push({
        type: 'twap',
        price: results.twap.twap,
        confidence: results.twap.confidence,
        dataPoints: results.twap.dataPoints
      });
    }
    
    if (results.weightedAverage && !results.weightedAverageError) {
      candidates.push({
        type: 'weightedAverage',
        price: results.weightedAverage.price,
        confidence: results.weightedAverage.confidence,
        dataPoints: results.weightedAverage.dataPoints
      });
    }
    
    if (candidates.length === 0) {
      return { error: 'No valid price calculations available' };
    }
    
    // Select based on confidence and data points
    const best = candidates.reduce((best, current) => {
      const bestScore = best.confidence * Math.log(best.dataPoints + 1);
      const currentScore = current.confidence * Math.log(current.dataPoints + 1);
      return currentScore > bestScore ? current : best;
    });
    
    return best;
  }
  
  /**
   * Get active sources for a token
   * @param {string} token - Token symbol
   * @returns {Array} List of active sources
   */
  getActiveSources(token) {
    const history = this.priceHistory.get(token);
    if (!history) return [];
    
    const recentData = history.filter(d => (Date.now() - d.timestamp) <= this.config.maxAge);
    return [...new Set(recentData.map(d => d.source))];
  }
  
  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTokens: this.priceHistory.size,
      totalDataPoints: Array.from(this.priceHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalVolumePoints: Array.from(this.volumeHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
      sourceWeights: Object.fromEntries(this.sourceWeights),
      config: this.config
    };
  }
  
  /**
   * Clear all data for a token
   * @param {string} token - Token symbol
   */
  clearTokenData(token) {
    this.priceHistory.delete(token);
    this.volumeHistory.delete(token);
  }
  
  /**
   * Clear all data
   */
  clearAllData() {
    this.priceHistory.clear();
    this.volumeHistory.clear();
    this.stats = {
      totalPricesProcessed: 0,
      outliersDetected: 0,
      vwapCalculations: 0,
      twapCalculations: 0,
      lastUpdate: null
    };
  }
}