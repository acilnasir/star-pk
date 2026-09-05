/// <reference path="../pb_data/types.d.ts" />

// Ganti nama tampilan pengguna pimpinan sesuai konvensi STAR-PK:
//   pimpinan_pusat   -> "dirjenpas"
//   pimpinan_wilayah -> "kakanwil <provinsi>"
//   pimpinan_kota    -> "kabapas <kabupaten_kota>"

migrate(
  (app) => {
    // ---------- Pimpinan Pusat ----------
    const pusat = app.findRecordsByFilter("users", "role = 'pimpinan_pusat'", "", 1000, 0);
    for (const r of pusat) {
      r.set("name", "dirjenpas");
      app.save(r);
    }

    // ---------- Pimpinan Wilayah ----------
    const wilayah = app.findRecordsByFilter("users", "role = 'pimpinan_wilayah'", "", 1000, 0);
    for (const r of wilayah) {
      const provinsi = r.get("provinsi") || "";
      r.set("name", provinsi ? `kakanwil ${provinsi}` : "kakanwil");
      app.save(r);
    }

    // ---------- Pimpinan Kota/Kabupaten ----------
    const kota = app.findRecordsByFilter("users", "role = 'pimpinan_kota'", "", 1000, 0);
    for (const r of kota) {
      const kabupatenKota = r.get("kabupaten_kota") || "";
      r.set("name", kabupatenKota ? `kabapas ${kabupatenKota}` : "kabapas");
      app.save(r);
    }
  },
  (app) => {
    // Rollback manual: kembalikan ke pola nama lama berdasarkan peran & lokasi.
    const wilayah = app.findRecordsByFilter("users", "role = 'pimpinan_wilayah'", "", 1000, 0);
    for (const r of wilayah) {
      const provinsi = r.get("provinsi") || "";
      r.set("name", provinsi ? `Pimpinan Wilayah ${provinsi}` : "Pimpinan Wilayah");
      app.save(r);
    }
    const kota = app.findRecordsByFilter("users", "role = 'pimpinan_kota'", "", 1000, 0);
    for (const r of kota) {
      const kabupatenKota = r.get("kabupaten_kota") || "";
      r.set("name", kabupatenKota ? `Pimpinan Kota ${kabupatenKota}` : "Pimpinan Kota");
      app.save(r);
    }
    const pusat = app.findRecordsByFilter("users", "role = 'pimpinan_pusat'", "", 1000, 0);
    for (const r of pusat) {
      r.set("name", "Pimpinan Pusat");
      app.save(r);
    }
  },
);
