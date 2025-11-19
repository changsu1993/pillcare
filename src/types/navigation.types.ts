/**
 * Navigation Types
 *
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

// Parent Navigator - Now using Stack inside Tabs
export type ParentStackParamList = {
  Home: undefined;
  Settings: undefined;
  FullScreenReminder: {
    medicationId: string;
    scheduledTime: string;
  };
  Confirmation: {
    medicationName: string;
    takenAt: string;
  };
  SkipReason: {
    medicationId: string;
    scheduledTime: string;
  };
  MedicationDetail: {
    medicationId: string;
  };
};

export type ParentTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

export type ParentScreenProps<T extends keyof ParentStackParamList> =
  StackScreenProps<ParentStackParamList, T>;

// Child Navigator
export type ChildTabParamList = {
  Timeline: undefined;
  Records: undefined;
  Settings: undefined;
};

export type ChildScreenProps<T extends keyof ChildTabParamList> =
  BottomTabScreenProps<ChildTabParamList, T>;

// Root Navigator (if needed)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Parent: NavigatorScreenParams<ParentTabParamList>;
  Child: NavigatorScreenParams<ChildTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
