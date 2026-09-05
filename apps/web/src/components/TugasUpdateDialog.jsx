import React, { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_LIST } from '@/lib/units';

export default function TugasUpdateDialog({ open, onOpenChange, tugas, onSaved }) {
  const [status, setStatus] = useState('belum_mulai');
  const [progres, setProgres] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !tugas) return;
    setStatus(tugas.status || 'belum_mulai');
    setProgres(tugas.progres || 0);
    setCatatan(tugas.catatan || '');
  }, [open, tugas]);

  const handleStatusChange = (value) => {
    setStatus(value);
    if (value === 'selesai') setProgres(100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pb.collection('tugas').update(tugas.id, {
        status,
        progres: status === 'selesai' ? 100 : progres,
        catatan: catatan.trim(),
      });
      toast.success('Progres tugas berhasil diperbarui.');
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error('Gagal memperbarui progres. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (!tugas) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perbarui Progres</DialogTitle>
          <DialogDescription className="line-clamp-2">{tugas.judul}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Progres pengerjaan</Label>
              <span className="text-sm font-bold tabular-nums">{progres}%</span>
            </div>
            <Slider
              value={[progres]}
              onValueChange={(values) => setProgres(values[0])}
              min={0}
              max={100}
              step={5}
              disabled={status === 'selesai'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan untuk pimpinan</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Kendala, capaian, atau tindak lanjut yang dibutuhkan…"
              rows={3}
            />
          </div>

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
              Simpan Progres
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
