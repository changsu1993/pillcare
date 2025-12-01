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
  ForgotPassword: undefined;
  FindEmail: undefined;
  ResetPassword: { email?: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

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
  AddMedication: undefined;
  EditMedication: {
    medicationId: string;
  };
  InvitationCode: undefined;
  MedicationCalendar: undefined;
  ProfileEdit: undefined;
};

export type ParentTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

export type ParentScreenProps<T extends keyof ParentStackParamList> = StackScreenProps<
  ParentStackParamList,
  T
>;

// Child Navigator - Tab Navigator
export type ChildTabParamList = {
  HomeTab: undefined;
  MedicationsTab: undefined;
  AppointmentsTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

// Child Navigator - Stack Navigator (for nested screens)
export type ChildStackParamList = {
  Home: undefined;
  MedicationManage: undefined;
  MedicationDetail: { medicationId: string };
  AddMedication: { parentId: string };
  EditMedication: { medicationId: string };
  Reports: undefined;
  Settings: undefined;
  EnterCode: undefined;
  // Appointments
  AppointmentList: undefined;
  AppointmentDetail: { appointmentId: string };
  AddAppointment: { parentId: string };
  EditAppointment: { appointmentId: string };
  // Profile
  ProfileEdit: undefined;
};

export type ChildTabScreenProps<T extends keyof ChildTabParamList> = BottomTabScreenProps<
  ChildTabParamList,
  T
>;

export type ChildStackScreenProps<T extends keyof ChildStackParamList> = StackScreenProps<
  ChildStackParamList,
  T
>;

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
