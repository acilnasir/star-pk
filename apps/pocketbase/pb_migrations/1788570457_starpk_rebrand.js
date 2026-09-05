/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // ---------- 1. Hapus seed lama (SIMANTAU) ----------
    // Hapus seluruh tugas lama TERLEBIH DAHULU agar tidak menahan
    // referensi pada pengguna lama yang akan dihapus.
    const tugasLama = app.findRecordsByFilter("tugas", "id != ''", "", 1000, 0);
    for (const r of tugasLama) {
      app.delete(r);
    }

    const emailLama = [
      "pimpinan@simantau.id",
      "kaurtu@simantau.id",
      "bkd@simantau.id",
      "bka@simantau.id",
    ];
    for (const email of emailLama) {
      try {
        app.delete(app.findAuthRecordByEmail("users", email));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }

    // ---------- 2. Skema users ----------
    const users = app.findCollectionByNameOrId("users");

    const roleField = users.fields.getByName("role");
    if (roleField) {
      roleField.values = [
        "pimpinan_pusat",
        "pimpinan_wilayah",
        "pimpinan_kota",
        "kaur_kasubsi",
        "operator",
        "pembimbing",
      ];
    }

    if (users.fields.getByName("unit")) {
      users.fields.removeByName("unit");
    }
    if (!users.fields.getByName("provinsi")) {
      users.fields.add(new TextField({ name: "provinsi", max: 100 }));
    }
    if (!users.fields.getByName("kabupaten_kota")) {
      users.fields.add(new TextField({ name: "kabupaten_kota", max: 100 }));
    }
    if (!users.fields.getByName("unit_kerja")) {
      users.fields.add(new TextField({ name: "unit_kerja", max: 150 }));
    }
    if (!users.fields.getByName("jabatan")) {
      users.fields.add(new TextField({ name: "jabatan", max: 150 }));
    }
    if (!users.fields.getByName("nip")) {
      users.fields.add(new TextField({ name: "nip", max: 30 }));
    }

    // Buka pendaftaran supaya setiap level bisa membuat profil sendiri.
    users.listRule = "@request.auth.id != ''";
    users.viewRule = "@request.auth.id != ''";
    users.createRule = "";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = null;

    app.save(users);

    // ---------- 3. Skema tugas ----------
    const tugas = app.findCollectionByNameOrId("tugas");

    if (tugas.fields.getByName("unit")) {
      tugas.fields.removeByName("unit");
    }
    if (!tugas.fields.getByName("provinsi")) {
      tugas.fields.add(new TextField({ name: "provinsi", max: 100 }));
    }
    if (!tugas.fields.getByName("kabupaten_kota")) {
      tugas.fields.add(new TextField({ name: "kabupaten_kota", max: 100 }));
    }
    if (!tugas.fields.getByName("unit_kerja")) {
      tugas.fields.add(new TextField({ name: "unit_kerja", max: 150 }));
    }

    // Aturan akses berjenjang: pusat > wilayah > kota > unit kerja > pembimbing.
    const lihat =
      "@request.auth.role = 'pimpinan_pusat' || " +
      "(@request.auth.role = 'pimpinan_wilayah' && provinsi = @request.auth.provinsi) || " +
      "(@request.auth.role = 'pimpinan_kota' && kabupaten_kota = @request.auth.kabupaten_kota) || " +
      "((@request.auth.role = 'kaur_kasubsi' || @request.auth.role = 'operator') && unit_kerja = @request.auth.unit_kerja) || " +
      "@request.auth.id = assignee";
    tugas.listRule = lihat;
    tugas.viewRule = lihat;
    tugas.createRule =
      "@request.auth.role = 'pimpinan_pusat' || @request.auth.role = 'pimpinan_wilayah' || @request.auth.role = 'pimpinan_kota' || @request.auth.role = 'kaur_kasubsi' || @request.auth.role = 'operator'";
    tugas.updateRule = lihat;
    tugas.deleteRule =
      "@request.auth.role = 'pimpinan_pusat' || @request.auth.role = 'pimpinan_wilayah' || @request.auth.role = 'pimpinan_kota'";

    tugas.indexes = tugas.indexes
      .filter((i) => !i.includes("idx_tugas_unit"))
      .concat([
        "CREATE INDEX idx_tugas_provinsi ON tugas (provinsi)",
        "CREATE INDEX idx_tugas_kabupaten ON tugas (kabupaten_kota)",
      ]);

    app.save(tugas);

    // ---------- 4. Seed pengguna STAR-PK ----------
    const seeds = [
      { email: "pusat@starpk.id", password: "Pusat#2026!StarPK", name: "Pimpinan Pusat", role: "pimpinan_pusat", provinsi: "", kabupaten_kota: "", unit_kerja: "", jabatan: "Kepala Pusat Pembimbingan Kemasyarakatan", nip: "" },
      { email: "wilayah.jabar@starpk.id", password: "WilayahJabar#2026!", name: "Pimpinan Wilayah Jawa Barat", role: "pimpinan_wilayah", provinsi: "Jawa Barat", kabupaten_kota: "", unit_kerja: "", jabatan: "Kepala Kanwil Jawa Barat", nip: "" },
      { email: "wilayah.jateng@starpk.id", password: "WilayahJateng#2026!", name: "Pimpinan Wilayah Jawa Tengah", role: "pimpinan_wilayah", provinsi: "Jawa Tengah", kabupaten_kota: "", unit_kerja: "", jabatan: "Kepala Kanwil Jawa Tengah", nip: "" },
      { email: "kota.bandung@starpk.id", password: "KotaBandung#2026!", name: "Pimpinan Kota Bandung", role: "pimpinan_kota", provinsi: "Jawa Barat", kabupaten_kota: "Kota Bandung", unit_kerja: "UPT PK Kota Bandung", jabatan: "Kepala UPT PK Kota Bandung", nip: "" },
      { email: "kota.semarang@starpk.id", password: "KotaSemarang#2026!", name: "Pimpinan Kota Semarang", role: "pimpinan_kota", provinsi: "Jawa Tengah", kabupaten_kota: "Kota Semarang", unit_kerja: "UPT PK Kota Semarang", jabatan: "Kepala UPT PK Kota Semarang", nip: "" },
      { email: "kaur.bandung@starpk.id", password: "KaurBandung#2026!", name: "Kaur Tata Usaha Bandung", role: "kaur_kasubsi", provinsi: "Jawa Barat", kabupaten_kota: "Kota Bandung", unit_kerja: "UPT PK Kota Bandung", jabatan: "Kaur Tata Usaha", nip: "" },
      { email: "op.bandung@starpk.id", password: "OperatorBandung#2026", name: "Operator Bandung", role: "operator", provinsi: "Jawa Barat", kabupaten_kota: "Kota Bandung", unit_kerja: "UPT PK Kota Bandung", jabatan: "Operator", nip: "" },
      { email: "pk.bandung@starpk.id", password: "PKBandung#2026!", name: "Pembimbing Kemasyarakatan Bandung", role: "pembimbing", provinsi: "Jawa Barat", kabupaten_kota: "Kota Bandung", unit_kerja: "UPT PK Kota Bandung", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.bekasi@starpk.id", password: "PKBekasi#2026!", name: "Pembimbing Kemasyarakatan Bekasi", role: "pembimbing", provinsi: "Jawa Barat", kabupaten_kota: "Kota Bekasi", unit_kerja: "UPT PK Kota Bekasi", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.depok@starpk.id", password: "PKDepok#2026!", name: "Pembimbing Kemasyarakatan Depok", role: "pembimbing", provinsi: "Jawa Barat", kabupaten_kota: "Kota Depok", unit_kerja: "UPT PK Kota Depok", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.semarang@starpk.id", password: "PKSemarang#2026!", name: "Pembimbing Kemasyarakatan Semarang", role: "pembimbing", provinsi: "Jawa Tengah", kabupaten_kota: "Kota Semarang", unit_kerja: "UPT PK Kota Semarang", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
    ];

    const userByEmail = {};
    for (const seed of seeds) {
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

    // ---------- 5. Seed tugas Pembimbingan Kemasyarakatan ----------
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

    buatTugas("pk.bandung@starpk.id", { judul: "Pendampingan klien pemasyarakatan kasus pidana umum", deskripsi: "Pendampingan dan pembinaan klien pemasyarakatan pascapembebasan.", status: "dalam_proses", prioritas: "tinggi", progres: 60, tenggat: "2026-09-15 00:00:00.000Z", catatan: "Klien kooperatif, perkembangan positif." });
    buatTugas("pk.bandung@starpk.id", { judul: "Kunjungan rumah ke binaan pemasyarakatan", deskripsi: "Home visit untuk memverifikasi kondisi keluarga binaan.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-02 00:00:00.000Z", catatan: "Kunjungan tuntas, laporan terlampir." });
    buatTugas("pk.bandung@starpk.id", { judul: "Penyusunan laporan perkembangan binaan bulanan", deskripsi: "Rekap perkembangan seluruh binaan aktif bulan berjalan.", status: "dalam_proses", prioritas: "tinggi", progres: 45, tenggat: "2026-09-20 00:00:00.000Z", catatan: "" });
    buatTugas("pk.bandung@starpk.id", { judul: "Pelaksanaan konseling kelompok binaan", deskripsi: "Sesi konseling kelompok untuk binaan pemasyarakatan.", status: "terhambat", prioritas: "sedang", progres: 30, tenggat: "2026-09-08 00:00:00.000Z", catatan: "Menunggu jadwal ruangan." });
    buatTugas("pk.bekasi@starpk.id", { judul: "Verifikasi berkas klien pemasyarakatan baru", deskripsi: "Pemeriksaan kelengkapan berkas klien baru.", status: "dalam_proses", prioritas: "tinggi", progres: 80, tenggat: "2026-09-12 00:00:00.000Z", catatan: "" });
    buatTugas("pk.bekasi@starpk.id", { judul: "Koordinasi dengan keluarga binaan", deskripsi: "Pertemuan dengan keluarga untuk dukungan pembimbingan.", status: "belum_mulai", prioritas: "rendah", progres: 0, tenggat: "2026-09-25 00:00:00.000Z", catatan: "" });
    buatTugas("pk.bekasi@starpk.id", { judul: "Penyusunan rencana pembimbingan individual", deskripsi: "Rencana pembimbingan disesuaikan untuk setiap klien.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-08-30 00:00:00.000Z", catatan: "Rencana disetujui pimpinan." });
    buatTugas("pk.depok@starpk.id", { judul: "Pendampingan klien pemasyarakatan kasus narkotika", deskripsi: "Pembimbingan klien kasus narkotika pascapembebasan.", status: "dalam_proses", prioritas: "tinggi", progres: 70, tenggat: "2026-09-18 00:00:00.000Z", catatan: "" });
    buatTugas("pk.depok@starpk.id", { judul: "Kunjungan kerja ke tempat kerja binaan", deskripsi: "Verifikasi penempatan kerja binaan.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-05 00:00:00.000Z", catatan: "" });
    buatTugas("pk.semarang@starpk.id", { judul: "Pendampingan klien anak konflik dengan hukum", deskripsi: "Pembimbingan klien anak yang berhadapan dengan hukum.", status: "dalam_proses", prioritas: "tinggi", progres: 50, tenggat: "2026-09-22 00:00:00.000Z", catatan: "" });
    buatTugas("pk.semarang@starpk.id", { judul: "Evaluasi perkembangan binaan triwulan III", deskripsi: "Evaluasi capaian pembimbingan triwulan III.", status: "terhambat", prioritas: "tinggi", progres: 40, tenggat: "2026-09-10 00:00:00.000Z", catatan: "Data dari dua klien belum lengkap." });
    buatTugas("pk.semarang@starpk.id", { judul: "Pelaksanaan penyuluhan hukum masyarakat", deskripsi: "Penyuluhan hukum kepada masyarakat terkait pemasyarakatan.", status: "belum_mulai", prioritas: "rendah", progres: 0, tenggat: "2026-10-05 00:00:00.000Z", catatan: "" });
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const roleField = users.fields.getByName("role");
    if (roleField) roleField.values = ["pimpinan", "staf"];
    for (const f of ["provinsi", "kabupaten_kota", "unit_kerja", "jabatan", "nip"]) {
      if (users.fields.getByName(f)) users.fields.removeByName(f);
    }
    users.createRule = null;
    app.save(users);

    const tugas = app.findCollectionByNameOrId("tugas");
    for (const f of ["provinsi", "kabupaten_kota", "unit_kerja"]) {
      if (tugas.fields.getByName(f)) tugas.fields.removeByName(f);
    }
    app.save(tugas);

    const emailBaru = [
      "pusat@starpk.id", "wilayah.jabar@starpk.id", "wilayah.jateng@starpk.id",
      "kota.bandung@starpk.id", "kota.semarang@starpk.id", "kaur.bandung@starpk.id",
      "op.bandung@starpk.id", "pk.bandung@starpk.id", "pk.bekasi@starpk.id",
      "pk.depok@starpk.id", "pk.semarang@starpk.id",
    ];
    for (const email of emailBaru) {
      try {
        app.delete(app.findAuthRecordByEmail("users", email));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
    const tugasLama = app.findRecordsByFilter("tugas", "id != ''", "", 1000, 0);
    for (const r of tugasLama) app.delete(r);
  },
);
