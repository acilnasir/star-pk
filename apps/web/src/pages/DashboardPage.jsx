import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import useTugas from '@/hooks/useTugas';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import { ProgresBar, LokasiBadge } from '@/components/tugas-ui';
import {
  DASHBOARD_LEVEL,
  PALETTE,
  STATUS,
  formatTanggal,
  isTerlambat,
  roleLabel,
  sisaHari,
} from '@/lib/units';

function sapaan() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 19) return 'Selamat sore';
  return 'Selamat malam';
}

const STATUS_LIST_MINI = [
  { id: 'belum_mulai', pendek: 'Belum' },
  { id: 'dalam_proses', pendek: 'Proses' },
  { id: 'selesai', pendek: 'Selesai' },
  { id: 'terhambat', pendek: 'Hambat' },
];

export default function DashboardPage({ level }) {
  const { user } = useAuth();
  const { tugas, loading, error } = useTugas();

  const conf = DASHBOARD_LEVEL[level] || DASHBOARD_LEVEL.kota;
  const groupKey = conf.groupKey;

  const ringkasan = useMemo(() => {
    const perluPerhatian = tugas.filter(
      (t) => t.status === 'terhambat' || isTerlambat(t),
    );
    return {
      total: tugas.length,
      dalamProses: tugas.filter((t) => t.status === 'dalam_proses').length,
      selesai: tugas.filter((t) => t.status === 'selesai').length,
      perluPerhatian: perluPerhatian.length,
    };
  }, [tugas]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const t of tugas) {
      const key = t[groupKey] || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [tugas, groupKey]);

  const dataGrafik = useMemo(
    () =>
      groups.map((g) => ({
        name: g.key,
        'Belum Mulai': g.items.filter((t) => t.status === 'belum_mulai').length,
        'Dalam Proses': g.items.filter((t) => t.status === 'dalam_proses').length,
        Selesai: g.items.filter((t) => t.status === 'selesai').length,
        Terhambat: g.items.filter((t) => t.status === 'terhambat').length,
      })),
    [groups],
  );

  const mendekatiTenggat = useMemo(
    () =>
      tugas
        .filter((t) => t.status !== 'selesai' && t.tenggat)
        .sort((a, b) => new Date(a.tenggat) - new Date(b.tenggat))
        .slice(0, 6),
    [tugas],
  );

  const tanggalHariIni = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const statistik = [
    { label: 'Total Tugas', value: ringkasan.total, icon: ClipboardList, warna: 'bg-primary/10 text-primary' },
    { label: 'Dalam Proses', value: ringkasan.dalamProses, icon: Loader2, warna: 'bg-blue-100 text-blue-700' },
    { label: 'Selesai', value: ringkasan.selesai, icon: CheckCircle2, warna: 'bg-emerald-100 text-emerald-700' },
    { label: 'Perlu Perhatian', value: ringkasan.perluPerhatian, icon: AlertTriangle, warna: 'bg-red-100 text-red-700' },
  ];

  const cakupanLokasi = [
    user?.provinsi,
    user?.kabupaten_kota,
    user?.unit_kerja,
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{conf.title} — STAR-PK</title>
        <meta
          name="description"
          content={`${conf.title} — ${conf.subtitle}`}
        />
      </Helmet>

      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{tanggalHariIni}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {sapaan()}, {user?.name || 'Pengguna'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {conf.subtitle}
              {cakupanLokasi && level !== 'pusat' && (
                <span className="block text-xs">
                  Cakupan: {cakupanLokasi} · {roleLabel(user?.role)}
                </span>
              )}
            </p>
          </div>
          <Link
            to="/tugas"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
          >
            Lihat Semua Tugas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Gagal memuat data tugas. Periksa koneksi Anda lalu muat ulang halaman.
        </div>
      )}

      {/* Pita statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statistik.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06}>
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.warna}`}>
                <stat.icon className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <p className="text-3xl font-extrabold tabular-nums tracking-tight">
                {loading ? '—' : <CountUp value={stat.value} />}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Kartu per grup cakupan */}
      <section>
        <Reveal>
          <h2 className="text-lg font-bold tracking-tight">
            Kinerja per {conf.groupLabel}
          </h2>
          <p className="text-sm text-muted-foreground">
            Rata-rata progres dan sebaran status tugas setiap {conf.groupLabel.toLowerCase()}.
          </p>
        </Reveal>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </p>
          ) : groups.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {conf.emptyHint}
            </p>
          ) : (
            groups.map((g, i) => {
              const rataProgres = g.items.length
                ? Math.round(
                    g.items.reduce((acc, t) => acc + (t.progres || 0), 0) /
                      g.items.length,
                  )
                : 0;
              const terhambat = g.items.filter(
                (t) => t.status === 'terhambat' || isTerlambat(t),
              ).length;
              const warna = PALETTE[i % PALETTE.length];
              return (
                <Reveal key={g.key} delay={i * 0.08}>
                  <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: warna }}
                        />
                        <div>
                          <p className="text-sm font-bold">{g.key}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.items.length} tugas aktif
                          </p>
                        </div>
                      </div>
                      {terhambat > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          {terhambat}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <p className="text-4xl font-extrabold tabular-nums tracking-tight">
                        <CountUp value={rataProgres} suffix="%" />
                      </p>
                    </div>
                    <ProgresBar value={rataProgres} className="mt-2" />

                    <div className="mt-4 grid grid-cols-4 gap-1 border-t pt-3 text-center">
                      {STATUS_LIST_MINI.map((s) => (
                        <div key={s.id}>
                          <p className="text-base font-bold tabular-nums">
                            {g.items.filter((t) => t.status === s.id).length}
                          </p>
                          <p className="text-[10px] leading-tight text-muted-foreground">
                            {s.pendek}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Grafik sebaran status */}
        <Reveal className="lg:col-span-3">
          <div className="h-full rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold tracking-tight">
              Sebaran Status Tugas per {conf.groupLabel}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Perbandingan jumlah tugas per status di setiap {conf.groupLabel.toLowerCase()}.
            </p>
            {dataGrafik.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Tidak ada data untuk ditampilkan.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataGrafik} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Belum Mulai" stackId="a" fill={STATUS.belum_mulai.hex} />
                  <Bar dataKey="Dalam Proses" stackId="a" fill={STATUS.dalam_proses.hex} />
                  <Bar dataKey="Selesai" stackId="a" fill={STATUS.selesai.hex} />
                  <Bar dataKey="Terhambat" stackId="a" fill={STATUS.terhambat.hex} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Reveal>

        {/* Tenggat terdekat */}
        <Reveal className="lg:col-span-2" delay={0.08}>
          <div className="h-full rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold tracking-tight">Tenggat Terdekat</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Tugas berjalan dengan tenggat paling dekat.
            </p>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Memuat…</p>
            ) : mendekatiTenggat.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada tugas berjalan dengan tenggat.
              </p>
            ) : (
              <ul className="space-y-3">
                {mendekatiTenggat.map((t) => {
                  const sisa = sisaHari(t.tenggat);
                  const telat = isTerlambat(t);
                  return (
                    <li
                      key={t.id}
                      className="rounded-xl border bg-background p-3 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">
                          {t.judul}
                        </p>
                        <LokasiBadge
                          provinsi={t.provinsi}
                          kabupaten_kota={t.kabupaten_kota}
                          className="shrink-0"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t.expand?.assignee?.name || '—'} · {formatTanggal(t.tenggat)}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            telat
                              ? 'bg-red-100 text-red-700'
                              : sisa <= 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {telat
                            ? `Terlambat ${Math.abs(sisa)} hari`
                            : sisa === 0
                              ? 'Hari ini'
                              : `${sisa} hari lagi`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
