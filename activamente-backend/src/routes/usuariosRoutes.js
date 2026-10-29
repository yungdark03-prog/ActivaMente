const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPerfil, obtenerProgreso } = require('../controllers/usuariosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.get('/progreso', verificarToken, obtenerProgreso);

module.exports = router;
