const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');
const { obtenerSecreto } = require('../config/secrets');
const {
  validarCorreoReal,
  enviarCorreoVerificacion,
  enviarCorreoRecuperacionPassword,
  limpiarCuentasNoVerificadasExpiradas
} = require('../services/emailService');

// POST /api/auth/registro
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, ocupacion, aceptoTerminos } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }

    if (!aceptoTerminos) {
      return res.status(400).json({ error: 'Debes aceptar el Aviso de Privacidad y los Términos de Uso.' });
    }

    // Limpiar cuentas expiradas (> 7 días sin verificar) antes de validar duplicados
    await limpiarCuentasNoVerificadasExpiradas();

    // 1. Validar que el correo sea real (formato, no temporal/falso y dominio con registros MX reales)
    const validacionCorreo = await validarCorreoReal(email);
    if (!validacionCorreo.valido) {
      return res.status(400).json({ error: validacionCorreo.error });
    }

    const emailLimpio = validacionCorreo.emailLimpio;
    const pool = await poolPromise;

    const checkUser = await pool.request()
      .input('email', sql.NVarChar, emailLimpio)
      .query('SELECT Id FROM dbo.Usuarios WHERE Email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');

    const insertReq = pool.request();
    insertReq.input('nombre', sql.NVarChar, nombre.trim());
    insertReq.input('email', sql.NVarChar, emailLimpio);
    insertReq.input('passwordHash', sql.NVarChar, passwordHash);
    insertReq.input('ocupacion', sql.NVarChar, ocupacion || 'estudiante');
    insertReq.input('tokenVerificacion', sql.NVarChar, tokenVerificacion);

    const result = await insertReq.query(`
      INSERT INTO dbo.Usuarios (
        Nombre,
        Email,
        PasswordHash,
        Ocupacion,
        Rol,
        FechaRegistro,
        EmailVerificado,
        TokenVerificacion,
        FechaEnvioVerificacion
      )
      OUTPUT
        INSERTED.Id,
        INSERTED.Nombre,
        INSERTED.Email,
        INSERTED.Rol,
        INSERTED.Ocupacion,
        INSERTED.EmailVerificado,
        INSERTED.FechaRegistro
      VALUES (
        @nombre,
        @email,
        @passwordHash,
        @ocupacion,
        'usuario',
        GETDATE(),
        0,
        @tokenVerificacion,
        GETDATE()
      )
    `);

    const newUser = result.recordset[0];
    const userId = Number(newUser.Id);

    // 2. Enviar correo de confirmación (sin bloquear el acceso a la aplicación)
    const infoCorreo = await enviarCorreoVerificacion({
      email: newUser.Email,
      nombre: newUser.Nombre,
      token: tokenVerificacion
    });

    const token = jwt.sign(
      { id: userId, rol: newUser.Rol },
      obtenerSecreto('JWT_SECRET', 'secreto_temporal'),
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Hemos enviado un correo de confirmación (tienes 7 días para verificar tu cuenta).',
      token,
      verificacion: {
        enviado: infoCorreo.enviado,
        esModoPrueba: infoCorreo.esModoPrueba,
        previewUrl: infoCorreo.previewUrl
      },
      usuario: {
        id: userId,
        nombre: newUser.Nombre,
        email: newUser.Email,
        rol: newUser.Rol,
        ocupacion: newUser.Ocupacion,
        emailVerificado: Boolean(newUser.EmailVerificado)
      }
    });
  } catch (error) {
    console.error('❌ Error crítico en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
};

// POST /api/auth/login
const loginUsuario = async (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.correo;
    const { password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const email = rawEmail.trim().toLowerCase();
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT
          Id,
          Nombre,
          Email,
          PasswordHash,
          Rol,
          Ocupacion,
          Activo,
          EmailVerificado,
          FechaRegistro,
          DATEDIFF(HOUR, COALESCE(FechaRegistro, GETDATE()), GETDATE()) AS horasDesdeRegistro
        FROM dbo.Usuarios
        WHERE Email = @email
      `);

    const usuario = resultado.recordset[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    // Si no ha confirmado su correo y ya pasó 1 semana (168 horas), eliminar la cuenta
    if (!usuario.EmailVerificado && Number(usuario.horasDesdeRegistro) >= 168) {
      await pool.request()
        .input('id', sql.Int, Number(usuario.Id))
        .query('DELETE FROM dbo.Usuarios WHERE Id = @id');

      return res.status(401).json({
        error: 'Tu cuenta fue eliminada automáticamente porque no confirmaste tu correo electrónico dentro del plazo de 1 semana (7 días).'
      });
    }

    let passwordValido = false;
    if (
      usuario.PasswordHash &&
      (usuario.PasswordHash.startsWith('$2a$') ||
        usuario.PasswordHash.startsWith('$2b$') ||
        usuario.PasswordHash.startsWith('$2y$'))
    ) {
      passwordValido = await bcrypt.compare(password, usuario.PasswordHash);
    } else if (usuario.PasswordHash === password) {
      passwordValido = true;
    }

    if (!passwordValido) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const userId = Number(usuario.Id);

    const token = jwt.sign(
      { id: userId, rol: usuario.Rol },
      obtenerSecreto('JWT_SECRET', 'secreto_temporal'),
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: userId,
        nombre: usuario.Nombre,
        email: usuario.Email,
        rol: usuario.Rol,
        ocupacion: usuario.Ocupacion,
        emailVerificado: Boolean(usuario.EmailVerificado)
      }
    });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN LOGIN:', error);
    return res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

// GET o POST /api/auth/verificar-email
const verificarEmail = async (req, res) => {
  try {
    const token = (req.query.token || req.body?.token || '').trim();

    if (!token) {
      return res.status(400).json({ error: 'El token de verificación es obligatorio.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT
          Id,
          Nombre,
          Email,
          EmailVerificado,
          DATEDIFF(HOUR, COALESCE(FechaRegistro, GETDATE()), GETDATE()) AS horasDesdeRegistro
        FROM dbo.Usuarios
        WHERE TokenVerificacion = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        error: 'El enlace de verificación no es válido o el correo ya fue confirmado anteriormente.'
      });
    }

    const usuario = result.recordset[0];

    if (!usuario.EmailVerificado && Number(usuario.horasDesdeRegistro) >= 168) {
      await pool.request()
        .input('id', sql.Int, Number(usuario.Id))
        .query('DELETE FROM dbo.Usuarios WHERE Id = @id');

      return res.status(410).json({
        error: 'El plazo de 7 días para confirmar tu cuenta expiró y la cuenta fue eliminada.'
      });
    }

    await pool.request()
      .input('id', sql.Int, Number(usuario.Id))
      .query(`
        UPDATE dbo.Usuarios
        SET EmailVerificado = 1,
            TokenVerificacion = NULL
        WHERE Id = @id
      `);

    return res.status(200).json({
      mensaje: '¡Correo electrónico confirmado con éxito! Tu cuenta ahora está verificada permanentemente.',
      email: usuario.Email,
      nombre: usuario.Nombre,
      emailVerificado: true
    });
  } catch (error) {
    console.error('❌ Error al verificar correo:', error);
    return res.status(500).json({ error: 'Error interno al verificar el correo electrónico.' });
  }
};

// POST /api/auth/reenviar-verificacion (Protegida con JWT)
const reenviarCorreoVerificacion = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const nuevoEmailOpcional = req.body?.email ? req.body.email.trim().toLowerCase() : null;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, usuarioId)
      .query(`
        SELECT
          Id,
          Nombre,
          Email,
          EmailVerificado,
          FechaEnvioVerificacion,
          DATEDIFF(SECOND, COALESCE(FechaEnvioVerificacion, DATEADD(MINUTE, -5, GETDATE())), GETDATE()) AS segundosDesdeUltimoEnvio
        FROM dbo.Usuarios
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = result.recordset[0];

    if (usuario.EmailVerificado) {
      return res.status(400).json({ error: 'Tu correo electrónico ya se encuentra verificado.' });
    }

    // Evitar spam de reenvíos (cooldown de 30 segundos)
    if (usuario.FechaEnvioVerificacion && Number(usuario.segundosDesdeUltimoEnvio) < 30 && !nuevoEmailOpcional) {
      const espera = 30 - Number(usuario.segundosDesdeUltimoEnvio);
      return res.status(429).json({
        error: `Por favor espera ${espera} segundos antes de solicitar otro correo de confirmación.`
      });
    }

    let emailDestino = usuario.Email;

    // Si el usuario proporcionó o corrigió su correo electrónico, validarlo como correo real
    if (nuevoEmailOpcional && nuevoEmailOpcional !== usuario.Email.toLowerCase()) {
      const validacion = await validarCorreoReal(nuevoEmailOpcional);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
      }

      const duplicado = await pool.request()
        .input('email', sql.NVarChar, validacion.emailLimpio)
        .input('id', sql.Int, usuarioId)
        .query('SELECT Id FROM dbo.Usuarios WHERE Email = @email AND Id <> @id');

      if (duplicado.recordset.length > 0) {
        return res.status(400).json({ error: 'Ese correo electrónico ya está en uso por otra cuenta.' });
      }

      emailDestino = validacion.emailLimpio;
    } else {
      // Validar que el correo actual de la cuenta sea un correo real capaz de recibir mensajes
      const validacionActual = await validarCorreoReal(emailDestino);
      if (!validacionActual.valido) {
        return res.status(400).json({
          error: `${validacionActual.error} Actualiza tu correo electrónico arriba con uno real para poder enviarte la confirmación.`
        });
      }
    }

    const nuevoToken = crypto.randomBytes(32).toString('hex');

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .input('email', sql.NVarChar, emailDestino)
      .input('token', sql.NVarChar, nuevoToken)
      .query(`
        UPDATE dbo.Usuarios
        SET Email = @email,
            TokenVerificacion = @token,
            FechaEnvioVerificacion = GETDATE()
        WHERE Id = @id
      `);

    const infoCorreo = await enviarCorreoVerificacion({
      email: emailDestino,
      nombre: usuario.Nombre,
      token: nuevoToken
    });

    if (!infoCorreo.enviado) {
      return res.status(500).json({
        error: 'No se pudo enviar el correo de verificación en este momento. Intenta de nuevo.'
      });
    }

    return res.status(200).json({
      mensaje: `Se ha enviado un nuevo correo de confirmación a ${emailDestino}. Revisa tu bandeja de entrada o spam.`,
      email: emailDestino,
      esModoPrueba: infoCorreo.esModoPrueba,
      previewUrl: infoCorreo.previewUrl,
      enlaceVerificacion: infoCorreo.esModoPrueba ? infoCorreo.enlaceVerificacion : undefined
    });
  } catch (error) {
    console.error('❌ Error al reenviar correo de verificación:', error);
    return res.status(500).json({ error: 'Error en el servidor al reenviar el correo de confirmación.' });
  }
};

