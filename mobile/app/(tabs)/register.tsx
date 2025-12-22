import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerSiswa } from '../api/auth';
import { getDudi } from '../api/dudi';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dudiList, setDudiList] = useState<{id_dudi:number;nama_dudi:string}[]>([]);
  const [selectedDudi, setSelectedDudi] = useState<number | null>(null);

  useEffect(() => {
    const fetchDudi = async () => {
      try {
        const data = await getDudi();
        setDudiList(data);
      } catch {
        Alert.alert('Error', 'Gagal ambil DUDI');
      }
    };
    fetchDudi();
  }, []);

  const handleRegister = async () => {
    if (!selectedDudi) {
      Alert.alert('Pilih DUDI dahulu');
      return;
    }

    try {
      await registerSiswa({
        nama_siswa: nama,
        email,
        password,
        jk_siswa: 'laki-laki', // contoh statis, bisa tambah input
        jurusan_siswa: 'RPL',
        kelas_siswa: 'XII RPL 1',
        nis_siswa: '12345678',
        alamat_siswa: 'Madiun',
        no_siswa: '08123456789',
        id_dudi: selectedDudi
      });
      Alert.alert('Sukses', 'Registrasi berhasil');
      navigation.navigate('Landing'); // kembali ke landing
    } catch {
      Alert.alert('Error', 'Gagal registrasi');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Siswa</Text>

      <TextInput placeholder="Nama" style={styles.input} value={nama} onChangeText={setNama} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={{ marginTop: 10 }}>Pilih DUDI:</Text>
      {dudiList.map(d => (
        <TouchableOpacity key={d.id_dudi} style={[styles.dudiButton, selectedDudi === d.id_dudi && styles.dudiSelected]} onPress={() => setSelectedDudi(d.id_dudi)}>
          <Text>{d.nama_dudi}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  title:{ fontSize:24, fontWeight:'bold', marginBottom:20 },
  input:{ borderWidth:1, borderColor:'#ccc', padding:10, marginTop:10, borderRadius:5 },
  button:{ backgroundColor:'#007bff', padding:15, borderRadius:8, marginTop:20, alignItems:'center' },
  buttonText:{ color:'#fff', fontSize:16 },
  dudiButton:{ padding:10, marginTop:5, borderWidth:1, borderColor:'#007bff', borderRadius:5 },
  dudiSelected:{ backgroundColor:'#cce5ff' }
});
