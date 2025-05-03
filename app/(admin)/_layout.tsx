import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import globalStyles, {COLORS} from '../styles/global';

export default function AdminLayout() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (profile?.role !== 'admin') {
        router.replace('/login'); 
      }
    }
  }, [profile?.role, loading, router]);

  if (loading) {
    return (
      <View style={globalStyles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (profile?.role !== 'admin') {
    return null; 
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.surface, 
        },
        headerTintColor: COLORS.primary, 
        headerTitleStyle: {
          color: COLORS.textPrimary, 
          fontWeight: 'bold', 
        },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="createuserform" options={{ title: 'Create User' }} />
      <Stack.Screen name="users" options={{ title: 'User Management' }} />
      <Stack.Screen name="user" options={{ title: 'User Details' }} />
      <Stack.Screen name="layoutUploader" options={{ title: 'Upload Lot Layout' }} />
    </Stack>
  );
}

