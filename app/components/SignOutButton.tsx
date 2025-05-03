import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import globalStyles, {COLORS} from '../styles/global';
const SignOutButton = () => {
    const { signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (error: any) {
            console.error('Error signing out:', error);
            Alert.alert('Sign Out Error', error.message || 'Failed to sign out.');
        }
    };

    return (
        <TouchableOpacity
            style={globalStyles.buttonSecondary}
            onPress={handleSignOut}
        >
            <Text style={globalStyles.buttonTextSecondary}>Sign Out</Text>
        </TouchableOpacity>
    );
};

export default SignOutButton;