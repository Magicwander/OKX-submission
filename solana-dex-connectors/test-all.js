import RaydiumConnector, { COMMON_TOKENS } from './raydium-connector.js';
import OrcaConnector, { COMMON_POOLS } from './orca-connector.js';

async function compareConnectors() {
  console.log('🔄 Comparing Raydium and Orca DEX Connectors\n');
  
  try {
    const raydium = new RaydiumConnector();
    const orca = new OrcaConnector();
    
    console.log('📊 Connector Comparison Summary');
    console.log('================================\n');
    
    // Test 1: Pool counts
    console.log('1. Pool Availability:');
    try {
      const raydiumPools = await raydium.fetchPools();
      console.log(`   Raydium: ${raydiumPools.length} pools`);
    } catch (error) {
      console.log(`   Raydium: Error - ${error.message}`);
    }
    
    try {
      const orcaPools = await orca.getPools();
      console.log(`   Orca: ${orcaPools.length} pools`);
    } catch (error) {
      console.log(`   Orca: Error - ${error.message}`);
    }
    console.log('');
    
    // Test 2: Popular pairs comparison
    console.log('2. Popular Trading Pairs:');
    try {
      const raydiumPairs = await raydium.getPopularPairs(3);
      console.log('   Raydium Top 3:');
      raydiumPairs.forEach((pair, index) => {
        console.log(`     ${index + 1}. ${pair.pair} - Volume: $${pair.volume24h?.toLocaleString() || 'N/A'}`);
      });
    } catch (error) {
      console.log(`   Raydium: Error - ${error.message}`);
    }
    
    try {
      const orcaPairs = await orca.getPopularPairs(3);
      console.log('   Orca Top 3:');
      orcaPairs.forEach((pair, index) => {
        console.log(`     ${index + 1}. ${pair.pair} - TVL: $${pair.tvl.toLocaleString()}`);
      });
    } catch (error) {
      console.log(`   Orca: Error - ${error.message}`);
    }
    console.log('');
    
    // Test 3: Price comparison for common pairs
    console.log('3. Price Comparison (SOL/USDC):');
    
    // Raydium price
    try {
      const raydiumPools = await raydium.fetchPools();
      const solUsdcPool = raydiumPools.find(pool => 
        (pool.baseSymbol === 'SOL' && pool.quoteSymbol === 'USDC') ||
        (pool.baseSymbol === 'USDC' && pool.quoteSymbol === 'SOL')
      );
      
      if (solUsdcPool) {
        const raydiumPrice = await raydium.getPrice(
          COMMON_TOKENS.SOL, 
          COMMON_TOKENS.USDC
        );
        console.log(`   Raydium: ${raydiumPrice.price.toFixed(4)} USDC per SOL`);
      } else {
        console.log('   Raydium: SOL/USDC pool not found');
      }
    } catch (error) {
      console.log(`   Raydium: Error - ${error.message}`);
    }
    
    // Orca price
    try {
      const orcaPrice = await orca.getPrice('SOL', 'USDC');
      console.log(`   Orca: ${orcaPrice.price.toFixed(4)} USDC per SOL`);
    } catch (error) {
      console.log(`   Orca: Error - ${error.message}`);
    }
    console.log('');
    
    // Test 4: Swap calculation comparison
    console.log('4. Swap Calculation (1 SOL -> USDC):');
    
    // Raydium swap
    try {
      const raydiumPools = await raydium.fetchPools();
      const solUsdcPool = raydiumPools.find(pool => 
        (pool.baseSymbol === 'SOL' && pool.quoteSymbol === 'USDC')
      );
      
      if (solUsdcPool) {
        const raydiumSwap = await raydium.calculateSwapOutput(
          solUsdcPool.id,
          COMMON_TOKENS.SOL,
          1000000000 // 1 SOL
        );
        const outputAmount = parseFloat(raydiumSwap.outputAmount) / 1000000; // Convert to USDC
        console.log(`   Raydium: ${outputAmount.toFixed(2)} USDC (Impact: ${raydiumSwap.priceImpact.toFixed(4)}%)`);
      } else {
        console.log('   Raydium: SOL/USDC pool not found for swap');
      }
    } catch (error) {
      console.log(`   Raydium: Error - ${error.message}`);
    }
    
    // Orca swap
    try {
      const orcaSwap = await orca.getSwapQuote('SOL', 'USDC', 1);
      console.log(`   Orca: ${orcaSwap.outputToken.expectedAmount.toFixed(2)} USDC (Impact: ${orcaSwap.priceImpact.toFixed(4)}%)`);
    } catch (error) {
      console.log(`   Orca: Error - ${error.message}`);
    }
    console.log('');
    
    // Test 5: Feature comparison
    console.log('5. Feature Comparison:');
    console.log('   Raydium Features:');
    console.log('     ✅ Pool data fetching');
    console.log('     ✅ Price calculations');
    console.log('     ✅ Swap output calculations');
    console.log('     ✅ Pool statistics');
    console.log('     ✅ Popular pairs');
    console.log('     ✅ Live API integration');
    console.log('');
    console.log('   Orca Features:');
    console.log('     ✅ Pool data fetching');
    console.log('     ✅ Price calculations');
    console.log('     ✅ Swap quotes');
    console.log('     ✅ Pool statistics');
    console.log('     ✅ Popular pairs');
    console.log('     ✅ Token management');
    console.log('');
    
    console.log('✅ Connector comparison completed successfully!');
    
  } catch (error) {
    console.error('❌ Error comparing connectors:', error.message);
  }
}

// Run the comparison
compareConnectors();