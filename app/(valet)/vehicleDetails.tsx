import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, vehiclesCollection, customersCollection, getUserProfile } from '@/lib/firebase';
import { VehicleData, CustomerData } from '@/types';
import globalStyles, {COLORS} from '../styles/global';

const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
        const date = timestamp.toDate();
        return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) { return "Invalid Date"; }
};

export default function VehicleDetailsScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();

    const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
    const [customerDetails, setCustomerDetails] = useState<Pick<CustomerData, 'name' | 'phoneNumber'> | null>(null);
    const [checkInValetName, setCheckInValetName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!vehicleId) { setError("Vehicle ID not provided."); setLoading(false); return; }
            setLoading(true); setError(null); setCustomerDetails(null); setCheckInValetName(null); setVehicleData(null);

            try {
                const vehicleDocRef = doc(vehiclesCollection, vehicleId);
                const vehicleSnap = await getDoc(vehicleDocRef);
                if (!vehicleSnap.exists()) { setError("Vehicle not found."); return; }

                const fetchedVehicleData = { id: vehicleSnap.id, ...vehicleSnap.data() } as VehicleData;
                setVehicleData(fetchedVehicleData);

                let fetchedCustomerDetails: Pick<CustomerData, 'name' | 'phoneNumber'> | null = null;
                let fetchedValetName: string | null = null;

                const customerPromise = fetchedVehicleData.customerId ? getDoc(doc(customersCollection, fetchedVehicleData.customerId)) : Promise.resolve(null);
                const valetProfilePromise = fetchedVehicleData.valetId ? getUserProfile(fetchedVehicleData.valetId) : Promise.resolve(null);
                const [customerSnap, valetProfile] = await Promise.all([customerPromise, valetProfilePromise]);

                if (customerSnap?.exists()) { fetchedCustomerDetails = customerSnap.data() as Pick<CustomerData, 'name' | 'phoneNumber'>; }
                setCustomerDetails(fetchedCustomerDetails);

                if (valetProfile) { fetchedValetName = valetProfile.name; }
                setCheckInValetName(fetchedValetName);

            } catch (err: any) {
                console.error("Error fetching vehicle details:", err);
                setError(err.message || "Failed to load vehicle details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [vehicleId]);

    useLayoutEffect(() => {
        let title = 'Vehicle Details';
        if (vehicleData) {
            title = vehicleData.licensePlate || `${vehicleData.make} ${vehicleData.model}` || 'Vehicle Details';
            if (customerDetails?.name) { title += ` (${customerDetails.name})`; }
        }
        navigation.setOptions({ title: title });
    }, [navigation, vehicleData, customerDetails]);

    const handleProceedToCheckout = useCallback(() => {
        if (!vehicleData) return;
        router.push({ pathname: '/(valet)/checkout', params: { licensePlate: vehicleData.licensePlate } });
    }, [router, vehicleData]);

    if (loading) {
        return <View style={globalStyles.centeredContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (error) {
        return (
            <View style={globalStyles.centeredContainer}>
                <Text style={globalStyles.errorText}>{error}</Text>
                <TouchableOpacity style={globalStyles.buttonSecondary} onPress={() => router.back()}>
                    <Text style={globalStyles.buttonTextSecondary}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!vehicleData) {
         return (
            <View style={globalStyles.centeredContainer}>
                <Text style={globalStyles.infoText}>Vehicle data not available.</Text>
                <TouchableOpacity style={globalStyles.buttonSecondary} onPress={() => router.back()}>
                    <Text style={globalStyles.buttonTextSecondary}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={styles.contentContainer}>

            <View style={globalStyles.card}>
                <Text style={styles.sectionTitle}>Vehicle Info</Text>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>License Plate:</Text>
                    <Text style={styles.value}>{vehicleData.licensePlate}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Make:</Text>
                    <Text style={styles.value}>{vehicleData.make}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Model:</Text>
                    <Text style={styles.value}>{vehicleData.model}</Text>
                 </View>
                 <View style={[styles.infoRow, styles.lastInfoRow]}>
                    <Text style={styles.label}>Color:</Text>
                    <Text style={styles.value}>{vehicleData.color}</Text>
                 </View>
            </View>

             <View style={globalStyles.card}>
                <Text style={styles.sectionTitle}>Parking Details</Text>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Parking Spot:</Text>
                    <Text style={styles.value}>{vehicleData.parkingSpotLabel || vehicleData.parkingSpotId}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Checked In:</Text>
                    <Text style={styles.value}>{formatTimestamp(vehicleData.checkInTime)}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Expected Out:</Text>
                    <Text style={styles.value}>{formatTimestamp(vehicleData.expectedCheckOutTime)}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.label}>Checked In By:</Text>
                    <Text style={styles.value}>{checkInValetName || `ID: ${vehicleData.valetId}`}</Text>
                 </View>
                  <View style={[styles.infoRow, styles.lastInfoRow]}>
                    <Text style={styles.label}>Customer Phone:</Text>
                    <Text style={styles.value}>{customerDetails?.phoneNumber || `ID: ${vehicleData.customerId}`}</Text>
                </View>
             </View>

             <View style={styles.actionsContainer}>
                 <TouchableOpacity style={globalStyles.button} onPress={handleProceedToCheckout}>
                    <Text style={globalStyles.buttonText}>Proceed to Check-Out</Text>
                 </TouchableOpacity>
             </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: globalStyles.subtitle.fontSize,
        color: globalStyles.subtitle.color,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    lastInfoRow: {
        borderBottomWidth: 0,
    },
    label: {
        fontSize: globalStyles.label.fontSize,
        fontWeight: globalStyles.label.fontWeight,
        color: globalStyles.label.color,
        marginRight: 10,
    },
    value: {
        fontSize: globalStyles.bodyText.fontSize,
        color: globalStyles.bodyText.color,
        flexShrink: 1,
        textAlign: 'right',
    },
    actionsContainer: {
        marginTop: 30,
    }
});
