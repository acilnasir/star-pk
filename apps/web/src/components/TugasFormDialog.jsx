import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import {
  PRIORITAS_LIST,
  STATUS_LIST,
  PROVINSI_LIST,
  kabupatenList,
} from '@/lib/units';

const FORM_AWAL = {
  judul: '',
  deskripsi: '',
  provinsi: '',
  kabupaten_kota: '',
  assignee: '',
  prioritas: 'sedang',
  tenggat: '',
  status: 'belum_mulai',
  progres: 0,
};

// Kandidat penanggung jawab: pembimbing, kaur/kasubsi, operator.
const KANDIDAT_FILTER = "role = 'pembimbing' || role = 'kaur_kasubsi' || role = 'operator'";

export default function TugasFormDialog({ open, onOpenChange, tugas, onSaved }) {
  const isEdit = Boolean(tugas);
  const [staf, setStaf] = useState([]);
  const [form, setForm] = useState(FORM_AWAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    pb.collection('users')
      .getFullList({ filter: KANDIDAT_FILTER, sort: 'name' })
      .then(setStaf)
      .catch((err) => console.error('Gagal memuat staf', err));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (tugas) {
      setForm({
        judul: tugas.judul || '',
        deskripsi: tugas.deskripsi || '',
        provinsi: tugas.provinsi || '',
        kabupaten_kota: tugas.kabupaten_kota || '',
        assignee: tugas.assignee || '',
        prioritas: tugas.prioritas || 'sedang',
        tenggat: tugas.tenggat ? tugas.tenggat.slice(0, 10) : '',
        status: tugas.status || 'belum_mulai',
        progres: tugas.progres || 0,
      });
    } else {
      setForm(FORM_AWAL);
    }
  }, [open, tugas]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleProvinsiChange = (provinsi) => {
    setForm((prev) => ({ ...prev, provinsi, kabupaten_kota: '', assignee: '' }));
  };

  const handleKabupatenChange = (kabupaten_kota) => {
    setForm((prev) => ({ ...prev, kabupaten_kota, assignee: '' }));
  };

  const handleAssigneeChange = (assigneeId) => {
    const stafTerpilih = staf.find((s) => s.id === assigneeId);
    setForm((prev) => ({
      ...prev,
      assignee: assigneeId,
      // Sesuaikan lokasi tugas dengan lokasi penanggung jawab.
      provinsi: stafTerpilih?.provinsi || prev.provinsi,
      kabupaten_kota: stafTerpilih?.kabupaten_kota || prev.kabupaten_kota,
    }));
  };

  const stafTerpilih = useMemo(
    () =>
      staf.filter(
        (s) =>
          (!form.provinsi || s.provinsi === form.provinsi) &&
          (!form.kabupaten_kota || s.kabupaten_kota === form.kabupaten_kota),
      ),
    [staf, form.provinsi, form.kabupaten_kota],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.provinsi || !form.kabupaten_kota || !form.assignee) {
      toast.error('Judul, provinsi, kota/kabupaten, dan penanggung jawab wajib diisi.');
      return;
    }
    const assigneeRec = staf.find((s) => s.id === form.assignee);
    const unitKerja = assigneeRec?.unit_kerja || '';
    setSaving(true);
    const payload = {
      judul: form.judul.trim(),
      deskripsi: form.deskripsi.trim(),
      provinsi: form.provinsi,
      kabupaten_kota: form.kabupaten_kota,
      unit_kerja: unitKerja,
      assignee: form.assignee,
      prioritas: form.prioritas,
      tenggat: form.tenggat ? `${form.tenggat} 00:00:00.000Z` : '',
      status: form.status,
      progres: form.status === 'selesai' ? 100 : Number(form.progres) || 0,
    };
    try {
      if (isEdit) {
        await pb.collection('tugas').update(tugas.id, payload);
        toast.success('Tugas berhasil diperbarui.');
      } else {
        await pb.collection('tugas').create({ ...payload, catatan: '' });
        toast.success('Tugas baru berhasil dibuat.');
      }
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error('Gagal menyimpan tugas. Periksa kembali isian Anda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Ubah Tugas' : 'Tugas Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui rincian tugas yang sedang berjalan.'
              : 'Bebankan tugas Pembimbingan Kemasyarakatan kepada anggota tim.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul tugas</Label>
            <Input
              id="judul"
              value={form.judul}
              onChange={(e) => setField('judul', e.target.value)}
              placeholder="Contoh: Pendampingan klien pemasyarakatan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={form.deskripsi}
              onChange={(e) => setField('deskripsi', e.target.value)}
              placeholder="Rincian pekerjaan yang diharapkan…"
              rows={3}
            />
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
            <div className="space-y-2">
              <Label>Kota/Kabupaten</Label>
              <Select
                value={form.kabupaten_kota}
                onValueChange={handleKabupatenChange}
                disabled={!form.provinsi}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kota/kabupaten" />
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Penanggung jawab</Label>
              <Select value={form.assignee} onValueChange={handleAssigneeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota tim" />
                </SelectTrigger>
                <SelectContent>
                  {stafTerpilih.length === 0 ? (
                    <SelectItem value="kosong" disabled>
                    Tidak ada anggota di wilayah ini
                    </SelectItem>
                  ) : (
                    stafTerpilih.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name || s.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select
                value={form.prioritas}
                onValueChange={(value) => setField('prioritas', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITAS_LIST.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenggat">Tenggat</Label>
              <Input
                id="tenggat"
                type="date"
                value={form.tenggat}
                onChange={(e) => setField('tenggat', e.target.value)}
              />
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LIST.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="progres">Progres (%)</Label>
              <Input
                id="progres"
                type="number"
                min={0}
                max={100}
                value={form.progres}
                onChange={(e) => setField('progres', e.target.value)}
              />
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
              {isEdit ? 'Simpan Perubahan' : 'Buat Tugas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
