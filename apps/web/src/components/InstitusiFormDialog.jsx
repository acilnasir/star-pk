import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JENIS_INSTITUSI_LIST, PROVINSI_LIST, kabupatenList } from '@/lib/units';

const FORM_AWAL = {
  nama_kantor: '',
  jenis: 'balai_pemasyarakatan',
  kelas: '',
  alamat: '',
  email: '',
  telepon: '',
  pimpinan: '',
  wilayah_kerja: '',
  provinsi: '',
  kabupaten_kota: '',
};

export default function InstitusiFormDialog({ open, onOpenChange, institusi, onSaved }) {
  const isEdit = Boolean(institusi);
  const [form, setForm] = useState(FORM_AWAL);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (institusi) {
      setForm({
        nama_kantor: institusi.nama_kantor || '',
        jenis: institusi.jenis || 'balai_pemasyarakatan',
        kelas: institusi.kelas || '',
        alamat: institusi.alamat || '',
        email: institusi.email || '',
        telepon: institusi.telepon || '',
        pimpinan: institusi.pimpinan || '',
        wilayah_kerja: institusi.wilayah_kerja || '',
        provinsi: institusi.provinsi || '',
        kabupaten_kota: institusi.kabupaten_kota || '',
      });
      setLogoPreview(institusi.logo ? pb.files.getURL(institusi, institusi.logo) : '');
    } else {
      setForm(FORM_AWAL);
      setLogoPreview('');
    }
    setLogoFile(null);
  }, [open, institusi]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2 MB.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleProvinsiChange = (provinsi) =>
    setForm((prev) => ({ ...prev, provinsi, kabupaten_kota: '' }));

  const butuhKabupaten = form.jenis === 'balai_pemasyarakatan';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_kantor.trim()) {
      toast.error('Nama kantor wajib diisi.');
      return;
    }
    if (butuhKabupaten && !form.kabupaten_kota) {
      toast.error('Pilih kota/kabupaten untuk Balai Pemasyarakatan.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama_kantor: form.nama_kantor.trim(),
        jenis: form.jenis,
        kelas: form.kelas.trim(),
        alamat: form.alamat.trim(),
        email: form.email.trim(),
        telepon: form.telepon.trim(),
        pimpinan: form.pimpinan.trim(),
        wilayah_kerja: form.wilayah_kerja.trim(),
        provinsi: form.jenis === 'pusat' ? '' : form.provinsi,
        kabupaten_kota: butuhKabupaten ? form.kabupaten_kota : '',
      };
      if (logoFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
        fd.append('logo', logoFile);
        if (isEdit) {
          await pb.collection('institusi').update(institusi.id, fd);
        } else {
          await pb.collection('institusi').create(fd);
        }
      } else if (isEdit) {
        await pb.collection('institusi').update(institusi.id, payload);
      } else {
        await pb.collection('institusi').create(payload);
      }
      toast.success(isEdit ? 'Profil institusi disimpan.' : 'Institusi baru dibuat.');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error('Gagal menyimpan profil institusi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah Profil Institusi' : 'Institusi Baru'}</DialogTitle>
          <DialogDescription>
            Kelola identitas kantor: nama, alamat, kontak, pimpinan, dan logo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
                <Upload className="h-4 w-4" />
                Unggah Logo
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">PNG/JPG/WebP/SVG, maks. 2 MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama_kantor">Nama kantor</Label>
            <Input
              id="nama_kantor"
              value={form.nama_kantor}
              onChange={(e) => setField('nama_kantor', e.target.value)}
              placeholder="Contoh: Balai Pemasyarakatan Kelas II Ciangir"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis institusi</Label>
              <Select value={form.jenis} onValueChange={(v) => setField('jenis', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_INSTITUSI_LIST.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input
                id="kelas"
                value={form.kelas}
                onChange={(e) => setField('kelas', e.target.value)}
                placeholder="Contoh: Kelas II"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pimpinan">Pimpinan</Label>
            <Input
              id="pimpinan"
              value={form.pimpinan}
              onChange={(e) => setField('pimpinan', e.target.value)}
              placeholder="Nama kepala kantor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea
              id="alamat"
              value={form.alamat}
              onChange={(e) => setField('alamat', e.target.value)}
              placeholder="Alamat lengkap kantor"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="kantor@djp.go.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telepon">Nomor telepon</Label>
              <Input
                id="telepon"
                value={form.telepon}
                onChange={(e) => setField('telepon', e.target.value)}
                placeholder="021-3000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wilayah_kerja">Wilayah kerja</Label>
            <Input
              id="wilayah_kerja"
              value={form.wilayah_kerja}
              onChange={(e) => setField('wilayah_kerja', e.target.value)}
              placeholder="Daftar kota/kabupaten yang dibawahi"
            />
          </div>

          {form.jenis !== 'pusat' && (
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
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Buat Institusi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
