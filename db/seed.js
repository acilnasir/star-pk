import { sql } from '../api/_lib/db.js';
import { hashPassword } from '../api/_lib/auth.js';

const users = [
  ['pusat@starpk.id', 'Pusat#2026!StarPK', 'Pimpinan Pusat', 'pimpinan_pusat', '', '', '', 'Kepala Pusat Pembimbingan Kemasyarakatan'],
  ['wilayah.jabar@starpk.id', 'WilayahJabar#2026!', 'Pimpinan Wilayah Jawa Barat', 'pimpinan_wilayah', 'Jawa Barat', '', '', 'Kepala Kanwil Jawa Barat'],
  ['wilayah.jateng@starpk.id', 'WilayahJateng#2026!', 'Pimpinan Wilayah Jawa Tengah', 'pimpinan_wilayah', 'Jawa Tengah', '', '', 'Kepala Kanwil Jawa Tengah'],
  ['kota.bandung@starpk.id', 'KotaBandung#2026!', 'Pimpinan Kota Bandung', 'pimpinan_kota', 'Jawa Barat', 'Kota Bandung', 'UPT PK Kota Bandung', 'Kepala UPT PK Kota Bandung'],
  ['kota.semarang@starpk.id', 'KotaSemarang#2026!', 'Pimpinan Kota Semarang', 'pimpinan_kota', 'Jawa Tengah', 'Kota Semarang', 'UPT PK Kota Semarang', 'Kepala UPT PK Kota Semarang'],
  ['kaur.bandung@starpk.id', 'KaurBandung#2026!', 'Kaur Tata Usaha Bandung', 'kaur_kasubsi', 'Jawa Barat', 'Kota Bandung', 'UPT PK Kota Bandung', 'Kaur Tata Usaha'],
  ['op.bandung@starpk.id', 'OperatorBandung#2026', 'Operator Bandung', 'operator', 'Jawa Barat', 'Kota Bandung', 'UPT PK Kota Bandung', 'Operator'],
  ['pk.bandung@starpk.id', 'PKBandung#2026!', 'Pembimbing Kemasyarakatan Bandung', 'pembimbing', 'Jawa Barat', 'Kota Bandung', 'UPT PK Kota Bandung', 'Pembimbing Kemasyarakatan'],
  ['pk.bekasi@starpk.id', 'PKBekasi#2026!', 'Pembimbing Kemasyarakatan Bekasi', 'pembimbing', 'Jawa Barat', 'Kota Bekasi', 'UPT PK Kota Bekasi', 'Pembimbing Kemasyarakatan'],
  ['pk.depok@starpk.id', 'PKDepok#2026!', 'Pembimbing Kemasyarakatan Depok', 'pembimbing', 'Jawa Barat', 'Kota Depok', 'UPT PK Kota Depok', 'Pembimbing Kemasyarakatan'],
  ['pk.semarang@starpk.id', 'PKSemarang#2026!', 'Pembimbing Kemasyarakatan Semarang', 'pembimbing', 'Jawa Tengah', 'Kota Semarang', 'UPT PK Kota Semarang', 'Pembimbing Kemasyarakatan'],
];

for (const [email, password, name, role, provinsi, kabupaten, unit, jabatan] of users) {
  await sql`INSERT INTO users (email, password_hash, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan) VALUES (${email}, ${hashPassword(password)}, ${name}, ${role}, ${provinsi}, ${kabupaten}, ${unit}, ${jabatan}) ON CONFLICT (email) DO NOTHING`;
}

const institutions = [
  ['Direktorat Jenderal Pemasyarakatan', 'pusat', 'Direktur Jenderal Pemasyarakatan', '', ''],
  ['Kantor Wilayah Direktorat Jenderal Pemasyarakatan Jawa Barat', 'kanwil', 'Kepala Kanwil Jawa Barat', 'Jawa Barat', ''],
  ['Balai Pemasyarakatan Kelas II Bandung', 'balai_pemasyarakatan', 'Kepala UPT PK Kota Bandung', 'Jawa Barat', 'Kota Bandung'],
  ['Balai Pemasyarakatan Kelas II Semarang', 'balai_pemasyarakatan', 'Kepala UPT PK Kota Semarang', 'Jawa Tengah', 'Kota Semarang'],
];

for (const [nama, jenis, pimpinan, provinsi, kabupaten] of institutions) {
  await sql`INSERT INTO institusi (nama_kantor, jenis, pimpinan, provinsi, kabupaten_kota) SELECT ${nama}, ${jenis}, ${pimpinan}, ${provinsi}, ${kabupaten} WHERE NOT EXISTS (SELECT 1 FROM institusi WHERE nama_kantor=${nama})`;
}

console.log(`Seeded ${users.length} users and ${institutions.length} institutions.`);
