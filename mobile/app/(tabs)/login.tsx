import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginSiswa } from '../api/auth';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await loginSiswa(email, password);
      Alert.alert('Sukses', 'Login berhasil');
      navigation.navigate('Home', { user: res.user }); // pindah ke Home
    } catch {
      Alert.alert('Error', 'Login gagal');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Siswa</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, justifyContent:'center' },
  title:{ fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  input:{ borderWidth:1, borderColor:'#ccc', padding:10, marginTop:10, borderRadius:5 },
  button:{ backgroundColor:'#007bff', padding:15, borderRadius:8, marginTop:20, alignItems:'center' },
  buttonText:{ color:'#fff', fontSize:16 },
});
