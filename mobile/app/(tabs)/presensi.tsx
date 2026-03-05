import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProfileSiswa } from '@/api/siswa';
import { getStatusAbsensi, postAbsensi, postAbsensiPulang } from '@/api/presensi';
import { getDistance } from '@/utils/location';

type AbsenStatus = 'belum' | 'sudah_masuk' | 'sudah_pulang';

export default function PresensiScreen() {
  const [profile, setProfile]       = useState<any>(null);
  const [userLoc, setUserLoc]       = useState<any>(null);
  const [absenStatus, setAbsenStatus] = useState<AbsenStatus>('belum');
  const [loading, setLoading]       = useState(false);

  const [izinVisible, setIzinVisible] = useState(false);
  const [izinType, setIzinType]       = useState<'izin' | 'sakit'>('izin');
  const [alasan, setAlasan]           = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const [prof, status, loc] = await Promise.all([
        getProfileSiswa(token),
        getStatusAbsensi(token),
        Location.getCurrentPositionAsync({}),
      ]);
      setProfile(prof);
      setAbsenStatus(status as AbsenStatus);
      setUserLoc(loc.coords);
    } catch (err) {
      console.log('loadData error:', err);
    }
  };

  const checkRadius = () => {
    if (profile.dudi_lat == null || profile.dudi_lon == null) {
      Alert.alert('Error', 'Koordinat tempat PKL belum diatur oleh admin');
      return false;
    }
    const distance = getDistance(
      userLoc.latitude, userLoc.longitude,
      profile.dudi_lat, profile.dudi_lon,
    );
    if (distance > 100) {
      Alert.alert('Gagal', 'Anda berada di luar radius 100 meter dari tempat PKL');
      return false;
    }
    return true;
  };

  const handleMasuk = async () => {
    if (!userLoc || !profile) return;
    if (!checkRadius()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await postAbsensi(token, {
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        status: 'hadir',
      });
      setAbsenStatus('sudah_masuk');
      Alert.alert('Berhasil', 'Presensi masuk berhasil dicatat');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
      Alert.alert('Gagal Absensi', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePulang = async () => {
    Alert.alert('Konfirmasi', 'Yakin ingin absen pulang sekarang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Pulang',
        onPress: async () => {
          setLoading(true);
          try {
            const token = await AsyncStorage.getItem('token');
            await postAbsensiPulang(token);
            setAbsenStatus('sudah_pulang');
            Alert.alert('Berhasil', 'Presensi pulang berhasil dicatat');
          } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
            Alert.alert('Gagal', msg);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const submitIzin = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await postAbsensi(token, {
        latitude:  userLoc?.latitude,
        longitude: userLoc?.longitude,
        status:    izinType,
        alasan,
      });
      setIzinVisible(false);
      setAlasan('');
      setAbsenStatus('sudah_masuk');
      Alert.alert('Berhasil', 'Izin berhasil dikirim');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
      Alert.alert('Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !userLoc) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 8, color: '#666' }}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.welcome}>Selamat Datang</Text>
      <Text style={styles.name}>{profile.nama}</Text>
      <Text style={styles.dudi}>{profile.dudi ?? '-'}</Text>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLoc.latitude,
          longitude: userLoc.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker coordinate={{ latitude: userLoc.latitude, longitude: userLoc.longitude }} title="Anda" />
        {profile.dudi_lat != null && profile.dudi_lon != null && (
          <Marker
            coordinate={{ latitude: profile.dudi_lat, longitude: profile.dudi_lon }}
            title="Tempat PKL"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Status info */}
      {absenStatus === 'sudah_pulang' && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>✅ Presensi hari ini sudah lengkap</Text>
        </View>
      )}

      {/* Tombol Masuk / Pulang */}
      {absenStatus === 'belum' && (
        <TouchableOpacity style={styles.btnMasuk} onPress={handleMasuk} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Masuk</Text>}
        </TouchableOpacity>
      )}

      {absenStatus === 'sudah_masuk' && (
        <TouchableOpacity style={styles.btnPulang} onPress={handlePulang} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pulang</Text>}
        </TouchableOpacity>
      )}

      {/* Tombol Izin — hanya tampil kalau belum absen */}
      {absenStatus === 'belum' && (
        <TouchableOpacity style={styles.btnIzin} onPress={() => setIzinVisible(true)}>
          <Text style={styles.btnText}>Izin / Sakit</Text>
        </TouchableOpacity>
      )}

      {/* Modal Izin */}
      <Modal visible={izinVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Izin / Sakit</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.option, izinType === 'izin' && styles.active]}
                onPress={() => setIzinType('izin')}
              >
                <Text>Izin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, izinType === 'sakit' && styles.active]}
                onPress={() => setIzinType('sakit')}
              >
                <Text>Sakit</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Alasan"
              style={styles.input}
              value={alasan}
              onChangeText={setAlasan}
            />
            <TouchableOpacity style={styles.submit} onPress={submitIzin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIzinVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  welcome: { fontSize: 16, color: '#6B7280' },
  name:    { fontSize: 22, fontWeight: '700', color: '#111827' },
  dudi:    { fontSize: 13, color: '#16A34A', marginBottom: 12 },

  map: { height: 280, marginVertical: 16, borderRadius: 12 },

  statusBox: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: { color: '#065F46', fontWeight: '600' },

  btnMasuk:  { backgroundColor: '#16A34A', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnPulang: { backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnIzin:   { backgroundColor: '#F97316', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '600', fontSize: 15 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal:   { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  row:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  option:  { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  active:  { backgroundColor: '#E5E7EB' },
  input:   { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  submit:  { backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center' },
});