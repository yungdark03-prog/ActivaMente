const express = require('express');
const router = express.Router();
const {
  buscarLugar,
  obtenerEspaciosCercanos,
  calcularRutaCaminando,
  registrarCaminata
} = require('../controllers/mapaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/buscar-lugar', verificarToken, buscarLugar);
router.get('/espacios', verificarToken, obtenerEspaciosCercanos);
router.get('/ruta', verificarToken, calcularRutaCaminando);
router.post('/registrar-caminata', verificarToken, registrarCaminata);

module.exports = router;
