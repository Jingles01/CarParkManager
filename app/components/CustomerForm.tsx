import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import globalStyles, {COLORS} from '@/app/styles/global';

export interface CustomerFormData {
    name: string;
    phoneNumber: string;
    email: string;
}

interface CustomerFormProps {
    onSubmit: (formData: CustomerFormData) => Promise<void>;
    isSubmitting: boolean;
    submitButtonText?: string;
    showCancelButton?: boolean;
    onCancel?: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
    onSubmit,
    isSubmitting,
    submitButtonText = 'Add Customer',
    showCancelButton = false,
    onCancel,
}) => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');

    const validateInput = (): boolean => {
        if (!name.trim() || !phoneNumber.trim() || !email.trim()) {
            Alert.alert('Missing Fields', 'Name, Phone Number, and Email are required.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }
        return true;
    };

    const handleSubmitInternal = async () => {
        if (!validateInput()) {
            return;
        }
        const formData: CustomerFormData = {
            name: name.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim().toLowerCase(),
        };

        try {
            await onSubmit(formData);
            setName('');
            setPhoneNumber('');
            setEmail('');
        } catch (error: any) {
            console.error('Error during customer form submission:', error);
        }
    };

    return (
        <View style={styles.formContainer}>
            <Text style={globalStyles.label}>Full Name</Text>
            <TextInput
                style={globalStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter customer's full name"
                placeholderTextColor={COLORS.textSecondary}
                editable={!isSubmitting}
                autoCapitalize="words"
            />

            <Text style={globalStyles.label}>Phone Number</Text>
            <TextInput
                style={globalStyles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textSecondary}
                editable={!isSubmitting}
                autoComplete='tel'
            />

            <Text style={globalStyles.label}>Email</Text>
            <TextInput
                style={globalStyles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor={COLORS.textSecondary}
                editable={!isSubmitting}
                autoComplete='email'
            />

            <View style={styles.buttonContainer}>
                 <TouchableOpacity
                     style={[
                         globalStyles.button,
                         isSubmitting && styles.disabledButton
                     ]}
                     onPress={handleSubmitInternal}
                     disabled={isSubmitting}
                 >
                     {isSubmitting ? (
                         <ActivityIndicator color={COLORS.textLight} />
                     ) : (
                         <Text style={globalStyles.buttonText}>{submitButtonText}</Text>
                     )}
                 </TouchableOpacity>
            </View>

             {showCancelButton && !isSubmitting && onCancel && (
                 <TouchableOpacity
                    style={globalStyles.buttonSecondary}
                    onPress={onCancel}
                    disabled={isSubmitting}
                 >
                     <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
                 </TouchableOpacity>
             )}
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: {
    },
    buttonContainer: {
        marginTop: 15,
    },
    disabledButton: {
        backgroundColor: COLORS.textSecondary,
        borderColor: COLORS.textSecondary,
        opacity: 0.7,
    },
});

export default CustomerForm;