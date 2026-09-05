/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    let collection;
    try {
      collection = app.findCollectionByNameOrId("tugas");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "tugas",
        // Pimpinan memantau semua tugas; staf hanya tugas yang dibebankan kepadanya.
        listRule:
          "@request.auth.role = 'pimpinan' || @request.auth.id = assignee",
        viewRule:
          "@request.auth.role = 'pimpinan' || @request.auth.id = assignee",
        createRule: "@request.auth.role = 'pimpinan'",
        updateRule:
          "@request.auth.role = 'pimpinan' || @request.auth.id = assignee",
        deleteRule: "@request.auth.role = 'pimpinan'",
        fields: [
          { name: "judul", type: "text", required: true, max: 200 },
          { name: "deskripsi", type: "text" },
          {
            name: "unit",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["kaur_tu", "bkd", "bka"],
          },
          {
            name: "assignee",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          {
            name: "status",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["belum_mulai", "dalam_proses", "selesai", "terhambat"],
          },
          {
            name: "prioritas",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["rendah", "sedang", "tinggi"],
          },
          { name: "progres", type: "number", min: 0, max: 100, onlyInt: true },
          { name: "tenggat", type: "date" },
          { name: "catatan", type: "text" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_tugas_unit ON tugas (unit)",
          "CREATE INDEX idx_tugas_status ON tugas (status)",
          "CREATE INDEX idx_tugas_assignee ON tugas (assignee)",
        ],
      });
      app.save(collection);
    }

    // Seed contoh tugas bila koleksi masih kosong.
    const existing = app.findRecordsByFilter("tugas", "id != ''", "", 1, 0);
    if (existing.length > 0) return;

    const kaurtu = app.findAuthRecordByEmail("users", "kaurtu@simantau.id");
    const bkd = app.findAuthRecordByEmail("users", "bkd@simantau.id");
    const bka = app.findAuthRecordByEmail("users", "bka@simantau.id");

    const seeds = [
      {
        judul: "Rekapitulasi surat masuk dan keluar bulan berjalan",
        deskripsi:
          "Merapikan agenda surat masuk dan keluar serta memastikan seluruh disposisi tertindaklanjuti.",
        unit: "kaur_tu",
        assignee: kaurtu.id,
        status: "dalam_proses",
        prioritas: "tinggi",
        progres: 65,
        tenggat: "2026-09-15 00:00:00.000Z",
        catatan: "Sudah 80 persen surat terverifikasi, menyusul arsip bulan lalu.",
      },
      {
        judul: "Penyusunan laporan keuangan triwulan III",
        deskripsi:
          "Menyusun laporan realisasi anggaran triwulan III beserta lampiran bukti dukung.",
        unit: "kaur_tu",
        assignee: kaurtu.id,
        status: "belum_mulai",
        prioritas: "tinggi",
        progres: 0,
        tenggat: "2026-09-30 00:00:00.000Z",
        catatan: "",
      },
      {
        judul: "Inventarisasi aset dan barang milik negara",
        deskripsi:
          "Pendataan ulang seluruh aset kantor dan pemutakhiran daftar barang inventaris.",
        unit: "kaur_tu",
        assignee: kaurtu.id,
        status: "selesai",
        prioritas: "sedang",
        progres: 100,
        tenggat: "2026-09-02 00:00:00.000Z",
        catatan: "Seluruh aset sudah terdata dan dilabeli ulang.",
      },
      {
        judul: "Penyusunan jadwal pembinaan mingguan",
        deskripsi:
          "Menyusun jadwal kegiatan pembinaan dan memastikan ketersediaan petugas pendamping.",
        unit: "bkd",
        assignee: bkd.id,
        status: "dalam_proses",
        prioritas: "sedang",
        progres: 40,
        tenggat: "2026-09-12 00:00:00.000Z",
        catatan: "Menunggu konfirmasi dua narasumber eksternal.",
      },
      {
        judul: "Laporan pelaksanaan kegiatan pembinaan bulanan",
        deskripsi:
          "Rekap capaian kegiatan pembinaan, jumlah peserta, dan kendala di lapangan.",
        unit: "bkd",
        assignee: bkd.id,
        status: "terhambat",
        prioritas: "tinggi",
        progres: 55,
        tenggat: "2026-09-08 00:00:00.000Z",
        catatan: "Data kehadiran dari dua blok belum masuk, sedang dikonfirmasi.",
      },
      {
        judul: "Koordinasi program pelatihan keterampilan staf",
        deskripsi:
          "Menyiapkan kurikulum, jadwal, dan kebutuhan sarana pelatihan keterampilan.",
        unit: "bkd",
        assignee: bkd.id,
        status: "belum_mulai",
        prioritas: "rendah",
        progres: 0,
        tenggat: "2026-10-05 00:00:00.000Z",
        catatan: "",
      },
      {
        judul: "Penyusunan bahan analisis kebutuhan anggaran",
        deskripsi:
          "Menghitung kebutuhan anggaran program tahun depan berdasarkan capaian tahun berjalan.",
        unit: "bka",
        assignee: bka.id,
        status: "dalam_proses",
        prioritas: "tinggi",
        progres: 70,
        tenggat: "2026-09-18 00:00:00.000Z",
        catatan: "Draf awal selesai, tinggal penajaman asumsi harga.",
      },
      {
        judul: "Verifikasi kelengkapan dokumen administrasi program",
        deskripsi:
          "Memeriksa kelengkapan dokumen pendukung seluruh program sebelum diajukan.",
        unit: "bka",
        assignee: bka.id,
        status: "dalam_proses",
        prioritas: "sedang",
        progres: 30,
        tenggat: "2026-09-22 00:00:00.000Z",
        catatan: "",
      },
      {
        judul: "Laporan capaian kinerja unit semester berjalan",
        deskripsi:
          "Menyusun laporan capaian indikator kinerja utama beserta analisis ketimpangan target.",
        unit: "bka",
        assignee: bka.id,
        status: "selesai",
        prioritas: "tinggi",
        progres: 100,
        tenggat: "2026-08-28 00:00:00.000Z",
        catatan: "Laporan sudah diserahkan dan diarsipkan.",
      },
    ];

    for (const seed of seeds) {
      const record = new Record(collection);
      record.set("judul", seed.judul);
      record.set("deskripsi", seed.deskripsi);
      record.set("unit", seed.unit);
      record.set("assignee", seed.assignee);
      record.set("status", seed.status);
      record.set("prioritas", seed.prioritas);
      record.set("progres", seed.progres);
      record.set("tenggat", seed.tenggat);
      record.set("catatan", seed.catatan);
      app.save(record);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("tugas");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
