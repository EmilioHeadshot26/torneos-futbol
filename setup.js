const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('database.db');

bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) throw err;
  
  db.run(
    'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)',
    ['admin', hash, 'admin'],
    function(err) {
      if (err) console.error(err.message);
      else console.log('Usuario admin creado con contraseña: admin123');
      db.close();
    }
  );
});