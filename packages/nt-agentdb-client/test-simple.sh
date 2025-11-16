#!/bin/bash
echo "Running final test verification..."
timeout 60 pnpm test 2>&1 | grep -E "Test Files|Tests|✓|PASS" | head -20
