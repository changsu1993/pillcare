/**
 * useOnboarding Hook
 *
 * Manages onboarding state and navigation.
 * Provides utilities for checking and updating onboarding status.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
  isDontShowAgain,
  setDontShowAgain,
  resetOnboardingStatus,
  UserRole,
} from '../services/onboardingStorage';

interface UseOnboardingReturn {
  /** Whether onboarding status is being loaded */
  isLoading: boolean;
  /** Whether onboarding has been completed */
  hasCompletedOnboarding: boolean;
  /** Whether "Don't show again" is checked */
  dontShowAgain: boolean;
  /** Toggle "Don't show again" checkbox */
  toggleDontShowAgain: () => void;
  /** Complete onboarding and optionally set "Don't show again" */
  completeOnboarding: () => Promise<void>;
  /** Reset onboarding to show it again (from settings) */
  resetOnboarding: () => Promise<void>;
  /** Refresh onboarding status */
  refreshStatus: () => Promise<void>;
}

/**
 * Hook for managing onboarding state
 * @param role - User role (parent or child)
 */
export const useOnboarding = (role: UserRole): UseOnboardingReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [dontShowAgain, setDontShowAgainState] = useState(false);

  const loadOnboardingStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const [completed, dontShow] = await Promise.all([
        isOnboardingCompleted(role),
        isDontShowAgain(),
      ]);
      setHasCompletedOnboarding(completed);
      setDontShowAgainState(dontShow);
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const toggleDontShowAgain = useCallback(() => {
    setDontShowAgainState((prev) => !prev);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await setOnboardingCompleted(role);
      if (dontShowAgain) {
        await setDontShowAgain(true);
      }
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }, [role, dontShowAgain]);

  const resetOnboarding = useCallback(async () => {
    try {
      await resetOnboardingStatus(role);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }, [role]);

  const refreshStatus = useCallback(async () => {
    await loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  return {
    isLoading,
    hasCompletedOnboarding,
    dontShowAgain,
    toggleDontShowAgain,
    completeOnboarding,
    resetOnboarding,
    refreshStatus,
  };
};

export default useOnboarding;
