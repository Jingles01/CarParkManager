import { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import globalStyles, {COLORS} from './styles/global';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { role, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
      setLoading(true);
      setError('');
      try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err: any) {
          console.error("Login Error:", err.code, err.message);
           if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
               setError('Invalid email or password.');
           } else if (err.code === 'auth/invalid-email') {
              setError('Please enter a valid email address.');
          } else if (err.code === 'auth/too-many-requests') {
              setError('Access temporarily disabled due to too many attempts. Please try again later.');
          }
           else {
              setError('An unexpected error occurred. Please try again.');
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      if (!authLoading && user) {
          console.log(`User authenticated. Role: ${role}`);
          if (role === 'admin') {
              router.replace('/(admin)/dashboard');
          } else if (role === 'valet') {
              router.replace('/(valet)/checkin');
          } else if (role === null) {
              console.log("User logged in, waiting for role assignment...");
          } else {
              console.warn(`User logged in with unhandled role: ${role}`);
          }
      } else if (!authLoading && !user) {
           console.log("User not authenticated.");
      }
  }, [user, role, authLoading, router]);

   if (authLoading && !user) {
       return (
           <View style={globalStyles.centeredContainer}>
               <ActivityIndicator size="large" color={COLORS.primary} />
           </View>
       );
   }

  return (
      <View style={globalStyles.centeredContainer}>
          <View style={styles.loginBox}>
               <Text style={[globalStyles.title, styles.loginTitle]}>Login</Text>

              <Text style={globalStyles.label}>Email</Text>
              <TextInput
                  style={globalStyles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
              />

              <Text style={globalStyles.label}>Password</Text>
              <TextInput
                  style={globalStyles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry
                  autoComplete="current-password"
                  editable={!loading}
              />

              {error ? <Text style={[globalStyles.errorText, styles.errorMargin]}>{error}</Text> : null}

              <TouchableOpacity
                   style={[
                       globalStyles.button,
                       loading && styles.disabledButton
                   ]}
                   onPress={handleLogin}
                   disabled={loading}
               >
                   {loading ? (
                       <ActivityIndicator color={COLORS.textLight} />
                   ) : (
                       <Text style={globalStyles.buttonText}>Login</Text>
                   )}
               </TouchableOpacity>
          </View>
      </View>
  );
}

const styles = StyleSheet.create({
  loginBox: {
      width: '85%',
      maxWidth: 400,
      padding: 20,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
  },
  loginTitle: {
      marginBottom: 25,
  },
  errorMargin: {
      marginBottom: 10,
  },
  disabledButton: {
      backgroundColor: COLORS.textSecondary,
      borderColor: COLORS.textSecondary,
      opacity: 0.7,
  },
});
