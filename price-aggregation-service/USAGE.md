# Price Aggregation Service - Usage Guide

This guide provides practical examples and best practices for using the Price Aggregation Service.

## 🚀 Getting Started

### Basic Setup

```javascript
import { createAggregationService } from './index.js';

// Create service with default settings
const service = createAggregationService();

// Start collecting data
service.start();

// Wait a moment for data collection
setTimeout(() => {
  // Get aggregated price
  const price = service.getPrice('SOL/USDC');
  console.log('Current price:', price);
  
  // Stop when done
  service.stop();
}, 30000);
```

### Custom Configuration

```javascript
import { createAggregationService } from './index.js';

const service = createAggregationService({
  aggregation: {
    zScoreThreshold: 2.0,      // More sensitive outlier detection
    iqrMultiplier: 1.2,        // Stricter IQR filtering
    minDataPoints: 5,          // Require more data points
    maxAge: 180000,            // 3-minute data expiry
    enableLogging: true        // Enable debug logs
  },
  collection: {
    collectInterval: 15000,    // Collect every 15 seconds
    enableOKX: true,
    enableBinance: true,
    enableCoinGecko: false,    // Disable to avoid rate limits
    enableMockData: true       // Enable for testing
  }
});
```

## 📊 Working with VWAP

### Basic VWAP Calculation

```javascript
import PriceAggregationService from './price-aggregation-service.js';

const service = new PriceAggregationService();

// Add sample data with volume
const priceData = [
  { price: 177.50, volume: 1000, source: 'okx', timestamp: Date.now() - 300000 },
  { price: 177.45, volume: 1500, source: 'binance', timestamp: Date.now() - 240000 },
  { price: 177.55, volume: 800, source: 'coinbase', timestamp: Date.now() - 180000 },
  { price: 177.48, volume: 1200, source: 'kraken', timestamp: Date.now() - 120000 },
  { price: 177.52, volume: 900, source: 'huobi', timestamp: Date.now() - 60000 }
];

priceData.forEach(data => {
  service.addPriceData('SOL/USDC', data);
});

// Calculate VWAP
try {
  const vwap = service.calculateVWAP('SOL/USDC');
  
  console.log('VWAP Analysis:');
  console.log(`Price: $${vwap.vwap.toFixed(4)}`);
  console.log(`Total Volume: ${vwap.totalVolume.toLocaleString()}`);
  console.log(`Data Points: ${vwap.dataPoints}`);
  console.log(`Confidence: ${(vwap.confidence * 100).toFixed(1)}%`);
  console.log(`Sources: ${vwap.sources.join(', ')}`);
  
  if (vwap.outliers > 0) {
    console.log(`Outliers removed: ${vwap.outliers}`);
  }
  
} catch (error) {
  console.error('VWAP calculation failed:', error.message);
}
```

### VWAP with Different Time Windows

```javascript
// Test different time windows
const windows = [
  { name: '5 minutes', ms: 5 * 60 * 1000 },
  { name: '15 minutes', ms: 15 * 60 * 1000 },
  { name: '1 hour', ms: 60 * 60 * 1000 },
  { name: '4 hours', ms: 4 * 60 * 60 * 1000 }
];

windows.forEach(window => {
  try {
    const vwap = service.calculateVWAP('SOL/USDC', window.ms);
    console.log(`${window.name} VWAP: $${vwap.vwap.toFixed(4)} (${vwap.dataPoints} points)`);
  } catch (error) {
    console.log(`${window.name} VWAP: Not enough data`);
  }
});
```

### VWAP for Trading Decisions

```javascript
function getTradingSignal(token) {
  try {
    const vwap = service.calculateVWAP(token);
    const currentPrice = vwap.metadata.maxPrice; // Latest price
    
    const deviation = ((currentPrice - vwap.vwap) / vwap.vwap) * 100;
    
    if (vwap.confidence < 0.7) {
      return { signal: 'HOLD', reason: 'Low confidence data' };
    }
    
    if (deviation > 2) {
      return { signal: 'SELL', reason: `Price ${deviation.toFixed(2)}% above VWAP` };
    } else if (deviation < -2) {
      return { signal: 'BUY', reason: `Price ${Math.abs(deviation).toFixed(2)}% below VWAP` };
    } else {
      return { signal: 'HOLD', reason: 'Price near VWAP' };
    }
    
  } catch (error) {
    return { signal: 'HOLD', reason: 'Insufficient data' };
  }
}

const signal = getTradingSignal('SOL/USDC');
console.log(`Trading Signal: ${signal.signal} - ${signal.reason}`);
```

