import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import globalStyles, {COLORS} from '../styles/global';

export default function VehicleAddedScreen() {
    const router = useRouter();
    const { licensePlate, make, model } = useLocalSearchParams<{ licensePlate?: string, make?: string, model?: string }>();

    return (
        <View style={globalStyles.centeredContainer}>
            <Text style={globalStyles.title}>Vehicle Added Successfully!</Text>

            {licensePlate && (
                <Text style={[globalStyles.bodyText, styles.detailText]}>License Plate: {licensePlate}</Text>
            )}
            {make && <Text style={[globalStyles.bodyText, styles.detailText]}>Make: {make}</Text>}
            {model && <Text style={[globalStyles.bodyText, styles.detailText]}>Model: {model}</Text>}

            <TouchableOpacity
                style={[globalStyles.button, styles.buttonSpacing]}
                onPress={() => router.replace('/(valet)/checkin')}
            >
                <Text style={globalStyles.buttonText}>Check In Another Vehicle</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={globalStyles.buttonSecondary}
                onPress={() => router.replace('/(valet)/home')}
            >
                <Text style={globalStyles.buttonTextSecondary}>Go to Dashboard</Text>
            </TouchableOpacity>
         </View>
    );
}

const styles = StyleSheet.create({
    detailText: {
        marginBottom: 10,
        textAlign: 'center',
        color: COLORS.textSecondary,
    },
    buttonSpacing: {
        marginTop: 20,
    },
});
