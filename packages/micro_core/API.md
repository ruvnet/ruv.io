# API Reference

## MicroCore

Main class for semantic Cartan matrix operations and neural network processing.

### Constructor

```typescript
constructor(config?: Config)
```

Creates a new MicroCore instance with optional configuration.

**Parameters:**
- `config` (optional): Configuration object with the following properties:
  - `timeout` (number, optional): Operation timeout in milliseconds (default: 5000)
  - `retries` (number, optional): Number of retries for failed operations (default: 3)
  - `maxConcurrency` (number, optional): Maximum concurrent operations (default: 10)
  - `logLevel` (string, optional): Logging level - 'debug', 'info', 'warn', or 'error' (default: 'info')

**Example:**
```typescript
const client = new MicroCore({
  timeout: 10000,
  retries: 5,
  maxConcurrency: 20,
  logLevel: 'info'
})
```

### Methods

#### `process(data: Buffer): Promise<Buffer>`

Process input data asynchronously.

**Parameters:**
- `data` (Buffer): Input data to process

**Returns:**
- Promise that resolves to a processed buffer

**Example:**
```typescript
const input = Buffer.from('input data')
const output = await client.process(input)
console.log('Processed:', output)
```

#### `processSync(data: Buffer): Buffer`

Process input data synchronously (blocking operation).

**Parameters:**
- `data` (Buffer): Input data to process

**Returns:**
- Processed buffer

**Example:**
```typescript
const input = Buffer.from('input data')
const output = client.processSync(input)
console.log('Processed:', output)
```

#### `getStats(): Stats`

Get statistics about the current processing state.

**Returns:**
- Stats object with:
  - `processedCount` (number): Total items processed
  - `totalTimeMs` (number): Total processing time in milliseconds
  - `averageTimeMs` (number): Average processing time per item

**Example:**
```typescript
const stats = client.getStats()
console.log(`Processed ${stats.processedCount} items`)
console.log(`Average time: ${stats.averageTimeMs}ms`)
```

#### `reset(): void`

Reset internal statistics and state.

**Example:**
```typescript
client.reset()
const stats = client.getStats() // Will show 0 processed items
```

#### `close(): void`

Close the client and release resources.

**Example:**
```typescript
client.close()
```

---

## Utility Functions

### `processSimple(data: Buffer): Buffer`

Process data without creating a client instance. Useful for one-off operations.

**Parameters:**
- `data` (Buffer): Input data to process

**Returns:**
- Processed buffer

**Example:**
```typescript
import { processSimple } from '@ruv.io/micro_core'

const result = processSimple(Buffer.from('data'))
```

### `getVersion(): string`

Get the version of the native binding.

**Returns:**
- Version string (e.g., "0.2.0")

**Example:**
```typescript
import { getVersion } from '@ruv.io/micro_core'

const version = getVersion()
console.log(`Using micro_core v${version}`)
```

---

## Interfaces

### Config

Configuration object for client initialization.

```typescript
interface Config {
  timeout?: number          // Operation timeout in ms (default: 5000)
  retries?: number          // Number of retries (default: 3)
  maxConcurrency?: number   // Max concurrent operations (default: 10)
  logLevel?: string         // Logging level (default: 'info')
}
```

### Stats

Statistics about processing operations.

```typescript
interface Stats {
  processedCount: number    // Total items processed
  totalTimeMs: number       // Total processing time in milliseconds
  averageTimeMs: number     // Average time per item
}
```

---

## Error Handling

The package may throw errors in the following cases:

1. **Invalid Input**: When provided data is malformed
2. **Processing Failures**: When the processing operation fails
3. **Timeout**: When an operation exceeds the configured timeout
4. **Resource Exhausted**: When system resources are insufficient

### Error Codes

- `INVALID_INPUT`: Invalid input data provided
- `PROCESSING_FAILED`: Processing operation failed
- `TIMEOUT`: Operation exceeded timeout
- `RESOURCE_EXHAUSTED`: System resources exhausted

### Example Error Handling

```typescript
try {
  const result = await client.process(data)
} catch (error) {
  console.error('Processing failed:', error.message)
  // Handle error appropriately
}
```

---

## Performance Considerations

### Memory Usage

- **Base overhead**: ~5MB (includes Rust runtime)
- **Per instance**: ~500KB
- **Processing**: ~2x input size (temporary buffers)

### Optimization Tips

1. **Reuse Instances**: Create once, use many times
   ```typescript
   const client = new MicroCore()
   // Use for multiple operations
   await client.close()
   ```

2. **Batch Processing**: Process multiple items in parallel
   ```typescript
   const results = await Promise.all(
     items.map(item => client.process(item))
   )
   ```

3. **Buffer Pooling**: Reuse buffers when possible
   ```typescript
   const buffer = Buffer.allocUnsafe(1024)
   // Reuse for multiple operations
   ```

4. **Tune Concurrency**: Adjust maxConcurrency based on workload
   ```typescript
   const client = new MicroCore({ maxConcurrency: 50 })
   ```

---

## Examples

### Basic Usage

```typescript
import { MicroCore } from '@ruv.io/micro_core'

async function basicExample() {
  const client = new MicroCore()

  const input = Buffer.from('Sample data')
  const output = await client.process(input)

  console.log('Processed:', output.toString())

  client.close()
}

basicExample()
```

### With Configuration

```typescript
import { MicroCore, Config } from '@ruv.io/micro_core'

const config: Config = {
  timeout: 30000,
  retries: 5,
  maxConcurrency: 50,
  logLevel: 'debug'
}

const client = new MicroCore(config)
```

### Statistics Tracking

```typescript
const client = new MicroCore()

for (let i = 0; i < 100; i++) {
  await client.process(Buffer.from(`item-${i}`))
}

const stats = client.getStats()
console.log(`Processed ${stats.processedCount} items in ${stats.totalTimeMs}ms`)
console.log(`Average: ${stats.averageTimeMs}ms per item`)

client.close()
```

### Batch Processing

```typescript
const client = new MicroCore({ maxConcurrency: 20 })

const items = Array.from({ length: 100 }, (_, i) => Buffer.from(`item-${i}`))

const results = await Promise.all(
  items.map(item => client.process(item))
)

console.log(`Processed ${results.length} items`)

client.close()
```

---

## Supported Platforms

| Platform | Architecture | Status |
|----------|-------------|--------|
| Linux | x64 (GNU) | ✅ Supported |
| Linux | x64 (musl) | ✅ Supported |
| Linux | ARM64 (GNU) | ✅ Supported |
| macOS | x64 (Intel) | ✅ Supported |
| macOS | ARM64 (Apple Silicon) | ✅ Supported |
| Windows | x64 (MSVC) | ✅ Supported |
| Windows | ARM64 (MSVC) | ✅ Supported |

---

## Node.js Requirements

- **Minimum**: Node.js 16.x
- **Recommended**: Node.js 20.x or later
- **LTS Versions**: All LTS versions supported

---

## Changelog

### Version 0.2.0

- Initial release with NAPI-RS bindings
- Support for synchronous and asynchronous processing
- Statistics tracking
- Configuration options
- Cross-platform support

---

## License

MIT OR Apache-2.0