## ⏰ Working with TWAP

### Basic TWAP Calculation

```javascript
// Add time-series data
const timeSeriesData = [
  { price: 177.00, source: 'okx', timestamp: Date.now() - 3600000 },    // 1 hour ago
  { price: 177.20, source: 'binance', timestamp: Date.now() - 2700000 }, // 45 min ago
  { price: 177.40, source: 'coinbase', timestamp: Date.now() - 1800000 }, // 30 min ago
  { price: 177.60, source: 'kraken', timestamp: Date.now() - 900000 },   // 15 min ago
  { price: 177.50, source: 'huobi', timestamp: Date.now() - 300000 }     // 5 min ago
];

timeSeriesData.forEach(data => {
  service.addPriceData('SOL/USDC', data);
});

try {
  const twap = service.calculateTWAP('SOL/USDC');
  
  console.log('TWAP Analysis:');
  console.log(`Price: $${twap.twap.toFixed(4)}`);
  console.log(`Data Points: ${twap.dataPoints}`);
  console.log(`Time Span: ${(twap.metadata.timeSpread / 1000 / 60).toFixed(0)} minutes`);
  console.log(`Price Volatility: ${twap.metadata.priceStdDev.toFixed(4)}`);
  console.log(`Confidence: ${(twap.confidence * 100).toFixed(1)}%`);
  
} catch (error) {
  console.error('TWAP calculation failed:', error.message);
}
```

### TWAP Trend Analysis

```javascript
function analyzeTrend(token, windows = [15, 30, 60]) {
  const trends = [];
  
  windows.forEach(minutes => {
    try {
      const windowMs = minutes * 60 * 1000;
      const twap = service.calculateTWAP(token, windowMs);
      
      trends.push({
        window: `${minutes}min`,
        price: twap.twap,
        confidence: twap.confidence,
        dataPoints: twap.dataPoints
      });
      
    } catch (error) {
      trends.push({
        window: `${minutes}min`,
        error: error.message
      });
    }
  });
  
  // Analyze trend direction
  const validTrends = trends.filter(t => !t.error);
  if (validTrends.length >= 2) {
    const shortTerm = validTrends[0].price;
    const longTerm = validTrends[validTrends.length - 1].price;
    const direction = shortTerm > longTerm ? 'UPWARD' : 'DOWNWARD';
    const strength = Math.abs((shortTerm - longTerm) / longTerm) * 100;
    
    console.log(`Trend Analysis for ${token}:`);
    console.log(`Direction: ${direction}`);
    console.log(`Strength: ${strength.toFixed(2)}%`);
    console.log('TWAP Values:', validTrends);
  }
  
  return trends;
}

analyzeTrend('SOL/USDC');
```

## 🔍 Outlier Detection Examples

### Detecting Market Manipulation

```javascript
// Simulate potential market manipulation
const suspiciousData = [
  { price: 177.50, volume: 1000, source: 'okx' },
  { price: 177.48, volume: 1200, source: 'binance' },
  { price: 177.52, volume: 800, source: 'coinbase' },
  { price: 200.00, volume: 50, source: 'suspicious_exchange' }, // Potential manipulation
  { price: 177.49, volume: 1100, source: 'kraken' }
];

service.clearTokenData('MANIPULATION/TEST');

suspiciousData.forEach(data => {
  service.addPriceData('MANIPULATION/TEST', {
    ...data,
    timestamp: Date.now() - Math.random() * 60000
  });
});

try {
  const result = service.calculateVWAP('MANIPULATION/TEST');
  
  console.log('Market Manipulation Detection:');
  console.log(`Original data points: ${suspiciousData.length}`);
  console.log(`Data points used: ${result.dataPoints}`);
  console.log(`Outliers detected: ${result.outliers}`);
  console.log(`Clean VWAP: $${result.vwap.toFixed(4)}`);
  
  if (result.outliers > 0) {
    console.log('⚠️ Potential market manipulation detected and filtered');
  }
  
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

### Custom Outlier Sensitivity

```javascript
// Create services with different sensitivity levels
const strictService = new PriceAggregationService({
  zScoreThreshold: 1.5,  // Very sensitive
  iqrMultiplier: 1.0,
  enableLogging: false
});

