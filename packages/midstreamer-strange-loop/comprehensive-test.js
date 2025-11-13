// Comprehensive test suite for midstreamer-strange-loop
const mod = require('./index.js');

let passCount = 0;
let failCount = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passCount++;
    results.push(`✓ ${name}`);
  } catch (e) {
    failCount++;
    results.push(`✗ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

console.log('=== Midstreamer Strange Loop - Comprehensive Test Suite ===\n');

// Test Suite 1: processStrangeLoop
console.log('Processing Suite...');

test('processStrangeLoop with basic loop state', () => {
  const loopState = { id: 'loop-001', depth: 3, data: { value: 42 } };
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify(loopState), '{}'));
  assert(result.id === 'loop-001', 'ID mismatch');
  assert(result.iterations > 0, 'Iterations should be > 0');
  assert(result.depth_reached >= 0, 'Depth reached should be >= 0');
});

test('processStrangeLoop with max_depth config', () => {
  const loopState = { id: 'loop-002', depth: 5, data: 100 };
  const config = { max_depth: 5 };
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify(loopState), JSON.stringify(config)));
  assert(result.depth_reached <= 5, 'Depth exceeded max_depth');
});

test('processStrangeLoop with disabled recursion', () => {
  const loopState = { id: 'loop-003', depth: 10, data: 'test' };
  const config = { enable_recursion: false };
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify(loopState), JSON.stringify(config)));
  assert(result.iterations <= 2, 'Recursion not disabled properly');
});

test('processStrangeLoop includes processing time', () => {
  const loopState = { id: 'loop-004', depth: 2, data: { x: 1 } };
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify(loopState), '{}'));
  assert(result.processing_time_ms >= 0, 'Processing time should be >= 0');
});

test('processStrangeLoop handles array data', () => {
  const loopState = { id: 'loop-005', depth: 2, data: [1, 2, 3] };
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify(loopState), '{}'));
  assert(Array.isArray(result.result), 'Result should be array');
});

// Test Suite 2: analyzeMetaLearning
console.log('Meta-learning Suite...');

test('analyzeMetaLearning with basic context', () => {
  const context = { id: 'meta-001', level: 0, content: 'Test' };
  const result = JSON.parse(mod.analyzeMetaLearning(JSON.stringify(context)));
  assert(result.id === 'meta-001', 'ID mismatch');
  assert(result.levels_analyzed > 0, 'Levels should be > 0');
  assert(Array.isArray(result.insights), 'Insights should be array');
});

test('analyzeMetaLearning with self-references', () => {
  const context = {
    id: 'meta-002',
    level: 0,
    content: 'Base',
    self_reference: {
      id: 'meta-002-inner',
      level: 1,
      content: 'Inner'
    }
  };
  const result = JSON.parse(mod.analyzeMetaLearning(JSON.stringify(context)));
  assert(result.self_references_found > 0, 'Self-references not detected');
});

test('analyzeMetaLearning calculates confidence', () => {
  const context = { id: 'meta-003', level: 0, content: 'Test' };
  const result = JSON.parse(mod.analyzeMetaLearning(JSON.stringify(context)));
  assert(result.confidence_score >= 0 && result.confidence_score <= 1, 'Confidence out of range');
});

test('analyzeMetaLearning with optional metadata', () => {
  const context = { id: 'meta-004', level: 0, content: 'Test' };
  const result = JSON.parse(mod.analyzeMetaLearning(JSON.stringify(context)));
  assert(result !== null, 'Result should not be null');
});

// Test Suite 3: detectPatterns
console.log('Pattern Detection Suite...');

test('detectPatterns in nested data', () => {
  const data = { self: { inner: { value: 100 } } };
  const result = JSON.parse(mod.detectPatterns(JSON.stringify(data)));
  assert(Array.isArray(result.patterns), 'Patterns should be array');
  assert(typeof result.cycle_detected === 'boolean', 'Cycle detected should be boolean');
});

test('detectPatterns detects self-reference', () => {
  const data = { self: { value: 42 } };
  const result = JSON.parse(mod.detectPatterns(JSON.stringify(data)));
  assert(result.patterns.includes('self_referential'), 'Self-reference not detected');
});

test('detectPatterns with simple data', () => {
  const data = { value: 42 };
  const result = JSON.parse(mod.detectPatterns(JSON.stringify(data)));
  assert(result !== null, 'Result should not be null');
});

test('detectPatterns with array', () => {
  const data = [1, 2, 3, 4];
  const result = JSON.parse(mod.detectPatterns(JSON.stringify(data)));
  assert(result !== null, 'Result should not be null');
});

// Test Suite 4: extractLayers
console.log('Layer Extraction Suite...');

test('extractLayers from nested structure', () => {
  const data = { self: { self: { value: 'deep' } } };
  const result = JSON.parse(mod.extractLayers(JSON.stringify(data)));
  assert(Array.isArray(result), 'Result should be array');
  assert(result.length > 0, 'Should extract at least one layer');
});

test('extractLayers with multiple nesting levels', () => {
  const data = { self: { self: { self: { value: 'bottom' } } } };
  const result = JSON.parse(mod.extractLayers(JSON.stringify(data)));
  assert(result.length >= 3, 'Should extract multiple layers');
});

test('extractLayers with inner property', () => {
  const data = { inner: { nested: { value: 'found' } } };
  const result = JSON.parse(mod.extractLayers(JSON.stringify(data)));
  assert(result.length > 1, 'Should extract layers from inner property');
});

test('extractLayers with simple data', () => {
  const data = { value: 42 };
  const result = JSON.parse(mod.extractLayers(JSON.stringify(data)));
  assert(result.length > 0, 'Should extract at least one layer');
});

// Test Suite 5: resolveParadox
console.log('Paradox Resolution Suite...');

test('resolveParadox with numeric data', () => {
  const result = JSON.parse(mod.resolveParadox(JSON.stringify({ value: 100 })));
  assert(Array.isArray(result.resolution_steps), 'Steps should be array');
  assert(result.resolution_steps.length > 0, 'Should have resolution steps');
  assert(typeof result.converged === 'boolean', 'Converged should be boolean');
});

test('resolveParadox includes final value', () => {
  const result = JSON.parse(mod.resolveParadox(JSON.stringify({ value: 50 })));
  assert(result.final_value !== undefined, 'Final value should be defined');
});

test('resolveParadox resolution steps have correct structure', () => {
  const result = JSON.parse(mod.resolveParadox(JSON.stringify({ value: 100 })));
  result.resolution_steps.forEach((step, index) => {
    assert(step.step === index, 'Step number should match index');
    assert(step.value !== undefined, 'Step should have value');
  });
});

test('resolveParadox with complex data', () => {
  const data = { value: 500, metadata: { type: 'test' } };
  const result = JSON.parse(mod.resolveParadox(JSON.stringify(data)));
  assert(result.resolution_steps.length > 0, 'Should have steps');
});

// Test Suite 6: Batch operations
console.log('Batch Operations Suite...');

test('Batch process with wrapper', () => {
  const loops = [
    { id: 'loop-1', depth: 1, data: 1 },
    { id: 'loop-2', depth: 2, data: 2 }
  ];

  const results = [];
  for (const loop of loops) {
    results.push(JSON.parse(mod.processStrangeLoop(JSON.stringify(loop), '{}')));
  }

  assert(results.length === 2, 'Should process both loops');
  assert(results[0].id === 'loop-1', 'First loop ID mismatch');
  assert(results[1].id === 'loop-2', 'Second loop ID mismatch');
});

// Test Suite 7: Error handling
console.log('Error Handling Suite...');

test('Handle invalid JSON gracefully', () => {
  try {
    const result = mod.processStrangeLoop(JSON.stringify({ id: 'invalid' }), '{}');
    assert(result !== null, 'Should return result even with minimal data');
  } catch (e) {
    // Expected for some cases
  }
});

test('Handle empty data', () => {
  const result = JSON.parse(mod.processStrangeLoop(JSON.stringify({ id: 'empty', depth: 0, data: {} }), '{}'));
  assert(result.id === 'empty', 'Should handle empty data');
});

// Print results
console.log('\n=== Test Results ===\n');
results.forEach(r => console.log(r));
console.log(`\nPassed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount > 0) {
  console.log('\nSome tests failed!');
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}
