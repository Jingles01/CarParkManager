import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, addVehicle, getAvailableParkingSpots, getUserProfile, db, customersCollection} from '@/lib/firebase';
import { doc, getDoc, QueryDocumentSnapshot, DocumentData, getDocs, Timestamp } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import globalStyles , {COLORS} from '@/app/styles/global';
import { ParkingSpotData, CustomerData } from '@/types';
import carData from '../../data/carMakesModels.json';

export default function VehicleForm() {
    const { customerId: routeCustomerIdParam, parkingSpotId: routeParkingSpotIdParam } = useLocalSearchParams<{ customerId?: string, parkingSpotId?: string }>();
    const router = useRouter();

    const [color, setColor] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [expectedHours, setExpectedHours] = useState('');

    const [customerId, setCustomerId] = useState('');
    const [valetId, setValetId] = useState('');
    const [valetName, setValetName] = useState('');
    const [customerName, setCustomerName] = useState<string | null>(null);
    const [isLoadingCustomerName, setIsLoadingCustomerName] = useState(false);

    const [availableSpots, setAvailableSpots] = useState<ParkingSpotData[]>([]);
    const [selectedSpotId, setSelectedSpotId] = useState<string>('');

    const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [selectedMake, setSelectedMake] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');

    const makesList = useMemo(() => Object.keys(carData).sort(), []);
    const availableModels = useMemo(() => {
        return selectedMake ? (carData as Record<string, string[]>)[selectedMake].sort() : [];
    }, [selectedMake]);

    // TODO: Make dynamic
    const lotId = 'lot2';

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsFetchingInitialData(true);
            setError('');
            setCustomerName(null);

            const currentRouteCustomerId = Array.isArray(routeCustomerIdParam) ? routeCustomerIdParam[0] : routeCustomerIdParam;
            const currentRouteParkingSpotId = Array.isArray(routeParkingSpotIdParam) ? routeParkingSpotIdParam[0] : routeParkingSpotIdParam;

            setCustomerId(currentRouteCustomerId || '');
            setSelectedSpotId(currentRouteParkingSpotId || '');

            try {
                const currentUser = auth.currentUser;
                if (!currentUser) throw new Error("Valet user not logged in.");
                setValetId(currentUser.uid);
                const profile = await getUserProfile(currentUser.uid);
                setValetName(profile?.name || 'Unknown Valet');

                 if (currentRouteCustomerId) {
                     setIsLoadingCustomerName(true);
                     const customerDocRef = doc(customersCollection, currentRouteCustomerId);
                     try {
                         const custSnap = await getDoc(customerDocRef);
                         setCustomerName(custSnap.exists() ? (custSnap.data() as CustomerData).name || 'Name N/A' : 'Customer Not Found');
                     } catch (custError) {
                           console.error("Error fetching customer name:", custError);
                           setCustomerName('Error loading name');
                     } finally {
                           setIsLoadingCustomerName(false);
                     }
                 } else {
                     setCustomerName(null);
                 }

                 const spotsQuery = getAvailableParkingSpots(lotId);
                 const snapshot = await getDocs(spotsQuery);
                 const spots = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                     id: doc.id,
                     label: doc.data().label || doc.id,
                     status: doc.data().status,
                 })) as ParkingSpotData[];
                 setAvailableSpots(spots);

                 if (currentRouteParkingSpotId && !spots.some(spot => spot.id === currentRouteParkingSpotId)) {
                    console.warn(`Spot ${currentRouteParkingSpotId} passed via params is not available or not in lot ${lotId}. Clearing selection.`);
                    setSelectedSpotId('');
                 }

            } catch (err: any) {
                console.error("Error fetching initial data for VehicleForm:", err);
                setError(err.message || "Failed to load required data.");
            } finally {
                setIsFetchingInitialData(false);
            }
        };
        fetchInitialData();
    }, [lotId, routeCustomerIdParam, routeParkingSpotIdParam]);

    const handleMakeChange = useCallback((makeValue: string) => {
        setSelectedMake(makeValue);
        setSelectedModel('');
    }, []);

    const handleSubmit = useCallback(async () => {
        setError('');
        if (!customerId || !selectedMake || !selectedModel || !licensePlate.trim() || !expectedHours.trim() || !color.trim()) {
            Alert.alert('Missing Information', 'Please fill all vehicle details (Make, Model, Color, License Plate, Expected Hours).');
            return;
        }
         if (!selectedSpotId) {
             Alert.alert('Spot Selection Required', 'Please select an available parking spot.');
             return;
         }
        setIsSubmitting(true);
        try {
            const hours = parseInt(expectedHours);
            if (isNaN(hours) || hours <= 0) throw new Error("Invalid expected hours.");

            const expectedCheckout = Timestamp.fromDate( new Date(Date.now() + hours * 3600000) );
            const vehiclePayload = {
                customerId, make: selectedMake, model: selectedModel,
                color: color.trim(), licensePlate: licensePlate.trim().toUpperCase(),
                expectedCheckOutTime: expectedCheckout, parkingSpotId: selectedSpotId,
                valetId, photos: [],
            };
            await addVehicle(vehiclePayload);
            Alert.alert('Success', 'Vehicle checked in successfully.');
            router.push({
                pathname: '/(valet)/vehicleadded',
                params: { licensePlate: vehiclePayload.licensePlate, make: selectedMake, model: selectedModel},
            })
             setSelectedMake(''); setSelectedModel(''); setColor('');
             setLicensePlate(''); setExpectedHours(''); setSelectedSpotId('');
        } catch (err: any) {
            console.error("Check-in Error:", err);
            setError(err.message || 'Failed to check in vehicle');
            Alert.alert('Check-In Failed', err.message || 'Failed to check in vehicle');
        } finally{
            setIsSubmitting(false);
        }
        }, [customerId, selectedMake, selectedModel, color, licensePlate, expectedHours, selectedSpotId, valetId, router]);


        if (isFetchingInitialData) {
            return (
                <View style={globalStyles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={globalStyles.infoText}>Loading form...</Text>
                </View>
            );
        }

         if (error && !isSubmitting) {
             return (
                 <View style={globalStyles.centeredContainer}>
                     <Text style={globalStyles.errorText}>{error}</Text>
                     <TouchableOpacity style={globalStyles.buttonSecondary} onPress={() => router.back()}>
                         <Text style={globalStyles.buttonTextSecondary}>Go Back</Text>
                     </TouchableOpacity>
                 </View>
             );
         }

        return (
            <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                 <Text style={globalStyles.title}>Enter Vehicle Details</Text>

                 <Text style={globalStyles.infoText}>Valet: {valetName || 'Loading...'}</Text>
                 {customerId && (
                    <View style={styles.customerInfoContainer}>
                         <Text style={globalStyles.label}>Customer:</Text>
                         {isLoadingCustomerName ? (
                            <ActivityIndicator size="small" color={COLORS.primary}/>
                         ) : (
                            <Text style={styles.customerNameValue}>{customerName || `ID: ${customerId}`}</Text>
                         )}
                    </View>
                 )}

                 <Text style={globalStyles.label}>Make</Text>
                 <View style={globalStyles.pickerContainer}>
                    <Picker selectedValue={selectedMake} onValueChange={handleMakeChange} enabled={!isSubmitting} prompt="Select Make">
                        <Picker.Item label="-- Select Make --" value="" />
                        {makesList.map((make) => <Picker.Item key={make} label={make} value={make} />)}
                    </Picker>
                 </View>

                 <Text style={globalStyles.label}>Model</Text>
                 <View style={globalStyles.pickerContainer}>
                    <Picker selectedValue={selectedModel} onValueChange={(itemValue) => itemValue ? setSelectedModel(itemValue) : setSelectedModel('')} enabled={!isSubmitting && !!selectedMake && availableModels.length > 0} prompt="Select Model" >
                         <Picker.Item label={selectedMake ? "-- Select Model --" : "-- Select Make First --"} value="" />
                         {availableModels.map((model) => <Picker.Item key={model} label={model} value={model} />)}
                    </Picker>
                 </View>

                 <Text style={globalStyles.label}>Color</Text>
                 <TextInput style={globalStyles.input} value={color} onChangeText={setColor} editable={!isSubmitting} placeholder="e.g., Blue" placeholderTextColor={COLORS.textSecondary}/>

                 <Text style={globalStyles.label}>License Plate</Text>
                 <TextInput style={globalStyles.input} value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" editable={!isSubmitting} placeholder="e.g., ABC1234" placeholderTextColor={COLORS.textSecondary}/>

                 <Text style={globalStyles.label}>Expected Stay Duration (Hours)</Text>
                 <TextInput style={globalStyles.input} value={expectedHours} onChangeText={setExpectedHours} keyboardType="numeric" editable={!isSubmitting} placeholder="e.g., 2" placeholderTextColor={COLORS.textSecondary}/>

                 <Text style={globalStyles.label}>Parking Spot</Text>
                 <View style={globalStyles.pickerContainer}>
                      <Picker selectedValue={selectedSpotId} onValueChange={(itemValue) => itemValue ? setSelectedSpotId(itemValue) : null} enabled={!isSubmitting && availableSpots.length > 0} >
                          <Picker.Item label="-- Select Available Spot --" value="" />
                          {availableSpots.map((spot) => <Picker.Item key={spot.id} label={spot.label} value={spot.id} />)}
                      </Picker>
                 </View>
                 {availableSpots.length === 0 && !isFetchingInitialData && <Text style={globalStyles.infoText}>No available spots found in Lot {lotId}</Text>}

                 <View style={styles.buttonContainer}>
                     <TouchableOpacity style={[globalStyles.button, (isSubmitting || isFetchingInitialData) && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting || isFetchingInitialData}>
                         {isSubmitting ? (
                             <ActivityIndicator color={COLORS.textLight} />
                         ) : (
                             <Text style={globalStyles.buttonText}>Check-In Vehicle</Text>
                         )}
                     </TouchableOpacity>
                 </View>

                  <TouchableOpacity style={[globalStyles.buttonSecondary, (isSubmitting || isFetchingInitialData) && styles.disabledButton]} onPress={() => router.back()} disabled={isSubmitting || isFetchingInitialData}>
                     <Text style={globalStyles.buttonTextSecondary}>Cancel / Back</Text>
                  </TouchableOpacity>

            </ScrollView>
            );
    }

    const styles = StyleSheet.create({
        contentContainer: { paddingBottom: 50 },
        buttonContainer: { marginTop: 15, marginBottom: 10 },
        customerInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: COLORS.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
        },
        customerNameValue: {
            fontSize: globalStyles.label.fontSize,
            fontWeight: globalStyles.label.fontWeight,
            color: globalStyles.label.color,
            marginLeft: 10,
            flexShrink: 1,
        },
        disabledButton: {
             backgroundColor: COLORS.textSecondary,
             borderColor: COLORS.textSecondary,
             opacity: 0.7,
        },
    });