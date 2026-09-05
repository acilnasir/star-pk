import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, MapPin, Save, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LIST, PROVINSI_LIST, kabupatenList, roleLabel } from '@/lib/units';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      provinsi: user.provinsi || '',
      kabupaten_kota: user.kabupaten_kota || '',
      unit_kerja: user.unit_kerja || '',
      jabatan: user.jabatan || '',
      nip: user.nip || '',
    });
  }, [user]);

  if (!user || !form) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat profil…
      </div>
    );
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleProvinsiChange = (provinsi) =>
    setForm((prev) => ({ ...prev, provinsi, kabupaten_kota: '' }));

  const butuhKabupaten = !['pimpinan_pusat', 'pimpinan_wilayah'].includes(user.role);
  const butuhUnitKerja = !['pimpinan_pusat', 'pimpinan_wilayah'].includes(user.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pb.collection('users').update(user.id, {
        name: form.name.trim(),
        provinsi: form.provinsi,
        kabupaten_kota: butuhKabupaten ? form.kabupaten_kota : '',
        unit_kerja: butuhUnitKerja ? form.unit_kerja.trim() : '',
        jabatan: form.jabatan.trim(),
        nip: form.nip.trim(),
      });
      toast.success('Profil berhasil disimpan.');
    } catch {
      toast.error('Gagal menyimpan profil. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const lokasi = [form.provinsi, form.kabupaten_kota, form.unit_kerja]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Profil — STAR-PK</title>
        <meta
          name="description"
          content="Kelola profil Anda di STAR-PK: nama, jabatan, wilayah, dan unit kerja."
        />
      </Helmet>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui data diri dan wilayah kerja Anda.
        </p>
      </div>

      {/* Kartu identitas */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="h-7 w-7" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{user.name || user.email}</p>
            <p className="text-sm text-muted-foreground">{roleLabel(user.role)}</p>
            {lokasi && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {lokasi}
              </p>
            )}
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>

      {/* Formulir profil */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Level / Peran</Label>
            <Input value={roleLabel(user.role)} disabled />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Select value={form.provinsi} onValueChange={handleProvinsiChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih provinsi" />
              </SelectTrigger>
              <SelectContent>
                {PROVINSI_LIST.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {butuhKabupaten && (
            <div className="space-y-2">
              <Label>Kota/Kabupaten</Label>
              <Select
                value={form.kabupaten_kota}
                onValueChange={(v) => setField('kabupaten_kota', v)}
                disabled={!form.provinsi}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kota/kab." />
                </SelectTrigger>
                <SelectContent>
                  {kabupatenList(form.provinsi).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {butuhUnitKerja && (
          <div className="space-y-2">
            <Label htmlFor="unit_kerja">Unit kerja</Label>
            <Input
              id="unit_kerja"
              value={form.unit_kerja}
              onChange={(e) => setField('unit_kerja', e.target.value)}
              placeholder="Contoh: UPT PK Kota Bandung"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={form.jabatan}
              onChange={(e) => setField('jabatan', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nip">NIP</Label>
            <Input
              id="nip"
              value={form.nip}
              onChange={(e) => setField('nip', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Profil
          </Button>
        </div>
      </form>
    </div>
  );
}
