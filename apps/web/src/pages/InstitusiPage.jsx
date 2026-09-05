import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Radar,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import useInstitusi from '@/hooks/useInstitusi';
import useTugas from '@/hooks/useTugas';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import InstitusiFormDialog from '@/components/InstitusiFormDialog';
import { ProgresBar } from '@/components/tugas-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  JENIS_INSTITUSI,
  STATUS,
  formatTanggal,
  isTerlambat,
  jenisLabel,
  sisaHari,
} from '@/lib/units';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Ambil institusi "milik" pengguna berdasarkan peran & lokasi.
function institusiMilik(institusiList, user) {
  if (!user) return null;
  if (user.role === 'pimpinan_pusat') {
    return institusiList.find((i) => i.jenis === 'pusat') || null;
  }
  if (user.role === 'pimpinan_wilayah') {
    return (
      institusiList.find(
        (i) => i.jenis === 'kanwil' && i.provinsi === user.provinsi,
      ) || null
    );
  }
  return (
    institusiList.find(
      (i) =>
        i.jenis === 'balai_pemasyarakatan' &&
        i.kabupaten_kota === user.kabupaten_kota,
    ) || null
  );
}

// Filter tugas yang termasuk cakupan sebuah institusi.
function tugasInstitusi(tugas, inst) {
  if (!inst) return [];
  if (inst.jenis === 'pusat') return tugas;
  if (inst.jenis === 'kanwil') return tugas.filter((t) => t.provinsi === inst.provinsi);
  return tugas.filter((t) => t.kabupaten_kota === inst.kabupaten_kota);
}

const JENIS_ICON = {
  pusat: Globe2,
  kanwil: Building2,
  balai_pemasyarakatan: Radar,
};

