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
const { authLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/registro', authLimiter, registrarUsuario);
router.post('/login', authLimiter, loginUsuario);
router.get('/verificar-email', verificarEmail);
router.post('/verificar-email', verificarEmail);
router.post('/reenviar-verificacion', authLimiter, verificarToken, reenviarCorreoVerificacion);
router.post('/solicitar-recuperacion', authLimiter, solicitarRecuperacionPassword);
router.post('/restablecer-password', authLimiter, restablecerPassword);

module.exports = router;
