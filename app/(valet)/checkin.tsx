import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import ParkingLotMap from '../components/ParkingLotMap';
import globalStyles, {COLORS} from '../styles/global';
import { doc, getDoc } from 'firebase/firestore';
import { customersCollection } from '@/lib/firebase';
import { CustomerData } from '@/types';

export default function CheckIn() {
    const router = useRouter();
    const { customerId: routeCustomerIdParam } = useLocalSearchParams<{ customerId?: string }>();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpotId, setSelectedSpotId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
    const [selectedSpotLabel, setSelectedSpotLabel] = useState<string | null>(null);
    const [isLoadingCustomerName, setIsLoadingCustomerName] = useState(false);

    // TODO: Make lotId dynamic
    const currentLotId = 'lot2';

    useEffect(() => {
        const routeCustomerId = Array.isArray(routeCustomerIdParam) ? routeCustomerIdParam[0] : routeCustomerIdParam;
        if (routeCustomerId && routeCustomerId !== customerId) {
            setSelectedSpotId('');
            setSelectedSpotLabel(null);
            setCustomerId(routeCustomerId);
            setSelectedCustomerName(null);
            setIsLoadingCustomerName(true);
            console.log(`CheckInScreen: Fetching customer name for ID: ${routeCustomerId}`);
            const customerDocRef = doc(customersCollection, routeCustomerId);
            getDoc(customerDocRef)
                .then(docSnap => { setSelectedCustomerName(docSnap.exists() ? (docSnap.data() as CustomerData).name || 'Name not found' : 'Customer not found'); })
                .catch(err => { console.error("Error fetching customer name:", err); setSelectedCustomerName('Error loading name'); })
                .finally(() => { setIsLoadingCustomerName(false); });
        } else if (!routeCustomerId && customerId) {
            setCustomerId(''); setSelectedCustomerName(null);
        }
    }, [routeCustomerIdParam, customerId]);

    const handleSearchCustomer = useCallback(() => {
        router.push({ pathname: '/(valet)/customersearch', params: { query: searchQuery, origin: '/(valet)/checkin' } });
    }, [router, searchQuery]);

    const navigateToNewCustomerForm = useCallback(() => {
        router.push({ pathname: '/(valet)/newcustomer', params: { origin: '/(valet)/checkin' } });
    }, [router]);

    const handleSpotSelected = useCallback((spotInfo: { id: string; label: string }) => {
        setSelectedSpotId(spotInfo.id);
        setSelectedSpotLabel(spotInfo.label);
    }, []);

    const handleProceedToVehicleForm = useCallback(() => {
        if (!customerId || !selectedSpotId) { Alert.alert("Selection Required", "Please select both a customer and a parking spot."); return; }
        router.push({ pathname: '/(valet)/VehicleForm', params: { parkingSpotId: selectedSpotId, customerId: customerId, lotId: currentLotId } });
    }, [customerId, selectedSpotId, router, currentLotId]);

    const canProceed = !!customerId && !!selectedSpotId;

    return (
        <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">

            <Text style={globalStyles.title}>Valet Check-in</Text>

            <Text style={globalStyles.subtitle}>1. Select Customer</Text>
            <View style={globalStyles.card}>
                 {customerId ? (
                    <View style={styles.customerSelectedContainer}>
                        <Text style={globalStyles.label}>
                            Customer: {isLoadingCustomerName ? <ActivityIndicator size="small" color={COLORS.primary}/> : (selectedCustomerName || `ID: ${customerId}`)}
                        </Text>
                        <TouchableOpacity style={[globalStyles.buttonSecondary, styles.changeButton]} onPress={() => { setCustomerId(''); setSelectedCustomerName(null); setSelectedSpotId(''); setSelectedSpotLabel(null); }}>
                            <Text style={globalStyles.buttonTextSecondary}>Change</Text>
                        </TouchableOpacity>
                    </View>
                 ) : (
                     <>
                         <View style={globalStyles.searchContainer}>
                             <TextInput
                                style={globalStyles.searchInput}
                                placeholder="Search Customer (Name, Phone)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                             />
                             <TouchableOpacity style={[globalStyles.button, styles.searchButton]} onPress={handleSearchCustomer}>
                                <Text style={globalStyles.buttonText}>Search</Text>
                             </TouchableOpacity>
                         </View>
                         <TouchableOpacity style={[globalStyles.button, styles.newCustomerButton]} onPress={navigateToNewCustomerForm}>
                            <Text style={globalStyles.buttonText}>Register New Customer</Text>
                         </TouchableOpacity>
                     </>
                 )}
            </View>

            <Text style={globalStyles.subtitle}>2. Select Parking Spot (Lot: {currentLotId})</Text>
             <View style={globalStyles.card}>
                <ParkingLotMap
                    lotId={currentLotId}
                    onSpotSelected={handleSpotSelected}
                    currentSelectedSpotId={selectedSpotId}
                />
                {selectedSpotId ? (
                    <Text style={styles.selectedInfoText}>Selected Spot: {selectedSpotLabel || selectedSpotId}</Text>
                ) : (
                    <Text style={globalStyles.infoText}>Tap an available spot on the map</Text>
                )}
             </View>

             <View style={styles.proceedButtonContainer}>
                 <TouchableOpacity style={[globalStyles.button, !canProceed && styles.disabledButton]} onPress={handleProceedToVehicleForm} disabled={!canProceed}>
                    <Text style={globalStyles.buttonText}>Enter Vehicle Details</Text>
                 </TouchableOpacity>
                {!canProceed && (
                    <Text style={[globalStyles.infoText, styles.proceedInfoText]}>
                        { !customerId && !selectedSpotId ? "Please select a customer and parking spot." : !customerId ? "Please select a customer." : "Please select a parking spot." }
                    </Text>
                )}
             </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        padding: globalStyles.container.padding,
        paddingBottom: 40,
    },
    customerSelectedContainer: {
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    changeButton: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        minHeight: 0,
    },
    searchButton: {
        marginLeft: 10,
        paddingVertical: 10,
        minHeight: 45,
    },
    newCustomerButton: {
        marginTop: 10,
    },
    selectedInfoText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginTop: 15,
        textAlign: 'center',
        fontWeight: '500',
    },
    proceedButtonContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    proceedInfoText: {
        marginTop: 8,
    },
    disabledButton: {
         backgroundColor: COLORS.textSecondary,
         borderColor: COLORS.textSecondary,
         opacity: 0.7,
    },
});
