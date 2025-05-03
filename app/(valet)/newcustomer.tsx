import { useState, useCallback } from "react";
import { ScrollView, Text, StyleSheet, Alert, View} from 'react-native';
import { addCustomer } from "@/lib/firebase";
import { useRouter } from 'expo-router';
import CustomerForm, { CustomerFormData} from "../components/CustomerForm";
import globalStyles from "../styles/global";

export default function NewCustomerScreen() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreateCustomer = useCallback(async (formData: CustomerFormData) => {
        setLoading(true);
        try {
            const customerId = await addCustomer(formData);
            if (!customerId) {
                throw new Error('Failed to create customer or retrieve ID.');
            }
            Alert.alert('Success', `Customer '${formData.name}' added successfully!`);
            router.push({
                pathname: '/(valet)/checkin',
                params: { customerId: customerId }
            });
        } catch (error: any) {
            console.error('Error adding customer:', error);
            Alert.alert('Error', error.message || 'Failed to add customer.');
        } finally {
            setLoading(false);
        }
     }, [router]);

     return (
        <ScrollView
            style={globalStyles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={[globalStyles.title, styles.titleMargin]}>Register New Customer</Text>

            <View style={globalStyles.card}>
                <CustomerForm
                    onSubmit={handleCreateCustomer}
                    isSubmitting={loading}
                    submitButtonText="Add Customer & Continue"
                    showCancelButton={true}
                    onCancel={() => router.back()}
                />
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    titleMargin: {
        marginBottom: 30,
    },
});