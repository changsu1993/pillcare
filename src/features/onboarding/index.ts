/**
 * Onboarding Feature Exports
 */

// Navigator
export { default as OnboardingNavigator } from './navigation/OnboardingNavigator';
export type {
  ParentOnboardingStackParamList,
  ChildOnboardingStackParamList,
} from './navigation/OnboardingNavigator';

// Components
export { default as ProgressDots } from './components/ProgressDots';
export { default as OnboardingButton } from './components/OnboardingButton';
export { default as OnboardingIllustration } from './components/OnboardingIllustration';

// Hooks
export {
  default as useOnboarding,
  useOnboarding as useOnboardingHook,
} from './hooks/useOnboarding';

// Services
export {
  isOnboardingCompleted,
  setOnboardingCompleted,
  isDontShowAgain,
  setDontShowAgain,
  resetOnboardingStatus,
  STORAGE_KEYS as ONBOARDING_STORAGE_KEYS,
} from './services/onboardingStorage';
