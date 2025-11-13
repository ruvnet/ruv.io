# Development Guide for @ruv.io/bit-parallel-search

## Prerequisites

- Node.js 16.x or later
- Rust 1.56 or later
- pnpm 8.x or later

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the native module:
   ```bash
   pnpm build
   ```

## Development Workflow

### Building

Build the release binary:
```bash
pnpm build
```

Build debug version:
```bash
pnpm build:debug
```

### Testing

Run tests:
```bash
pnpm test
```

Watch mode:
```bash
pnpm test:watch
```

### Linting and Formatting

Lint the code:
```bash
pnpm lint
```

Format code:
```bash
pnpm format
```

This will run both `prettier` on TypeScript and `cargo fmt` on Rust.

### Clean

Remove build artifacts:
```bash
pnpm clean
```

## Project Structure

```
.
├── src/
│   ├── lib.rs              # Main Rust bindings
│   └── index.ts            # TypeScript wrapper
├── __test__/
│   └── index.spec.ts       # Test suite
├── Cargo.toml              # Rust package manifest
├── package.json            # Node.js package manifest
├── build.rs                # Build script
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest configuration
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
└── README.md               # Package documentation
```

## Understanding the Code

### Rust Bindings (src/lib.rs)

The Rust code provides NAPI bindings to the `bit-parallel-search` crate. Key exports:

- `BitParallelSearch` - Main struct for pattern searching
  - `search_all()` - Find all occurrences
  - `search_first()` - Find first occurrence
  - `count()` - Count occurrences
  - `contains()` - Check existence

- Utility functions:
  - `search()` - Simple one-off search
  - `search_detailed()` - Search with metadata

### TypeScript Wrapper (src/index.ts)

The TypeScript wrapper provides:

- `BitParallelSearchClass` - Wrapper around the Rust struct
- Type definitions for all functions and interfaces
- Helper functions with JSDoc comments

## Building for Different Platforms

NAPI-RS supports cross-compilation. Available targets:

- Linux x64 (GNU and musl)
- Linux ARM64 (GNU and musl)
- macOS x64 (Intel)
- macOS ARM64 (Apple Silicon)
- Windows x64 (MSVC)

To build for a specific platform:
```bash
napi build --platform --release --target <target>
```

## Common Issues

### Build fails with "napi-rs not found"

Make sure you have `@napi-rs/cli` installed globally or locally:
```bash
pnpm install -D @napi-rs/cli
```

### Tests fail due to missing native module

Rebuild the module:
```bash
pnpm clean && pnpm build
```

### Rust compilation errors

Ensure you have Rust 1.56+ installed:
```bash
rustup update
```

## Performance Optimization

The bit-parallel-search algorithm is optimized for:
- Single character patterns
- Medium-length patterns in large texts
- Alphabet-bounded searches (up to 256 unique bytes)

For patterns longer than the alphabet size (256), performance may degrade.

## Publishing

Prepare for publishing:
```bash
pnpm prepublishOnly
```

This will:
1. Build the release binaries
2. Generate TypeScript type definitions
3. Prepare the distribution

## Contributing

When contributing:
1. Follow Rust and TypeScript style guides
2. Run linting and formatting before submitting
3. Add tests for new features
4. Update documentation

## Resources

- [NAPI-RS Documentation](https://napi.rs/)
- [Rust bit-parallel-search Crate](https://crates.io/crates/bit-parallel-search)
- [Node.js Native Addons](https://nodejs.org/api/addons.html)
