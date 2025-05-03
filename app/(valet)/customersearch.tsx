import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db, customersCollection } from '../../lib/firebase';
import { query, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import globalStyles, {COLORS} from '../styles/global';
interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    name_lowercase?: string;
}

export default function CustomerSearchScreen() {
    const router = useRouter();
    const { query: routeQuery } = useLocalSearchParams<{ query?: string }>();
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const searchQuery = useMemo(() => (Array.isArray(routeQuery) ? routeQuery[0] : routeQuery) ?? '', [routeQuery]);

    useEffect(() => {
        const performSearch = async () => {
            const searchTerm = searchQuery.trim();
            if (!searchTerm) {
                setSearchResults([]); setLoading(false); setError(''); return;
            }
            setLoading(true); setError('');
            try {
                const searchTermLower = searchTerm.toLowerCase();
                const q = query(
                    customersCollection,
                    orderBy('name_lowercase'),
                    startAt(searchTermLower),
                    endAt(searchTermLower + '\uf8ff')
                );
                const querySnapshot = await getDocs(q);
                const results: Customer[] = [];
                querySnapshot.forEach((doc) => { results.push({ id: doc.id, ...doc.data() } as Customer); });
                setSearchResults(results);
            } catch (err: any) {
                console.error('Error searching customers:', err);
                setError('Failed to search customers.');
            } finally {
                setLoading(false);
            }
        };
        performSearch();
    }, [searchQuery]);

    const handleSelectCustomer = useCallback((customerId: string) => {
        router.push({ pathname: '/(valet)/checkin', params: { customerId: customerId } });
    }, [router, origin]);

    const renderCustomerItem = useCallback(({ item }: { item: Customer }) => (
        <TouchableOpacity onPress={() => handleSelectCustomer(item.id)} style={globalStyles.card}>
           <Text style={globalStyles.label}>{item.name}</Text>
           <Text style={globalStyles.infoText}>Phone: {item.phoneNumber}</Text>
           <Text style={globalStyles.infoText}>Email: {item.email}</Text>
        </TouchableOpacity>
    ), [handleSelectCustomer]);

    if (loading) {
        return (
            <View style={globalStyles.centeredContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={globalStyles.infoText}>Searching...</Text>
            </View>
        );
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

    return (
        <View style={globalStyles.container}>
            <Link href={'/(valet)/checkin'} style={styles.backButton}>
                <Text style={styles.backButtonText}>{'< Back'}</Text>
            </Link>

            <Text style={[globalStyles.title, styles.titleSpacing]}>Customer Search Results</Text>
            {searchQuery ? (
                <Text style={globalStyles.subtitle}>Results for: "{searchQuery}"</Text>
            ) : (
                <Text style={globalStyles.subtitle}>Please enter a search query.</Text>
            )}

            {searchResults.length > 0 ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomerItem}
                    style={styles.list}
                />
            ) : (
                searchQuery && <Text style={[globalStyles.infoText, styles.noResults]}>No customers found matching "{searchQuery}".</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    list: { marginTop: 15 },
    noResults: { marginTop: 20, textAlign: 'center' },
    backButton: { position: 'absolute', top: 20, left: 20, zIndex: 1, padding: 5 },
    backButtonText: { fontSize: 18, color: COLORS.primary },
    titleSpacing: { marginTop: 50 },
});