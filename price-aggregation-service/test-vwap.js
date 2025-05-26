import PriceAggregationService from './price-aggregation-service.js';

/**
 * Comprehensive VWAP Testing Suite
 */

async function testVWAP() {
  console.log('🧪 Testing VWAP (Volume Weighted Average Price) Calculations\n');
  
  const service = new PriceAggregationService({
    enableLogging: false,
    minDataPoints: 2
  });
  
  const token = 'SOL/USDC';
  
  // Test 1: Basic VWAP calculation
  console.log('📊 Test 1: Basic VWAP Calculation');
  console.log('-'.repeat(40));
  
  // Add sample data with different prices and volumes
  const testData = [
    { price: 177.50, volume: 1000, source: 'okx' },
    { price: 177.45, volume: 1500, source: 'binance' },
    { price: 177.55, volume: 800, source: 'coinbase' },
    { price: 177.48, volume: 1200, source: 'kraken' },
    { price: 177.52, volume: 900, source: 'huobi' }
  ];
  
  testData.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000 // Random timestamps within last minute
    });
  });
  
  try {
    const vwap = service.calculateVWAP(token);
    
    console.log(`✅ VWAP: $${vwap.vwap.toFixed(4)}`);
    console.log(`   Total Volume: ${vwap.totalVolume.toLocaleString()}`);
    console.log(`   Data Points: ${vwap.dataPoints}`);
    console.log(`   Outliers Removed: ${vwap.outliers}`);
    console.log(`   Confidence: ${(vwap.confidence * 100).toFixed(1)}%`);
    console.log(`   Sources: ${vwap.sources.join(', ')}`);
    console.log(`   Price Range: $${vwap.metadata.minPrice.toFixed(4)} - $${vwap.metadata.maxPrice.toFixed(4)}`);
    
    // Manual VWAP calculation for verification
    let totalVolumePrice = 0;
    let totalVolume = 0;
    testData.forEach(data => {
      totalVolumePrice += data.price * data.volume;
      totalVolume += data.volume;
    });
    const expectedVWAP = totalVolumePrice / totalVolume;
    
    console.log(`   Expected VWAP: $${expectedVWAP.toFixed(4)}`);
    console.log(`   Difference: ${Math.abs(vwap.vwap - expectedVWAP).toFixed(6)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: VWAP with outliers
  console.log('\n📊 Test 2: VWAP with Outlier Detection');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data with outliers
  const dataWithOutliers = [
    { price: 177.50, volume: 1000, source: 'okx' },
    { price: 177.45, volume: 1500, source: 'binance' },
    { price: 200.00, volume: 100, source: 'suspicious1' }, // Outlier
    { price: 177.55, volume: 800, source: 'coinbase' },
    { price: 150.00, volume: 50, source: 'suspicious2' }, // Outlier
    { price: 177.48, volume: 1200, source: 'kraken' },
    { price: 177.52, volume: 900, source: 'huobi' }
  ];
  
  dataWithOutliers.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const vwapWithOutliers = service.calculateVWAP(token);
    
    console.log(`✅ VWAP (with outlier detection): $${vwapWithOutliers.vwap.toFixed(4)}`);
    console.log(`   Total Volume: ${vwapWithOutliers.totalVolume.toLocaleString()}`);
    console.log(`   Data Points Used: ${vwapWithOutliers.dataPoints}`);
    console.log(`   Outliers Removed: ${vwapWithOutliers.outliers}`);
    console.log(`   Confidence: ${(vwapWithOutliers.confidence * 100).toFixed(1)}%`);
    console.log(`   Sources: ${vwapWithOutliers.sources.join(', ')}`);
    
    if (vwapWithOutliers.outliers > 0) {
      console.log(`   ✅ Successfully detected and removed ${vwapWithOutliers.outliers} outliers`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: VWAP with different time windows
  console.log('\n📊 Test 3: VWAP with Different Time Windows');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data with different timestamps
  const now = Date.now();
  const timeBasedData = [
    { price: 177.50, volume: 1000, source: 'okx', timestamp: now - 3600000 }, // 1 hour ago
    { price: 177.60, volume: 1200, source: 'binance', timestamp: now - 1800000 }, // 30 min ago
    { price: 177.70, volume: 800, source: 'coinbase', timestamp: now - 900000 }, // 15 min ago
    { price: 177.80, volume: 1500, source: 'kraken', timestamp: now - 300000 }, // 5 min ago
    { price: 177.90, volume: 1000, source: 'huobi', timestamp: now - 60000 } // 1 min ago
  ];
  
  timeBasedData.forEach(data => {
    service.addPriceData(token, data);
  });
  
  // Test different time windows
  const windows = [
    { name: '10 minutes', ms: 10 * 60 * 1000 },
    { name: '30 minutes', ms: 30 * 60 * 1000 },
    { name: '1 hour', ms: 60 * 60 * 1000 },
    { name: '2 hours', ms: 2 * 60 * 60 * 1000 }
  ];
  
  for (const window of windows) {
    try {
      const vwap = service.calculateVWAP(token, window.ms);
      console.log(`   ${window.name}: $${vwap.vwap.toFixed(4)} (${vwap.dataPoints} points)`);
    } catch (error) {
      console.log(`   ${window.name}: ❌ ${error.message}`);
    }
  }
  
  // Test 4: VWAP with minimum volume filtering
  console.log('\n📊 Test 4: VWAP with Minimum Volume Filtering');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Add data with varying volumes
  const volumeTestData = [
    { price: 177.50, volume: 0.001, source: 'low_volume1' }, // Below minimum
    { price: 177.45, volume: 1500, source: 'binance' },
    { price: 177.55, volume: 0.005, source: 'low_volume2' }, // Below minimum
    { price: 177.48, volume: 1200, source: 'kraken' },
    { price: 177.52, volume: 900, source: 'huobi' }
  ];
  
  volumeTestData.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const vwapFiltered = service.calculateVWAP(token);
    
    console.log(`✅ VWAP (volume filtered): $${vwapFiltered.vwap.toFixed(4)}`);
    console.log(`   Data Points Used: ${vwapFiltered.dataPoints} (filtered from ${volumeTestData.length})`);
    console.log(`   Total Volume: ${vwapFiltered.totalVolume.toLocaleString()}`);
    console.log(`   Average Volume: ${vwapFiltered.metadata.avgVolume.toFixed(2)}`);
    
    const filteredCount = volumeTestData.length - vwapFiltered.dataPoints;
    if (filteredCount > 0) {
      console.log(`   ✅ Successfully filtered ${filteredCount} low-volume data points`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 5: Edge cases
  console.log('\n📊 Test 5: Edge Cases');
  console.log('-'.repeat(40));
  
  // Test with no data
  service.clearTokenData('EMPTY/TOKEN');
  try {
    service.calculateVWAP('EMPTY/TOKEN');
    console.log('❌ Should have thrown error for empty data');
  } catch (error) {
    console.log(`✅ Correctly handled empty data: ${error.message}`);
  }
  
  // Test with insufficient data points
  service.clearTokenData('INSUFFICIENT/TOKEN');
  service.addPriceData('INSUFFICIENT/TOKEN', {
    price: 100,
    volume: 1000,
    source: 'test',
    timestamp: Date.now()
  });
  
  try {
    service.calculateVWAP('INSUFFICIENT/TOKEN');
    console.log('❌ Should have thrown error for insufficient data');
  } catch (error) {
    console.log(`✅ Correctly handled insufficient data: ${error.message}`);
  }
  
  // Test with zero volume
  service.clearTokenData('ZERO/VOLUME');
  service.addPriceData('ZERO/VOLUME', {
    price: 100,
    volume: 0,
    source: 'test1',
    timestamp: Date.now()
  });
  service.addPriceData('ZERO/VOLUME', {
    price: 101,
    volume: 0,
    source: 'test2',
    timestamp: Date.now()
  });
  service.addPriceData('ZERO/VOLUME', {
    price: 102,
    volume: 0,
    source: 'test3',
    timestamp: Date.now()
  });
  
  try {
    service.calculateVWAP('ZERO/VOLUME');
    console.log('❌ Should have thrown error for zero volume');
  } catch (error) {
    console.log(`✅ Correctly handled zero volume: ${error.message}`);
  }
  
  console.log('\n🎉 VWAP testing completed!');
}

// Run tests
testVWAP().catch(console.error);