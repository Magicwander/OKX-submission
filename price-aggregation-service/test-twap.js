import PriceAggregationService from './price-aggregation-service.js';

/**
 * Comprehensive TWAP Testing Suite
 */

async function testTWAP() {
  console.log('🧪 Testing TWAP (Time Weighted Average Price) Calculations\n');
  
  const service = new PriceAggregationService({
    enableLogging: false,
    minDataPoints: 2
  });
  
  const token = 'SOL/USDC';
  
  // Test 1: Basic TWAP calculation
  console.log('📊 Test 1: Basic TWAP Calculation');
  console.log('-'.repeat(40));
  
  const now = Date.now();
  const testData = [
    { price: 177.50, source: 'okx', timestamp: now - 300000 }, // 5 min ago
    { price: 177.60, source: 'binance', timestamp: now - 240000 }, // 4 min ago
    { price: 177.45, source: 'coinbase', timestamp: now - 180000 }, // 3 min ago
    { price: 177.70, source: 'kraken', timestamp: now - 120000 }, // 2 min ago
    { price: 177.55, source: 'huobi', timestamp: now - 60000 } // 1 min ago
  ];
  
  testData.forEach(data => {
    service.addPriceData(token, data);
  });
  
  try {
    const twap = service.calculateTWAP(token);
    
    console.log(`✅ TWAP: $${twap.twap.toFixed(4)}`);
    console.log(`   Data Points: ${twap.dataPoints}`);
    console.log(`   Outliers Removed: ${twap.outliers}`);
    console.log(`   Confidence: ${(twap.confidence * 100).toFixed(1)}%`);
    console.log(`   Sources: ${twap.sources.join(', ')}`);
    console.log(`   Time Window: ${(twap.timeWindow / 1000 / 60).toFixed(0)} minutes`);
    console.log(`   Time Spread: ${(twap.metadata.timeSpread / 1000).toFixed(0)} seconds`);
    console.log(`   Price Range: $${twap.metadata.minPrice.toFixed(4)} - $${twap.metadata.maxPrice.toFixed(4)}`);
    console.log(`   Price Std Dev: ${twap.metadata.priceStdDev.toFixed(4)}`);
    
    // Manual TWAP calculation for verification (simplified)
    const prices = testData.map(d => d.price);
    const simpleAverage = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    console.log(`   Simple Average: $${simpleAverage.toFixed(4)}`);
    console.log(`   TWAP vs Simple: ${(twap.twap - simpleAverage).toFixed(4)} difference`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: TWAP with outliers
  console.log('\n📊 Test 2: TWAP with Outlier Detection');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  const dataWithOutliers = [
    { price: 177.50, source: 'okx', timestamp: now - 300000 },
    { price: 177.60, source: 'binance', timestamp: now - 240000 },
    { price: 200.00, source: 'suspicious1', timestamp: now - 200000 }, // Outlier
    { price: 177.45, source: 'coinbase', timestamp: now - 180000 },
    { price: 150.00, source: 'suspicious2', timestamp: now - 150000 }, // Outlier
    { price: 177.70, source: 'kraken', timestamp: now - 120000 },
    { price: 177.55, source: 'huobi', timestamp: now - 60000 }
  ];
  
  dataWithOutliers.forEach(data => {
    service.addPriceData(token, data);
  });
  
  try {
    const twapWithOutliers = service.calculateTWAP(token);
    
    console.log(`✅ TWAP (with outlier detection): $${twapWithOutliers.twap.toFixed(4)}`);
    console.log(`   Data Points Used: ${twapWithOutliers.dataPoints}`);
    console.log(`   Outliers Removed: ${twapWithOutliers.outliers}`);
    console.log(`   Confidence: ${(twapWithOutliers.confidence * 100).toFixed(1)}%`);
    console.log(`   Sources: ${twapWithOutliers.sources.join(', ')}`);
    console.log(`   Price Std Dev: ${twapWithOutliers.metadata.priceStdDev.toFixed(4)}`);
    
    if (twapWithOutliers.outliers > 0) {
      console.log(`   ✅ Successfully detected and removed ${twapWithOutliers.outliers} outliers`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: TWAP with different time windows
  console.log('\n📊 Test 3: TWAP with Different Time Windows');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data spanning 2 hours
  const extendedData = [
    { price: 177.00, source: 'okx', timestamp: now - 7200000 }, // 2 hours ago
    { price: 177.10, source: 'binance', timestamp: now - 5400000 }, // 1.5 hours ago
    { price: 177.20, source: 'coinbase', timestamp: now - 3600000 }, // 1 hour ago
    { price: 177.30, source: 'kraken', timestamp: now - 1800000 }, // 30 min ago
    { price: 177.40, source: 'huobi', timestamp: now - 900000 }, // 15 min ago
    { price: 177.50, source: 'okx', timestamp: now - 300000 }, // 5 min ago
    { price: 177.60, source: 'binance', timestamp: now - 60000 } // 1 min ago
  ];
  
  extendedData.forEach(data => {
    service.addPriceData(token, data);
  });
  
  const windows = [
    { name: '10 minutes', ms: 10 * 60 * 1000 },
    { name: '30 minutes', ms: 30 * 60 * 1000 },
    { name: '1 hour', ms: 60 * 60 * 1000 },
    { name: '2 hours', ms: 2 * 60 * 60 * 1000 },
    { name: '3 hours', ms: 3 * 60 * 60 * 1000 }
  ];
  
  for (const window of windows) {
    try {
      const twap = service.calculateTWAP(token, window.ms);
      console.log(`   ${window.name}: $${twap.twap.toFixed(4)} (${twap.dataPoints} points, ${(twap.metadata.timeSpread / 1000 / 60).toFixed(0)}min span)`);
    } catch (error) {
      console.log(`   ${window.name}: ❌ ${error.message}`);
    }
  }
  
  // Test 4: TWAP with source weights
  console.log('\n📊 Test 4: TWAP with Source Weights');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data from sources with different weights
  const weightedData = [
    { price: 177.50, source: 'okx', timestamp: now - 300000 }, // Weight: 1.0
    { price: 177.60, source: 'binance', timestamp: now - 240000 }, // Weight: 1.0
    { price: 177.45, source: 'raydium', timestamp: now - 180000 }, // Weight: 0.8
    { price: 177.70, source: 'orca', timestamp: now - 120000 }, // Weight: 0.8
    { price: 177.55, source: 'coinbase', timestamp: now - 60000 } // Weight: 0.9
  ];
  
  weightedData.forEach(data => {
    service.addPriceData(token, data);
  });
  
  try {
    const twapWeighted = service.calculateTWAP(token);
    
    console.log(`✅ TWAP (source weighted): $${twapWeighted.twap.toFixed(4)}`);
    console.log(`   Data Points: ${twapWeighted.dataPoints}`);
    console.log(`   Sources: ${twapWeighted.sources.join(', ')}`);
    console.log(`   Confidence: ${(twapWeighted.confidence * 100).toFixed(1)}%`);
    
    // Show source weights
    console.log('   Source Weights:');
    const stats = service.getStats();
    for (const [source, weight] of stats.sourceWeights) {
      if (twapWeighted.sources.includes(source)) {
        console.log(`     ${source}: ${weight}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 5: TWAP with irregular time intervals
  console.log('\n📊 Test 5: TWAP with Irregular Time Intervals');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data with irregular intervals
  const irregularData = [
    { price: 177.50, source: 'okx', timestamp: now - 600000 }, // 10 min ago
    { price: 177.60, source: 'binance', timestamp: now - 580000 }, // 9.67 min ago (close)
    { price: 177.45, source: 'coinbase', timestamp: now - 300000 }, // 5 min ago (gap)
    { price: 177.70, source: 'kraken', timestamp: now - 290000 }, // 4.83 min ago (close)
    { price: 177.55, source: 'huobi', timestamp: now - 60000 }, // 1 min ago (gap)
    { price: 177.65, source: 'okx', timestamp: now - 30000 }, // 30 sec ago (close)
    { price: 177.58, source: 'binance', timestamp: now - 10000 } // 10 sec ago (close)
  ];
  
  irregularData.forEach(data => {
    service.addPriceData(token, data);
  });
  
  try {
    const twapIrregular = service.calculateTWAP(token);
    
    console.log(`✅ TWAP (irregular intervals): $${twapIrregular.twap.toFixed(4)}`);
    console.log(`   Data Points: ${twapIrregular.dataPoints}`);
    console.log(`   Time Spread: ${(twapIrregular.metadata.timeSpread / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Price Std Dev: ${twapIrregular.metadata.priceStdDev.toFixed(4)}`);
    console.log(`   Confidence: ${(twapIrregular.confidence * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 6: Edge cases
  console.log('\n📊 Test 6: Edge Cases');
  console.log('-'.repeat(40));
  
  // Test with no data
  service.clearTokenData('EMPTY/TOKEN');
  try {
    service.calculateTWAP('EMPTY/TOKEN');
    console.log('❌ Should have thrown error for empty data');
  } catch (error) {
    console.log(`✅ Correctly handled empty data: ${error.message}`);
  }
  
  // Test with insufficient data points
  service.clearTokenData('INSUFFICIENT/TOKEN');
  service.addPriceData('INSUFFICIENT/TOKEN', {
    price: 100,
    source: 'test',
    timestamp: Date.now()
  });
  
  try {
    service.calculateTWAP('INSUFFICIENT/TOKEN');
    console.log('❌ Should have thrown error for insufficient data');
  } catch (error) {
    console.log(`✅ Correctly handled insufficient data: ${error.message}`);
  }
  
  // Test with single timestamp (zero time weight)
  service.clearTokenData('SINGLE/TIME');
  const singleTime = Date.now();
  service.addPriceData('SINGLE/TIME', {
    price: 100,
    source: 'test1',
    timestamp: singleTime
  });
  service.addPriceData('SINGLE/TIME', {
    price: 101,
    source: 'test2',
    timestamp: singleTime
  });
  service.addPriceData('SINGLE/TIME', {
    price: 102,
    source: 'test3',
    timestamp: singleTime
  });
  
  try {
    const twapSingle = service.calculateTWAP('SINGLE/TIME');
    console.log(`✅ TWAP with same timestamps: $${twapSingle.twap.toFixed(4)}`);
    console.log(`   Data Points: ${twapSingle.dataPoints}`);
    console.log(`   Time Spread: ${twapSingle.metadata.timeSpread}ms`);
  } catch (error) {
    console.log(`❌ Error with same timestamps: ${error.message}`);
  }
  
  // Test 7: Performance test with large dataset
  console.log('\n📊 Test 7: Performance Test');
  console.log('-'.repeat(40));
  
  service.clearTokenData('PERF/TEST');
  
  const startTime = Date.now();
  
  // Add 1000 data points
  for (let i = 0; i < 1000; i++) {
    service.addPriceData('PERF/TEST', {
      price: 177.5 + (Math.random() - 0.5) * 2, // ±$1 variation
      source: `source${i % 10}`,
      timestamp: now - (i * 1000) // 1 second intervals
    });
  }
  
  const addTime = Date.now() - startTime;
  
  try {
    const calcStart = Date.now();
    const twapPerf = service.calculateTWAP('PERF/TEST');
    const calcTime = Date.now() - calcStart;
    
    console.log(`✅ Performance test completed:`);
    console.log(`   Data Points: ${twapPerf.dataPoints}`);
    console.log(`   Add Time: ${addTime}ms`);
    console.log(`   Calculation Time: ${calcTime}ms`);
    console.log(`   TWAP: $${twapPerf.twap.toFixed(4)}`);
    console.log(`   Outliers Removed: ${twapPerf.outliers}`);
    
  } catch (error) {
    console.log(`❌ Performance test error: ${error.message}`);
  }
  
  console.log('\n🎉 TWAP testing completed!');
}

// Run tests
testTWAP().catch(console.error);