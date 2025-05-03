import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import CreateUserForm from './CreateUserForm';
import { doc, setDoc, serverTimestamp, query, onSnapshot, QuerySnapshot, DocumentData, orderBy } from 'firebase/firestore';
import { auth, db, usersCollection } from '../../lib/firebase';
import { UserProfile, UserCreationPayload } from '../../types';
import globalStyles, {COLORS} from '../styles/global';


export default function UsersManagementScreen() {
    const { profile: adminProfile, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);

    const [usersList, setUsersList] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoadingUsers(true);
        const q = query(usersCollection, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot: QuerySnapshot<DocumentData>) => {
                const fetchedUsers: UserProfile[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedUsers.push({
                        id: doc.id,
                        ...(doc.data() as Omit<UserProfile, 'id'>)
                    });
                });
                setUsersList(fetchedUsers);
                setFetchError(null);
                setIsLoadingUsers(false);
            },
            (error) => {
                console.error("Error fetching users list:", error);
                setFetchError("Failed to load users list.");
                setIsLoadingUsers(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const handleCreateUser = useCallback(async (userData: UserCreationPayload) => {
        setIsSubmittingUser(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const user = userCredential.user;
            const userRef = doc(usersCollection, user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: userData.email,
                role: userData.role,
                name: userData.name,
                phoneNumber: userData.phoneNumber,
                createdAt: serverTimestamp(),
            });
            Alert.alert('Success', `User '${userData.name}' created successfully.`);
            setShowCreateForm(false);
        } catch (error: any) {
            console.error('Error creating user:', error.code, error.message);
            let friendlyMessage = 'Could not create user.';
            if (error.code === 'auth/email-already-in-use') { friendlyMessage = 'Email already registered.'; }
            else if (error.code === 'auth/weak-password') { friendlyMessage = 'Password is too weak.'; }
            else if (error.code === 'auth/invalid-email') { friendlyMessage = 'Email address is not valid.'; }
            Alert.alert('Error Creating User', friendlyMessage);
        } finally {
            setIsSubmittingUser(false);
        }
    }, []);

    const navigateToUserDetails = (userId: string) => {
        router.push({
             pathname: '/(admin)/userDetails',
             params: { userId: userId }
         });
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => (
         <TouchableOpacity
             style={styles.userItem}
             onPress={() => navigateToUserDetails(item.id!)}
             disabled={isSubmittingUser}
          >
            <View style={styles.userInfoContainer}>
                <Text style={globalStyles.label}>{item.name}</Text>
                <Text style={globalStyles.infoText}>{item.email}</Text>
                <Text style={globalStyles.infoText}>Role: <Text style={styles.userRole}>{item.role}</Text></Text>
            </View>
             <Text style={styles.arrow}>&gt;</Text>
         </TouchableOpacity>
     );

    if (authLoading) {
      return <View style={globalStyles.centeredContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }
    if (!isAuthenticated || adminProfile?.role !== 'admin') {
        return <Redirect href="/login" />;
    }

    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Manage Users</Text>

             <View style={styles.toggleFormContainer}>
                 {!showCreateForm ? (
                     <TouchableOpacity
                         style={globalStyles.button}
                         onPress={() => setShowCreateForm(true)}
                         disabled={isSubmittingUser}
                     >
                         <Text style={globalStyles.buttonText}>Create New User</Text>
                     </TouchableOpacity>
                 ) : (
                    <TouchableOpacity
                         style={globalStyles.buttonSecondary}
                         onPress={() => setShowCreateForm(false)}
                         disabled={isSubmittingUser}
                    >
                        <Text style={globalStyles.buttonTextSecondary}>Cancel Creation</Text>
                    </TouchableOpacity>
                 )}
             </View>

             {showCreateForm ? (
                 <ScrollView keyboardShouldPersistTaps="handled" style={styles.formScroll}>
                      <View style={styles.formWrapper}>
                          <Text style={styles.sectionTitle}>Create New User</Text>
                          <CreateUserForm
                            onCreateUser={handleCreateUser}
                            loading={isSubmittingUser}
                            allowedRoles={['admin', 'valet']}
                           />
                      </View>
                 </ScrollView>
             ) : (
                 <View style={styles.listContainer}>
                     <Text style={styles.sectionTitle}>Existing Users</Text>
                     {isLoadingUsers ? (
                         <ActivityIndicator size="large" color={COLORS.primary} style={styles.listLoader} />
                     ) : fetchError ? (
                         <Text style={globalStyles.errorText}>{fetchError}</Text>
                     ) : (
                         <FlatList
                             data={usersList}
                             renderItem={renderUserItem}
                             keyExtractor={(item) => item.id ?? item.uid}
                             ItemSeparatorComponent={() => <View style={globalStyles.separator}/>}
                             ListEmptyComponent={<Text style={globalStyles.infoText}>No users found.</Text>}
                         />
                     )}
                 </View>
             )}

        </View>
    );
}

const styles = StyleSheet.create({
    toggleFormContainer: { marginBottom: 20 },
    formScroll: { flex: 1 },
    formWrapper: {
        padding: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        marginBottom: 20,
    },
    listContainer: { flex: 1 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: COLORS.textPrimary,
    },
    listLoader: { marginTop: 20 },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        marginBottom: 10,
    },
    userInfoContainer: {
        flexShrink: 1,
        marginRight: 10,
    },
    userRole: {
        fontStyle: 'italic',
        textTransform: 'capitalize',
    },
    arrow: {
        fontSize: 22,
        color: COLORS.textSecondary,
    }
});