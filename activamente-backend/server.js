const path = require('path');
const { encriptarArchivoEnv } = require('./src/config/secrets');

// Encriptar automáticamente cualquier API Key en texto plano dentro de .env antes de cargarlo
try {
  const varsCifradas = encriptarArchivoEnv(path.join(__dirname, '.env'));
  if (varsCifradas.length > 0) {
    console.log(`🔒 Variables encriptadas automáticamente con AES-256-GCM en .env: ${varsCifradas.join(', ')}`);
  }
} catch (e) {
  // Ignorar si .env no existe aún
}

require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

// 1. IMPORTAR RUTAS Y SERVICIOS
const authRoutes = require('./src/routes/authRoutes');
const rutinasRoutes = require('./src/routes/rutinasRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const { limpiarCuentasNoVerificadasExpiradas } = require('./src/services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. MIDDLEWARES GLOBALES (Configuración CORS explícita para permitir el frontend en puerto 5174 y otros puertos locales)
app.use(
  cors({
    origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🚨 RADAR: Imprime cualquier petición que intente entrar al servidor
app.use((req, res, next) => {
  console.log(`📡 Petición entrante: ${req.method} ${req.url}`);
  next();
});

// 3. DECLARAR LAS RUTAS BASE
app.use('/api/auth', authRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// 4. RUTAS DE PRUEBA Y PUERTO
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', app: 'ActivaMente API' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor ActivaMente corriendo en http://localhost:${PORT}`);
  // Limpiar cuentas no verificadas con más de 1 semana al iniciar y cada hora
  limpiarCuentasNoVerificadasExpiradas();
  setInterval(limpiarCuentasNoVerificadasExpiradas, 60 * 60 * 1000);
});
