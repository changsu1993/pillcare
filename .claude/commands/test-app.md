---
description: Run E2E tests for PillCare app
---

Run the full E2E test suite for the PillCare application:

1. Check if the Expo development server is running
2. If not running, start it in the background
3. Wait for the server to be ready
4. Run Playwright E2E tests covering:
   - Parent app medication reminder flow
   - Parent app "Took it / Missed it" button functionality
   - Child app notification receiving
   - Family connection flow
5. Display test results with pass/fail summary
6. If tests fail, show detailed error messages

Use the Playwright MCP server for test execution.
