import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='login' />
      <Stack.Screen name='index' />
      <Stack.Screen name='(admin)' />
      <Stack.Screen name='(valet)' />
      <Stack.Screen name='+not-found' />
    </Stack>
  );
}
