import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import globalStyles, {COLORS} from '../styles/global';

export default function ValetLayout() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (profile?.role !== 'valet') {
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

    if (profile?.role !== 'valet') {
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
            <Stack.Screen name="home" options={{ title: 'Valet Dashboard' }} />
            <Stack.Screen name="checkin" options={{ title: 'Check-In Vehicle' }} />
            <Stack.Screen name="customersearch" options={{ title: 'Search Customer' }} />
            <Stack.Screen name="newcustomer" options={{ title: 'New Customer' }} />
            <Stack.Screen name="vehicleadded" options={{ title: 'Vehicle Added' }} />
            <Stack.Screen name="checkout" options={{ title: 'Check-out Vehicle' }}/>
            <Stack.Screen name="activevehicles" options={{ title: 'Active Vehicles' }} />
            <Stack.Screen name="VehicleForm" options={{ title: 'Enter Vehicle Details' }} />
            <Stack.Screen name="vehicleDetails" options={{ title: 'Vehicle Details' }} />
        </Stack>
    );
}