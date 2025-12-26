import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="(modals)/add-block" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
          <Stack.Screen 
            name="(modals)/proof" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
          <Stack.Screen 
            name="(modals)/constraints" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
          <Stack.Screen 
            name="(modals)/goal-optimizer" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
          <Stack.Screen 
            name="(modals)/debrief" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
          <Stack.Screen 
            name="(modals)/replan" 
            options={{ presentation: 'modal', headerShown: false }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
