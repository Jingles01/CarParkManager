import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import SignOutButton from '../components/SignOutButton';
import globalStyles, { COLORS } from '../styles/global';

export default function AdminDashboard() {
  const { role, profile } = useAuth();
  const router = useRouter();

  if (role !== 'admin') return <Redirect href="/login" />;

  return (
    <View style={[globalStyles.container, styles.pageContainer]}>
      <Text style={globalStyles.title}>Admin Dashboard</Text>

      {profile?.name && (
        <Text style={[globalStyles.subtitle, styles.userInfo]}>Logged in as: {profile.name}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => router.push('/(admin)/users')}
        >
          <Text style={globalStyles.buttonText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => router.push('/(admin)/layoutUploader')}
        >
          <Text style={globalStyles.buttonText}>Upload Parking Lot Layout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signOutContainer}>
         <SignOutButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  userInfo: {
    marginBottom: 30,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 40,
  },
  signOutContainer: {
    position: 'absolute',
    bottom: 30,
    width: '80%',
    alignSelf: 'center',
  },
});