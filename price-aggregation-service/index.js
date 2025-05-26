import PriceAggregationService from './price-aggregation-service.js';
import DataCollector from './data-collector.js';

/**
 * Main entry point for Price Aggregation Service
 * Demonstrates VWAP, TWAP, and outlier detection capabilities
 */

// Export main classes
export { PriceAggregationService, DataCollector };

/**
 * Create a configured aggregation service
 * @param {Object} config - Configuration options
 * @returns {Object} Service instance and collector
 */
export function createAggregationService(config = {}) {
  const aggregationService = new PriceAggregationService(config.aggregation);
  const dataCollector = new DataCollector(aggregationService, config.collection);
  
  return {
    aggregationService,
    dataCollector,
    
    // Convenience methods
    start: () => dataCollector.startCollection(),
    stop: () => dataCollector.stopCollection(),
    getPrice: (token, options) => aggregationService.getAggregatedPrice(token, options),
    getVWAP: (token, window) => aggregationService.calculateVWAP(token, window),
    getTWAP: (token, window) => aggregationService.calculateTWAP(token, window),
    getStats: () => ({
      aggregation: aggregationService.getStats(),
      collection: dataCollector.getStats()
    })
  };
}

/**
 * Demo function showing service capabilities
 */
async function demonstrateService() {
  console.log('🚀 Price Aggregation Service Demo\n');
  
  // Create service with custom configuration
  const config = {
    aggregation: {
      zScoreThreshold: 2.0,
      iqrMultiplier: 1.5,
      minDataPoints: 3,
      enableLogging: true
    },
    collection: {
      collectInterval: 5000, // 5 seconds for demo
      enableMockData: true,
      enableOKX: true,
      enableBinance: true,
      enableCoinGecko: false // Disabled to avoid rate limits in demo
    }
  };
  
  const service = createAggregationService(config);
  
  try {
    console.log('📊 Starting data collection...');
    service.start();
    
    // Wait for some data to be collected
    console.log('⏳ Collecting data for 30 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test different tokens
    const tokens = ['SOL/USDC', 'BTC/USDT', 'ETH/USDT'];
    
    for (const token of tokens) {
      console.log(`\n📈 Analyzing ${token}:`);
      console.log('=' .repeat(50));
      
      try {
        // Get aggregated price
        const aggregated = service.getPrice(token);
        
        console.log('🎯 Aggregated Price Analysis:');
        if (aggregated.recommendedPrice && !aggregated.recommendedPrice.error) {
          console.log(`   Best Price: $${aggregated.recommendedPrice.price.toFixed(4)} (${aggregated.recommendedPrice.type.toUpperCase()})`);
          console.log(`   Confidence: ${(aggregated.recommendedPrice.confidence * 100).toFixed(1)}%`);
          console.log(`   Data Points: ${aggregated.recommendedPrice.dataPoints}`);
        }
        
        // VWAP Analysis
        if (aggregated.vwap) {
          console.log('\n💰 VWAP Analysis:');
          console.log(`   VWAP: $${aggregated.vwap.vwap.toFixed(4)}`);
          console.log(`   Total Volume: ${aggregated.vwap.totalVolume.toLocaleString()}`);
          console.log(`   Data Points: ${aggregated.vwap.dataPoints}`);
          console.log(`   Outliers Removed: ${aggregated.vwap.outliers}`);
          console.log(`   Confidence: ${(aggregated.vwap.confidence * 100).toFixed(1)}%`);
          console.log(`   Sources: ${aggregated.vwap.sources.join(', ')}`);
          console.log(`   Price Range: $${aggregated.vwap.metadata.minPrice.toFixed(4)} - $${aggregated.vwap.metadata.maxPrice.toFixed(4)}`);
        } else if (aggregated.vwapError) {
          console.log(`\n💰 VWAP: ❌ ${aggregated.vwapError}`);
        }
        
        // TWAP Analysis
        if (aggregated.twap) {
          console.log('\n⏰ TWAP Analysis:');
          console.log(`   TWAP: $${aggregated.twap.twap.toFixed(4)}`);
          console.log(`   Data Points: ${aggregated.twap.dataPoints}`);
          console.log(`   Outliers Removed: ${aggregated.twap.outliers}`);
          console.log(`   Confidence: ${(aggregated.twap.confidence * 100).toFixed(1)}%`);
          console.log(`   Sources: ${aggregated.twap.sources.join(', ')}`);
          console.log(`   Time Spread: ${(aggregated.twap.metadata.timeSpread / 1000).toFixed(0)}s`);
          console.log(`   Price Std Dev: ${aggregated.twap.metadata.priceStdDev.toFixed(4)}`);
        } else if (aggregated.twapError) {
          console.log(`\n⏰ TWAP: ❌ ${aggregated.twapError}`);
        }
        
        // Weighted Average
        if (aggregated.weightedAverage) {
          console.log('\n⚖️ Weighted Average:');
          console.log(`   Price: $${aggregated.weightedAverage.price.toFixed(4)}`);
          console.log(`   Confidence: ${(aggregated.weightedAverage.confidence * 100).toFixed(1)}%`);
          console.log(`   Data Points: ${aggregated.weightedAverage.dataPoints}`);
        }
        
        // Metadata
        console.log('\n📊 Data Summary:');
        console.log(`   Total Data Points: ${aggregated.metadata.dataPoints}`);
        console.log(`   Volume Data Points: ${aggregated.metadata.volumePoints}`);
        console.log(`   Active Sources: ${aggregated.metadata.sources.join(', ')}`);
        
      } catch (error) {
        console.log(`❌ Error analyzing ${token}: ${error.message}`);
      }
    }
    
    // Show service statistics
    console.log('\n\n📊 Service Statistics:');
    console.log('=' .repeat(50));
    const stats = service.getStats();
    
    console.log('🔧 Aggregation Service:');
    console.log(`   Total Prices Processed: ${stats.aggregation.totalPricesProcessed}`);
    console.log(`   Outliers Detected: ${stats.aggregation.outliersDetected}`);
    console.log(`   VWAP Calculations: ${stats.aggregation.vwapCalculations}`);
    console.log(`   TWAP Calculations: ${stats.aggregation.twapCalculations}`);
    console.log(`   Active Tokens: ${stats.aggregation.activeTokens}`);
    console.log(`   Total Data Points: ${stats.aggregation.totalDataPoints}`);
    
    console.log('\n📡 Data Collection:');
    console.log(`   Total Requests: ${stats.collection.totalRequests}`);
    console.log(`   Success Rate: ${stats.collection.successRate}`);
    console.log(`   Failed Requests: ${stats.collection.failedRequests}`);
    console.log(`   Last Collection: ${new Date(stats.collection.lastCollection).toLocaleTimeString()}`);
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
  } finally {
    service.stop();
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateService().catch(console.error);
}

// Default export
export default {
  PriceAggregationService,
  DataCollector,
  createAggregationService,
  demonstrateService
};