export default function InstitusiPage() {
  const { user } = useAuth();
  const { institusi, loading, error, reload } = useInstitusi();
  const { tugas } = useTugas();

  const canManage =
    user?.role === 'pimpinan_pusat' ||
    user?.role === 'pimpinan_wilayah' ||
    user?.role === 'pimpinan_kota';

  const milik = useMemo(() => institusiMilik(institusi, user), [institusi, user]);
  const [terpilihId, setTerpilihId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formInst, setFormInst] = useState(null);

  // Defaultkan pilihan ke institusi milik pengguna.
  useEffect(() => {
    if (terpilihId) return;
    if (milik) setTerpilihId(milik.id);
    else if (institusi.length > 0) setTerpilihId(institusi[0].id);
  }, [milik, institusi, terpilihId]);

  const terpilih = useMemo(
    () => institusi.find((i) => i.id === terpilihId) || null,
    [institusi, terpilihId],
  );

  const tugasTerpilih = useMemo(
    () => tugasInstitusi(tugas, terpilih),
    [tugas, terpilih],
  );

  const ringkasan = useMemo(() => {
    const perluPerhatian = tugasTerpilih.filter(
      (t) => t.status === 'terhambat' || isTerlambat(t),
    );
    const rataProgres = tugasTerpilih.length
      ? Math.round(
          tugasTerpilih.reduce((acc, t) => acc + (t.progres || 0), 0) /
            tugasTerpilih.length,
        )
      : 0;
    return {
      total: tugasTerpilih.length,
      dalamProses: tugasTerpilih.filter((t) => t.status === 'dalam_proses').length,
      selesai: tugasTerpilih.filter((t) => t.status === 'selesai').length,
      terhambat: tugasTerpilih.filter((t) => t.status === 'terhambat').length,
      perluPerhatian: perluPerhatian.length,
      rataProgres,
    };
  }, [tugasTerpilih]);

  const dataStatus = useMemo(
    () =>
      [
        { key: 'belum_mulai', label: 'Belum Mulai', value: 0, hex: STATUS.belum_mulai.hex },
        { key: 'dalam_proses', label: 'Dalam Proses', value: 0, hex: STATUS.dalam_proses.hex },
        { key: 'selesai', label: 'Selesai', value: 0, hex: STATUS.selesai.hex },
        { key: 'terhambat', label: 'Terhambat', value: 0, hex: STATUS.terhambat.hex },
      ].map((s) => ({
        ...s,
        value: tugasTerpilih.filter((t) => t.status === s.key).length,
      })),
    [tugasTerpilih],
  );

  // Progres per penanggung jawab (5 teratas).
  const progresPerStaf = useMemo(() => {
    const map = new Map();
    for (const t of tugasTerpilih) {
      const nama = t.expand?.assignee?.name || '—';
      if (!map.has(nama)) map.set(nama, { total: 0, jumlah: 0 });
      const e = map.get(nama);
      e.total += t.progres || 0;
      e.jumlah += 1;
    }
    return Array.from(map.entries())
      .map(([nama, v]) => ({
        nama,
        rata: v.jumlah ? Math.round(v.total / v.jumlah) : 0,
        jumlah: v.jumlah,
      }))
      .sort((a, b) => b.rata - a.rata)
      .slice(0, 6);
  }, [tugasTerpilih]);

  const mendekatiTenggat = useMemo(
    () =>
      tugasTerpilih
        .filter((t) => t.status !== 'selesai' && t.tenggat)
        .sort((a, b) => new Date(a.tenggat) - new Date(b.tenggat))
        .slice(0, 5),
    [tugasTerpilih],
  );

  const logoUrl = terpilih?.logo ? pb.files.getURL(terpilih, terpilih.logo) : '';
  const IkonJenis = JENIS_ICON[terpilih?.jenis] || Building2;

  const handleEdit = () => {
    setFormInst(terpilih);
    setFormOpen(true);
  };
  const handleBaru = () => {
    setFormInst(null);
    setFormOpen(true);
  };

  const statistik = [
    { label: 'Total Tugas', value: ringkasan.total, icon: ClipboardList, warna: 'bg-primary/10 text-primary' },
    { label: 'Dalam Proses', value: ringkasan.dalamProses, icon: Loader2, warna: 'bg-blue-100 text-blue-700' },
    { label: 'Selesai', value: ringkasan.selesai, icon: CheckCircle2, warna: 'bg-emerald-100 text-emerald-700' },
    { label: 'Perlu Perhatian', value: ringkasan.perluPerhatian, icon: AlertTriangle, warna: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Profil Institusi — STAR-PK</title>
        <meta
          name="description"
          content="Profil institusi Balai Pemasyarakatan, Kanwil, dan Direktorat Jenderal Pemasyarakatan beserta dasbor kinerjanya."
        />
      </Helmet>

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Profil Institusi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola profil kantor & pantau kinerja setiap institusi pemasyarakatan.
            </p>
          </div>
          {canManage && (
            <Button onClick={handleBaru} className="h-10 font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Institusi Baru
            </Button>
          )}
        </div>
      </Reveal>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Gagal memuat data institusi. Periksa koneksi Anda lalu muat ulang.
        </div>
      )}

      {/* Pemilih institusi */}
      <Reveal delay={0.05}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {loading ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">Memuat institusi…</p>
          ) : institusi.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              Belum ada profil institusi di cakupan Anda.
            </p>
          ) : (
            institusi.map((inst) => {
              const Ikon = JENIS_ICON[inst.jenis] || Building2;
              const aktif = inst.id === terpilihId;
              return (
                <button
                  key={inst.id}
                  onClick={() => setTerpilihId(inst.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                    aktif
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-foreground hover:bg-muted',
                  )}
                >
                  <Ikon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {inst.nama_kantor}
                    </p>
                    <p
                      className={cn(
                        'truncate text-[11px] leading-tight',
                        aktif ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      {jenisLabel(inst.jenis)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Reveal>

      {!terpilih ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Pilih institusi untuk melihat profil dan kinerjanya.
        </div>
      ) : (
        <>
          {/* Kartu profil institusi */}
          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                  {logoUrl ? (
                    <img src={logoUrl} alt={terpilih.nama_kantor} className="h-full w-full object-contain" />
                  ) : (
                    <IkonJenis className="h-9 w-9 text-muted-foreground" strokeWidth={2} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold tracking-tight">
                          {terpilih.nama_kantor}
                        </h2>
                        {terpilih.kelas && (
                          <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {terpilih.kelas}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {jenisLabel(terpilih.jenis)}
                      </p>
                    </div>
                    {canManage && (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Ubah Profil
                      </Button>
                    )}
                  </div>

                  {terpilih.pimpinan && (
                    <p className="flex items-center gap-2 text-sm">
                      <UserCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Pimpinan:</span>
                      <span className="font-medium">{terpilih.pimpinan}</span>
                    </p>
                  )}

                  {terpilih.wilayah_kerja && (
                    <p className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Wilayah kerja:</span>
                      <span className="font-medium">{terpilih.wilayah_kerja}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {terpilih.alamat && (
                      <p className="flex items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{terpilih.alamat}</span>
                      </p>
                    )}
                    {terpilih.email && (
                      <p className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <a href={`mailto:${terpilih.email}`} className="hover:underline">
                          {terpilih.email}
                        </a>
                      </p>
                    )}
                    {terpilih.telepon && (
                      <p className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <a href={`tel:${terpilih.telepon}`} className="hover:underline">
                          {terpilih.telepon}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pita rata-rata progres */}
              <div className="border-t bg-muted/30 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Rata-rata progres kinerja
                    </p>
                    <p className="text-2xl font-extrabold tabular-nums tracking-tight">
                      <CountUp value={ringkasan.rataProgres} suffix="%" />
                    </p>
                  </div>
                  <div className="min-w-48 flex-1 sm:max-w-xs">
                    <ProgresBar value={ringkasan.rataProgres} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Pita statistik */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statistik.map((stat, i) => (
              <Reveal key={stat.label} delay={0.1 + i * 0.05}>
                <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                  <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-lg', stat.warna)}>
                    <stat.icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <p className="text-3xl font-extrabold tabular-nums tracking-tight">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Sebaran status */}
            <Reveal className="lg:col-span-2" delay={0.12}>
              <div className="h-full rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="text-base font-bold tracking-tight">Sebaran Status</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Komposisi status tugas di {terpilih.nama_kantor}.
                </p>
                {ringkasan.total === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Belum ada tugas tercatat.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={dataStatus}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {dataStatus.map((s) => (
                          <Cell key={s.key} fill={s.hex} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid hsl(var(--border))',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {ringkasan.total > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {dataStatus.map((s) => (
                      <li key={s.key} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
                          {s.label}
                        </span>
                        <span className="font-semibold tabular-nums">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>

            {/* Progres per staf */}
            <Reveal className="lg:col-span-3" delay={0.16}>
              <div className="h-full rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="text-base font-bold tracking-tight">Progres per Pembimbing</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Rata-rata progres tugas per penanggung jawab di institusi ini.
                </p>
                {progresPerStaf.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Belum ada data penugasan.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, progresPerStaf.length * 44)}>
                    <BarChart
                      data={progresPerStaf}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="nama"
                        width={120}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid hsl(var(--border))',
                          fontSize: 12,
                        }}
                        formatter={(v) => [`${v}%`, 'Rata-rata progres']}
                      />
                      <Bar dataKey="rata" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Reveal>
          </div>

          {/* Tenggat terdekat */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-base font-bold tracking-tight">Tenggat Terdekat</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Tugas berjalan dengan tenggat paling dekat di {terpilih.nama_kantor}.
              </p>
              {mendekatiTenggat.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada tugas berjalan dengan tenggat.
                </p>
              ) : (
                <ul className="divide-y">
                  {mendekatiTenggat.map((t) => {
                    const sisa = sisaHari(t.tenggat);
                    const telat = isTerlambat(t);
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{t.judul}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.expand?.assignee?.name || '—'} · {formatTanggal(t.tenggat)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            telat
                              ? 'bg-red-100 text-red-700'
                              : sisa <= 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {telat
                            ? `Terlambat ${Math.abs(sisa)} hari`
                            : sisa === 0
                              ? 'Hari ini'
                              : `${sisa} hari lagi`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Reveal>
        </>
      )}

      <InstitusiFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        institusi={formInst}
        onSaved={reload}
      />
    </div>
  );
}
