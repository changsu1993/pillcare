/**
 * OnboardingNavigator
 *
 * Stack navigator for onboarding flow.
 * Supports both parent and child user roles.
 */

import React, { useState, useCallback } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Parent screens
import ParentWelcomeScreen from '../screens/parent/ParentWelcomeScreen';
import ParentOnboarding1Screen from '../screens/parent/ParentOnboarding1Screen';
import ParentOnboarding2Screen from '../screens/parent/ParentOnboarding2Screen';
import ParentOnboarding3Screen from '../screens/parent/ParentOnboarding3Screen';

// Child screens
import ChildWelcomeScreen from '../screens/child/ChildWelcomeScreen';
import ChildOnboarding1Screen from '../screens/child/ChildOnboarding1Screen';
import ChildOnboarding2Screen from '../screens/child/ChildOnboarding2Screen';
import ChildOnboarding3Screen from '../screens/child/ChildOnboarding3Screen';
import ChildOnboarding4Screen from '../screens/child/ChildOnboarding4Screen';
import ChildOnboarding5Screen from '../screens/child/ChildOnboarding5Screen';

// Types
export type ParentOnboardingStackParamList = {
  Welcome: undefined;
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
};

export type ChildOnboardingStackParamList = {
  Welcome: undefined;
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
  Step4: undefined;
  Step5: undefined;
};

const ParentStack = createStackNavigator<ParentOnboardingStackParamList>();
const ChildStack = createStackNavigator<ChildOnboardingStackParamList>();

interface OnboardingNavigatorProps {
  /** User role */
  role: 'parent' | 'child';
  /** Callback when onboarding is completed */
  onComplete: () => void;
  /** Callback to navigate to family connection (child only) */
  onConnectParent?: () => void;
}

/**
 * Parent Onboarding Navigator
 */
const ParentOnboardingNavigator: React.FC<{
  onComplete: () => void;
  dontShowAgain: boolean;
  onToggleDontShow: () => void;
}> = ({ onComplete, dontShowAgain, onToggleDontShow }) => {
  return (
    <ParentStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <ParentStack.Screen name="Welcome">
        {(props) => <ParentWelcomeScreen {...props} onSkip={onComplete} />}
      </ParentStack.Screen>
      <ParentStack.Screen name="Step1" component={ParentOnboarding1Screen} />
      <ParentStack.Screen name="Step2" component={ParentOnboarding2Screen} />
      <ParentStack.Screen name="Step3">
        {() => (
          <ParentOnboarding3Screen
            dontShowAgain={dontShowAgain}
            onToggleDontShow={onToggleDontShow}
            onComplete={onComplete}
          />
        )}
      </ParentStack.Screen>
    </ParentStack.Navigator>
  );
};

/**
 * Child Onboarding Navigator
 */
const ChildOnboardingNavigator: React.FC<{
  onComplete: () => void;
  onConnectParent: () => void;
  dontShowAgain: boolean;
  onToggleDontShow: () => void;
}> = ({ onComplete, onConnectParent, dontShowAgain, onToggleDontShow }) => {
  return (
    <ChildStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <ChildStack.Screen name="Welcome">
        {(props) => <ChildWelcomeScreen {...props} onSkip={onComplete} />}
      </ChildStack.Screen>
      <ChildStack.Screen name="Step1">
        {(props) => <ChildOnboarding1Screen {...props} onSkip={onComplete} />}
      </ChildStack.Screen>
      <ChildStack.Screen name="Step2">
        {(props) => <ChildOnboarding2Screen {...props} onSkip={onComplete} />}
      </ChildStack.Screen>
      <ChildStack.Screen name="Step3">
        {(props) => <ChildOnboarding3Screen {...props} onSkip={onComplete} />}
      </ChildStack.Screen>
      <ChildStack.Screen name="Step4">
        {(props) => <ChildOnboarding4Screen {...props} onSkip={onComplete} />}
      </ChildStack.Screen>
      <ChildStack.Screen name="Step5">
        {() => (
          <ChildOnboarding5Screen
            dontShowAgain={dontShowAgain}
            onToggleDontShow={onToggleDontShow}
            onComplete={onComplete}
            onConnectParent={onConnectParent}
          />
        )}
      </ChildStack.Screen>
    </ChildStack.Navigator>
  );
};

/**
 * Main Onboarding Navigator
 */
const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({
  role,
  onComplete,
  onConnectParent,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const toggleDontShowAgain = useCallback(() => {
    setDontShowAgain((prev) => !prev);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleConnectParent = useCallback(() => {
    if (onConnectParent) {
      onConnectParent();
    }
  }, [onConnectParent]);

  if (role === 'parent') {
    return (
      <ParentOnboardingNavigator
        onComplete={handleComplete}
        dontShowAgain={dontShowAgain}
        onToggleDontShow={toggleDontShowAgain}
      />
    );
  }

  return (
    <ChildOnboardingNavigator
      onComplete={handleComplete}
      onConnectParent={handleConnectParent}
      dontShowAgain={dontShowAgain}
      onToggleDontShow={toggleDontShowAgain}
    />
  );
};

export default OnboardingNavigator;
