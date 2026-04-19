import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getProfileSiswa } from '@/api/siswa';
import { getStatusAbsensi } from '@/api/presensi';

interface User {
  id_users: number;
  nama: string;
  email: string;
}

type AbsenStatus = 'belum' | 'sudah_masuk' | 'sudah_pulang';

export default function Home() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [profile, setProfile]         = useState<any>(null);
  const [absenStatus, setAbsenStatus] = useState<AbsenStatus>('belum');
  const [loading, setLoading]         = useState(true);
  const [tanggal, setTanggal]         = useState('');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) { router.replace('/'); return; }
    setUser(JSON.parse(userData));

    const token = await AsyncStorage.getItem('token');
    if (!token) { router.replace('/'); return; }

    try {
      const [prof, status] = await Promise.all([
        getProfileSiswa(token),
        getStatusAbsensi(token),
      ]);
      setProfile(prof);
      setAbsenStatus(status as AbsenStatus);
    } catch (err) {
      console.log('loadData error:', err);
    } finally {
      setLoading(false);
    }

    // Format tanggal hari ini
    const now = new Date();
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    setTanggal(`${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`);
  };

  if (loading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const absenLabel = () => {
    switch (absenStatus) {
      case 'belum':        return { text: 'Belum Absen', color: '#F97316', bg: '#FFF7ED', icon: 'time-outline' as const };
      case 'sudah_masuk':  return { text: 'Sudah Masuk', color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle-outline' as const };
      case 'sudah_pulang': return { text: 'Sudah Pulang', color: '#2563EB', bg: '#EFF6FF', icon: 'checkmark-done-circle-outline' as const };
    }
  };

  const absen = absenLabel();

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Selamat Datang 👋</Text>
          <Text style={styles.headerName}>{profile?.nama ?? user.nama}</Text>
          <Text style={styles.headerDudi}>{profile?.dudi ?? '-'}</Text>
        </View>
        <View style={styles.tanggalBox}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.tanggalText}>{tanggal}</Text>
        </View>
      </View>

      {/* ===== NOTIF ABSEN ===== */}
      <TouchableOpacity
        style={[styles.notifCard, { backgroundColor: absen.bg, borderColor: absen.color }]}
        onPress={() => router.push('/(tabs)/presensi')}
        activeOpacity={0.8}
      >
        <View style={styles.notifLeft}>
          <Ionicons name={absen.icon} size={28} color={absen.color} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.notifLabel}>Status Presensi Hari Ini</Text>
            <Text style={[styles.notifStatus, { color: absen.color }]}>{absen.text}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={absen.color} />
      </TouchableOpacity>

      {/* ===== MENU CEPAT ===== */}
      <Text style={styles.sectionTitle}>Menu</Text>
      <View style={styles.menuGrid}>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(tabs)/jurnal_harian')}>
          <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="document-text" size={26} color="#2563EB" />
          </View>
          <Text style={styles.menuLabel}>Jurnal Harian</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(tabs)/jurnal_mingguan')}>
          <View style={[styles.menuIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="documents" size={26} color="#7C3AED" />
          </View>
          <Text style={styles.menuLabel}>Jurnal Mingguan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardDisabled]}
          onPress={() => {}}
          activeOpacity={1}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="eye" size={26} color="#9CA3AF" />
          </View>
          <Text style={[styles.menuLabel, { color: '#9CA3AF' }]}>Monitoring</Text>
          <Text style={styles.menuComingSoon}>Segera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, styles.menuCardDisabled]}
          onPress={() => {}}
          activeOpacity={1}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="easel" size={26} color="#9CA3AF" />
          </View>
          <Text style={[styles.menuLabel, { color: '#9CA3AF' }]}>Presentasi</Text>
          <Text style={styles.menuComingSoon}>Segera</Text>
        </TouchableOpacity>

      </View>

      {/* ===== INFO CARDS ===== */}
      <Text style={styles.sectionTitle}>Informasi</Text>
      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="school-outline" size={20} color="#16A34A" />
          <Text style={styles.infoCardLabel}>Jurusan</Text>
          <Text style={styles.infoCardValue}>{profile?.jurusan ?? '-'}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="people-outline" size={20} color="#2563EB" />
          <Text style={styles.infoCardLabel}>Kelas</Text>
          <Text style={styles.infoCardValue}>{profile?.kelas ?? '-'}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  container:  { flexGrow: 1, padding: 20, paddingBottom: 40, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    marginBottom: 20,
  },
  headerSub:  { fontSize: 13, color: '#6B7280' },
  headerName: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 2 },
  headerDudi: { fontSize: 12, color: '#16A34A', marginTop: 2 },
  tanggalBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  tanggalText:{ fontSize: 12, color: '#6B7280' },

  // Notif absen
  notifCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 24,
  },
  notifLeft:   { flexDirection: 'row', alignItems: 'center' },
  notifLabel:  { fontSize: 12, color: '#6B7280' },
  notifStatus: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  // Section title
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Menu grid
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  menuCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
    elevation: 1,
  },
  menuCardDisabled: { opacity: 0.6 },
  menuIcon:         { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel:        { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  menuComingSoon:   { fontSize: 10, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },

  // Info cards
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: {
    flex: 1, borderRadius: 12, padding: 14, gap: 4,
  },
  infoCardLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  infoCardValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
});