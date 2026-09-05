import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import useTugas from '@/hooks/useTugas';
import Reveal from '@/components/Reveal';
import TugasFormDialog from '@/components/TugasFormDialog';
import TugasUpdateDialog from '@/components/TugasUpdateDialog';
import {
  LokasiBadge,
  PrioritasBadge,
  ProgresBar,
  StatusBadge,
} from '@/components/tugas-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  STATUS_LIST,
  CAN_CREATE,
  CAN_MANAGE,
  formatTanggal,
  isTerlambat,
} from '@/lib/units';
import { cn } from '@/lib/utils';

export default function TugasPage() {
  const { user } = useAuth();
  const canManage = CAN_MANAGE.includes(user?.role);
  const canCreate = CAN_CREATE.includes(user?.role);
  const { tugas, loading, error, reload } = useTugas();

  const [searchParams] = useSearchParams();
  const [cari, setCari] = useState('');
  const [filterProvinsi, setFilterProvinsi] = useState(searchParams.get('provinsi') || 'semua');
  const [filterKabupaten, setFilterKabupaten] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');

  const [formOpen, setFormOpen] = useState(false);
  const [formTugas, setFormTugas] = useState(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTugas, setUpdateTugas] = useState(null);
  const [hapusTugas, setHapusTugas] = useState(null);
  const [menghapus, setMenghapus] = useState(false);

  // Daftar provinsi & kabupaten unik dari data yang terlihat (untuk filter).
  const provinsiUnik = useMemo(
    () => [...new Set(tugas.map((t) => t.provinsi).filter(Boolean))].sort(),
    [tugas],
  );
  const kabupatenUnik = useMemo(
    () =>
      [...new Set(
        tugas
          .filter((t) => filterProvinsi === 'semua' || t.provinsi === filterProvinsi)
          .map((t) => t.kabupaten_kota)
          .filter(Boolean),
      )].sort(),
    [tugas, filterProvinsi],
  );

  const terfilter = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return tugas.filter((t) => {
      if (filterProvinsi !== 'semua' && t.provinsi !== filterProvinsi) return false;
      if (filterKabupaten !== 'semua' && t.kabupaten_kota !== filterKabupaten) return false;
      if (filterStatus !== 'semua' && t.status !== filterStatus) return false;
      if (
        kata &&
        !`${t.judul} ${t.deskripsi || ''} ${t.expand?.assignee?.name || ''}`
          .toLowerCase()
          .includes(kata)
      )
        return false;
      return true;
    });
  }, [tugas, cari, filterProvinsi, filterKabupaten, filterStatus]);

  const handleHapus = async () => {
    if (!hapusTugas) return;
    setMenghapus(true);
    try {
      await pb.collection('tugas').delete(hapusTugas.id);
      toast.success('Tugas berhasil dihapus.');
      setHapusTugas(null);
      reload();
    } catch {
      toast.error('Gagal menghapus tugas.');
    } finally {
      setMenghapus(false);
    }
  };

  const tampilkanFilterLokasi = CAN_MANAGE.includes(user?.role) || user?.role === 'kaur_kasubsi' || user?.role === 'operator';

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Daftar Tugas — STAR-PK</title>
        <meta
          name="description"
          content="Kelola dan pantau seluruh tugas Pembimbingan Kemasyarakatan: status, progres, prioritas, dan tenggat."
        />
      </Helmet>

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Daftar Tugas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {canManage
                ? 'Pantau dan kelola penugasan Pembimbingan Kemasyarakatan di cakupan Anda.'
                : 'Perbarui status dan progres tugas yang dibebankan kepada Anda.'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                setFormTugas(null);
                setFormOpen(true);
              }}
              className="h-10 font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tugas Baru
            </Button>
          )}
        </div>
      </Reveal>

      {/* Bilah filter */}
      <Reveal delay={0.05}>
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari judul, deskripsi, atau nama pembimbing…"
              className="pl-9"
            />
          </div>
          {tampilkanFilterLokasi && provinsiUnik.length > 0 && (
            <Select
              value={filterProvinsi}
              onValueChange={(v) => {
                setFilterProvinsi(v);
                setFilterKabupaten('semua');
              }}
            >
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Semua provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Provinsi</SelectItem>
                {provinsiUnik.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tampilkanFilterLokasi && kabupatenUnik.length > 0 && (
            <Select value={filterKabupaten} onValueChange={setFilterKabupaten}>
              <SelectTrigger className="lg:w-44">
                <SelectValue placeholder="Semua kota/kab." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Kota/Kab.</SelectItem>
                {kabupatenUnik.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="lg:w-44">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Reveal>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Gagal memuat data tugas. Periksa koneksi Anda lalu muat ulang halaman.
        </div>
      )}

      {/* Tabel tugas */}
      <Reveal delay={0.1}>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Tugas</th>
                  <th className="px-4 py-3">Wilayah</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progres</th>
                  <th className="px-4 py-3">Tenggat</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                      Memuat data tugas…
                    </td>
                  </tr>
                ) : terfilter.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-semibold">Belum ada tugas yang cocok</p>
                        <p className="text-sm text-muted-foreground">
                          {canCreate
                            ? 'Ubah filter atau buat tugas baru untuk tim Anda.'
                            : 'Belum ada tugas yang dibebankan kepada Anda.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  terfilter.map((t) => {
                    const telat = isTerlambat(t);
                    return (
                      <tr key={t.id} className="align-top transition-colors hover:bg-muted/40">
                        <td className="max-w-64 px-4 py-3.5">
                          <p className="font-semibold leading-snug">{t.judul}</p>
                          {t.catatan && (
                            <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                              “{t.catatan}”
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <LokasiBadge
                            provinsi={t.provinsi}
                            kabupaten_kota={t.kabupaten_kota}
                          />
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {t.expand?.assignee?.name || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <PrioritasBadge prioritas={t.prioritas} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="w-40 px-4 py-3.5">
                          <ProgresBar value={t.progres} status={t.status} />
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3.5 whitespace-nowrap',
                            telat ? 'font-semibold text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          {formatTanggal(t.tenggat)}
                          {telat && <span className="block text-[11px]">Terlambat</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Aksi tugas"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canManage ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setFormTugas(t);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Ubah Tugas
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setUpdateTugas(t);
                                      setUpdateOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Perbarui Progres
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setHapusTugas(t)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setUpdateTugas(t);
                                    setUpdateOpen(true);
                                  }}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Perbarui Progres
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && terfilter.length > 0 && (
            <div className="border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              Menampilkan {terfilter.length} dari {tugas.length} tugas
            </div>
          )}
        </div>
      </Reveal>

      <TugasFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tugas={formTugas}
        onSaved={reload}
      />
      <TugasUpdateDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        tugas={updateTugas}
        onSaved={reload}
      />

      <AlertDialog open={Boolean(hapusTugas)} onOpenChange={() => setHapusTugas(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tugas ini?</AlertDialogTitle>
            <AlertDialogDescription>
              “{hapusTugas?.judul}” akan dihapus secara permanen dan tidak dapat
              dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={menghapus}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHapus}
              disabled={menghapus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {menghapus ? 'Menghapus…' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
