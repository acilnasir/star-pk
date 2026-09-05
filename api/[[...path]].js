import { sql } from './_lib/db.js';
import {
  clearSession,
  currentUser,
  hashPassword,
  setSession,
  verifyPassword,
} from './_lib/auth.js';

const json = (response, status, data) => response.status(status).json(data);
const publicUser = (user) => user && ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provinsi: user.provinsi,
  kabupaten_kota: user.kabupaten_kota,
  unit_kerja: user.unit_kerja,
  jabatan: user.jabatan,
  nip: user.nip,
});

function allowed(user, resource, row) {
  if (user.role === 'pimpinan_pusat') return true;
  if (resource === 'users') return user.id === row.id || ['pimpinan_wilayah', 'pimpinan_kota'].includes(user.role);
  if (resource === 'institusi') {
    return row.jenis === 'pusat' ||
      (user.role === 'pimpinan_wilayah' && row.provinsi === user.provinsi) ||
      (user.role === 'pimpinan_kota' && (row.kabupaten_kota === user.kabupaten_kota || (row.jenis === 'kanwil' && row.provinsi === user.provinsi))) ||
      (['kaur_kasubsi', 'operator', 'pembimbing'].includes(user.role) && row.kabupaten_kota === user.kabupaten_kota);
  }
  if (resource === 'tugas') {
    return (user.role === 'pimpinan_wilayah' && row.provinsi === user.provinsi) ||
      (user.role === 'pimpinan_kota' && row.kabupaten_kota === user.kabupaten_kota) ||
      (['kaur_kasubsi', 'operator'].includes(user.role) && row.unit_kerja === user.unit_kerja) ||
      row.assignee === user.id;
  }
  return false;
}

function mapTask(row) {
  return {
    ...row,
    tenggat: row.tenggat?.toISOString?.() || row.tenggat,
    expand: { assignee: row.assignee_record ? publicUser(row.assignee_record) : undefined },
  };
}

function mapInstitution(row) {
  return { ...row, logo: row.logo_url || '' };
}

