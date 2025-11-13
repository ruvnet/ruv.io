const {
  processStrangeLoop,
  analyzeMetaLearning,
  detectPatterns,
  extractLayers,
  resolveParadox,
  MidstreamerStrangeLoop
} = require('./src/index.ts');

// Convert require to commonjs since we're using .ts file
const mod = require('./index.js');

console.log('Testing Midstreamer Strange Loop Implementation\n');

// Test 1: processStrangeLoop
console.log('Test 1: processStrangeLoop');
const loopState = {
  id: 'loop-001',
  depth: 3,
  data: {
    value: 42,
    name: 'test_loop'
  }
};
try {
  const result = mod.processStrangeLoop(JSON.stringify(loopState), '{}');
  const parsed = JSON.parse(result);
  console.log('✓ processStrangeLoop works');
  console.log('  ID:', parsed.id);
  console.log('  Iterations:', parsed.iterations);
  console.log('  Depth reached:', parsed.depth_reached);
} catch (e) {
  console.log('✗ processStrangeLoop failed:', e.message);
}

// Test 2: analyzeMetaLearning
console.log('\nTest 2: analyzeMetaLearning');
const metaContext = {
  id: 'meta-001',
  level: 0,
  content: 'Base context'
};
try {
  const result = mod.analyzeMetaLearning(JSON.stringify(metaContext));
  const parsed = JSON.parse(result);
  console.log('✓ analyzeMetaLearning works');
  console.log('  ID:', parsed.id);
  console.log('  Levels analyzed:', parsed.levels_analyzed);
  console.log('  Insights:', parsed.insights.length);
} catch (e) {
  console.log('✗ analyzeMetaLearning failed:', e.message);
}

// Test 3: detectPatterns
console.log('\nTest 3: detectPatterns');
const data = {
  self: {
    inner: {
      value: 100
    }
  }
};
try {
  const result = mod.detectPatterns(JSON.stringify(data));
  const parsed = JSON.parse(result);
  console.log('✓ detectPatterns works');
  console.log('  Patterns:', parsed.patterns);
  console.log('  Cycle detected:', parsed.cycle_detected);
} catch (e) {
  console.log('✗ detectPatterns failed:', e.message);
}

// Test 4: extractLayers
console.log('\nTest 4: extractLayers');
try {
  const result = mod.extractLayers(JSON.stringify(data));
  const parsed = JSON.parse(result);
  console.log('✓ extractLayers works');
  console.log('  Layers extracted:', parsed.length);
} catch (e) {
  console.log('✗ extractLayers failed:', e.message);
}

// Test 5: resolveParadox
console.log('\nTest 5: resolveParadox');
try {
  const result = mod.resolveParadox(JSON.stringify({ value: 100 }));
  const parsed = JSON.parse(result);
  console.log('✓ resolveParadox works');
  console.log('  Resolution steps:', parsed.resolution_steps.length);
  console.log('  Converged:', parsed.converged);
} catch (e) {
  console.log('✗ resolveParadox failed:', e.message);
}

console.log('\n=== All Core Tests Completed ===\n');
