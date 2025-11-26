---
name: lint-fix
description: Auto-fix linting and formatting issues
version: 1.0.0
permissions:
  - bash
  - file:read
  - file:write
---

# Lint and Format Fix

Automatically fix code quality issues in the PillCare codebase.

## Capabilities

1. **ESLint Auto-Fix**
   ```bash
   npm run lint:fix
   ```
   - Fix auto-fixable ESLint errors
   - Apply React/React Native best practices
   - Enforce TypeScript rules

2. **Prettier Formatting**
   ```bash
   npm run format
   ```
   - Consistent code formatting
   - Fix indentation and spacing
   - Normalize quotes and semicolons

3. **TypeScript Check**
   ```bash
   npm run typecheck
   ```
   - Verify type safety
   - Detect type errors

## Workflow

1. Run ESLint with auto-fix
2. Run Prettier formatting
3. Run TypeScript type check
4. Report remaining issues that need manual fix

## Output

- Count of auto-fixed issues
- List of remaining errors by file
- Severity classification (error/warning)
- Specific fix suggestions for manual issues

## When to Use

- Before committing code
- After major refactoring
- When CI lint checks fail
- To clean up imported/generated code