async function body(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  const text = await new Promise((resolve, reject) => {
    let value = '';
    request.on('data', (chunk) => { value += chunk; });
    request.on('end', () => resolve(value));
    request.on('error', reject);
  });
  return text ? JSON.parse(text) : {};
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'OPTIONS') return response.status(204).end();

  const path = new URL(request.url, 'http://localhost').pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const resource = path[0];
  const id = path[1];

  try {
    if (resource === 'auth' && path[1] === 'login' && request.method === 'POST') {
      const { email, password } = await body(request);
      const rows = await sql`SELECT * FROM users WHERE lower(email) = lower(${String(email || '').trim()}) LIMIT 1`;
      if (!rows[0] || !verifyPassword(password || '', rows[0].password_hash)) return json(response, 401, { message: 'Email atau password salah.' });
      setSession(response, rows[0].id);
      return json(response, 200, { user: publicUser(rows[0]) });
    }

    if (resource === 'auth' && path[1] === 'signup' && request.method === 'POST') {
      const data = await body(request);
      if (!data.email || !data.password || data.password.length < 10) return json(response, 400, { message: 'Email dan password minimal 10 karakter wajib diisi.' });
      const rows = await sql`INSERT INTO users (email, password_hash, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan, nip) VALUES (${data.email.toLowerCase().trim()}, ${hashPassword(data.password)}, ${data.name || ''}, ${data.role || 'pembimbing'}, ${data.provinsi || ''}, ${data.kabupaten_kota || ''}, ${data.unit_kerja || ''}, ${data.jabatan || ''}, ${data.nip || ''}) RETURNING id, email, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan, nip`;
      setSession(response, rows[0].id);
      return json(response, 201, { user: publicUser(rows[0]) });
    }

    if (resource === 'auth' && path[1] === 'me' && request.method === 'GET') return json(response, 200, { user: await currentUser(request) });
    if (resource === 'auth' && path[1] === 'logout' && request.method === 'POST') { clearSession(response); return json(response, 200, { ok: true }); }

    const user = await currentUser(request);
    if (!user) return json(response, 401, { message: 'Anda harus login.' });

    if (resource === 'users' && request.method === 'GET') {
      const rows = await sql`SELECT id, email, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan, nip FROM users ORDER BY name, email`;
      return json(response, 200, rows.filter((row) => allowed(user, 'users', row)));
    }

    if (resource === 'users' && id && request.method === 'PATCH') {
      if (id !== user.id) return json(response, 403, { message: 'Tidak diizinkan.' });
      const data = await body(request);
      const rows = await sql`UPDATE users SET name=${data.name || ''}, provinsi=${data.provinsi || ''}, kabupaten_kota=${data.kabupaten_kota || ''}, unit_kerja=${data.unit_kerja || ''}, jabatan=${data.jabatan || ''}, nip=${data.nip || ''}, updated_at=now() WHERE id=${id} RETURNING id, email, name, role, provinsi, kabupaten_kota, unit_kerja, jabatan, nip`;
      return json(response, 200, publicUser(rows[0]));
    }

    if (resource === 'tugas' && request.method === 'GET') {
      const rows = await sql`SELECT t.*, json_build_object('id', u.id, 'email', u.email, 'name', u.name, 'role', u.role, 'provinsi', u.provinsi, 'kabupaten_kota', u.kabupaten_kota, 'unit_kerja', u.unit_kerja) AS assignee_record FROM tugas t JOIN users u ON u.id=t.assignee ORDER BY t.updated_at DESC`;
      return json(response, 200, rows.filter((row) => allowed(user, 'tugas', row)).map(mapTask));
    }

    if (resource === 'tugas' && request.method === 'POST') {
      if (!['pimpinan_pusat', 'pimpinan_wilayah', 'pimpinan_kota', 'kaur_kasubsi', 'operator'].includes(user.role)) return json(response, 403, { message: 'Tidak diizinkan.' });
      const data = await body(request);
      const rows = await sql`INSERT INTO tugas (judul, deskripsi, provinsi, kabupaten_kota, unit_kerja, assignee, prioritas, status, progres, tenggat, catatan) VALUES (${data.judul}, ${data.deskripsi || ''}, ${data.provinsi || ''}, ${data.kabupaten_kota || ''}, ${data.unit_kerja || ''}, ${data.assignee}, ${data.prioritas || 'sedang'}, ${data.status || 'belum_mulai'}, ${Number(data.progres) || 0}, ${data.tenggat || null}, ${data.catatan || ''}) RETURNING *`;
      return json(response, 201, mapTask(rows[0]));
    }

    if (resource === 'tugas' && id && ['PATCH', 'DELETE'].includes(request.method)) {
      const found = await sql`SELECT * FROM tugas WHERE id=${id}`;
      if (!found[0] || !allowed(user, 'tugas', found[0])) return json(response, 403, { message: 'Tidak diizinkan.' });
      if (request.method === 'DELETE') { await sql`DELETE FROM tugas WHERE id=${id}`; return json(response, 200, { ok: true }); }
      const data = await body(request);
      const rows = await sql`UPDATE tugas SET judul=COALESCE(${data.judul}, judul), deskripsi=COALESCE(${data.deskripsi}, deskripsi), provinsi=COALESCE(${data.provinsi}, provinsi), kabupaten_kota=COALESCE(${data.kabupaten_kota}, kabupaten_kota), unit_kerja=COALESCE(${data.unit_kerja}, unit_kerja), assignee=COALESCE(${data.assignee}, assignee), prioritas=COALESCE(${data.prioritas}, prioritas), status=COALESCE(${data.status}, status), progres=COALESCE(${data.progres}, progres), tenggat=COALESCE(${data.tenggat}, tenggat), catatan=COALESCE(${data.catatan}, catatan), updated_at=now() WHERE id=${id} RETURNING *`;
      return json(response, 200, mapTask(rows[0]));
    }

    if (resource === 'institusi' && request.method === 'GET') {
      const rows = await sql`SELECT * FROM institusi ORDER BY nama_kantor`;
      return json(response, 200, rows.filter((row) => allowed(user, 'institusi', row)).map(mapInstitution));
    }

    if (resource === 'institusi' && request.method === 'POST') {
      if (!['pimpinan_pusat', 'pimpinan_wilayah', 'pimpinan_kota'].includes(user.role)) return json(response, 403, { message: 'Tidak diizinkan.' });
      const data = await body(request);
      const rows = await sql`INSERT INTO institusi (nama_kantor, jenis, kelas, alamat, email, telepon, pimpinan, wilayah_kerja, provinsi, kabupaten_kota) VALUES (${data.nama_kantor}, ${data.jenis}, ${data.kelas || ''}, ${data.alamat || ''}, ${data.email || ''}, ${data.telepon || ''}, ${data.pimpinan || ''}, ${data.wilayah_kerja || ''}, ${data.provinsi || ''}, ${data.kabupaten_kota || ''}) RETURNING *`;
      return json(response, 201, mapInstitution(rows[0]));
    }

    if (resource === 'institusi' && id && request.method === 'PATCH') {
      const found = await sql`SELECT * FROM institusi WHERE id=${id}`;
      if (!found[0] || !allowed(user, 'institusi', found[0]) || !['pimpinan_pusat', 'pimpinan_wilayah', 'pimpinan_kota'].includes(user.role)) return json(response, 403, { message: 'Tidak diizinkan.' });
      const data = await body(request);
      const rows = await sql`UPDATE institusi SET nama_kantor=${data.nama_kantor || ''}, jenis=${data.jenis}, kelas=${data.kelas || ''}, alamat=${data.alamat || ''}, email=${data.email || ''}, telepon=${data.telepon || ''}, pimpinan=${data.pimpinan || ''}, wilayah_kerja=${data.wilayah_kerja || ''}, provinsi=${data.provinsi || ''}, kabupaten_kota=${data.kabupaten_kota || ''}, updated_at=now() WHERE id=${id} RETURNING *`;
      return json(response, 200, mapInstitution(rows[0]));
    }

    return json(response, 404, { message: 'Endpoint tidak ditemukan.' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { message: 'Terjadi kesalahan server.' });
  }
}
