const express = require('express');
const router = express.Router();
const {
  registrarUsuario,
  loginUsuario,
  verificarEmail,
  reenviarCorreoVerificacion,
  solicitarRecuperacionPassword,
  restablecerPassword
} = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/verificar-email', verificarEmail);
router.post('/verificar-email', verificarEmail);
router.post('/reenviar-verificacion', verificarToken, reenviarCorreoVerificacion);
router.post('/solicitar-recuperacion', solicitarRecuperacionPassword);
router.post('/restablecer-password', restablecerPassword);

module.exports = router;
