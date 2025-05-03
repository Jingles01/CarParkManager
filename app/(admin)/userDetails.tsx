import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { getUserProfile } from '@/lib/firebase';
import type { UserProfile } from '../../types';
import { Timestamp } from 'firebase/firestore';
import globalStyles, { COLORS } from '../styles/global';

interface UserDetailsProfile extends UserProfile {
    id?: string;
    createdAt?: Timestamp;
}


export default function UserDetailsScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { userId } = useLocalSearchParams<{ userId?: string }>();

    const [userData, setUserData] = useState<UserDetailsProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setError("User ID not provided.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        console.log(`UserDetailsScreen: Fetching profile for userId: ${userId}`);

        getUserProfile(userId)
            .then(profile => {
                if (profile) {
                    console.log("UserDetailsScreen: Profile fetched:", profile);
                    setUserData({
                        id: userId,
                        ...profile 
                    });
                } else {
                    console.log("UserDetailsScreen: No profile found for user.");
                    setError("User profile not found.");
                }
            })
            .catch(err => {
                console.error("UserDetailsScreen: Error fetching profile:", err);
                setError("Failed to load user details.");
            })
            .finally(() => {
                setLoading(false);
            });

    }, [userId]);

    useLayoutEffect(() => {
        if (userData?.name) {
            navigation.setOptions({ title: userData.name });
        }else {
            navigation.setOptions({ title: 'User Details' });
        }
    }, [navigation, userData]);


    if (loading) {
        return (
            <View style={globalStyles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={globalStyles.centeredContainer}>
                <Text style={globalStyles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={[globalStyles.buttonSecondary, styles.backButton]} // Use secondary style
                    onPress={() => router.back()}
                >
                    <Text style={globalStyles.buttonTextSecondary}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!userData) {
        return (
           <View style={globalStyles.centeredContainer}>
               <Text style={globalStyles.infoText}>No user data available.</Text>
                <TouchableOpacity
                   style={[globalStyles.buttonSecondary, styles.backButton]} // Use secondary style
                   onPress={() => router.back()}
               >
                   <Text style={globalStyles.buttonTextSecondary}>Go Back</Text>
               </TouchableOpacity>
           </View>
       );
   }

   return (
    <ScrollView style={globalStyles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Text style={[globalStyles.title, styles.header]}>User Information</Text>

        <View style={styles.infoCard}>
            <View style={styles.infoRow}>
                <Text style={globalStyles.label}>Name:</Text>
                <Text style={[globalStyles.bodyText, styles.value]}>{userData.name}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={globalStyles.label}>Email:</Text>
                <Text style={[globalStyles.bodyText, styles.value]}>{userData.email}</Text>
            </View>
             <View style={styles.infoRow}>
                <Text style={globalStyles.label}>Phone:</Text>
                <Text style={[globalStyles.bodyText, styles.value]}>{userData.phoneNumber || 'N/A'}</Text>
            </View>
             <View style={styles.infoRow}>
                <Text style={globalStyles.label}>Role:</Text>
                <Text style={[globalStyles.bodyText, styles.value, styles.roleValue]}>{userData.role}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={globalStyles.label}>User ID:</Text>
                <Text style={[globalStyles.infoText, styles.value, styles.uidValue]}>{userData.uid}</Text>
            </View>
            {userData.createdAt && (
                 <View style={styles.infoRow}>
                    <Text style={globalStyles.label}>Created:</Text>
                    <Text style={[globalStyles.bodyText, styles.value]}>
                         {userData.createdAt.toDate().toLocaleDateString()}
                    </Text>
                 </View>
            )}
        </View>

         <View style={styles.actionsContainer}>
              <TouchableOpacity
                 style={globalStyles.button}
                 onPress={() => Alert.alert("Edit Role", "Functionality not implemented yet.")}
             >
                 <Text style={globalStyles.buttonText}>Edit Role (Placeholder)</Text>
             </TouchableOpacity>

             <TouchableOpacity
                 style={globalStyles.buttonSecondary}
                 onPress={() => Alert.alert("Reset Password", "Functionality not implemented yet.")}
             >
                <Text style={globalStyles.buttonTextSecondary}>Reset Password (Placeholder)</Text>
             </TouchableOpacity>

             <TouchableOpacity
                 style={globalStyles.buttonDestructive}
                 onPress={() => Alert.alert("Disable User", "Functionality not implemented yet.")}
             >
                 <Text style={globalStyles.buttonTextDestructive}>Disable User (Placeholder)</Text>
             </TouchableOpacity>
         </View>

         <TouchableOpacity
             style={globalStyles.buttonSecondary}
             onPress={() => router.back()}
         >
             <Text style={globalStyles.buttonTextSecondary}>Back to User List</Text>
         </TouchableOpacity>

    </ScrollView>
);
}
const styles = StyleSheet.create({
contentContainer: {
    paddingBottom: 40,
},
header: {
    marginBottom: 15,
},
infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
},
infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
},
value: {
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 10,
},
roleValue: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
},
uidValue: {
},
actionsContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 10,
},
backButton: {
    marginTop: 15,
}
});
