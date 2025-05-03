import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import SignOutButton from '../components/SignOutButton';
import globalStyles from '../styles/global';

export default function ValetHomePage() {
    const router = useRouter();

    const navigateToCheckIn = () => router.push('/(valet)/checkin');
    const navigateToRetrieve = () => router.push('/(valet)/checkout');
    const navigateToActiveVehicles = () => router.push('/(valet)/activevehicles');

    return (
        <View style={[globalStyles.container, styles.pageContainer]}>
            <Text style={globalStyles.title}>Valet Dashboard</Text>

            <TouchableOpacity style={globalStyles.button} onPress={navigateToCheckIn}>
                <Text style={globalStyles.buttonText}>Check-in Vehicle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={globalStyles.button} onPress={navigateToRetrieve}>
                <Text style={globalStyles.buttonText}>Check-out Vehicle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={globalStyles.button} onPress={navigateToActiveVehicles}>
                <Text style={globalStyles.buttonText}>Active Vehicles</Text>
            </TouchableOpacity>

            <View style={styles.signOutContainer}>
                <SignOutButton />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
    },
    signOutContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    }
});