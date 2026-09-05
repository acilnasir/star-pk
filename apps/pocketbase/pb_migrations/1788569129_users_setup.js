/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Tambahkan field peran dan unit organisasi bila belum ada.
    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: true,
          maxSelect: 1,
          values: ["pimpinan", "staf"],
        }),
      );
    }
    if (!users.fields.getByName("unit")) {
      users.fields.add(
        new SelectField({
          name: "unit",
          maxSelect: 1,
          values: ["kaur_tu", "bkd", "bka"],
        }),
      );
    }

    // Alat internal tim: pendaftaran ditutup, akun dibuat lewat migrasi.
    // Sesama pengguna yang masuk boleh melihat daftar nama staf
    // (email tetap tersembunyi karena emailVisibility = false).
    users.listRule = "@request.auth.id != ''";
    users.viewRule = "@request.auth.id != ''";
    users.createRule = null;
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = null;

    // Perkuat panjang kata sandi minimum.
    const pw = users.fields.getByName("password");
    pw.min = Math.max(pw.min || 0, 10);

    app.save(users);

    // Seed akun awal: 1 pimpinan + 3 staf unit.
    const seeds = [
      {
        email: "pimpinan@simantau.id",
        password: "Pimpinan#2026!Pantau",
        name: "Pimpinan",
        role: "pimpinan",
        unit: "",
      },
      {
        email: "kaurtu@simantau.id",
        password: "KaurTU#2026!Sigap",
        name: "Kaur Tata Usaha",
        role: "staf",
        unit: "kaur_tu",
      },
      {
        email: "bkd@simantau.id",
        password: "Bkd#2026!Tanggap",
        name: "Kasubsi BKD",
        role: "staf",
        unit: "bkd",
      },
      {
        email: "bka@simantau.id",
        password: "Bka#2026!Waspada",
        name: "Kasubsi BKA",
        role: "staf",
        unit: "bka",
      },
    ];

    for (const seed of seeds) {
      try {
        app.findAuthRecordByEmail("users", seed.email);
      } catch (_) {
        const record = new Record(users);
        record.setEmail(seed.email);
        record.setPassword(seed.password);
        record.set("name", seed.name);
        record.set("role", seed.role);
        record.set("unit", seed.unit);
        record.set("verified", true);
        app.save(record);
      }
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const emails = [
      "pimpinan@simantau.id",
      "kaurtu@simantau.id",
      "bkd@simantau.id",
      "bka@simantau.id",
    ];
    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail("users", email);
        app.delete(record);
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
    users.fields.removeByName("role");
    users.fields.removeByName("unit");
    app.save(users);
  },
);
