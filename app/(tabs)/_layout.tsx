import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuthStore } from '@/store/auth';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string; size?: number }) {
  return <FontAwesome size={props.size ?? 24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const palette = Colors[colorScheme ?? 'light'];

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: styles.tabBar,
        headerShown: useClientOnlyValue(false, true),
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarLabel: 'Create',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} size={30} />,
          tabBarButton: (props) => (
            <Pressable
              accessibilityLabel="Create note"
              {...props}
              style={({ pressed }) => [
                styles.centerButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <View style={styles.centerIconWrapper}>
                <FontAwesome name="plus" color="#ffffff" size={22} />
              </View>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarLabel: 'Library',
          tabBarIcon: ({ color }) => <TabBarIcon name="bookmark" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 6,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1,
  },
  centerButton: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  centerIconWrapper: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316', // orange circle
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
