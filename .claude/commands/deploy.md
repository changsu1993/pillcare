---
description: Deploy PillCare app to TestFlight/Play Console
---

Deploy the PillCare application:

1. Pre-deployment checks:
   - Run all unit tests (npm test)
   - Run E2E tests (npm run test:e2e)
   - Check for TypeScript errors
   - Verify all environment variables are set
   - Check git status (should be on main branch with no uncommitted changes)

2. Build the app:
   - For iOS: Run Expo build for iOS (TestFlight)
   - For Android: Run Expo build for Android (Play Console Beta)

3. Version bump:
   - Update version in package.json
   - Create git tag for the release

4. Upload builds:
   - iOS: Upload to TestFlight
   - Android: Upload to Google Play Console (Beta track)

5. Post-deployment:
   - Create a GitHub release with changelog
   - Notify beta testers
   - Update deployment documentation

Stop if any tests fail or errors occur. Display detailed logs at each step.
