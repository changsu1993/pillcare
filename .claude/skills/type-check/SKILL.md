---
name: type-check
description: Run TypeScript type checking with detailed analysis
version: 1.0.0
permissions:
  - bash
  - file:read
---

# TypeScript Type Check

Comprehensive TypeScript type checking and analysis.

## Capabilities

1. **Type Checking**
   ```bash
   npx tsc --noEmit
   ```
   - Full project type validation
   - No output files generated

2. **Error Analysis**
   - Group errors by file
   - Categorize by error type
   - Identify most problematic files

3. **Common Issue Detection**
   - Missing type definitions
   - Implicit 'any' types
   - Null/undefined handling
   - Props type mismatches
   - Missing exports/imports

## Error Categories

| Code | Category | Description |
|------|----------|-------------|
| TS2304 | Missing | Cannot find name |
| TS2322 | Mismatch | Type not assignable |
| TS2339 | Property | Property does not exist |
| TS7006 | Implicit | Implicit any type |
| TS2345 | Argument | Argument type mismatch |

## Output

- Total error count
- Errors grouped by file (sorted by count)
- Specific error messages with line numbers
- Fix suggestions for common patterns

## When to Use

- Before deployment
- After adding new dependencies
- When refactoring types
- To verify API contract changes
