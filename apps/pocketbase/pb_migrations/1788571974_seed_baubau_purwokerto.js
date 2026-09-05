/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const institusi = app.findCollectionByNameOrId("institusi");
    const tugas = app.findCollectionByNameOrId("tugas");

    // ---------- 1. Seed pengguna baru ----------
    const seedUsers = [
      // Sulawesi Tenggara
      { email: "wilayah.sultra@starpk.id", password: "WilayahSultra#2026!", name: "Kepala Kanwil DJP Sulawesi Tenggara", role: "pimpinan_wilayah", provinsi: "Sulawesi Tenggara", kabupaten_kota: "", unit_kerja: "", jabatan: "Kepala Kanwil DJP Sulawesi Tenggara", nip: "" },
      { email: "kota.baubau@starpk.id", password: "KotaBaubau#2026!", name: "Kepala Bapas Baubau", role: "pimpinan_kota", provinsi: "Sulawesi Tenggara", kabupaten_kota: "Kota Baubau", unit_kerja: "Bapas Baubau", jabatan: "Kepala Balai Pemasyarakatan Kelas II Baubau", nip: "" },
      { email: "pk.baubau1@starpk.id", password: "PKBaubau1#2026!", name: "Pembimbing Kemasyarakatan Baubau 1", role: "pembimbing", provinsi: "Sulawesi Tenggara", kabupaten_kota: "Kota Baubau", unit_kerja: "Bapas Baubau", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.baubau2@starpk.id", password: "PKBaubau2#2026!", name: "Pembimbing Kemasyarakatan Baubau 2", role: "pembimbing", provinsi: "Sulawesi Tenggara", kabupaten_kota: "Kota Baubau", unit_kerja: "Bapas Baubau", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      // Jawa Tengah — Purwokerto
      { email: "kota.purwokerto@starpk.id", password: "KotaPurwokerto#2026!", name: "Kepala Bapas Purwokerto", role: "pimpinan_kota", provinsi: "Jawa Tengah", kabupaten_kota: "Kabupaten Banyumas", unit_kerja: "Bapas Purwokerto", jabatan: "Kepala Balai Pemasyarakatan Kelas II Purwokerto", nip: "" },
      { email: "pk.purwokerto1@starpk.id", password: "PKPurwokerto1#2026!", name: "Pembimbing Kemasyarakatan Purwokerto 1", role: "pembimbing", provinsi: "Jawa Tengah", kabupaten_kota: "Kabupaten Banyumas", unit_kerja: "Bapas Purwokerto", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.purwokerto2@starpk.id", password: "PKPurwokerto2#2026!", name: "Pembimbing Kemasyarakatan Purwokerto 2", role: "pembimbing", provinsi: "Jawa Tengah", kabupaten_kota: "Kabupaten Banyumas", unit_kerja: "Bapas Purwokerto", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
    ];

    const userByEmail = {};
    for (const seed of seedUsers) {
      let record;
      try {
        record = app.findAuthRecordByEmail("users", seed.email);
      } catch (_) {
        record = new Record(users);
        record.setEmail(seed.email);
        record.setPassword(seed.password);
        record.set("name", seed.name);
        record.set("role", seed.role);
        record.set("provinsi", seed.provinsi);
        record.set("kabupaten_kota", seed.kabupaten_kota);
        record.set("unit_kerja", seed.unit_kerja);
        record.set("jabatan", seed.jabatan);
        record.set("nip", seed.nip);
        record.set("verified", true);
        app.save(record);
      }
      userByEmail[seed.email] = record;
    }

    // ---------- 2. Seed profil institusi ----------
    const buatInstitusi = (data) => {
      const existing = app.findRecordsByFilter(
        "institusi",
        "nama_kantor = {:nama}",
        "",
        1,
        0,
        { nama: data.nama_kantor },
      );
      if (existing.length > 0) return existing[0];
      const record = new Record(institusi);
      record.set("nama_kantor", data.nama_kantor);
      record.set("jenis", data.jenis);
      record.set("kelas", data.kelas || "");
      record.set("alamat", data.alamat || "");
      record.set("email", data.email || "");
      record.set("telepon", data.telepon || "");
      record.set("pimpinan", data.pimpinan || "");
      record.set("wilayah_kerja", data.wilayah_kerja || "");
      record.set("provinsi", data.provinsi || "");
      record.set("kabupaten_kota", data.kabupaten_kota || "");
      app.save(record);
      return record;
    };

    // Sulawesi Tenggara
    buatInstitusi({
      nama_kantor: "Kantor Wilayah Direktorat Jenderal Pemasyarakatan Sulawesi Tenggara",
      jenis: "kanwil",
      pimpinan: "Kepala Kanwil DJP Sulawesi Tenggara",
      wilayah_kerja: "Bapas Baubau dan balai pemasyarakatan lain di Sulawesi Tenggara",
      alamat: "Jl. Mayjen S. Parman No. 1, Kota Kendari, Sulawesi Tenggara",
      email: "kanwil.sultra@djp.go.id",
      telepon: "0401-3000000",
      provinsi: "Sulawesi Tenggara",
      kabupaten_kota: "",
    });

    buatInstitusi({
      nama_kantor: "Balai Pemasyarakatan Kelas II Baubau",
      jenis: "balai_pemasyarakatan",
      kelas: "Kelas II",
      pimpinan: "Kepala Bapas Baubau",
      wilayah_kerja: "Kota Baubau, Kabupaten Buton, Kabupaten Buton Selatan",
      alamat: "Jl. Yos Sudarso, Kota Baubau, Sulawesi Tenggara",
      email: "bapas.baubau@djp.go.id",
      telepon: "0402-3000001",
      provinsi: "Sulawesi Tenggara",
      kabupaten_kota: "Kota Baubau",
    });

    // Jawa Tengah
    buatInstitusi({
      nama_kantor: "Kantor Wilayah Direktorat Jenderal Pemasyarakatan Jawa Tengah",
      jenis: "kanwil",
      pimpinan: "Kepala Kanwil DJP Jawa Tengah",
      wilayah_kerja: "Bapas Purwokerto dan balai pemasyarakatan lain di Jawa Tengah",
      alamat: "Jl. Pemuda No. 1, Kota Semarang, Jawa Tengah",
      email: "kanwil.jateng@djp.go.id",
      telepon: "024-3000000",
      provinsi: "Jawa Tengah",
      kabupaten_kota: "",
    });

    buatInstitusi({
      nama_kantor: "Balai Pemasyarakatan Kelas II Purwokerto",
      jenis: "balai_pemasyarakatan",
      kelas: "Kelas II",
      pimpinan: "Kepala Bapas Purwokerto",
      wilayah_kerja: "Kabupaten Banyumas, Kota Purwokerto dan sekitarnya",
      alamat: "Jl. Jenderal Sudirman, Kabupaten Banyumas, Jawa Tengah",
      email: "bapas.purwokerto@djp.go.id",
      telepon: "0281-3000001",
      provinsi: "Jawa Tengah",
      kabupaten_kota: "Kabupaten Banyumas",
    });

    // ---------- 3. Seed tugas ----------
    const buatTugas = (email, data) => {
      const assignee = userByEmail[email];
      const record = new Record(tugas);
      record.set("judul", data.judul);
      record.set("deskripsi", data.deskripsi);
      record.set("provinsi", assignee.get("provinsi"));
      record.set("kabupaten_kota", assignee.get("kabupaten_kota"));
      record.set("unit_kerja", assignee.get("unit_kerja"));
      record.set("assignee", assignee.id);
      record.set("status", data.status);
      record.set("prioritas", data.prioritas);
      record.set("progres", data.progres);
      record.set("tenggat", data.tenggat);
      record.set("catatan", data.catatan || "");
      app.save(record);
    };

    // Tugas Bapas Baubau
    buatTugas("pk.baubau1@starpk.id", { judul: "Pendampingan klien pemasyarakatan Kota Baubau", deskripsi: "Pembimbingan klien pascapembebasan di wilayah Bapas Baubau.", status: "dalam_proses", prioritas: "tinggi", progres: 60, tenggat: "2026-09-21 00:00:00.000Z", catatan: "Klien kooperatif." });
    buatTugas("pk.baubau1@starpk.id", { judul: "Kunjungan rumah binaan Baubau", deskripsi: "Home visit verifikasi kondisi keluarga binaan Kota Baubau.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-04 00:00:00.000Z", catatan: "Tuntas." });
    buatTugas("pk.baubau2@starpk.id", { judul: "Konseling kelompok binaan Bapas Baubau", deskripsi: "Sesi konseling kelompok untuk binaan pemasyarakatan Baubau.", status: "terhambat", prioritas: "sedang", progres: 20, tenggat: "2026-09-13 00:00:00.000Z", catatan: "Menunggu jadwal ruangan." });
    buatTugas("pk.baubau2@starpk.id", { judul: "Penyusunan rencana pembimbingan individual Baubau", deskripsi: "Rencana pembimbingan per klien Bapas Baubau.", status: "dalam_proses", prioritas: "tinggi", progres: 45, tenggat: "2026-09-26 00:00:00.000Z", catatan: "" });
    buatTugas("pk.baubau1@starpk.id", { judul: "Rekap laporan perkembangan binaan bulanan Baubau", deskripsi: "Rekap perkembangan seluruh binaan aktif Bapas Baubau.", status: "belum_mulai", prioritas: "rendah", progres: 0, tenggat: "2026-10-03 00:00:00.000Z", catatan: "" });

    // Tugas Bapas Purwokerto
    buatTugas("pk.purwokerto1@starpk.id", { judul: "Pendampingan klien pemasyarakatan Kabupaten Banyumas", deskripsi: "Pembimbingan klien pascapembebasan di wilayah Bapas Purwokerto.", status: "dalam_proses", prioritas: "tinggi", progres: 70, tenggat: "2026-09-20 00:00:00.000Z", catatan: "Klien kooperatif." });
    buatTugas("pk.purwokerto1@starpk.id", { judul: "Kunjungan rumah binaan Purwokerto", deskripsi: "Home visit verifikasi kondisi keluarga binaan Kabupaten Banyumas.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-05 00:00:00.000Z", catatan: "Tuntas." });
    buatTugas("pk.purwokerto2@starpk.id", { judul: "Konseling kelompok binaan Bapas Purwokerto", deskripsi: "Sesi konseling kelompok untuk binaan pemasyarakatan Purwokerto.", status: "dalam_proses", prioritas: "sedang", progres: 55, tenggat: "2026-09-18 00:00:00.000Z", catatan: "" });
    buatTugas("pk.purwokerto2@starpk.id", { judul: "Verifikasi berkas klien baru Bapas Purwokerto", deskripsi: "Pemeriksaan kelengkapan berkas klien baru Purwokerto.", status: "dalam_proses", prioritas: "tinggi", progres: 80, tenggat: "2026-09-15 00:00:00.000Z", catatan: "" });
    buatTugas("pk.purwokerto1@starpk.id", { judul: "Rekap laporan perkembangan binaan bulanan Purwokerto", deskripsi: "Rekap perkembangan seluruh binaan aktif Bapas Purwokerto.", status: "belum_mulai", prioritas: "rendah", progres: 0, tenggat: "2026-10-04 00:00:00.000Z", catatan: "" });
  },
  (app) => {
    // Hapus institusi yang di-seed migrasi ini
    const namaInstitusi = [
      "Kantor Wilayah Direktorat Jenderal Pemasyarakatan Sulawesi Tenggara",
      "Balai Pemasyarakatan Kelas II Baubau",
      "Kantor Wilayah Direktorat Jenderal Pemasyarakatan Jawa Tengah",
      "Balai Pemasyarakatan Kelas II Purwokerto",
    ];
    for (const nama of namaInstitusi) {
      try {
        const records = app.findRecordsByFilter("institusi", "nama_kantor = {:nama}", "", 1, 0, { nama });
        for (const r of records) app.delete(r);
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }

    // Hapus pengguna yang di-seed migrasi ini
    const emails = [
      "wilayah.sultra@starpk.id", "kota.baubau@starpk.id",
      "pk.baubau1@starpk.id", "pk.baubau2@starpk.id",
      "kota.purwokerto@starpk.id", "pk.purwokerto1@starpk.id", "pk.purwokerto2@starpk.id",
    ];
    for (const email of emails) {
      try {
        app.delete(app.findAuthRecordByEmail("users", email));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
  },
);
