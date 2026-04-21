import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getProfileSiswa } from '@/api/siswa';
import { getStatusAbsensi } from '@/api/presensi';
import { getMonitoringSiswa } from '@/api/monitoring';

type AbsenStatus = 'belum' | 'sudah_masuk' | 'sudah_pulang';
type MonitoringItem = {
  id_monitoring: number;
  nama_guru: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  alasan: string | null;
  status: string;
};

export default function Home() {
  const router = useRouter();
  const [profile, setProfile]             = useState<any>(null);
  const [absenStatus, setAbsenStatus]     = useState<AbsenStatus>('belum');
  const [loading, setLoading]             = useState(true);
  const [tanggal, setTanggal]             = useState('');
  const [monitoringList, setMonitoringList] = useState<MonitoringItem[]>([]);
  const [adaJadwal, setAdaJadwal]         = useState(false);

  // Modal monitoring
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState<MonitoringItem | null>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) { router.replace('/'); return; }

    try {
      const [prof, status, monRes] = await Promise.all([
        getProfileSiswa(token),
        getStatusAbsensi(token),
        getMonitoringSiswa(token),
      ]);
      setProfile(prof);
      setAbsenStatus(status as AbsenStatus);
      setMonitoringList(monRes.data ?? []);
      setAdaJadwal(monRes.ada_jadwal ?? false);
    } catch (err) {
      console.log('loadData error:', err);
    } finally {
      setLoading(false);
    }

    const now = new Date();
    const hari  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    setTanggal(`${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  const absenLabel = () => {
    switch (absenStatus) {
      case 'belum':        return { text: 'Belum Absen',   color: '#F97316', bg: '#FFF7ED', icon: 'time-outline' as const };
      case 'sudah_masuk':  return { text: 'Sudah Masuk',   color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle-outline' as const };
      case 'sudah_pulang': return { text: 'Sudah Pulang',  color: '#2563EB', bg: '#EFF6FF', icon: 'checkmark-done-circle-outline' as const };
    }
  };
  const absen = absenLabel();

  const statusMonConfig = (s: string) =>
    s === 'dijadwalkan'
      ? { label: 'Dijadwalkan', color: '#F97316', bg: '#FFF7ED' }
      : { label: 'Selesai',     color: '#16A34A', bg: '#F0FDF4' };

  // Jadwal monitoring berikutnya (dijadwalkan)
  const jadwalBerikutnya = monitoringList.find(m => m.status === 'dijadwalkan');

  return (
    <>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Selamat Datang 👋</Text>
            <Text style={styles.headerName}>{profile?.nama ?? '-'}</Text>
            <Text style={styles.headerDudi}>{profile?.dudi ?? '-'}</Text>
          </View>
          <View style={styles.tanggalBox}>
            <Ionicons name="calendar-outline" size={13} color="#6B7280" />
            <Text style={styles.tanggalText}>{tanggal}</Text>
          </View>
        </View>

        {/* Notif Absen */}
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

        {/* Jadwal monitoring berikutnya */}
        {jadwalBerikutnya && (
          <TouchableOpacity
            style={styles.monitoringBanner}
            onPress={() => { setSelectedMonitoring(jadwalBerikutnya); setShowMonitoring(true); }}
            activeOpacity={0.8}
          >
            <View style={styles.monitoringBannerLeft}>
              <View style={styles.monitoringDot} />
              <View>
                <Text style={styles.monitoringBannerTitle}>Jadwal Monitoring</Text>
                <Text style={styles.monitoringBannerSub}>
                  {jadwalBerikutnya.tanggal}  •  {jadwalBerikutnya.jam ?? '-'}
                </Text>
                <Text style={styles.monitoringBannerLokasi}>{jadwalBerikutnya.lokasi}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Menu */}
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.menuGrid}>

          {/* <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(tabs)/presensi')}>
            <View style={[styles.menuIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="finger-print" size={26} color="#16A34A" />
            </View>
            <Text style={styles.menuLabel}>Presensi</Text>
          </TouchableOpacity> */}

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

          {/* Monitoring — dengan titik merah */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => {
              if (monitoringList.length > 0) {
                setSelectedMonitoring(monitoringList[0]);
                setShowMonitoring(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View>
              <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="eye" size={26} color="#F59E0B" />
              </View>
              {/* Titik merah jika ada jadwal */}
              {adaJadwal && <View style={styles.redDot} />}
            </View>
            <Text style={styles.menuLabel}>Monitoring</Text>
          </TouchableOpacity>

          {/* Presentasi — coming soon */}
          <TouchableOpacity style={[styles.menuCard, styles.menuCardDisabled]} activeOpacity={1}>
            <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="easel" size={26} color="#9CA3AF" />
            </View>
            <Text style={[styles.menuLabel, { color: '#9CA3AF' }]}>Presentasi</Text>
            <Text style={styles.menuComingSoon}>Segera</Text>
          </TouchableOpacity>

        </View>

        {/* Info cards */}
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

      {/* ===== MODAL DETAIL MONITORING ===== */}
      <Modal visible={showMonitoring} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Detail Monitoring</Text>

              {selectedMonitoring && (() => {
                const s = statusMonConfig(selectedMonitoring.status);
                return (
                  <>
                    <View style={[styles.statusRow, { backgroundColor: s.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                      <Text style={[styles.statusRowText, { color: s.color }]}>{s.label}</Text>
                    </View>
                    <DetailRow icon="calendar-outline" label="Tanggal" value={selectedMonitoring.tanggal} />
                    <DetailRow icon="time-outline"     label="Jam"     value={selectedMonitoring.jam ?? '-'} />
                    <DetailRow icon="location-outline" label="Lokasi"  value={selectedMonitoring.lokasi ?? '-'} />
                    <DetailRow icon="person-outline"   label="Guru Pembimbing" value={selectedMonitoring.nama_guru ?? '-'} />
                    {selectedMonitoring.alasan && (
                      <DetailRow icon="help-circle-outline" label="Alasan" value={selectedMonitoring.alasan} />
                    )}

                    {/* List semua jadwal */}
                    {monitoringList.length > 1 && (
                      <>
                        <Text style={styles.allJadwalTitle}>Semua Jadwal</Text>
                        {monitoringList.map((m) => {
                          const sc = statusMonConfig(m.status);
                          return (
                            <TouchableOpacity
                              key={m.id_monitoring}
                              style={[styles.jadwalItem, selectedMonitoring.id_monitoring === m.id_monitoring && styles.jadwalItemActive]}
                              onPress={() => setSelectedMonitoring(m)}
                            >
                              <View style={[styles.jadwalDot, { backgroundColor: sc.color }]} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.jadwalTanggal}>{m.tanggal}  •  {m.jam ?? '-'}</Text>
                                <Text style={styles.jadwalLokasi}>{m.lokasi}</Text>
                              </View>
                              <Text style={[styles.jadwalStatus, { color: sc.color }]}>{sc.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </>
                );
              })()}

              <TouchableOpacity style={styles.btnTutup} onPress={() => setShowMonitoring(false)}>
                <Text style={styles.btnTutupText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={16} color="#6B7280" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  container:  { flexGrow: 1, padding: 20, paddingBottom: 40 },

  header:     { marginBottom: 20 },
  headerSub:  { fontSize: 13, color: '#6B7280' },
  headerName: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 2 },
  headerDudi: { fontSize: 12, color: '#16A34A', marginTop: 2 },
  tanggalBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  tanggalText:{ fontSize: 12, color: '#6B7280' },

  notifCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 12 },
  notifLeft:  { flexDirection: 'row', alignItems: 'center' },
  notifLabel: { fontSize: 12, color: '#6B7280' },
  notifStatus:{ fontSize: 16, fontWeight: '700', marginTop: 2 },

  monitoringBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF1F2', borderWidth: 1.5, borderColor: '#EF4444',
    borderRadius: 14, padding: 14, marginBottom: 20,
  },
  monitoringBannerLeft:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  monitoringDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginTop: 4 },
  monitoringBannerTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  monitoringBannerSub:   { fontSize: 12, color: '#374151', marginTop: 2 },
  monitoringBannerLokasi:{ fontSize: 11, color: '#6B7280', marginTop: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },

  menuGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  menuCard:         { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  menuCardDisabled: { opacity: 0.6 },
  menuIcon:         { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel:        { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  menuComingSoon:   { fontSize: 10, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  redDot:           { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff' },

  infoRow:       { flexDirection: 'row', gap: 12 },
  infoCard:      { flex: 1, borderRadius: 12, padding: 14, gap: 4 },
  infoCardLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  infoCardValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, maxHeight: '85%' },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },

  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 14 },
  statusDot:     { width: 10, height: 10, borderRadius: 5 },
  statusRowText: { fontSize: 15, fontWeight: '700' },

  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right', marginLeft: 12 },

  allJadwalTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  jadwalItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 6 },
  jadwalItemActive:{ borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  jadwalDot:      { width: 8, height: 8, borderRadius: 4 },
  jadwalTanggal:  { fontSize: 12, fontWeight: '600', color: '#111827' },
  jadwalLokasi:   { fontSize: 11, color: '#6B7280' },
  jadwalStatus:   { fontSize: 11, fontWeight: '600' },

  btnTutup:     { alignItems: 'center', padding: 12, marginTop: 8 },
  btnTutupText: { color: '#6B7280', fontSize: 14 },
});