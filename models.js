const db = require('./database');

module.exports = {
  // Usuarios
  crearUsuario: (username, password, rol, callback) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      db.run(
        'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)',
        [username, hash, rol],
        callback
      );
    });
  },
  
  // Torneos
  crearTorneo: (nombre, fecha_inicio, fecha_fin, descripcion, callback) => {
    db.run(
      'INSERT INTO torneos (nombre, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?)',
      [nombre, fecha_inicio, fecha_fin, descripcion],
      callback
    );
  },
  
  obtenerTorneos: (callback) => {
    db.all('SELECT * FROM torneos', callback);
  },
  
  // Agrega más funciones para equipos, jugadores, partidos, etc.
};