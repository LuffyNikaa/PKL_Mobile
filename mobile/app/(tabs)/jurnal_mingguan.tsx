import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, ActivityIndicator,
  Image, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { getProfileSiswa } from '@/api/siswa';
import { getJurnalMingguan, postJurnalMingguan, putJurnalMingguan } from '@/api/jurnal_mingguan';

type JurnalMingguan = {
  id_jurnal_mingguan: number;
  tanggal: string;
  minggu_ke: number;
  range_tanggal: string;
  kegiatan: string;
  dokumentasi: string | null;
  bisa_edit: boolean;
};

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return {
    monday: formatDate(monday),
    sunday: formatDate(sunday),
  };
};

const parseRangeTanggal = (range: string) => {
  if (!range || typeof range !== 'string') return null;
  // accept separators: ' s/d ', '-', '–', '—'
  const parts = range.split(/\s*(?:-|–|—|s\/d)\s*/i);
  if (parts.length !== 2) return null;
  let [startStr, endStr] = parts.map((p) => p.trim());

  // If end contains a year but start doesn't, append the year to start
  const yearMatch = endStr.match(/(\d{4})/);
  if (yearMatch && !/\d{4}/.test(startStr)) {
    startStr = `${startStr} ${yearMatch[1]}`;
  }

  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
};

