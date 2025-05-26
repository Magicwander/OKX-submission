import RaydiumConnector, { COMMON_TOKENS } from './raydium-connector.js';
import OrcaConnector, { COMMON_POOLS } from './orca-connector.js';

/**
 * Solana DEX Connectors
 * Main entry point for accessing Raydium and Orca DEX functionality
 */

// Export connectors
export { RaydiumConnector, OrcaConnector };
export { COMMON_TOKENS, COMMON_POOLS };

// Example usage function
async function demonstrateConnectors() {
  console.log('🚀 Solana DEX Connectors Demo\n');
  
  // Initialize connectors
  const raydium = new RaydiumConnector();
  const orca = new OrcaConnector();
  
  try {
    // Raydium example
    console.log('📊 Raydium Example:');
    const raydiumPools = await raydium.fetchPools();
    console.log(`Found ${raydiumPools.length} Raydium pools`);
    
    const raydiumPopular = await raydium.getPopularPairs(3);
    console.log('Top 3 Raydium pairs:');
    raydiumPopular.forEach((pair, i) => {
      console.log(`  ${i + 1}. ${pair.pair}`);
    });
    console.log('');
    
    // Orca example
    console.log('🐋 Orca Example:');
    const orcaPools = await orca.getPools();
    console.log(`Found ${orcaPools.length} Orca pools`);
    
    const orcaPopular = await orca.getPopularPairs(3);
    console.log('Top 3 Orca pairs:');
    orcaPopular.forEach((pair, i) => {
      console.log(`  ${i + 1}. ${pair.pair} - TVL: $${pair.tvl.toLocaleString()}`);
    });
    console.log('');
    
    // Price comparison
    console.log('💰 Price Comparison (SOL/USDC):');
    try {
      const orcaPrice = await orca.getPrice('SOL', 'USDC');
      console.log(`Orca: ${orcaPrice.price.toFixed(4)} USDC per SOL`);
    } catch (error) {
      console.log(`Orca price error: ${error.message}`);
    }
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateConnectors();
}

export default { RaydiumConnector, OrcaConnector, COMMON_TOKENS, COMMON_POOLS };