// POST /api/auth/solicitar-recuperacion
const solicitarRecuperacionPassword = async (req, res) => {
  try {
    const emailRaw = req.body?.email || '';
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Por favor ingresa tu correo electrónico.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT Id, Nombre, Email
        FROM dbo.Usuarios
        WHERE Email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: 'No encontramos ninguna cuenta registrada con ese correo electrónico.'
      });
    }

    const usuario = result.recordset[0];
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');

    await pool.request()
      .input('id', sql.Int, Number(usuario.Id))
      .input('token', sql.NVarChar, tokenRecuperacion)
      .query(`
        UPDATE dbo.Usuarios
        SET TokenRecuperacion = @token,
            ExpiracionRecuperacion = DATEADD(MINUTE, 30, GETDATE())
        WHERE Id = @id
      `);

    const infoCorreo = await enviarCorreoRecuperacionPassword({
      email: usuario.Email,
      nombre: usuario.Nombre,
      token: tokenRecuperacion
    });

    if (!infoCorreo.enviado) {
      return res.status(500).json({
        error: 'No se pudo enviar el correo de recuperación en este momento. Intenta de nuevo.'
      });
    }

    return res.status(200).json({
      mensaje: `Hemos enviado un enlace de recuperación a ${usuario.Email}. Revisa tu bandeja de entrada o carpeta de spam (válido por 30 minutos).`,
      previewUrl: infoCorreo.previewUrl || null
    });
  } catch (error) {
    console.error('❌ Error al solicitar recuperación de contraseña:', error);
    return res.status(500).json({ error: 'Error interno al procesar la solicitud.' });
  }
};