const formatDateIndonesia = (date: Date) => {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatRangeIndonesia = (range: string) => {
  const parsed = parseRangeTanggal(range);
  if (parsed) return `${formatDateIndonesia(parsed.start)} s/d ${formatDateIndonesia(parsed.end)}`;

  // fallback: translate English month names to Indonesian in the raw string
  if (!range || typeof range !== 'string') return range;
  const monthsMap: Record<string, string> = {
    January: 'Januari', Jan: 'Jan',
    February: 'Februari', Feb: 'Feb',
    March: 'Maret', Mar: 'Mar',
    April: 'April', Apr: 'Apr',
    May: 'Mei',
    June: 'Juni', Jun: 'Jun',
    July: 'Juli', Jul: 'Jul',
    August: 'Agustus', Aug: 'Agu',
    September: 'September', Sep: 'Sep',
    October: 'Oktober', Oct: 'Okt',
    November: 'November', Nov: 'Nov',
    December: 'Desember', Dec: 'Des',
  };
  let out = range;
  Object.keys(monthsMap).forEach((eng) => {
    const re = new RegExp(`\\b${eng}\\b`, 'g');
    out = out.replace(re, monthsMap[eng]);
  });
  return out;
};

const canEditJurnal = (item: JurnalMingguan) => {
  if (item.bisa_edit) return true;
  const range = parseRangeTanggal(item.range_tanggal);
  if (!range) return false;
  const now = new Date();
  return now >= range.start && now <= range.end;
};

export default function JurnalMingguanScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [jurnal, setJurnal] = useState<JurnalMingguan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<JurnalMingguan | null>(null);
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formDok, setFormDok] = useState<any>(null);

  const [detailItem, setDetailItem] = useState<JurnalMingguan | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const checkAuthAndLoad = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert(
            'Akses Dibatasi',
            'Silakan login terlebih dahulu untuk mengakses Jurnal Mingguan.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/profil') }]
          );
          return;
        }
        loadAll();
      };
      checkAuthAndLoad();
    }, [])
  );

  const loadAll = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const [prof, data] = await Promise.all([
        getProfileSiswa(token),
        getJurnalMingguan(token),
      ]);
      setProfile(prof);
      setJurnal(data);
    } catch (err: any) {
      console.log('loadAll error:', err);
      if (err?.response?.status === 401) {
        Alert.alert('Sesi Habis', 'Silakan login ulang');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (text: string) => {
    setSearch(text);
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const data = await getJurnalMingguan(token, text);
      setJurnal(data);
    } catch (err) { console.log(err); }
  }, []);

  const openTambah = () => {
    setEditItem(null);
    setFormKegiatan('');
    setFormDok(null);
    setModalVisible(true);
  };

  const openEdit = (item: JurnalMingguan) => {
    if (!canEditJurnal(item)) {
      Alert.alert('Tidak Bisa Edit', 'Jurnal hanya bisa diedit dalam minggu yang sama');
      return;
    }
    setDetailVisible(false);
    setEditItem(item);
    setFormKegiatan(item.kegiatan);
    setFormDok(null);
    setModalVisible(true);
  };

  const pilihFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk upload dokumentasi');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormDok({
        uri: asset.uri,
        name: asset.fileName ?? `dok_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handleSimpan = async () => {
  if (!formKegiatan.trim()) {
    Alert.alert('Peringatan', 'Kegiatan mingguan wajib diisi');
    return;
  }
  
  setSubmitting(true);
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (editItem) {
      // ✅ Untuk edit, hanya kirim kegiatan jika tidak ada foto baru
      const payload: any = {
        kegiatan: formKegiatan,
      };
      
      // ✅ Hanya kirim dokumentasi jika ada file baru
      if (formDok) {
        payload.dokumentasi = formDok;
      }
      
      await putJurnalMingguan(token, editItem.id_jurnal_mingguan, payload);
      Alert.alert('Berhasil', 'Jurnal mingguan berhasil diperbarui');
    } else {
      // Untuk tambah, kirim kegiatan dan dokumentasi (jika ada)
      await postJurnalMingguan(token, {
        kegiatan: formKegiatan,
        dokumentasi: formDok,
      });
      Alert.alert('Berhasil', 'Jurnal mingguan berhasil ditambahkan');
    }
    
    setModalVisible(false);
    loadAll();
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
    Alert.alert('Gagal', msg);
  } finally {
    setSubmitting(false);
  }
};

  const tutupModal = () => {
    setModalVisible(false);
    setFormKegiatan('');
    setFormDok(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Selamat Datang</Text>
        <Text style={styles.headerName}>{profile?.nama ?? '-'}</Text>
        <Text style={styles.headerDudi}>{profile?.dudi ?? 'Belum ditempatkan'}</Text>
      </View>

      {/* Info minggu berjalan */}
      <View style={styles.infoBox}>
        <Ionicons name="calendar-clear-outline" size={14} color="#1D4ED8" />
        <Text style={styles.infoText}>
          Jurnal dibuat per minggu. Setelah minggu berlalu, jurnal tidak bisa diedit.
        </Text>
      </View>

      {/* Search + Tambah */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kegiatan..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.btnTambah} onPress={openTambah}>
          <Text style={styles.btnTambahText}>Tambah</Text>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <Text style={styles.listLabel}>Riwayat Jurnal Mingguan:</Text>
      <FlatList
        data={jurnal}
        keyExtractor={(item) => String(item.id_jurnal_mingguan)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Belum ada jurnal mingguan</Text>
            <Text style={styles.emptySubText}>Tekan tombol Tambah untuk membuat jurnal</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => { setDetailItem(item); setDetailVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardMinggu}>{item.minggu_ke}</Text>
              </View>
              <View>
                <Text style={styles.cardRange}>{formatRangeIndonesia(item.range_tanggal)}</Text>
                <Text 
                  style={styles.cardKegiatan} 
                  numberOfLines={1}
                >
                  {item.kegiatan}
                </Text>
              </View>
            </View>
            {canEditJurnal(item) && (
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Bisa edit</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      />

      {/* ===== MODAL TAMBAH / EDIT ===== */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={tutupModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editItem ? `Edit Jurnal Minggu ke-${editItem.minggu_ke}` : 'Tambah Jurnal Mingguan'}
              </Text>

              {/* Info minggu */}
              {!editItem && (
                <View style={styles.rangeBox}>
                  <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                    <Text style={styles.rangeText}>
                      Minggu ini: {getCurrentWeekRange().monday} s/d {getCurrentWeekRange().sunday}
                    </Text>
                </View>
              )}

              {editItem && (
                <View style={styles.rangeBox}>
                  <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                  <Text style={styles.rangeText}>{formatRangeIndonesia(editItem.range_tanggal)}</Text>
                </View>
              )}

              {/* Kegiatan */}
              <Text style={styles.inputLabel}>
                Kegiatan Minggu Ini <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={formKegiatan}
                onChangeText={setFormKegiatan}
                placeholder="Tulis kegiatan selama seminggu ini..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Dokumentasi */}
              <Text style={styles.inputLabel}>
                Dokumentasi Foto <Text style={styles.optional}>(opsional)</Text>
              </Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={pilihFoto}>
                <Ionicons name="image-outline" size={18} color="#2563EB" />
                <Text style={styles.uploadText}>
                  {formDok ? 'Ganti Foto' : editItem?.dokumentasi ? 'Ganti Foto Dokumentasi' : 'Pilih Foto Dokumentasi'}
                </Text>
              </TouchableOpacity>

              {/* Preview foto baru */}
              {formDok && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: formDok.uri }} style={styles.preview} resizeMode="cover" />
                  <TouchableOpacity onPress={() => setFormDok(null)} style={styles.hapusFoto}>
                    <Text style={{ color: '#EF4444', fontSize: 12 }}>✕ Hapus</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Preview foto lama saat edit */}
              {editItem?.dokumentasi && !formDok && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Foto saat ini:</Text>
                  <Image source={{ uri: editItem.dokumentasi }} style={styles.preview} resizeMode="cover" />
                </View>
              )}

              <TouchableOpacity style={styles.btnSimpan} onPress={handleSimpan} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnSimpanText}>Simpan</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBatal} onPress={tutupModal}>
                <Text style={styles.btnBatalText}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL DETAIL ===== */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Minggu ke-{detailItem?.minggu_ke}</Text>

              <View style={styles.rangeBox}>
                <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                <Text style={styles.rangeText}>{detailItem ? formatRangeIndonesia(detailItem.range_tanggal) : '-'}</Text>
              </View>

              <Text style={styles.inputLabel}>Kegiatan</Text>
              <View style={[styles.detailBox, { minHeight: 100 }]}>
                <Text style={styles.detailText}>{detailItem?.kegiatan}</Text>
              </View>

              {detailItem?.dokumentasi && (
                <>
                  <Text style={styles.inputLabel}>Dokumentasi</Text>
                  <Image
                    source={{ uri: detailItem.dokumentasi }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                </>
              )}

              {detailItem && canEditJurnal(detailItem) ? (
                <TouchableOpacity
                  style={styles.btnSimpan}
                  onPress={() => detailItem && openEdit(detailItem)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#fff" />
                  <Text style={[styles.btnSimpanText, { marginLeft: 6 }]}>Edit Jurnal</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedBox}>
                  <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                  <Text style={styles.lockedText}>Jurnal tidak dapat diedit (minggu sudah berlalu)</Text>
                </View>
              )}

              <TouchableOpacity style={styles.btnBatal} onPress={() => setDetailVisible(false)}>
                <Text style={styles.btnBatalText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingTop: 20 },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:     { marginBottom: 16 },
  headerSub:  { fontSize: 14, color: '#6B7280' },
  headerName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerDudi: { fontSize: 13, color: '#16A34A', marginTop: 2 },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { fontSize: 12, color: '#1D4ED8', flex: 1 },

  searchRow:  { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'center' },
  searchBox:  {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E5E7EB', height: 42,
  },
  searchInput:       { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  btnTambah:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnTambahText:     { color: '#fff', fontWeight: '600', fontSize: 14 },

  listLabel:  { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText:  { textAlign: 'center', color: '#9CA3AF', marginTop: 16, fontSize: 14 },
  emptySubText: { textAlign: 'center', color: '#D1D5DB', marginTop: 4, fontSize: 12 },

  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  cardMinggu: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  cardRange:  { fontSize: 13, fontWeight: '500', color: '#111827' },
  cardKegiatan: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  editBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 8 },
  editBadgeText: { fontSize: 10, color: '#065F46' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:   {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '90%',
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },

  rangeBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  rangeText:  { fontSize: 13, color: '#1D4ED8', fontWeight: '500', flex: 1 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  required:   { color: '#EF4444' },
  optional:   { color: '#9CA3AF', fontWeight: '400' },

  input:         { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginBottom: 12 },
  inputArea:     { height: 120, textAlignVertical: 'top' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 8, padding: 12, marginBottom: 10,
  },
  uploadText:       { color: '#2563EB', fontWeight: '500', fontSize: 14 },
  previewContainer: { alignItems: 'center', marginBottom: 12 },
  previewLabel:     { fontSize: 12, color: '#6B7280', marginBottom: 6, alignSelf: 'flex-start' },
  preview:          { width: '100%', height: 160, borderRadius: 8 },
  hapusFoto:        { marginTop: 6 },

  btnSimpan:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', padding: 13, borderRadius: 10, marginBottom: 8, marginTop: 4 },
  btnSimpanText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnBatal:      { alignItems: 'center', padding: 10 },
  btnBatalText:  { color: '#6B7280', fontSize: 14 },

  detailBox:   { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailText:  { fontSize: 14, color: '#374151', lineHeight: 22 },
  detailImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 14 },

  lockedBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 8 },
  lockedText: { fontSize: 13, color: '#6B7280' },
});