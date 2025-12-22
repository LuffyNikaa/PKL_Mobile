import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat Datang PKL</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Register Siswa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Login Siswa</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    width: '80%',
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
});
