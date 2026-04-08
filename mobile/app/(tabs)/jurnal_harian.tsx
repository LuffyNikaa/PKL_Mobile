import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { getProfileSiswa } from '@/api/siswa';
import { getStatusAbsensi } from '@/api/presensi';
import { getJurnalHarian, postJurnalHarian, putJurnalHarian } from '@/api/jurnal_harian';

type Jurnal = {
  id_jurnal_harian: number;
  tanggal: string;
  tanggal_format: string;
  kegiatan: string;
  bisa_edit: boolean;
};

const todayString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function JurnalHarianScreen() {
  const [profile, setProfile]         = useState<any>(null);
  const [jurnal, setJurnal]           = useState<Jurnal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [absenStatus, setAbsenStatus] = useState<string>('belum');

  // Modal tambah/edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<Jurnal | null>(null);
  const [formTanggal, setFormTanggal]   = useState('');
  const [formKegiatan, setFormKegiatan] = useState('');

  // Modal detail
  const [detailItem, setDetailItem]       = useState<Jurnal | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const [prof, data, status] = await Promise.all([
        getProfileSiswa(token),
        getJurnalHarian(token),
        getStatusAbsensi(token),
      ]);
      setProfile(prof);
      setJurnal(data);
      setAbsenStatus(status);
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
      const data = await getJurnalHarian(token, text);
      setJurnal(data);
    } catch (err) {
      console.log('search error:', err);
    }
  }, []);

  const openTambah = () => {
    if (absenStatus === 'belum') {
      Alert.alert('Belum Absen Masuk', 'Kamu harus absen masuk terlebih dahulu sebelum mengisi jurnal harian.');
      return;
    }
    setEditItem(null);
    setFormTanggal('');
    setFormKegiatan('');
    setModalVisible(true);
  };

  const openEdit = (item: Jurnal) => {
    setDetailVisible(false);
    setEditItem(item);
    setFormTanggal(item.tanggal);
    setFormKegiatan(item.kegiatan);
    setModalVisible(true);
  };

  const handleSimpan = async () => {
    if (!formTanggal.trim() || !formKegiatan.trim()) {
      Alert.alert('Peringatan', 'Tanggal dan kegiatan wajib diisi');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formTanggal)) {
      Alert.alert('Peringatan', 'Format tanggal harus YYYY-MM-DD\nContoh: 2026-04-04');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (editItem) {
        await putJurnalHarian(token, editItem.id_jurnal_harian, {
          kegiatan_jurnal_harian: formKegiatan,
        });
        Alert.alert('Berhasil', 'Jurnal berhasil diperbarui');
      } else {
        await postJurnalHarian(token, {
          tanggal_jurnal_harian:  formTanggal,
          kegiatan_jurnal_harian: formKegiatan,
        });
        Alert.alert('Berhasil', 'Jurnal berhasil ditambahkan');
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

      {/* Warning belum absen */}
      {absenStatus === 'belum' && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={styles.warningText}>Absen masuk dulu untuk mengisi jurnal</Text>
        </View>
      )}

      {/* Info izin/sakit tidak perlu isi jurnal */}
      {(absenStatus === 'sudah_masuk' || absenStatus === 'sudah_pulang') && (
        <View style={[styles.warningBox, styles.infoBox]}>
          <Ionicons name="information-circle-outline" size={16} color="#1e40af" />
          <Text style={[styles.warningText, { color: '#1e40af' }]}>
            Siswa izin/sakit tidak perlu mengisi jurnal harian
          </Text>
        </View>
      )}

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
        <TouchableOpacity
          style={[styles.btnTambah, absenStatus === 'belum' && styles.btnTambahDisabled]}
          onPress={openTambah}
        >
          <Text style={styles.btnTambahText}>Tambah</Text>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <Text style={styles.listLabel}>Riwayat:</Text>
      <FlatList
        data={jurnal}
        keyExtractor={(item) => String(item.id_jurnal_harian)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada jurnal harian</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => { setDetailItem(item); setDetailVisible(true); }}
            activeOpacity={0.7}
          >
            <Text style={styles.cardDate}>{item.tanggal_format}</Text>
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
            <Text style={styles.modalTitle}>
              {editItem ? 'Edit Jurnal' : 'Tambah Jurnal'}
            </Text>

            {/* Tanggal */}
            <Text style={styles.inputLabel}>
              Tanggal <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.tanggalRow}>
              <TextInput
                style={[styles.input, styles.tanggalInput, editItem && styles.inputDisabled]}
                value={formTanggal}
                onChangeText={setFormTanggal}
                placeholder="YYYY-MM-DD"
                editable={!editItem}
                keyboardType="numeric"
              />
              {!editItem && (
                <TouchableOpacity
                  style={styles.btnHariIni}
                  onPress={() => setFormTanggal(todayString())}
                >
                  <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                  <Text style={styles.btnHariIniText}>Hari Ini</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Kegiatan */}
            <Text style={styles.inputLabel}>
              Kegiatan <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.inputArea]}
              value={formKegiatan}
              onChangeText={setFormKegiatan}
              placeholder="Tulis kegiatan hari ini..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.btnSimpan} onPress={handleSimpan} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnSimpanText}>Simpan</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnBatal} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnBatalText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL DETAIL ===== */}
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Detail Jurnal</Text>

            <Text style={styles.inputLabel}>Tanggal</Text>
            <View style={styles.detailBox}>
              <Text style={styles.detailText}>{detailItem?.tanggal_format}</Text>
            </View>

            <Text style={styles.inputLabel}>Kegiatan</Text>
            <View style={[styles.detailBox, { minHeight: 100 }]}>
              <Text style={styles.detailText}>{detailItem?.kegiatan}</Text>
            </View>

            {/* Hanya tampil tombol Edit jika bisa_edit true */}
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

  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  infoBox: {
    backgroundColor: '#EFF6FF', borderColor: '#BFDBFE',
  },
  warningText: { fontSize: 13, color: '#92400E', flex: 1 },

  lockedBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 8,
  },
  lockedText: { fontSize: 13, color: '#6B7280' },

  searchRow:         { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'center' },
  searchBox:         {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E5E7EB', height: 42,
  },
  searchInput:       { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  btnTambah:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnTambahDisabled: { backgroundColor: '#93C5FD' },
  btnTambahText:     { color: '#fff', fontWeight: '600', fontSize: 14 },

  listLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardDate: { fontSize: 14, color: '#374151', fontWeight: '500' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },

  inputLabel:    { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  required:      { color: '#EF4444' },

  tanggalRow:     { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  tanggalInput:   { flex: 1, marginBottom: 0 },
  btnHariIni:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  btnHariIniText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },

  input:         { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginBottom: 12 },
  inputArea:     { height: 120, textAlignVertical: 'top' },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280' },

  btnSimpan:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563EB', padding: 13, borderRadius: 10, marginBottom: 8 },
  btnSimpanText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnBatal:      { alignItems: 'center', padding: 10 },
  btnBatalText:  { color: '#6B7280', fontSize: 14 },

  detailBox:  { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});