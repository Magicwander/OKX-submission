import OrcaConnector, { COMMON_POOLS } from './orca-connector.js';

async function testOrcaConnector() {
  console.log('🐋 Testing Orca DEX Connector\n');
  
  try {
    const orca = new OrcaConnector();
    
    // Test 1: Get available pools
    console.log('📊 Getting Orca pools...');
    const pools = await orca.getPools();
    console.log(`✅ Found ${pools.length} pools:`);
    pools.forEach((pool, index) => {
      console.log(`${index + 1}. ${pool.name} (${pool.tokenA.symbol}/${pool.tokenB.symbol})`);
    });
    console.log('');
    
    // Test 2: Get popular pairs
    console.log('🔥 Getting popular trading pairs...');
    const popularPairs = await orca.getPopularPairs(3);
    console.log('Popular pairs by TVL:');
    popularPairs.forEach((pair, index) => {
      console.log(`${index + 1}. ${pair.pair} - TVL: $${pair.tvl.toLocaleString()}`);
    });
    console.log('');
    
    // Test 3: Get price for SOL/USDC
    console.log('💰 Getting price for SOL/USDC...');
    try {
      const priceInfo = await orca.getPrice('SOL', 'USDC');
      console.log(`Price: ${priceInfo.price.toFixed(4)} ${priceInfo.tokenB.symbol} per ${priceInfo.tokenA.symbol}`);
      console.log(`Pool: ${priceInfo.poolName}`);
      console.log(`Fee Rate: ${(priceInfo.feeRate * 100).toFixed(2)}%`);
      console.log('');
      
      // Test 4: Get swap quote
      console.log('🔄 Getting swap quote for 1 SOL -> USDC...');
      const swapQuote = await orca.getSwapQuote('SOL', 'USDC', 1, 1); // 1 SOL with 1% slippage
      console.log(`Input: ${swapQuote.inputToken.amount} ${swapQuote.inputToken.symbol}`);
      console.log(`Expected Output: ${swapQuote.outputToken.expectedAmount.toFixed(2)} ${swapQuote.outputToken.symbol}`);
      console.log(`Min Output: ${swapQuote.outputToken.minAmount.toFixed(2)} ${swapQuote.outputToken.symbol}`);
      console.log(`Price Impact: ${swapQuote.priceImpact.toFixed(4)}%`);
      console.log(`Fee: ${swapQuote.fee} ${swapQuote.inputToken.symbol}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error getting SOL/USDC price: ${error.message}`);
    }
    
    // Test 5: Get pool statistics
    console.log('📈 Getting pool statistics for SOL/USDC...');
    try {
      const poolStats = await orca.getPoolStats('SOL/USDC');
      console.log(`Pool: ${poolStats.poolName}`);
      console.log(`${poolStats.tokenA.symbol} Amount: ${poolStats.tokenA.amount.toLocaleString()}`);
      console.log(`${poolStats.tokenB.symbol} Amount: ${poolStats.tokenB.amount.toLocaleString()}`);
      console.log(`TVL: $${poolStats.tvl.toLocaleString()}`);
      console.log(`Fee Rate: ${(poolStats.feeRate * 100).toFixed(2)}%`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error getting pool stats: ${error.message}`);
    }
    
    // Test 6: Get available tokens
    console.log('🪙 Available tokens:');
    const tokens = orca.getAvailableTokens();
    Object.keys(tokens).forEach(symbol => {
      const token = tokens[symbol];
      console.log(`${symbol}: ${token.mint.substring(0, 8)}...`);
    });
    console.log('');
    
    // Test 7: Test different token pairs
    console.log('🔍 Testing different token pairs...');
    const testPairs = [
      ['SOL', 'USDT'],
      ['ORCA', 'SOL']
    ];
    
    for (const [tokenA, tokenB] of testPairs) {
      try {
        const price = await orca.getPrice(tokenA, tokenB);
        console.log(`${tokenA}/${tokenB}: ${price.price.toFixed(6)}`);
      } catch (error) {
        console.log(`${tokenA}/${tokenB}: Error - ${error.message}`);
      }
    }
    
    console.log('\n✅ Orca connector tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Orca connector:', error.message);
  }
}

// Run the test
testOrcaConnector();