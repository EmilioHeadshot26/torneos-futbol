const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const app = express();
const methodOverride = require('method-override');
app.use(methodOverride('_method')); // Permite usar PUT/DELETE en formularios
// Configuración
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretoSuperSeguro',
  resave: false,
  saveUninitialized: true
}));

// Base de datos
const db = new sqlite3.Database('database.db');

// Crear tablas (ejecutar solo una vez al inicio)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    rol TEXT DEFAULT 'visitante'
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS torneos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    descripcion TEXT
  )`);
});

// Rutas
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

// ... (configuraciones previas que ya tenías)

// Middleware para mensajes flash
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

// Rutas de autenticación
app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM usuarios WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      req.session.message = 'Usuario no encontrado';
      return res.redirect('/login');
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        req.session.message = 'Contraseña incorrecta';
        return res.redirect('/login');
      }
      
      req.session.user = user;
      req.session.message = '¡Bienvenido!';
      res.redirect('/');
    });
  });
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user });
});

app.post('/register', (req, res) => {
  const { username, password, rol } = req.body;
  
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      req.session.message = 'Error al registrar usuario';
      return res.redirect('/register');
    }
    
    db.run(
      'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)',
      [username, hash, rol || 'visitante'],
      function(err) {
        if (err) {
          req.session.message = 'El usuario ya existe';
          return res.redirect('/register');
        }
        
        req.session.message = '¡Registro exitoso! Por favor inicia sesión';
        res.redirect('/login');
      }
    );
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Rutas de Torneos (protegidas para admin)
app.get('/torneos/nuevo', adminRequired, (req, res) => {
  res.render('nuevo-torneo', { user: req.session.user });
});

app.post('/torneos', adminRequired, (req, res) => {
  const { nombre, fecha_inicio, fecha_fin, descripcion } = req.body;
  db.run(
    'INSERT INTO torneos (nombre, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?)',
    [nombre, fecha_inicio, fecha_fin, descripcion],
    function(err) {
      if (err) {
        req.session.message = 'Error al crear torneo';
        return res.redirect('/torneos/nuevo');
      }
      req.session.message = 'Torneo creado exitosamente';
      res.redirect('/torneos');
    }
  );
});

app.get('/torneos', (req, res) => {
  db.all('SELECT * FROM torneos', [], (err, torneos) => {
    res.render('torneos', { user: req.session.user, torneos });
  });
});

// Middleware para proteger rutas de admin
function adminRequired(req, res, next) {
  if (req.session.user?.rol === 'admin') {
    next();
  } else {
    req.session.message = 'Acceso no autorizado';
    res.redirect('/');
  }
}

// Ruta protegida de ejemplo
app.get('/admin', adminRequired, (req, res) => {
  res.render('admin', { user: req.session.user });
});

// ---- Operaciones CRUD para torneos ----
// Eliminar torneo
app.post('/torneos/:id/eliminar', (req, res) => {
  const id = parseInt(req.params.id);
  torneos = torneos.filter(torneo => torneo.id !== id);
  res.redirect('/torneos');
});

// Mostrar formulario de edición
app.get('/torneos/:id/editar', (req, res) => {
  const id = parseInt(req.params.id);
  const torneo = torneos.find(t => t.id === id);
  res.render('torneos/editar', { torneo });
});

// Procesar edición
app.post('/torneos/:id/editar', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, fechaInicio, fechaFin } = req.body;
  const index = torneos.findIndex(t => t.id === id);
  
  if (index !== -1) {
    torneos[index] = { ...torneos[index], nombre, fechaInicio, fechaFin };
  }
  
  res.redirect('/torneos');
});

// Inscribir equipo (vista)
app.get('/torneos/:id/inscribir', (req, res) => {
  const id = parseInt(req.params.id);
  const torneo = torneos.find(t => t.id === id);
  res.render('torneos/inscribir', { torneo, equipos });
});

// Procesar inscripción
app.post('/torneos/:id/inscribir', (req, res) => {
  const torneoId = parseInt(req.params.id);
  const equipoId = parseInt(req.body.equipoId);
  
  const torneo = torneos.find(t => t.id === torneoId);
  const equipo = equipos.find(e => e.id === equipoId);
  
  if (torneo && equipo) {
    torneo.equipos.push(equipoId);
  }
  
  res.redirect(`/torneos/${torneoId}`);
});