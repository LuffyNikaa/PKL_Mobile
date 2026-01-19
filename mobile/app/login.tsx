import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginSiswa } from '../api/auth'; // Import dari auth.js

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with:', { email });
      
      // Panggil API login sesuai endpoint yang benar
      const response = await loginSiswa(email, password);
      
      console.log('Login response:', response);
      
      // Pastikan response sesuai dengan yang diharapkan
      if (response && response.user) {
        // Simpan data user ke AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        await AsyncStorage.setItem('role', response.role || 'siswa');
        await AsyncStorage.setItem('token', response.token || '');
        
        console.log('Login successful, redirecting to home...');
        
        // Redirect ke home
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Login Gagal', 'Respon tidak valid dari server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Tampilkan error spesifik dari API jika ada
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Email atau password salah';
      
      Alert.alert('Login Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Siswa</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        editable={!loading}
        onSubmitEditing={handleLogin}
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
    padding: 10,
  },
  linkText: {
    color: '#2563eb',
    textAlign: 'center',
    fontSize: 14,
  },
});