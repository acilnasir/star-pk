CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'pembimbing',
  provinsi text NOT NULL DEFAULT '',
  kabupaten_kota text NOT NULL DEFAULT '',
  unit_kerja text NOT NULL DEFAULT '',
  jabatan text NOT NULL DEFAULT '',
  nip text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institusi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kantor text NOT NULL,
  jenis text NOT NULL CHECK (jenis IN ('pusat', 'kanwil', 'balai_pemasyarakatan')),
  kelas text NOT NULL DEFAULT '',
  alamat text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telepon text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  pimpinan text NOT NULL DEFAULT '',
  wilayah_kerja text NOT NULL DEFAULT '',
  provinsi text NOT NULL DEFAULT '',
  kabupaten_kota text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tugas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  deskripsi text NOT NULL DEFAULT '',
  provinsi text NOT NULL DEFAULT '',
  kabupaten_kota text NOT NULL DEFAULT '',
  unit_kerja text NOT NULL DEFAULT '',
  assignee uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  prioritas text NOT NULL DEFAULT 'sedang' CHECK (prioritas IN ('rendah', 'sedang', 'tinggi')),
  status text NOT NULL DEFAULT 'belum_mulai' CHECK (status IN ('belum_mulai', 'dalam_proses', 'selesai', 'terhambat')),
  progres integer NOT NULL DEFAULT 0 CHECK (progres BETWEEN 0 AND 100),
  tenggat timestamptz,
  catatan text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_scope ON users (role, provinsi, kabupaten_kota, unit_kerja);
CREATE INDEX IF NOT EXISTS idx_tugas_scope ON tugas (provinsi, kabupaten_kota, unit_kerja);
CREATE INDEX IF NOT EXISTS idx_tugas_assignee ON tugas (assignee);
CREATE INDEX IF NOT EXISTS idx_institusi_scope ON institusi (jenis, provinsi, kabupaten_kota);
