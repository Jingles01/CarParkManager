import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Button, ScrollView, Alert } from 'react-native';
import { getActiveVehicles } from '@/lib/firebase';
import { onSnapshot, QuerySnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { VehicleData } from '../../types';
import { useRouter } from 'expo-router';
import globalStyles, {COLORS} from '../styles/global';

const formatTimestamp = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
         const date = timestamp.toDate();
         return date.toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return "Invalid Date";
    }
};

export default function ActiveVehiclesScreen() {
    const [vehicles, setVehicles] = useState<VehicleData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setLoading(true);
        const activeVehiclesQuery = getActiveVehicles();
        const unsubscribe = onSnapshot(activeVehiclesQuery,
            (querySnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedVehicles: VehicleData[] = [];
                querySnapshot.forEach((doc) => { fetchedVehicles.push({ id: doc.id, ...(doc.data() as Omit<VehicleData, 'id'>) }); });
                setVehicles(fetchedVehicles.sort((a, b) => (b.checkInTime?.seconds ?? 0) - (a.checkInTime?.seconds ?? 0)));
                setLoading(false); setError(null);
            },
            (err) => {
                console.error("Error fetching active vehicles:", err);
                setError("Failed to load active vehicles. Please try again."); setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const onRefresh = useCallback(() => {
        console.log("Refreshing active vehicles...");
        setRefreshing(true); setError(null);
        setTimeout(() => { setRefreshing(false); console.log("Refresh simulation complete."); }, 1000);
    }, []);

    const handleVehiclePress = (vehicle: VehicleData) => {
        if (!vehicle.id) { console.error("Vehicle item missing ID:", vehicle); Alert.alert("Error", "Cannot view details for this vehicle."); return; }
        router.push({ pathname: '/(valet)/vehicleDetails', params: { vehicleId: vehicle.id } });
    };

    const renderVehicleItem = ({ item }: { item: VehicleData }) => (
      <TouchableOpacity style={globalStyles.card} onPress={() => handleVehiclePress(item)}>
         <View style={styles.itemRow}>
              <Text style={globalStyles.label}>{item.licensePlate}</Text>
              <Text style={globalStyles.infoText}>Spot: {item.parkingSpotLabel || item.parkingSpotId}</Text>
         </View>
          <Text style={globalStyles.bodyText}>{item.make} {item.model} ({item.color})</Text>
          <Text style={globalStyles.infoText}>{formatTimestamp(item.checkInTime)}</Text>
      </TouchableOpacity>
  );

    if (loading) {
        return (
            <View style={globalStyles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={globalStyles.infoText}>Loading Active Vehicles...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={globalStyles.centeredContainer}>
                <Text style={globalStyles.errorText}>{error}</Text>
                 <TouchableOpacity style={globalStyles.buttonSecondary} onPress={onRefresh}>
                     <Text style={globalStyles.buttonTextSecondary}>Retry</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Active Vehicles</Text>
            {vehicles.length === 0 ? (
                <ScrollView
                        contentContainerStyle={globalStyles.centeredContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
                        style={{ flex: 1 }}
                    >
                   <Text style={globalStyles.infoText}>No vehicles currently checked in.</Text>
                   <Text style={[globalStyles.infoText, styles.pullDownText]}>Pull down to refresh</Text>
                </ScrollView>
            ) : (
                <>
                    <Text style={styles.instructions}>
                        Tap a vehicle to view details or check-out
                    </Text>
                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicleItem}
                        keyExtractor={(item) => item.id || `${item.licensePlate}-${item.checkInTime?.seconds}`}
                        ItemSeparatorComponent={() => <View style={globalStyles.separator} />}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                        }
                        contentContainerStyle={styles.listContentContainer}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    instructions: {
        fontSize: globalStyles.infoText.fontSize,
        color: globalStyles.infoText.color,
        textAlign: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    pullDownText: {
        marginTop: 10,
    }
});