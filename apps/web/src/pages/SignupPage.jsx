import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const LOGO_URL =
  'https://horizons-cdn.hostinger.com/07e427fa-d575-42a9-9e54-1062f7b90da9/16154b93057f5dee94b031eafddd81f4.png';
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
import { ROLE_LIST, PROVINSI_LIST, kabupatenList } from '@/lib/units';

export default function SignupPage() {
  const { isAuthed, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pembimbing',
    provinsi: '',
    kabupaten_kota: '',
    unit_kerja: '',
    jabatan: '',
    nip: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleProvinsiChange = (provinsi) => {
    setForm((prev) => ({ ...prev, provinsi, kabupaten_kota: '' }));
  };

  // Level yang tidak terikat kota/kabupaten (pusat & wilayah) menyembunyikan
  // field unit kerja karena cakupannya lebih luas.
  const butuhKabupaten = !['pimpinan_pusat', 'pimpinan_wilayah'].includes(form.role);
  const butuhUnitKerja = !['pimpinan_pusat', 'pimpinan_wilayah'].includes(form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 10) {
      setError('Kata sandi minimal 10 karakter.');
      return;
    }
    if (butuhKabupaten && !form.kabupaten_kota) {
      setError('Pilih kota/kabupaten untuk level ini.');
      return;
    }
    setLoading(true);
    try {
      await signup(form.email.trim(), form.password, {
        name: form.name.trim(),
        role: form.role,
        provinsi: form.provinsi,
        kabupaten_kota: butuhKabupaten ? form.kabupaten_kota : '',
        unit_kerja: butuhUnitKerja ? form.unit_kerja.trim() : '',
        jabatan: form.jabatan.trim(),
        nip: form.nip.trim(),
        emailVisibility: false,
        verified: true,
      });
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.response?.data?.email) {
        setError('Email sudah terdaftar. Silakan masuk.');
      } else {
        setError('Gagal membuat profil. Periksa kembali isian Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-sidebar-background px-4 py-10">
      <Helmet>
        <title>Buat Profil — STAR-PK</title>
        <meta
          name="description"
          content="Buat profil STAR-PK sesuai level Anda: pimpinan pusat, wilayah, kota/kabupaten, kaur/kasubsi, operator, atau pembimbing kemasyarakatan."
        />
      </Helmet>

      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center">
          <img
            src={LOGO_URL}
            alt="STAR-PK"
            className="h-12 w-auto max-w-[260px] object-contain object-left"
          />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight">Buat Profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftarkan diri sesuai level dan wilayah kerja Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Nama sesuai penempatan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Level / Peran</Label>
            <Select value={form.role} onValueChange={(v) => setField('role', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih level" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_LIST.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                placeholder="Jabatan struktural/fungsional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={form.nip}
                onChange={(e) => setField('nip', e.target.value)}
                placeholder="Nomor induk pegawai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="nama@starpk.id"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="Minimal 10 karakter"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Profil & Masuk
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
