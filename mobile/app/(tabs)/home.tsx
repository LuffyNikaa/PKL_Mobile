import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = ({ route }: any) => {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Halo, {user?.name}</Text>
      <Text>Selamat datang di Dashboard Siswa</Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', alignItems:'center' },
  title:{ fontSize:24, fontWeight:'bold', marginBottom:10 }
});
