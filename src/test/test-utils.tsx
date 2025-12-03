/**
 * Test Utilities for PillCare App
 *
 * Provides reusable test helpers, mock factories, and render utilities.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'parent' as const,
  phone_number: '010-1234-5678',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMedication = (overrides = {}) => ({
  id: 'medication-1',
  user_id: 'test-user-id',
  name: 'Test Medication',
  dosage: '1 tablet',
  frequency: 'daily',
  reminder_times: ['09:00', '21:00'],
  start_date: new Date().toISOString().split('T')[0],
  end_date: undefined,
  notes: 'Take with food',
  active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMedicationLog = (overrides = {}) => ({
  id: 'log-1',
  medication_id: 'medication-1',
  scheduled_at: new Date().toISOString(),
  taken: true,
  taken_at: new Date().toISOString(),
  skipped_reason: undefined,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockFamilyConnection = (overrides = {}) => ({
  id: 'connection-1',
  parent_id: 'parent-user-id',
  child_id: 'child-user-id',
  invitation_code: undefined,
  invitation_expires_at: undefined,
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAppointment = (overrides = {}) => ({
  id: 'appointment-1',
  user_id: 'test-user-id',
  title: 'Doctor Visit',
  hospital_name: 'Test Hospital',
  appointment_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  notes: 'Annual checkup',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockScheduledMedication = (overrides = {}) => ({
  id: 'medication-1-09:00',
  medication_id: 'medication-1',
  medication_name: 'Test Medication',
  dosage: '1 tablet',
  scheduled_time: '09:00',
  scheduled_at: new Date().toISOString(),
  taken: false,
  taken_at: undefined,
  skipped_reason: undefined,
  notes: 'Take with food',
  ...overrides,
});

export const createMockMissedMedicationEvent = (overrides = {}) => ({
  id: 'event-1',
  parent_id: 'parent-user-id',
  medication_id: 'medication-1',
  medication_name: 'Test Medication',
  scheduled_time: new Date().toISOString(),
  skip_reason: undefined,
  notified: false,
  read_at: undefined,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockNotificationPreferences = (overrides = {}) => ({
  id: 'pref-1',
  user_id: 'test-user-id',
  push_enabled: true,
  missed_medication_alert: true,
  daily_summary: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAppSettings = (overrides = {}) => ({
  voiceGuidanceEnabled: true,
  vibrationEnabled: true,
  voiceSpeed: 0.85 as const,
  ...overrides,
});

// Navigation wrapper for component tests
interface WrapperProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: WrapperProps) => {
  // Simple wrapper - NavigationContainer is mocked in setup.ts
  return <>{children}</>;
};

// Custom render function with providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';
export { customRender as render };

// Async utilities
export const waitForAsync = async (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const flushPromises = () => new Promise(setImmediate);

// Mock Supabase response helpers
export const createSuccessResponse = <T,>(data: T) => ({
  data,
  error: null,
});

export const createErrorResponse = (message: string, code?: string) => ({
  data: null,
  error: { message, code, details: null, hint: null },
});

// Navigation mock helpers
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  getParent: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  setParams: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
});

export const createMockRoute = <T extends object>(params?: T) => ({
  key: 'test-key',
  name: 'TestScreen',
  params: params || {},
});

// Supabase query builder mock helpers
export const createMockQueryBuilder = <T,>(resolvedData: T | null, error: Error | null = null) => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error }),
  };

  // Also return data directly for queries without .single()
  builder.select = jest.fn().mockImplementation(() => {
    const chainableBuilder = { ...builder };
    // Override to return array data
    chainableBuilder.then = (resolve: (value: { data: unknown[]; error: Error | null }) => void) => resolve({ data: resolvedData ? [resolvedData] : [], error });
    return chainableBuilder;
  });

  return builder;
};
