/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // ---------- 1. Skema institusi ----------
    let institusi;
    try {
      institusi = app.findCollectionByNameOrId("institusi");
    } catch (_) {
      institusi = new Collection({
        type: "base",
        name: "institusi",
        // Aturan akses berjenjang berdasarkan lokasi & peran.
        // Pusat: lihat semua. Kanwil: lihat institusi di provinsinya.
        // Kota/Kab.: lihat Bapas di wilayahnya + Kanwil induk provinsinya.
        // Staf/PK: lihat Bapas di kota/kab. tempat mereka bertugas.
        // Semua yang teregistrasi boleh melihat profil institusi pusat.
        listRule:
          "@request.auth.id != '' && (" +
          "@request.auth.role = 'pimpinan_pusat' || " +
          "jenis = 'pusat' || " +
          "(@request.auth.role = 'pimpinan_wilayah' && provinsi = @request.auth.provinsi) || " +
          "(@request.auth.role = 'pimpinan_kota' && (kabupaten_kota = @request.auth.kabupaten_kota || (jenis = 'kanwil' && provinsi = @request.auth.provinsi))) || " +
          "((@request.auth.role = 'kaur_kasubsi' || @request.auth.role = 'operator' || @request.auth.role = 'pembimbing') && kabupaten_kota = @request.auth.kabupaten_kota)" +
          ")",
        viewRule:
          "@request.auth.id != '' && (" +
          "@request.auth.role = 'pimpinan_pusat' || " +
          "jenis = 'pusat' || " +
          "(@request.auth.role = 'pimpinan_wilayah' && provinsi = @request.auth.provinsi) || " +
          "(@request.auth.role = 'pimpinan_kota' && (kabupaten_kota = @request.auth.kabupaten_kota || (jenis = 'kanwil' && provinsi = @request.auth.provinsi))) || " +
          "((@request.auth.role = 'kaur_kasubsi' || @request.auth.role = 'operator' || @request.auth.role = 'pembimbing') && kabupaten_kota = @request.auth.kabupaten_kota)" +
          ")",
        createRule:
          "@request.auth.role = 'pimpinan_pusat' || @request.auth.role = 'pimpinan_wilayah' || @request.auth.role = 'pimpinan_kota'",
        updateRule:
          "@request.auth.role = 'pimpinan_pusat' || " +
          "(@request.auth.role = 'pimpinan_wilayah' && provinsi = @request.auth.provinsi) || " +
          "(@request.auth.role = 'pimpinan_kota' && kabupaten_kota = @request.auth.kabupaten_kota)",
        deleteRule: "@request.auth.role = 'pimpinan_pusat'",
        fields: [
          { name: "nama_kantor", type: "text", required: true, max: 200 },
          {
            name: "jenis",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["pusat", "kanwil", "balai_pemasyarakatan"],
          },
          { name: "kelas", type: "text", max: 50 },
          { name: "alamat", type: "text", max: 500 },
          { name: "email", type: "email" },
          { name: "telepon", type: "text", max: 30 },
          {
            name: "logo",
            type: "file",
            maxSelect: 1,
            maxSize: 2097152,
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
          },
          { name: "pimpinan", type: "text", max: 200 },
          { name: "wilayah_kerja", type: "text", max: 500 },
          { name: "provinsi", type: "text", max: 100 },
          { name: "kabupaten_kota", type: "text", max: 100 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_institusi_jenis ON institusi (jenis)",
          "CREATE INDEX idx_institusi_provinsi ON institusi (provinsi)",
          "CREATE INDEX idx_institusi_kabupaten ON institusi (kabupaten_kota)",
        ],
      });
      app.save(institusi);
    }

    institusi = app.findCollectionByNameOrId("institusi");

    // ---------- 2. Seed pengguna Banten ----------
    const seedUsers = [
      { email: "wilayah.banten@starpk.id", password: "WilayahBanten#2026!", name: "Kepala Kanwil DJP Banten", role: "pimpinan_wilayah", provinsi: "Banten", kabupaten_kota: "", unit_kerja: "", jabatan: "Kepala Kanwil DJP Banten", nip: "" },
      { email: "kota.ciangir@starpk.id", password: "KotaCiangir#2026!", name: "Kepala Bapas Ciangir", role: "pimpinan_kota", provinsi: "Banten", kabupaten_kota: "Kabupaten Tangerang", unit_kerja: "Bapas Ciangir", jabatan: "Kepala Balai Pemasyarakatan Kelas II Ciangir", nip: "" },
      { email: "kota.serang@starpk.id", password: "KotaSerang#2026!", name: "Kepala Bapas Serang", role: "pimpinan_kota", provinsi: "Banten", kabupaten_kota: "Kota Serang", unit_kerja: "Bapas Serang", jabatan: "Kepala Balai Pemasyarakatan Serang", nip: "" },
      { email: "kota.tangerang@starpk.id", password: "KotaTangerang#2026!", name: "Kepala Bapas Tangerang", role: "pimpinan_kota", provinsi: "Banten", kabupaten_kota: "Kota Tangerang", unit_kerja: "Bapas Tangerang", jabatan: "Kepala Balai Pemasyarakatan Tangerang", nip: "" },
      { email: "pk.ciangir1@starpk.id", password: "PKCiangir1#2026!", name: "Pembimbing Kemasyarakatan Ciangir 1", role: "pembimbing", provinsi: "Banten", kabupaten_kota: "Kabupaten Tangerang", unit_kerja: "Bapas Ciangir", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.ciangir2@starpk.id", password: "PKCiangir2#2026!", name: "Pembimbing Kemasyarakatan Ciangir 2", role: "pembimbing", provinsi: "Banten", kabupaten_kota: "Kabupaten Tangerang", unit_kerja: "Bapas Ciangir", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.serang1@starpk.id", password: "PKSerang1#2026!", name: "Pembimbing Kemasyarakatan Serang 1", role: "pembimbing", provinsi: "Banten", kabupaten_kota: "Kota Serang", unit_kerja: "Bapas Serang", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
      { email: "pk.tangerang1@starpk.id", password: "PKTangerang1#2026!", name: "Pembimbing Kemasyarakatan Tangerang 1", role: "pembimbing", provinsi: "Banten", kabupaten_kota: "Kota Tangerang", unit_kerja: "Bapas Tangerang", jabatan: "Pembimbing Kemasyarakatan", nip: "" },
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

    // ---------- 3. Seed profil institusi ----------
    const buatInstitusi = (data) => {
      // Hindari duplikasi berdasarkan nama_kantor.
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

    buatInstitusi({
      nama_kantor: "Direktorat Jenderal Pemasyarakatan",
      jenis: "pusat",
      pimpinan: "Direktur Jenderal Pemasyarakatan",
      wilayah_kerja: "Seluruh Indonesia — membawahi 33 Kanwil DJP & 94 Balai Pemasyarakatan",
      alamat: "Jl. Kramat Raya No. 11, Jakarta Pusat",
      email: "ditjen.pemasyarakatan@kemenimip.go.id",
      telepon: "021-3140000",
      provinsi: "",
      kabupaten_kota: "",
    });

    buatInstitusi({
      nama_kantor: "Kantor Wilayah Direktorat Jenderal Pemasyarakatan Banten",
      jenis: "kanwil",
      pimpinan: "Kepala Kanwil DJP Banten",
      wilayah_kerja: "Bapas Serang, Bapas Ciangir, Bapas Tangerang",
      alamat: "Jl. Jenderal Sudirman No. 1, Kota Serang, Banten",
      email: "kanwil.banten@djp.go.id",
      telepon: "021-2000000",
      provinsi: "Banten",
      kabupaten_kota: "",
    });

    buatInstitusi({
      nama_kantor: "Balai Pemasyarakatan Serang",
      jenis: "balai_pemasyarakatan",
      kelas: "Kelas II",
      pimpinan: "Kepala Bapas Serang",
      wilayah_kerja: "Kota Serang, Kota Cilegon, Kabupaten Serang, Kabupaten Pandeglang, Kabupaten Rangkasbitung",
      alamat: "Jl. Raya Serang-Pandeglang, Kota Serang, Banten",
      email: "bapas.serang@djp.go.id",
      telepon: "021-3000001",
      provinsi: "Banten",
      kabupaten_kota: "Kota Serang",
    });

    buatInstitusi({
      nama_kantor: "Balai Pemasyarakatan Kelas II Ciangir",
      jenis: "balai_pemasyarakatan",
      kelas: "Kelas II",
      pimpinan: "Kepala Bapas Ciangir",
      wilayah_kerja: "Kabupaten Tangerang",
      alamat: "Jl. Raya Ciangir, Kabupaten Tangerang, Banten",
      email: "bapas.ciangir@djp.go.id",
      telepon: "021-3000002",
      provinsi: "Banten",
      kabupaten_kota: "Kabupaten Tangerang",
    });

    buatInstitusi({
      nama_kantor: "Balai Pemasyarakatan Tangerang",
      jenis: "balai_pemasyarakatan",
      kelas: "Kelas II",
      pimpinan: "Kepala Bapas Tangerang",
      wilayah_kerja: "Kota Tangerang, Kota Tangerang Selatan",
      alamat: "Jl. Raya Tangerang, Kota Tangerang, Banten",
      email: "bapas.tangerang@djp.go.id",
      telepon: "021-3000003",
      provinsi: "Banten",
      kabupaten_kota: "Kota Tangerang",
    });

    // ---------- 4. Seed tugas Bapas Ciangir & Banten ----------
    const tugas = app.findCollectionByNameOrId("tugas");
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

    buatTugas("pk.ciangir1@starpk.id", { judul: "Pendampingan klien pemasyarakatan Kabupaten Tangerang", deskripsi: "Pembimbingan klien pascapembebasan di wilayah Bapas Ciangir.", status: "dalam_proses", prioritas: "tinggi", progres: 65, tenggat: "2026-09-19 00:00:00.000Z", catatan: "Klien kooperatif." });
    buatTugas("pk.ciangir1@starpk.id", { judul: "Kunjungan rumah binaan Ciangir", deskripsi: "Home visit verifikasi kondisi keluarga binaan.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-03 00:00:00.000Z", catatan: "Tuntas." });
    buatTugas("pk.ciangir2@starpk.id", { judul: "Konseling kelompok binaan Bapas Ciangir", deskripsi: "Sesi konseling kelompok untuk binaan pemasyarakatan.", status: "terhambat", prioritas: "sedang", progres: 25, tenggat: "2026-09-11 00:00:00.000Z", catatan: "Menunggu jadwal ruangan." });
    buatTugas("pk.ciangir2@starpk.id", { judul: "Penyusunan rencana pembimbingan individual", deskripsi: "Rencana pembimbingan per klien Bapas Ciangir.", status: "dalam_proses", prioritas: "tinggi", progres: 50, tenggat: "2026-09-24 00:00:00.000Z", catatan: "" });
    buatTugas("pk.ciangir1@starpk.id", { judul: "Rekap laporan perkembangan binaan bulanan", deskripsi: "Rekap perkembangan seluruh binaan aktif Bapas Ciangir.", status: "belum_mulai", prioritas: "rendah", progres: 0, tenggat: "2026-10-02 00:00:00.000Z", catatan: "" });
    buatTugas("pk.serang1@starpk.id", { judul: "Verifikasi berkas klien baru Bapas Serang", deskripsi: "Pemeriksaan kelengkapan berkas klien baru.", status: "dalam_proses", prioritas: "tinggi", progres: 75, tenggat: "2026-09-16 00:00:00.000Z", catatan: "" });
    buatTugas("pk.tangerang1@starpk.id", { judul: "Pendampingan klien Kota Tangerang", deskripsi: "Pembimbingan klien pascapembebasan Kota Tangerang.", status: "selesai", prioritas: "sedang", progres: 100, tenggat: "2026-09-06 00:00:00.000Z", catatan: "Laporan terlampir." });
  },
  (app) => {
    try {
      const institusi = app.findCollectionByNameOrId("institusi");
      const records = app.findRecordsByFilter("institusi", "id != ''", "", 1000, 0);
      for (const r of records) app.delete(r);
      app.delete(institusi);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }

    const emailBanten = [
      "wilayah.banten@starpk.id", "kota.ciangir@starpk.id", "kota.serang@starpk.id",
      "kota.tangerang@starpk.id", "pk.ciangir1@starpk.id", "pk.ciangir2@starpk.id",
      "pk.serang1@starpk.id", "pk.tangerang1@starpk.id",
    ];
    for (const email of emailBanten) {
      try {
        app.delete(app.findAuthRecordByEmail("users", email));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
  },
);