// POST /api/auth/restablecer-password
const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'El token y la nueva contraseña son obligatorios.' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('token', sql.NVarChar, token.trim())
      .query(`
        SELECT
          Id,
          Nombre,
          Email,
          CASE WHEN ExpiracionRecuperacion > GETDATE() THEN 1 ELSE 0 END AS vigente
        FROM dbo.Usuarios
        WHERE TokenRecuperacion = @token
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        error: 'El enlace de recuperación no es válido o ya fue utilizado.'
      });
    }

    const usuario = result.recordset[0];
    if (!usuario.vigente) {
      return res.status(400).json({
        error: 'El enlace de recuperación ha expirado (tenía una vigencia de 30 minutos). Solicita uno nuevo en el inicio de sesión.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    await pool.request()
      .input('id', sql.Int, Number(usuario.Id))
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE dbo.Usuarios
        SET PasswordHash = @passwordHash,
            TokenRecuperacion = NULL,
            ExpiracionRecuperacion = NULL
        WHERE Id = @id
      `);

    return res.status(200).json({
      mensaje: '¡Tu contraseña ha sido actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.'
    });
  } catch (error) {
    console.error('❌ Error al restablecer contraseña:', error);
    return res.status(500).json({ error: 'Error interno al restablecer la contraseña.' });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  verificarEmail,
  reenviarCorreoVerificacion,
  solicitarRecuperacionPassword,
  restablecerPassword
};
