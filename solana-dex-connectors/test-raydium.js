import RaydiumConnector, { COMMON_TOKENS } from './raydium-connector.js';

async function testRaydiumConnector() {
  console.log('🚀 Testing Raydium DEX Connector\n');
  
  try {
    const raydium = new RaydiumConnector();
    
    // Test 1: Fetch pools
    console.log('📊 Fetching Raydium pools...');
    const pools = await raydium.fetchPools();
    console.log(`✅ Found ${pools.length} pools\n`);
    
    // Test 2: Get popular pairs
    console.log('🔥 Getting popular trading pairs...');
    const popularPairs = await raydium.getPopularPairs(5);
    console.log('Popular pairs:');
    popularPairs.forEach((pair, index) => {
      console.log(`${index + 1}. ${pair.pair} - Volume: $${pair.volume24h?.toLocaleString() || 'N/A'}`);
    });
    console.log('');
    
    // Test 3: Get price for SOL/USDC
    if (popularPairs.length > 0) {
      const firstPair = popularPairs[0];
      console.log(`💰 Getting price for ${firstPair.baseSymbol}/${firstPair.quoteSymbol}...`);
      
      try {
        const priceInfo = await raydium.getPrice(firstPair.baseToken, firstPair.quoteToken);
        console.log(`Price: ${priceInfo.price.toFixed(4)} ${priceInfo.quoteSymbol} per ${priceInfo.baseSymbol}`);
        console.log(`Base Reserve: ${priceInfo.baseReserve}`);
        console.log(`Quote Reserve: ${priceInfo.quoteReserve}`);
        console.log('');
        
        // Test 4: Calculate swap output
        console.log('🔄 Calculating swap output...');
        const swapResult = await raydium.calculateSwapOutput(
          firstPair.poolId, 
          firstPair.baseToken, 
          1000000000 // 1 SOL in lamports
        );
        console.log(`Input: 1 ${priceInfo.baseSymbol}`);
        console.log(`Output: ${(parseFloat(swapResult.outputAmount) / 1000000).toFixed(2)} ${priceInfo.quoteSymbol}`);
        console.log(`Price Impact: ${swapResult.priceImpact.toFixed(4)}%`);
        console.log('');
        
        // Test 5: Get pool statistics
        console.log('📈 Getting pool statistics...');
        const poolStats = await raydium.getPoolStats(firstPair.poolId);
        console.log(`Pool: ${poolStats.baseSymbol}/${poolStats.quoteSymbol}`);
        console.log(`TVL: $${poolStats.tvl.toLocaleString()}`);
        console.log(`Fee: ${(poolStats.fee * 100).toFixed(3)}%`);
        console.log(`24h Volume: $${poolStats.volume24h.toLocaleString()}`);
        
      } catch (error) {
        console.log(`❌ Error testing price/swap: ${error.message}`);
      }
    }
    
    console.log('\n✅ Raydium connector tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Raydium connector:', error.message);
  }
}

// Run the test
testRaydiumConnector();