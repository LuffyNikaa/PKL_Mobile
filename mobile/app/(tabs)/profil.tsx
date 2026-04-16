import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileSiswa } from '@/api/siswa';
import { router } from 'expo-router';
import { updateProfile } from '@/api/profile';

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
  const [profile, setProfile]   = useState<SiswaProfile | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ nama: '', alamat: '', no_hp: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    const data = await getProfileSiswa(token);
    setProfile(data);
  };

  const openEdit = () => {
    if (!profile) return;
    setForm({ nama: profile.nama, alamat: profile.alamat, no_hp: profile.no_hp });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim()) {
      Alert.alert('Peringatan', 'Nama wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      await updateProfile(token, form);

      // update state langsung biar lebih cepat
      setProfile((prev) => prev && ({
        ...prev,
        nama: form.nama,
        alamat: form.alamat,
        no_hp: form.no_hp,
      }));

      setShowEdit(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/rings/png?backgroundColor=d1d4f9&seed=${encodeURIComponent(profile.nama)}`;

  const InfoRow = ({ label, value }: InfoProps) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.colon}>:</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{profile.nama}</Text>
        <Text style={styles.sub}>{profile.jurusan} • {profile.kelas}</Text>

        {/* Info Card */}
        <View style={styles.card}>
          <InfoRow label="Email"      value={profile.email} />
          <InfoRow label="NIS"        value={profile.nis} />
          <InfoRow label="No HP"      value={profile.no_hp} />
          <InfoRow label="Tempat PKL" value={profile.dudi || '-'} />
          <InfoRow label="Alamat"     value={profile.alamat} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnEdit} onPress={openEdit}>
            <Text style={styles.btnEditText}>Edit Profil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== MODAL EDIT ===== */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Profil</Text>

              <Text style={styles.inputLabel}>Nama Lengkap <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.nama}
                onChangeText={(v) => setForm({ ...form, nama: v })}
                placeholder="Masukkan nama lengkap"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile.email}
                editable={false}
              />
              <Text style={styles.hint}>Email tidak dapat diubah</Text>

              <Text style={styles.inputLabel}>No HP</Text>
              <TextInput
                style={styles.input}
                value={form.no_hp}
                onChangeText={(v) => setForm({ ...form, no_hp: v })}
                placeholder="Masukkan nomor HP"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={form.alamat}
                onChangeText={(v) => setForm({ ...form, alamat: v })}
                placeholder="Masukkan alamat"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🔒  NIS, Kelas, Jurusan, dan Tempat PKL hanya bisa diubah oleh admin
                </Text>
              </View>

              <TouchableOpacity style={styles.btnSimpan} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnSimpanText}>Simpan</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBatal} onPress={() => setShowEdit(false)}>
                <Text style={styles.btnBatalText}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  container:  { flexGrow: 1, alignItems: 'center', paddingTop: 40, paddingBottom: 40, backgroundColor: '#F9FAFB' },

  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  name:   { fontSize: 20, fontWeight: '600', color: '#111827' },
  sub:    { fontSize: 14, color: '#6B7280', marginBottom: 14 },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    gap: 10,
  },

  btnEdit: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },

  btnEditText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },

  card: {
    width: '90%', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, elevation: 2, gap: 12, marginBottom: 24,
  },
  row:    { flexDirection: 'row', alignItems: 'flex-start' },
  label:  { width: 90, color: '#6B7280', fontSize: 14 },
  colon:  { width: 16, color: '#6B7280', fontSize: 14, textAlign: 'center' },
  value:  { flex: 1, fontWeight: '500', fontSize: 14, color: '#111827', flexWrap: 'wrap' },

  logoutBtn:  { backgroundColor: '#EF4444', paddingVertical: 13, paddingHorizontal: 60, borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:   {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '85%',
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },

  inputLabel:    { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  required:      { color: '#EF4444' },
  input:         { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginBottom: 12 },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  inputArea:     { height: 90, textAlignVertical: 'top' },
  hint:          { fontSize: 11, color: '#9CA3AF', marginTop: -8, marginBottom: 12 },

  infoBox:  { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginBottom: 12 },
  infoText: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  btnSimpan:     { backgroundColor: '#2563EB', padding: 13, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  btnSimpanText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnBatal:      { alignItems: 'center', padding: 10 },
  btnBatalText:  { color: '#6B7280', fontSize: 14 },
});