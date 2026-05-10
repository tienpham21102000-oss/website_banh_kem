const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT * FROM coupons", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Coupons in DB:");
  console.log(JSON.stringify(rows, null, 2));
  
  db.get("SELECT datetime('now', 'localtime') as now_local, datetime('now') as now_utc", (err, row) => {
    console.log("Current DB times:");
    console.log(row);
    db.close();
  });
});
