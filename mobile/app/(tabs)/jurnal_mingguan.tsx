import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, ActivityIndicator,
  Image, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function JurnalMingguanScreen() {
  const [profile, setProfile]         = useState<any>(null);
  const [jurnal, setJurnal]           = useState<JurnalMingguan[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // Modal tambah/edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<JurnalMingguan | null>(null);
  const [formTanggal, setFormTanggal]   = useState('');
  const [formKegiatan, setFormKegiatan] = useState('');
  const [formDok, setFormDok]           = useState<any>(null);

  // Modal detail
  const [detailItem, setDetailItem]       = useState<JurnalMingguan | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const loadAll = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const [prof, data] = await Promise.all([
        getProfileSiswa(token),
        getJurnalMingguan(token),
      ]);
      setProfile(prof);
      setJurnal(data);
    } catch (err) {
      console.log('loadAll error:', err);
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
    setFormTanggal(todayString());
    setFormKegiatan('');
    setFormDok(null);
    setModalVisible(true);
  };

  const openEdit = (item: JurnalMingguan) => {
    setDetailVisible(false);
    setEditItem(item);
    setFormTanggal(item.tanggal);
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
        uri:  asset.uri,
        name: asset.fileName ?? `dok_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handleSimpan = async () => {
    if (!formKegiatan.trim()) {
      Alert.alert('Peringatan', 'Kegiatan wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (editItem) {
        await putJurnalMingguan(token, editItem.id_jurnal_mingguan, {
          kegiatan:      formKegiatan,
          dokumentasi:   formDok,
        });
        Alert.alert('Berhasil', 'Jurnal mingguan berhasil diperbarui');
      } else {
        await postJurnalMingguan(token, {
          tanggal:     formTanggal,
          kegiatan:    formKegiatan,
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
      <Text style={styles.listLabel}>Riwayat:</Text>
      <FlatList
        data={jurnal}
        keyExtractor={(item) => String(item.id_jurnal_mingguan)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada jurnal mingguan</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => { setDetailItem(item); setDetailVisible(true); }}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.cardMinggu}>Minggu ke-{item.minggu_ke}</Text>
              <Text style={styles.cardRange}>{item.range_tanggal}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      />

      {/* ===== MODAL TAMBAH / EDIT ===== */}
      <Modal visible={modalVisible} transparent animationType="slide">
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

              {/* Tanggal — hanya saat tambah */}
              {!editItem && (
                <>
                  <Text style={styles.inputLabel}>Tanggal <Text style={styles.required}>*</Text></Text>
                  <View style={styles.tanggalRow}>
                    <TextInput
                      style={[styles.input, styles.tanggalInput]}
                      value={formTanggal}
                      onChangeText={setFormTanggal}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.btnHariIni} onPress={() => setFormTanggal(todayString())}>
                      <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                      <Text style={styles.btnHariIniText}>Hari Ini</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Range info saat edit */}
              {editItem && (
                <View style={styles.rangeBox}>
                  <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                  <Text style={styles.rangeText}>{editItem.range_tanggal}</Text>
                </View>
              )}

              {/* Kegiatan */}
              <Text style={styles.inputLabel}>Kegiatan Minggu Ini <Text style={styles.required}>*</Text></Text>
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
              <Text style={styles.inputLabel}>Dokumentasi <Text style={styles.optional}>(opsional)</Text></Text>
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
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Minggu ke-{detailItem?.minggu_ke}</Text>

              {/* Range tanggal */}
              <View style={styles.rangeBox}>
                <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                <Text style={styles.rangeText}>{detailItem?.range_tanggal}</Text>
              </View>

              <Text style={styles.inputLabel}>Kegiatan</Text>
              <View style={[styles.detailBox, { minHeight: 100 }]}>
                <Text style={styles.detailText}>{detailItem?.kegiatan}</Text>
              </View>

              {/* Dokumentasi */}
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

              {/* Tombol edit / locked */}
              {detailItem?.bisa_edit ? (
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
                  <Text style={styles.lockedText}>Jurnal tidak dapat diedit</Text>
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
  emptyText:  { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardMinggu: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardRange:  { fontSize: 12, color: '#6B7280', marginTop: 2 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:   {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '90%',
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },

  rangeBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  rangeText:  { fontSize: 13, color: '#1D4ED8', fontWeight: '500' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  required:   { color: '#EF4444' },
  optional:   { color: '#9CA3AF', fontWeight: '400' },

  tanggalRow:     { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  tanggalInput:   { flex: 1, marginBottom: 0 },
  btnHariIni:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  btnHariIniText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },

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