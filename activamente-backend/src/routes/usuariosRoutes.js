const express = require('express');
const router = express.Router();
const {
  obtenerPerfil,
  actualizarPerfil,
  obtenerProgreso,
  cambiarPassword,
  cambiarEmail,
  enviarResumenEmail,
  exportarHistorial,
  eliminarCuenta
} = require('../controllers/usuariosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.get('/progreso', verificarToken, obtenerProgreso);
router.put('/cambiar-password', verificarToken, cambiarPassword);
router.put('/cambiar-email', verificarToken, cambiarEmail);
router.post('/enviar-resumen-email', verificarToken, enviarResumenEmail);
router.get('/exportar-historial', verificarToken, exportarHistorial);
router.delete('/cuenta', verificarToken, eliminarCuenta);

module.exports = router;
