import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selamat Datang</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.buttonText}>Register Siswa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>Login Siswa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#F7A500',
    padding: 15,
    width: '80%',
    borderRadius: 10,
    marginTop: 15,
  },
  secondary: {
    backgroundColor: '#424EED',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