const lenientService = new PriceAggregationService({
  zScoreThreshold: 3.0,  // Less sensitive
  iqrMultiplier: 2.0,
  enableLogging: false
});

const testData = [
  { price: 177.50, source: 'normal1' },
  { price: 177.45, source: 'normal2' },
  { price: 177.55, source: 'normal3' },
  { price: 180.00, source: 'outlier1' },  // +1.4% deviation
  { price: 185.00, source: 'outlier2' }   // +4.2% deviation
];

// Test both services
['STRICT/TEST', 'LENIENT/TEST'].forEach((token, index) => {
  const currentService = index === 0 ? strictService : lenientService;
  const serviceName = index === 0 ? 'Strict' : 'Lenient';
  
  testData.forEach(data => {
    currentService.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const result = currentService.calculateTWAP(token);
    console.log(`${serviceName} Service: ${result.outliers} outliers, TWAP: $${result.twap.toFixed(4)}`);
  } catch (error) {
    console.log(`${serviceName} Service: Error - ${error.message}`);
  }
});
```

## 📈 Real-time Price Monitoring

### Live Price Feed

```javascript
import { createAggregationService } from './index.js';

class PriceMonitor {
  constructor() {
    this.service = createAggregationService({
      aggregation: {
        maxAge: 60000,  // 1-minute data window
        enableLogging: false
      },
      collection: {
        collectInterval: 10000,  // Collect every 10 seconds
        enableMockData: true     // Use mock data for demo
      }
    });
    
    this.alerts = [];
  }
  
  start() {
    this.service.start();
    
    // Monitor prices every 30 seconds
    this.monitorInterval = setInterval(() => {
      this.checkPrices();
    }, 30000);
    
    console.log('Price monitoring started...');
  }
  
  stop() {
    this.service.stop();
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    console.log('Price monitoring stopped.');
  }
  
  checkPrices() {
    const tokens = ['SOL/USDC', 'BTC/USDT', 'ETH/USDT'];
    
    tokens.forEach(token => {
      try {
        const price = this.service.getPrice(token);
        
        if (price.recommendedPrice && !price.recommendedPrice.error) {
          const currentPrice = price.recommendedPrice.price;
          const confidence = price.recommendedPrice.confidence;
          
          console.log(`${token}: $${currentPrice.toFixed(4)} (${(confidence * 100).toFixed(1)}% confidence)`);
          
          // Check for alerts
          this.checkAlerts(token, currentPrice, confidence);
        }
        
      } catch (error) {
        console.log(`${token}: Error - ${error.message}`);
      }
    });
  }
  
  addAlert(token, condition, threshold, message) {
    this.alerts.push({ token, condition, threshold, message });
  }
  
  checkAlerts(token, price, confidence) {
    this.alerts.forEach(alert => {
      if (alert.token === token) {
        let triggered = false;
        
        switch (alert.condition) {
          case 'above':
            triggered = price > alert.threshold;
            break;
          case 'below':
            triggered = price < alert.threshold;
            break;
          case 'low_confidence':
            triggered = confidence < alert.threshold;
            break;
        }
        
        if (triggered) {
          console.log(`🚨 ALERT: ${alert.message} (${token}: $${price.toFixed(4)})`);
        }
      }
    });
  }
}

// Usage example
const monitor = new PriceMonitor();

// Add some alerts
monitor.addAlert('SOL/USDC', 'above', 180.00, 'SOL price above $180');
monitor.addAlert('SOL/USDC', 'below', 175.00, 'SOL price below $175');
monitor.addAlert('SOL/USDC', 'low_confidence', 0.7, 'Low confidence SOL price data');

// Start monitoring
monitor.start();

// Stop after 2 minutes
setTimeout(() => {
  monitor.stop();
}, 120000);
```

### Price Comparison Dashboard

```javascript
function createPriceDashboard() {
  const service = createAggregationService();
  service.start();
  
  setInterval(() => {
    console.clear();
    console.log('📊 CRYPTOCURRENCY PRICE DASHBOARD');
    console.log('='.repeat(60));
    
    const tokens = ['SOL/USDC', 'BTC/USDT', 'ETH/USDT'];
    
    tokens.forEach(token => {
      try {
        const analysis = service.getPrice(token);
        
        console.log(`\n💰 ${token}:`);
        console.log('-'.repeat(30));
        
        if (analysis.recommendedPrice && !analysis.recommendedPrice.error) {
          console.log(`Best Price: $${analysis.recommendedPrice.price.toFixed(4)} (${analysis.recommendedPrice.type.toUpperCase()})`);
          console.log(`Confidence: ${(analysis.recommendedPrice.confidence * 100).toFixed(1)}%`);
        }
        
        if (analysis.vwap) {
          console.log(`VWAP: $${analysis.vwap.vwap.toFixed(4)} (Vol: ${analysis.vwap.totalVolume.toLocaleString()})`);
        }
        
        if (analysis.twap) {
          console.log(`TWAP: $${analysis.twap.twap.toFixed(4)} (${analysis.twap.dataPoints} points)`);
        }
        
        console.log(`Sources: ${analysis.metadata.sources.join(', ')}`);
        
        // Show price comparison
        if (analysis.vwap && analysis.twap) {
          const spread = analysis.vwap.vwap - analysis.twap.twap;
          const spreadPercent = (spread / analysis.twap.twap) * 100;
          console.log(`VWAP-TWAP Spread: $${spread.toFixed(4)} (${spreadPercent.toFixed(2)}%)`);
        }
        
      } catch (error) {
        console.log(`\n💰 ${token}: ❌ ${error.message}`);
      }
    });
    
    console.log(`\n🕐 Last Update: ${new Date().toLocaleTimeString()}`);
    
  }, 15000); // Update every 15 seconds
}

// Run dashboard
createPriceDashboard();
```

## 🔧 Advanced Configuration

### Custom Source Weights

```javascript
const service = new PriceAggregationService();

// Modify source weights based on reliability
service.sourceWeights.set('okx', 1.0);        // Highest weight
service.sourceWeights.set('binance', 0.95);   // Slightly lower
service.sourceWeights.set('coinbase', 0.9);   // Lower weight
service.sourceWeights.set('raydium', 0.7);    // DEX weight
service.sourceWeights.set('orca', 0.7);       // DEX weight
service.sourceWeights.set('unknown', 0.3);    // Unknown sources

console.log('Source weights:', Object.fromEntries(service.sourceWeights));
```

### Performance Optimization

```javascript
// High-performance configuration for production
const productionService = new PriceAggregationService({
  // Reduce memory usage
  maxHistorySize: 500,
  maxAge: 180000,  // 3 minutes
  
  // Optimize calculations
  minDataPoints: 3,
  zScoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  
  // Disable logging in production
  enableLogging: false
});

// Batch data processing
function batchAddPriceData(service, token, dataArray) {
  const startTime = Date.now();
  
  dataArray.forEach(data => {
    service.addPriceData(token, data);
  });
  
  const endTime = Date.now();
  console.log(`Processed ${dataArray.length} data points in ${endTime - startTime}ms`);
}
```

### Error Handling Best Practices

```javascript
function robustPriceCalculation(service, token) {
  const results = {
    vwap: null,
    twap: null,
    weightedAverage: null,
    errors: []
  };
  
  // Try VWAP
  try {
    results.vwap = service.calculateVWAP(token);
  } catch (error) {
    results.errors.push(`VWAP: ${error.message}`);
  }
  
  // Try TWAP
  try {
    results.twap = service.calculateTWAP(token);
  } catch (error) {
    results.errors.push(`TWAP: ${error.message}`);
  }
  
  // Try weighted average as fallback
  try {
    results.weightedAverage = service.calculateWeightedAverage(token);
  } catch (error) {
    results.errors.push(`Weighted Average: ${error.message}`);
  }
  
  // Determine best available price
  if (results.vwap) {
    results.bestPrice = { price: results.vwap.vwap, method: 'VWAP', confidence: results.vwap.confidence };
  } else if (results.twap) {
    results.bestPrice = { price: results.twap.twap, method: 'TWAP', confidence: results.twap.confidence };
  } else if (results.weightedAverage) {
    results.bestPrice = { price: results.weightedAverage.price, method: 'Weighted', confidence: results.weightedAverage.confidence };
  } else {
    results.bestPrice = { error: 'No price calculation available' };
  }
  
  return results;
}

// Usage
const result = robustPriceCalculation(service, 'SOL/USDC');
if (result.bestPrice.error) {
  console.log('No price available:', result.errors);
} else {
  console.log(`Best price: $${result.bestPrice.price.toFixed(4)} via ${result.bestPrice.method}`);
}
```

## 📊 Data Analysis Examples

### Volatility Analysis

```javascript
function analyzeVolatility(service, token, windowMinutes = 60) {
  try {
    const windowMs = windowMinutes * 60 * 1000;
    const twap = service.calculateTWAP(token, windowMs);
    
    const volatility = {
      priceStdDev: twap.metadata.priceStdDev,
      priceRange: twap.metadata.maxPrice - twap.metadata.minPrice,
      relativeVolatility: (twap.metadata.priceStdDev / twap.twap) * 100,
      dataPoints: twap.dataPoints,
      timeSpan: twap.metadata.timeSpread / 1000 / 60 // minutes
    };
    
    // Classify volatility
    if (volatility.relativeVolatility < 0.5) {
      volatility.classification = 'LOW';
    } else if (volatility.relativeVolatility < 2.0) {
      volatility.classification = 'MODERATE';
    } else {
      volatility.classification = 'HIGH';
    }
    
    console.log(`Volatility Analysis for ${token} (${windowMinutes}min):`);
    console.log(`Price Std Dev: $${volatility.priceStdDev.toFixed(4)}`);
    console.log(`Price Range: $${volatility.priceRange.toFixed(4)}`);
    console.log(`Relative Volatility: ${volatility.relativeVolatility.toFixed(2)}%`);
    console.log(`Classification: ${volatility.classification}`);
    
    return volatility;
    
  } catch (error) {
    console.error(`Volatility analysis failed: ${error.message}`);
    return null;
  }
}

// Usage
analyzeVolatility(service, 'SOL/USDC', 30); // 30-minute volatility
```

### Market Efficiency Score

```javascript
function calculateMarketEfficiency(service, token) {
  try {
    const aggregated = service.getAggregatedPrice(token);
    
    if (!aggregated.vwap || !aggregated.twap) {
      throw new Error('Both VWAP and TWAP required for efficiency calculation');
    }
    
    const vwapPrice = aggregated.vwap.vwap;
    const twapPrice = aggregated.twap.twap;
    const spread = Math.abs(vwapPrice - twapPrice);
    const avgPrice = (vwapPrice + twapPrice) / 2;
    const spreadPercent = (spread / avgPrice) * 100;
    
    // Calculate efficiency score (lower spread = higher efficiency)
    const efficiencyScore = Math.max(0, 100 - (spreadPercent * 10));
    
    const efficiency = {
      vwapPrice,
      twapPrice,
      spread,
      spreadPercent,
      efficiencyScore,
      dataQuality: {
        vwapConfidence: aggregated.vwap.confidence,
        twapConfidence: aggregated.twap.confidence,
        vwapDataPoints: aggregated.vwap.dataPoints,
        twapDataPoints: aggregated.twap.dataPoints
      }
    };
    
    console.log(`Market Efficiency for ${token}:`);
    console.log(`VWAP: $${vwapPrice.toFixed(4)}`);
    console.log(`TWAP: $${twapPrice.toFixed(4)}`);
    console.log(`Spread: $${spread.toFixed(4)} (${spreadPercent.toFixed(3)}%)`);
    console.log(`Efficiency Score: ${efficiencyScore.toFixed(1)}/100`);
    
    return efficiency;
    
  } catch (error) {
    console.error(`Market efficiency calculation failed: ${error.message}`);
    return null;
  }
}

// Usage
calculateMarketEfficiency(service, 'SOL/USDC');
```

This usage guide provides comprehensive examples for implementing the Price Aggregation Service in various scenarios, from basic price calculations to advanced market analysis and real-time monitoring systems.