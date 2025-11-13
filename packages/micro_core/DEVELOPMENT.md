# Development Guide

## Setup

```bash
pnpm install
```

## Building

### Development Build
```bash
pnpm build:debug
```

### Release Build
```bash
pnpm build
```

## Testing

### Run Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm test:watch
```

### Generate Coverage Report
```bash
pnpm test -- --coverage
```

## Code Quality

### Lint TypeScript
```bash
pnpm lint
```

### Format Code
```bash
pnpm format
```

This will:
- Format TypeScript with prettier
- Format Rust with cargo fmt

## Project Structure

```
packages/micro_core/
├── src/
│   ├── lib.rs           # Rust NAPI bindings
│   └── index.ts         # TypeScript wrapper
├── __test__/
│   └── index.spec.ts    # Test suite
├── Cargo.toml           # Rust configuration
├── package.json         # NPM configuration
├── tsconfig.json        # TypeScript configuration
└── jest.config.js       # Jest configuration
```

## Building for Different Platforms

The package supports cross-platform builds via `@napi-rs/cli`.

### Build for Specific Target
```bash
napi build --platform --release --target x86_64-unknown-linux-gnu
```

### Supported Targets
- `x86_64-unknown-linux-gnu` - Linux x64
- `x86_64-unknown-linux-musl` - Linux x64 (musl)
- `aarch64-unknown-linux-gnu` - Linux ARM64
- `aarch64-apple-darwin` - macOS ARM64
- `x86_64-apple-darwin` - macOS x64
- `x86_64-pc-windows-msvc` - Windows x64
- `aarch64-pc-windows-msvc` - Windows ARM64

## Debugging

### Enable Debug Logging
```bash
RUST_LOG=debug pnpm test
```

### Inspect Native Module
```bash
node -e "console.log(require('./index'))"
```

## Common Issues

### Build Failures
- Ensure you have Rust toolchain installed: `rustup install stable`
- Check that all dependencies are available: `pnpm install`

### Test Failures
- Clear build artifacts: `pnpm clean`
- Rebuild: `pnpm build:debug`
- Run tests: `pnpm test`

### Memory Issues
- Reduce test concurrency: `jest --maxWorkers=1`
- Check for memory leaks: `valgrind` or `heaptrack`

## Contributing

When adding new functionality:
1. Write tests first in `__test__/index.spec.ts`
2. Implement in `src/lib.rs`
3. Add TypeScript wrapper in `src/index.ts`
4. Ensure all tests pass
5. Run linting: `pnpm lint`
6. Run formatting: `pnpm format`
