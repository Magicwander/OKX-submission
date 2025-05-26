import PriceAggregationService from './price-aggregation-service.js';

/**
 * Comprehensive Outlier Detection Testing Suite
 */

async function testOutlierDetection() {
  console.log('🧪 Testing Outlier Detection Algorithms\n');
  
  const service = new PriceAggregationService({
    enableLogging: false,
    minDataPoints: 3,
    zScoreThreshold: 2.0,
    iqrMultiplier: 1.5
  });
  
  const token = 'SOL/USDC';
  
  // Test 1: Z-Score outlier detection
  console.log('📊 Test 1: Z-Score Outlier Detection');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Normal distribution with outliers
  const normalData = [
    { price: 177.50, source: 'okx' },
    { price: 177.45, source: 'binance' },
    { price: 177.55, source: 'coinbase' },
    { price: 177.48, source: 'kraken' },
    { price: 177.52, source: 'huobi' },
    { price: 177.47, source: 'kucoin' },
    { price: 177.53, source: 'gate' }
  ];
  
  const outliers = [
    { price: 200.00, source: 'suspicious1' }, // +12.7% outlier
    { price: 150.00, source: 'suspicious2' }  // -15.5% outlier
  ];
  
  const allData = [...normalData, ...outliers];
  
  allData.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const twap = service.calculateTWAP(token);
    
    console.log(`✅ Z-Score outlier detection:`);
    console.log(`   Original data points: ${allData.length}`);
    console.log(`   Data points used: ${twap.dataPoints}`);
    console.log(`   Outliers detected: ${twap.outliers}`);
    console.log(`   TWAP: $${twap.twap.toFixed(4)}`);
    console.log(`   Price Std Dev: ${twap.metadata.priceStdDev.toFixed(4)}`);
    console.log(`   Sources used: ${twap.sources.join(', ')}`);
    
    // Calculate what TWAP would be without outlier detection
    const allPrices = allData.map(d => d.price);
    const avgWithOutliers = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
    const normalPrices = normalData.map(d => d.price);
    const avgWithoutOutliers = normalPrices.reduce((sum, p) => sum + p, 0) / normalPrices.length;
    
    console.log(`   Average with outliers: $${avgWithOutliers.toFixed(4)}`);
    console.log(`   Average without outliers: $${avgWithoutOutliers.toFixed(4)}`);
    console.log(`   Outlier impact: ${Math.abs(avgWithOutliers - avgWithoutOutliers).toFixed(4)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: IQR outlier detection
  console.log('\n📊 Test 2: IQR (Interquartile Range) Outlier Detection');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  // Data with different distribution
  const iqrTestData = [
    { price: 177.40, source: 'source1' },
    { price: 177.42, source: 'source2' },
    { price: 177.44, source: 'source3' },
    { price: 177.46, source: 'source4' },
    { price: 177.48, source: 'source5' }, // Q1 around here
    { price: 177.50, source: 'source6' },
    { price: 177.52, source: 'source7' }, // Median
    { price: 177.54, source: 'source8' },
    { price: 177.56, source: 'source9' }, // Q3 around here
    { price: 177.58, source: 'source10' },
    { price: 177.60, source: 'source11' },
    { price: 190.00, source: 'outlier1' }, // Far outlier
    { price: 165.00, source: 'outlier2' }  // Far outlier
  ];
  
  iqrTestData.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const twap = service.calculateTWAP(token);
    
    console.log(`✅ IQR outlier detection:`);
    console.log(`   Original data points: ${iqrTestData.length}`);
    console.log(`   Data points used: ${twap.dataPoints}`);
    console.log(`   Outliers detected: ${twap.outliers}`);
    console.log(`   TWAP: $${twap.twap.toFixed(4)}`);
    console.log(`   Price range: $${twap.metadata.minPrice.toFixed(4)} - $${twap.metadata.maxPrice.toFixed(4)}`);
    
    // Calculate quartiles manually for verification
    const prices = iqrTestData.map(d => d.price).sort((a, b) => a - b);
    const q1Index = Math.floor(prices.length * 0.25);
    const q3Index = Math.floor(prices.length * 0.75);
    const q1 = prices[q1Index];
    const q3 = prices[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);
    
    console.log(`   Q1: $${q1.toFixed(4)}, Q3: $${q3.toFixed(4)}, IQR: $${iqr.toFixed(4)}`);
    console.log(`   IQR bounds: $${lowerBound.toFixed(4)} - $${upperBound.toFixed(4)}`);
    
    const expectedOutliers = prices.filter(p => p < lowerBound || p > upperBound);
    console.log(`   Expected outliers: ${expectedOutliers.length} (${expectedOutliers.map(p => p.toFixed(2)).join(', ')})`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Different outlier thresholds
  console.log('\n📊 Test 3: Different Outlier Detection Thresholds');
  console.log('-'.repeat(40));
  
  const testData = [
    { price: 177.50, source: 'normal1' },
    { price: 177.45, source: 'normal2' },
    { price: 177.55, source: 'normal3' },
    { price: 177.48, source: 'normal4' },
    { price: 177.52, source: 'normal5' },
    { price: 180.00, source: 'mild_outlier' }, // Mild outlier
    { price: 185.00, source: 'moderate_outlier' }, // Moderate outlier
    { price: 200.00, source: 'extreme_outlier' } // Extreme outlier
  ];
  
  const thresholds = [
    { zScore: 1.0, iqr: 1.0, name: 'Strict' },
    { zScore: 2.0, iqr: 1.5, name: 'Standard' },
    { zScore: 3.0, iqr: 2.0, name: 'Lenient' }
  ];
  
  for (const threshold of thresholds) {
    const testService = new PriceAggregationService({
      enableLogging: false,
      minDataPoints: 3,
      zScoreThreshold: threshold.zScore,
      iqrMultiplier: threshold.iqr
    });
    
    testService.clearTokenData(token);
    
    testData.forEach(data => {
      testService.addPriceData(token, {
        ...data,
        timestamp: Date.now() - Math.random() * 60000
      });
    });
    
    try {
      const twap = testService.calculateTWAP(token);
      console.log(`   ${threshold.name} (Z:${threshold.zScore}, IQR:${threshold.iqr}): ${twap.outliers} outliers, TWAP: $${twap.twap.toFixed(4)}`);
    } catch (error) {
      console.log(`   ${threshold.name}: ❌ ${error.message}`);
    }
  }
  
  // Test 4: Outlier detection with volume data (VWAP)
  console.log('\n📊 Test 4: Outlier Detection in VWAP');
  console.log('-'.repeat(40));
  
  service.clearTokenData(token);
  
  const vwapTestData = [
    { price: 177.50, volume: 1000, source: 'normal1' },
    { price: 177.45, volume: 1500, source: 'normal2' },
    { price: 177.55, volume: 800, source: 'normal3' },
    { price: 177.48, volume: 1200, source: 'normal4' },
    { price: 177.52, volume: 900, source: 'normal5' },
    { price: 190.00, volume: 100, source: 'price_outlier' }, // Price outlier with low volume
    { price: 177.49, volume: 50000, source: 'volume_outlier' }, // Normal price with extreme volume
    { price: 200.00, volume: 10000, source: 'both_outlier' } // Both price and volume outlier
  ];
  
  vwapTestData.forEach(data => {
    service.addPriceData(token, {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const vwap = service.calculateVWAP(token);
    
    console.log(`✅ VWAP outlier detection:`);
    console.log(`   Original data points: ${vwapTestData.length}`);
    console.log(`   Data points used: ${vwap.dataPoints}`);
    console.log(`   Outliers detected: ${vwap.outliers}`);
    console.log(`   VWAP: $${vwap.vwap.toFixed(4)}`);
    console.log(`   Total volume: ${vwap.totalVolume.toLocaleString()}`);
    console.log(`   Sources used: ${vwap.sources.join(', ')}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 5: Edge cases for outlier detection
  console.log('\n📊 Test 5: Edge Cases');
  console.log('-'.repeat(40));
  
  // Test with all identical values
  service.clearTokenData('IDENTICAL/VALUES');
  for (let i = 0; i < 5; i++) {
    service.addPriceData('IDENTICAL/VALUES', {
      price: 177.50,
      source: `source${i}`,
      timestamp: Date.now() - i * 1000
    });
  }
  
  try {
    const twapIdentical = service.calculateTWAP('IDENTICAL/VALUES');
    console.log(`✅ Identical values: ${twapIdentical.outliers} outliers, TWAP: $${twapIdentical.twap.toFixed(4)}`);
    console.log(`   Std Dev: ${twapIdentical.metadata.priceStdDev.toFixed(6)}`);
  } catch (error) {
    console.log(`❌ Identical values error: ${error.message}`);
  }
  
  // Test with only outliers
  service.clearTokenData('ONLY/OUTLIERS');
  const onlyOutliers = [
    { price: 100.00, source: 'outlier1' },
    { price: 200.00, source: 'outlier2' },
    { price: 300.00, source: 'outlier3' }
  ];
  
  onlyOutliers.forEach(data => {
    service.addPriceData('ONLY/OUTLIERS', {
      ...data,
      timestamp: Date.now() - Math.random() * 60000
    });
  });
  
  try {
    const twapOnlyOutliers = service.calculateTWAP('ONLY/OUTLIERS');
    console.log(`✅ Only outliers: ${twapOnlyOutliers.outliers} outliers removed, ${twapOnlyOutliers.dataPoints} points used`);
  } catch (error) {
    console.log(`❌ Only outliers error: ${error.message}`);
  }
  
  // Test with minimal data
  service.clearTokenData('MINIMAL/DATA');
  service.addPriceData('MINIMAL/DATA', {
    price: 177.50,
    source: 'source1',
    timestamp: Date.now()
  });
  service.addPriceData('MINIMAL/DATA', {
    price: 200.00,
    source: 'source2',
    timestamp: Date.now() - 1000
  });
  
  try {
    const twapMinimal = service.calculateTWAP('MINIMAL/DATA');
    console.log(`✅ Minimal data: ${twapMinimal.outliers} outliers, TWAP: $${twapMinimal.twap.toFixed(4)}`);
  } catch (error) {
    console.log(`❌ Minimal data error: ${error.message}`);
  }
  
  // Test 6: Outlier detection statistics
  console.log('\n📊 Test 6: Outlier Detection Statistics');
  console.log('-'.repeat(40));
  
  const stats = service.getStats();
  console.log(`✅ Service statistics:`);
  console.log(`   Total outliers detected: ${stats.outliersDetected}`);
  console.log(`   Total prices processed: ${stats.totalPricesProcessed}`);
  console.log(`   Outlier rate: ${(stats.outliersDetected / stats.totalPricesProcessed * 100).toFixed(2)}%`);
  console.log(`   Z-Score threshold: ${stats.config.zScoreThreshold}`);
  console.log(`   IQR multiplier: ${stats.config.iqrMultiplier}`);
  
  // Test 7: Custom outlier detection scenario
  console.log('\n📊 Test 7: Market Crash Simulation');
  console.log('-'.repeat(40));
  
  service.clearTokenData('CRASH/SIMULATION');
  
  // Simulate a market crash scenario
  const crashData = [
    { price: 177.50, source: 'pre_crash1', timestamp: Date.now() - 600000 },
    { price: 177.45, source: 'pre_crash2', timestamp: Date.now() - 580000 },
    { price: 177.55, source: 'pre_crash3', timestamp: Date.now() - 560000 },
    { price: 150.00, source: 'crash_start', timestamp: Date.now() - 540000 }, // -15.5%
    { price: 140.00, source: 'crash_deep', timestamp: Date.now() - 520000 }, // -21.1%
    { price: 145.00, source: 'crash_bounce', timestamp: Date.now() - 500000 }, // -18.3%
    { price: 142.00, source: 'crash_continue', timestamp: Date.now() - 480000 }, // -20.0%
    { price: 177.48, source: 'recovery1', timestamp: Date.now() - 460000 }, // Back to normal
    { price: 177.52, source: 'recovery2', timestamp: Date.now() - 440000 }
  ];
  
  crashData.forEach(data => {
    service.addPriceData('CRASH/SIMULATION', data);
  });
  
  try {
    const twapCrash = service.calculateTWAP('CRASH/SIMULATION');
    
    console.log(`✅ Market crash simulation:`);
    console.log(`   Original data points: ${crashData.length}`);
    console.log(`   Data points used: ${twapCrash.dataPoints}`);
    console.log(`   Outliers detected: ${twapCrash.outliers}`);
    console.log(`   TWAP: $${twapCrash.twap.toFixed(4)}`);
    console.log(`   Price range: $${twapCrash.metadata.minPrice.toFixed(4)} - $${twapCrash.metadata.maxPrice.toFixed(4)}`);
    console.log(`   Sources used: ${twapCrash.sources.join(', ')}`);
    
    // Check if crash prices were filtered out
    const crashPrices = crashData.filter(d => d.source.includes('crash')).map(d => d.price);
    const usedSources = twapCrash.sources;
    const crashSourcesUsed = usedSources.filter(s => s.includes('crash'));
    
    console.log(`   Crash prices: ${crashPrices.map(p => `$${p.toFixed(2)}`).join(', ')}`);
    console.log(`   Crash sources used: ${crashSourcesUsed.length > 0 ? crashSourcesUsed.join(', ') : 'None (filtered out)'}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n🎉 Outlier detection testing completed!');
}

// Run tests
testOutlierDetection().catch(console.error);