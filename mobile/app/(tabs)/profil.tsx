import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileSiswa } from '@/api/siswa';
import { router } from 'expo-router';

interface SiswaProfile {
  nama: string;
  email: string;
  jurusan: string;
  kelas: string;
  nis: string;
  alamat: string;
  no_hp: string;
  dudi?: string;
}

interface InfoProps {
  label: string;
  value: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<SiswaProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const data = await getProfileSiswa(token);
    setProfile(data);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  if (!profile) {
    return <Text style={{ padding: 20 }}>Loading...</Text>;
  }

  // DiceBear Avatar (FIXED)
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/png?backgroundColor=b6e3f4&seed=${encodeURIComponent(
    profile.nama
  )}`;

  const InfoRow = ({ label, value }: InfoProps) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const InfoBlock = ({ label, value }: InfoProps) => (
  <View style={styles.block}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.blockValue}>{value}</Text>
  </View>
);

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      {/* Nama */}
      <Text style={styles.name}>{profile.nama}</Text>
      <Text style={styles.sub}>
        {profile.jurusan} • {profile.kelas}
      </Text>

      {/* Info */}
      <View style={styles.card}>
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="NIS" value={profile.nis} />
        <InfoBlock label="Alamat" value={profile.alamat} />
        <InfoRow label="No HP" value={profile.no_hp} />
        <InfoRow label="Tempat PKL" value={profile.dudi || '-'} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#F9FAFB',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  sub: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },

  // Row (data pendek)
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // 🔥 penting
    marginBottom: 12,
  },
  label: {
    color: '#6B7280',
    width: 90,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },

  // Block (alamat panjang)
  block: {
    marginBottom: 12,
  },
  blockValue: {
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});
