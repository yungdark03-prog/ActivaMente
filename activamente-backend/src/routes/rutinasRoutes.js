const express = require('express');
const router = express.Router();
const { generarRutina, completarRutina, evaluarRutina } = require('../controllers/rutinasController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Todas las rutas exigen que el usuario esté logueado
router.post('/generar', verificarToken, generarRutina);
router.post('/completar', verificarToken, completarRutina);
router.post('/evaluar', verificarToken, evaluarRutina);

module.exports = router;
