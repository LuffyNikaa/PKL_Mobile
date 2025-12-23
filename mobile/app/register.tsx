import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import api from '../api/api';
import { registerSiswa } from '../api/auth';

interface Dudi {
  id_dudi: number;
  nama_dudi: string;
}

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
  nama_siswa: '',
  email: '',
  password: '',
  nis_siswa: '',
  no_siswa: '',
  alamat_siswa: '',
  jk_siswa: 'L',
  jurusan_siswa: '',
  kelas_siswa: '',
  id_dudi: '',
});


  const [dudi, setDudi] = useState<Dudi[]>([]);

  // ambil data dudi
  useEffect(() => {
  const fetchDudi = async () => {
    try {
      const res = await api.get('/mobile/dudi');

      // Laravel biasanya return { data: [...] }
      setDudi(res.data.data ?? res.data);
    } catch (err) {
      console.log(err);
      Alert.alert('Gagal mengambil data DUDI');
    }
  };

  fetchDudi();
}, []);

  const handleRegister = async () => {
    try {
      await registerSiswa(form);
      Alert.alert('Berhasil', 'Registrasi berhasil');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Gagal', 'Registrasi gagal');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register Siswa</Text>

      <TextInput
        placeholder="Nama Lengkap"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, nama_siswa: v })}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={(v) => setForm({ ...form, email: v })}
      />

      <TextInput
        placeholder="NIS"
        style={styles.input}
        keyboardType="numeric"
        onChangeText={(v) => setForm({ ...form, nis_siswa: v })}
      />

      <TextInput
        placeholder="No HP"
        style={styles.input}
        keyboardType="phone-pad"
        onChangeText={(v) => setForm({ ...form, no_siswa: v })}
      />

      <TextInput
        placeholder="Alamat"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, alamat_siswa: v })}
      />

      <TextInput
        placeholder="Jurusan"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, jurusan_siswa: v })}
      />

      <TextInput
        placeholder="Kelas"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, kelas_siswa: v })}
      />

      {/* JENIS KELAMIN */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={form.jk_siswa}
          onValueChange={(v) => setForm({ ...form, jk_siswa: v })}
        >
          <Picker.Item label="Laki-laki" value="laki-laki" />
          <Picker.Item label="Perempuan" value="perempuan" />
        </Picker>
      </View>

      {/* PILIH DUDI */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={form.id_dudi}
          onValueChange={(v) => setForm({ ...form, id_dudi: v })}
        >
          <Picker.Item label="Pilih DUDI" value="" />
          {dudi.map((item) => (
            <Picker.Item
              key={item.id_dudi}
              label={item.nama_dudi}
              value={item.id_dudi}
            />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, password: v })}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Daftar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerBox: {
  backgroundColor: '#fff',
  borderRadius: 10,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
