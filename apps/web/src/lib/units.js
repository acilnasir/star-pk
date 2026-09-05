// Konfigurasi peran, wilayah, status, dan prioritas untuk STAR-PK.

export const ROLES = {
  pimpinan_pusat: {
    id: 'pimpinan_pusat',
    label: 'Pimpinan Pusat',
    short: 'Pusat',
    rank: 5,
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-600',
  },
  pimpinan_wilayah: {
    id: 'pimpinan_wilayah',
    label: 'Pimpinan Wilayah',
    short: 'Wilayah',
    rank: 4,
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
  },
  pimpinan_kota: {
    id: 'pimpinan_kota',
    label: 'Pimpinan Kota/Kabupaten',
    short: 'Kota/Kab.',
    rank: 3,
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
  },
  kaur_kasubsi: {
    id: 'kaur_kasubsi',
    label: 'Kaur/Kasubsi',
    short: 'Kaur/Kasubsi',
    rank: 2,
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    dot: 'bg-sky-600',
  },
  operator: {
    id: 'operator',
    label: 'Operator',
    short: 'Operator',
    rank: 1,
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
  pembimbing: {
    id: 'pembimbing',
    label: 'Pembimbing Kemasyarakatan',
    short: 'PK',
    rank: 0,
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
  },
};

export const ROLE_LIST = Object.values(ROLES);

// Daftar provinsi dan kabupaten/kota untuk pilihan formulir.
export const WILAYAH = {
  'Jawa Barat': ['Kota Bandung', 'Kota Bekasi', 'Kota Depok', 'Kota Bogor', 'Kabupaten Bandung'],
  'Jawa Tengah': ['Kota Semarang', 'Kota Surakarta', 'Kabupaten Semarang'],
  'Jawa Timur': ['Kota Surabaya', 'Kota Malang'],
  'DKI Jakarta': ['Jakarta Selatan', 'Jakarta Timur', 'Jakarta Pusat'],
  'Banten': [
    'Kota Tangerang',
    'Kota Tangerang Selatan',
    'Kota Serang',
    'Kota Cilegon',
    'Kabupaten Tangerang',
    'Kabupaten Serang',
    'Kabupaten Pandeglang',
    'Kabupaten Rangkasbitung',
  ],
};

export const PROVINSI_LIST = Object.keys(WILAYAH);

export function kabupatenList(provinsi) {
  return WILAYAH[provinsi] || [];
}

// Palet warna untuk grup dinamis (provinsi/kota/unit kerja).
export const PALETTE = [
  '#b45309', '#0f766e', '#3730a3', '#b91c1c',
  '#1d4ed8', '#7c3aed', '#db2777', '#0891b2',
];

export const STATUS = {
  belum_mulai: {
    id: 'belum_mulai',
    label: 'Belum Mulai',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    hex: '#94a3b8',
  },
  dalam_proses: {
    id: 'dalam_proses',
    label: 'Dalam Proses',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    hex: '#1d4ed8',
  },
  selesai: {
    id: 'selesai',
    label: 'Selesai',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    hex: '#059669',
  },
  terhambat: {
    id: 'terhambat',
    label: 'Terhambat',
    badge: 'bg-red-100 text-red-800 border-red-200',
    hex: '#b91c1c',
  },
};

export const STATUS_LIST = Object.values(STATUS);

export const PRIORITAS = {
  rendah: { id: 'rendah', label: 'Rendah', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  sedang: { id: 'sedang', label: 'Sedang', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  tinggi: { id: 'tinggi', label: 'Tinggi', badge: 'bg-red-100 text-red-800 border-red-200' },
};

export const PRIORITAS_LIST = Object.values(PRIORITAS);

// Jenis institusi pemasyarakatan.
export const JENIS_INSTITUSI = {
  pusat: { id: 'pusat', label: 'Pusat (Direktorat Jenderal)', short: 'Pusat' },
  kanwil: { id: 'kanwil', label: 'Kantor Wilayah DJP', short: 'Kanwil' },
  balai_pemasyarakatan: { id: 'balai_pemasyarakatan', label: 'Balai Pemasyarakatan', short: 'Bapas' },
};
export const JENIS_INSTITUSI_LIST = Object.values(JENIS_INSTITUSI);

export function jenisLabel(jenis) {
  return JENIS_INSTITUSI[jenis]?.label || jenis || '—';
}

// Peran yang berhak membuat / mengubah / menghapus tugas.
export const CAN_CREATE = ['pimpinan_pusat', 'pimpinan_wilayah', 'pimpinan_kota', 'kaur_kasubsi', 'operator'];
export const CAN_MANAGE = ['pimpinan_pusat', 'pimpinan_wilayah', 'pimpinan_kota'];

export function roleLabel(role) {
  return ROLES[role]?.label || role || '—';
}

export function getDefaultRoute(role) {
  if (role === 'pimpinan_pusat') return '/pusat';
  if (role === 'pimpinan_wilayah') return '/wilayah';
  return '/kota';
}

export function canAccess(role, level) {
  const rank = ROLES[role]?.rank ?? 0;
  if (level === 'pusat') return rank >= 5;
  if (level === 'wilayah') return rank >= 4;
  if (level === 'kota') return true;
  return false;
}

// Konfigurasi dasbor per level cakupan.
export const DASHBOARD_LEVEL = {
  pusat: {
    groupKey: 'provinsi',
    groupLabel: 'Provinsi',
    groupLabelShort: 'Provinsi',
    title: 'Dasbor Kinerja Pusat',
    subtitle: 'Pantauan kinerja Pembimbingan Kemasyarakatan seluruh Indonesia.',
    emptyHint: 'Belum ada data tugas dari provinsi mana pun.',
  },
  wilayah: {
    groupKey: 'kabupaten_kota',
    groupLabel: 'Kota/Kabupaten',
    groupLabelShort: 'Kota/Kab.',
    title: 'Dasbor Kinerja Wilayah',
    subtitle: 'Kinerja Pembimbingan Kemasyarakatan tingkat provinsi.',
    emptyHint: 'Belum ada data tugas pada provinsi ini.',
  },
  kota: {
    groupKey: 'unit_kerja',
    groupLabel: 'Unit Kerja',
    groupLabelShort: 'Unit Kerja',
    title: 'Dasbor Kinerja Kota/Kabupaten',
    subtitle: 'Kinerja Pembimbingan Kemasyarakatan tingkat unit kerja.',
    emptyHint: 'Belum ada data tugas pada unit kerja ini.',
  },
};

export function formatTanggal(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function isTerlambat(tugas) {
  if (!tugas.tenggat || tugas.status === 'selesai') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(tugas.tenggat) < today;
}

export function sisaHari(tenggat) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(tenggat);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}
