import { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { UserRole } from '../../context/AuthContext';
import { UserCreationPayload } from '../../types';
import globalStyles, {COLORS} from '../styles/global';
import { Picker } from '@react-native-picker/picker';

interface CreateUserFormProps {
  onCreateUser: (userData: UserCreationPayload) => Promise<void>;
  loading: boolean;
  allowedRoles?: Exclude<UserRole, null>[];
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onCreateUser, loading, allowedRoles = ['admin', 'valet'] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<Exclude<UserRole, null>>(allowedRoles[0]);

  const handleSubmit = useCallback(async () => {
    if (!email || !password || !name || !phoneNumber) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const userData: UserCreationPayload = {
      email,
      password,
      role: role,
      name,
      phoneNumber,
    };

    try {
      await onCreateUser(userData);
      setEmail('');
      setPassword('');
      setName('');
      setPhoneNumber('');
      setRole(allowedRoles[0]);
    } catch (error: any) {
      console.error('Error in CreateUserForm:', error);
    }
  }, [email, password, name, phoneNumber, role, allowedRoles, onCreateUser]);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.label}>Email</Text>
      <TextInput
        style={globalStyles.input} 
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Enter email"
        placeholderTextColor={COLORS.textSecondary} 
        editable={!loading}
      />

      <Text style={globalStyles.label}>Password</Text>
      <TextInput
        style={globalStyles.input} 
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter password"
        placeholderTextColor={COLORS.textSecondary} 
        editable={!loading} 
      />

      <Text style={globalStyles.label}>Name</Text>
      <TextInput
        style={globalStyles.input} 
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        placeholderTextColor={COLORS.textSecondary} 
        autoCapitalize="words"
        editable={!loading} 
      />

      <Text style={globalStyles.label}>Phone Number</Text>
      <TextInput
        style={globalStyles.input} 
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
        placeholderTextColor={COLORS.textSecondary} 
        editable={!loading} 
      />

      <Text style={globalStyles.label}>Role</Text>
      <View style={globalStyles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue as Exclude<UserRole, null>)}
          enabled={!loading && allowedRoles.length > 1}
          style={{ color: loading ? COLORS.textSecondary : COLORS.textPrimary }} 
        >
          {allowedRoles.map((r) => (
              <Picker.Item key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} value={r} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={[
          globalStyles.button,
          loading && { backgroundColor: COLORS.textSecondary },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.textLight} />
        ) : (
          <Text style={globalStyles.buttonText}>Create User</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CreateUserForm;
