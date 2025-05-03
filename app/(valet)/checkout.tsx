import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getVehicleByLicensePlate, checkOutVehicle } from '../../lib/firebase';
import { getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { VehicleData } from '@/types';
import globalStyles, {COLORS} from '../styles/global';

export default function CheckoutScreen() {
    const router = useRouter();
    const { licensePlate: routeLicensePlate } = useLocalSearchParams<{ licensePlate?: string }>();
    const [licensePlateQuery, setLicensePlateQuery] = useState(routeLicensePlate || '');
    const [vehicle, setVehicle] = useState<VehicleData | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
    const [error, setError] = useState('');

    const handleSearchVehicle = useCallback(async (plateToSearch: string) => {
        setError(''); setVehicle(null);
        const normalizedPlate = plateToSearch.trim().toUpperCase();
        if (!normalizedPlate) { setError('Please enter a license plate to search.'); return; }
        console.log(`CheckoutScreen: Searching for plate: ${normalizedPlate}`);
        setIsSearching(true);
        try {
            const q = getVehicleByLicensePlate(normalizedPlate);
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setError(`No active vehicle found with license plate: ${normalizedPlate}`);
            } else {
                const doc = snapshot.docs[0] as QueryDocumentSnapshot<DocumentData>;
                setVehicle({ id: doc.id, ...doc.data() } as VehicleData);
            }
        } catch (err: any) {
            console.error("Search Error:", err);
            setError('Failed to search for vehicle.');
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (routeLicensePlate && !vehicle && !isSearching && !error) {
             console.log(`CheckoutScreen: Auto-searching for passed plate: ${routeLicensePlate}`);
             handleSearchVehicle(routeLicensePlate);
        }
    }, [routeLicensePlate]);

    const handleCheckout = useCallback(async () => {
        if (!vehicle) { setError('Please search for and find a vehicle first.'); return; }
        setIsCheckingOut(true); setError('');
        try {
            await checkOutVehicle(vehicle.id || '', vehicle.parkingSpotId);
            Alert.alert('Success', `Vehicle ${vehicle.licensePlate} checked out successfully!`);
            router.replace('/(valet)/home');
        } catch (err: any) {
            console.error('Error checking out vehicle:', err);
            setError(err.message || 'Failed to check out vehicle.');
            Alert.alert('Checkout Error', err.message || 'Failed to check out vehicle.');
        } finally {
            setIsCheckingOut(false);
        }
    }, [vehicle, router]);

    return (
        <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
            <Text style={globalStyles.title}>Vehicle Checkout</Text>

            <View style={globalStyles.searchContainer}>
                <TextInput
                    style={globalStyles.searchInput}
                    placeholder="Enter License Plate"
                    placeholderTextColor={COLORS.textSecondary}
                    value={licensePlateQuery}
                     onChangeText={(text) => {
                         setLicensePlateQuery(text);
                         if (vehicle || error) {
                             setVehicle(null);
                             setError('');
                         }
                     }}
                     autoCapitalize="characters"
                     editable={!isSearching && !isCheckingOut}
                />
                <TouchableOpacity
                    style={[globalStyles.button, styles.searchButton, (isSearching || !licensePlateQuery.trim()) && styles.disabledButton]}
                    onPress={() => handleSearchVehicle(licensePlateQuery)}
                    disabled={isSearching || isCheckingOut || !licensePlateQuery.trim()}
                >
                    {isSearching ? (
                        <ActivityIndicator color={COLORS.textLight} size="small"/>
                    ) : (
                        <Text style={globalStyles.buttonText}>Search</Text>
                    )}
                </TouchableOpacity>
            </View>

            {error ? <Text style={globalStyles.errorText}>{error}</Text> : null}

            {vehicle && !isSearching && (
                <View style={[globalStyles.card, styles.vehicleInfoCard]}>
                    <Text style={globalStyles.bodyText}>Make: {vehicle.make}</Text>
                    <Text style={globalStyles.bodyText}>Model: {vehicle.model}</Text>
                    <Text style={globalStyles.bodyText}>License Plate: {vehicle.licensePlate}</Text>
                    <Text style={globalStyles.bodyText}>Parking Spot: {vehicle.parkingSpotLabel || vehicle.parkingSpotId}</Text>

                    <TouchableOpacity
                         style={[globalStyles.button, styles.checkoutButton, isCheckingOut && styles.disabledButton]}
                         onPress={handleCheckout}
                         disabled={isCheckingOut || isSearching}
                    >
                         {isCheckingOut ? (
                             <ActivityIndicator color={COLORS.textLight} size="small"/>
                         ) : (
                             <Text style={globalStyles.buttonText}>Checkout Vehicle</Text>
                         )}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
     searchButton: {
         marginLeft: 10,
         paddingVertical: 10,
         minHeight: 45,
         justifyContent: 'center',
     },
    vehicleInfoCard: {
        marginTop: 20,
    },
    checkoutButton: {
        marginTop: 15,
    },
    disabledButton: {
        backgroundColor: COLORS.textSecondary,
        borderColor: COLORS.textSecondary,
        opacity: 0.7,
    },
});