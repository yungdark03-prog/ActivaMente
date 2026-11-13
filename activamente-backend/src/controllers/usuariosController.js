const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('../config/db');
const {
  validarCorreoReal,
  enviarCorreoVerificacion,
  enviarResumenProgresoEmail
} = require('../services/emailService');

const obtenerPerfil = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, usuarioId)
      .query(`
        SELECT
          Id AS id,
          Nombre AS nombre,
          Email AS email,
          Ocupacion AS ocupacion,
          fotoPerfil,
          ubicacionPorDefecto,
          tiempoPorDefecto,
          COALESCE(objetivoPorDefecto, 'concentracion') AS objetivoPorDefecto,
          COALESCE(metaDiariaMin, 20) AS metaDiariaMin,
          COALESCE(sonidoTemporizador, 1) AS sonidoTemporizador,
          COALESCE(frecuenciaRecordatorioMin, 0) AS frecuenciaRecordatorioMin,
          COALESCE(notificacionesEmail, 1) AS notificacionesEmail,
          COALESCE(temaOscuro, 0) AS temaOscuro,
          COALESCE(chatbotHabilitado, 1) AS chatbotHabilitado,
          EmailVerificado AS emailVerificado,
          FechaRegistro AS fechaRegistro,
          DATEADD(DAY, 7, COALESCE(FechaRegistro, GETDATE())) AS fechaLimiteVerificacion,
          DATEDIFF(HOUR, COALESCE(FechaRegistro, GETDATE()), GETDATE()) AS horasDesdeRegistro
        FROM dbo.Usuarios
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const perfil = result.recordset[0];
    const horasTranscurridas = Number(perfil.horasDesdeRegistro || 0);

    // Si la cuenta no ha sido verificada y ya transcurrió 1 semana (168 horas), eliminarla
    if (!perfil.emailVerificado && horasTranscurridas >= 168) {
      await pool.request()
        .input('id', sql.Int, usuarioId)
        .query('DELETE FROM dbo.Usuarios WHERE Id = @id');

      return res.status(401).json({
        cuentaEliminada: true,
        error: 'Tu cuenta fue eliminada porque no confirmaste tu correo electrónico dentro del plazo de 1 semana.'
      });
    }

    const horasRestantes = Math.max(0, 168 - horasTranscurridas);
    const diasRestantes = Math.max(1, Math.ceil(horasRestantes / 24));

    return res.status(200).json({
      ...perfil,
      id: Number(perfil.id),
      metaDiariaMin: Number(perfil.metaDiariaMin || 20),
      sonidoTemporizador: Boolean(perfil.sonidoTemporizador),
      frecuenciaRecordatorioMin: Number(perfil.frecuenciaRecordatorioMin || 0),
      notificacionesEmail: Boolean(perfil.notificacionesEmail),
      temaOscuro: Boolean(perfil.temaOscuro),
      chatbotHabilitado: perfil.chatbotHabilitado !== undefined ? Boolean(perfil.chatbotHabilitado) : true,
      emailVerificado: Boolean(perfil.emailVerificado),
      horasRestantesVerificacion: perfil.emailVerificado ? null : horasRestantes,
      diasRestantesVerificacion: perfil.emailVerificado ? null : diasRestantes
    });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL OBTENER PERFIL:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const {
      nombre,
      ocupacion,
      fotoPerfil,
      ubicacionPorDefecto,
      tiempoPorDefecto,
      objetivoPorDefecto,
      metaDiariaMin,
      sonidoTemporizador,
      frecuenciaRecordatorioMin,
      notificacionesEmail,
      temaOscuro,
      chatbotHabilitado
    } = req.body;

    const nombreLimpio = typeof nombre === 'string' && nombre.trim() !== '' ? nombre.trim() : null;
    const ocupacionLimpia = typeof ocupacion === 'string' && ocupacion.trim() !== '' ? ocupacion.trim() : null;
    const fotoLimpia = typeof fotoPerfil === 'string' && fotoPerfil.trim() !== '' ? fotoPerfil : null;
    const ubicacionLimpia = typeof ubicacionPorDefecto === 'string' && ubicacionPorDefecto.trim() !== '' ? ubicacionPorDefecto.trim() : null;
    const tiempoLimpio = tiempoPorDefecto !== undefined && tiempoPorDefecto !== null ? (parseInt(tiempoPorDefecto, 10) || 10) : null;
    const objetivoLimpio = typeof objetivoPorDefecto === 'string' && objetivoPorDefecto.trim() !== '' ? objetivoPorDefecto.trim() : null;
    const metaLimpia = metaDiariaMin !== undefined && metaDiariaMin !== null ? (parseInt(metaDiariaMin, 10) || 20) : null;
    const sonidoBit = sonidoTemporizador !== undefined && sonidoTemporizador !== null ? (sonidoTemporizador ? 1 : 0) : null;
    const recordatorioLimpio = frecuenciaRecordatorioMin !== undefined && frecuenciaRecordatorioMin !== null ? (parseInt(frecuenciaRecordatorioMin, 10) || 0) : null;
    const notifEmailBit = notificacionesEmail !== undefined && notificacionesEmail !== null ? (notificacionesEmail ? 1 : 0) : null;
    const temaOscuroBit = temaOscuro !== undefined && temaOscuro !== null ? (temaOscuro ? 1 : 0) : null;
    const chatbotBit = chatbotHabilitado !== undefined && chatbotHabilitado !== null ? (chatbotHabilitado ? 1 : 0) : null;

    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .input('nombre', sql.NVarChar(100), nombreLimpio)
      .input('ocupacion', sql.NVarChar(30), ocupacionLimpia)
      .input('fotoPerfil', sql.VarChar(sql.MAX), fotoLimpia)
      .input('ubicacionPorDefecto', sql.VarChar(50), ubicacionLimpia)
      .input('tiempoPorDefecto', sql.Int, tiempoLimpio)
      .input('objetivoPorDefecto', sql.VarChar(50), objetivoLimpio)
      .input('metaDiariaMin', sql.Int, metaLimpia)
      .input('sonidoTemporizador', sql.Bit, sonidoBit)
      .input('frecuenciaRecordatorioMin', sql.Int, recordatorioLimpio)
      .input('notificacionesEmail', sql.Bit, notifEmailBit)
      .input('temaOscuro', sql.Bit, temaOscuroBit)
      .input('chatbotHabilitado', sql.Bit, chatbotBit)
      .query(`
        UPDATE dbo.Usuarios
        SET Nombre = COALESCE(@nombre, Nombre),
            Ocupacion = COALESCE(@ocupacion, Ocupacion),
            fotoPerfil = COALESCE(@fotoPerfil, fotoPerfil),
            ubicacionPorDefecto = COALESCE(@ubicacionPorDefecto, ubicacionPorDefecto),
            tiempoPorDefecto = COALESCE(@tiempoPorDefecto, tiempoPorDefecto),
            objetivoPorDefecto = COALESCE(@objetivoPorDefecto, objetivoPorDefecto),
            metaDiariaMin = COALESCE(@metaDiariaMin, metaDiariaMin),
            sonidoTemporizador = COALESCE(@sonidoTemporizador, sonidoTemporizador),
            frecuenciaRecordatorioMin = COALESCE(@frecuenciaRecordatorioMin, frecuenciaRecordatorioMin),
            notificacionesEmail = COALESCE(@notificacionesEmail, notificacionesEmail),
            temaOscuro = COALESCE(@temaOscuro, temaOscuro),
            chatbotHabilitado = COALESCE(@chatbotHabilitado, chatbotHabilitado)
        WHERE Id = @id
      `);

    return res.status(200).json({ mensaje: 'Ajustes actualizados correctamente' });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN SQL SERVER (ACTUALIZAR PERFIL):', error);
    return res.status(500).json({
      error: 'Error al actualizar el perfil en la base de datos',
      detalle: error.message
    });
  }
};

// PUT /api/usuarios/cambiar-password
const cambiarPassword = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Debes ingresar tu contraseña actual y la nueva contraseña.' });
    }

    if (passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, usuarioId)
      .query('SELECT PasswordHash FROM dbo.Usuarios WHERE Id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const hashActual = result.recordset[0].PasswordHash || '';
    let passwordValida = false;
    if (hashActual.startsWith('$2a$') || hashActual.startsWith('$2b$') || hashActual.startsWith('$2y$')) {
      passwordValida = await bcrypt.compare(passwordActual, hashActual);
    } else {
      passwordValida = hashActual === passwordActual;
    }

    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña actual que ingresaste es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .input('passwordHash', sql.NVarChar, nuevoHash)
      .query('UPDATE dbo.Usuarios SET PasswordHash = @passwordHash WHERE Id = @id');

    return res.status(200).json({ mensaje: '¡Tu contraseña ha sido actualizada exitosamente!' });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    return res.status(500).json({ error: 'Error interno al cambiar la contraseña.' });
  }
};

// PUT /api/usuarios/cambiar-email
const cambiarEmail = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const { nuevoEmail } = req.body;

    if (!nuevoEmail) {
      return res.status(400).json({ error: 'Debes proporcionar el nuevo correo electrónico.' });
    }

    const validacion = await validarCorreoReal(nuevoEmail);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.error });
    }

    const emailLimpio = validacion.emailLimpio;
    const pool = await poolPromise;

    const userRes = await pool.request()
      .input('id', sql.Int, usuarioId)
      .query('SELECT Nombre, Email FROM dbo.Usuarios WHERE Id = @id');

    if (userRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = userRes.recordset[0];
    if (usuario.Email.toLowerCase() === emailLimpio) {
      return res.status(400).json({ error: 'Ese ya es tu correo electrónico actual.' });
    }

    const duplicado = await pool.request()
      .input('email', sql.NVarChar, emailLimpio)
      .input('id', sql.Int, usuarioId)
      .query('SELECT Id FROM dbo.Usuarios WHERE Email = @email AND Id <> @id');

    if (duplicado.recordset.length > 0) {
      return res.status(400).json({ error: 'Ese correo electrónico ya está registrado en otra cuenta.' });
    }

    const nuevoToken = crypto.randomBytes(32).toString('hex');

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .input('email', sql.NVarChar, emailLimpio)
      .input('token', sql.NVarChar, nuevoToken)
      .query(`
        UPDATE dbo.Usuarios
        SET Email = @email,
            EmailVerificado = 0,
            TokenVerificacion = @token,
            FechaEnvioVerificacion = GETDATE()
        WHERE Id = @id
      `);

    const infoCorreo = await enviarCorreoVerificacion({
      email: emailLimpio,
      nombre: usuario.Nombre,
      token: nuevoToken
    });

    return res.status(200).json({
      mensaje: `Tu correo se actualizó a ${emailLimpio}. Hemos enviado un enlace de confirmación a tu nueva bandeja.`,
      email: emailLimpio,
      emailVerificado: false,
      previewUrl: infoCorreo.previewUrl
    });
  } catch (error) {
    console.error('❌ Error al cambiar email:', error);
    return res.status(500).json({ error: 'Error interno al cambiar el correo electrónico.' });
  }
};

// POST /api/usuarios/enviar-resumen-email
const enviarResumenEmail = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const pool = await poolPromise;

    const userRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query('SELECT Nombre, Email, COALESCE(metaDiariaMin, 20) AS metaDiariaMin FROM dbo.Usuarios WHERE Id = @usuarioId');

    if (userRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = userRes.recordset[0];

    const statsRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT
          COUNT(*) AS sesionesCompletadas,
          COALESCE(SUM(TiempoSolicitadoMin), 0) AS minutosInvertidos,
          COALESCE(SUM(CASE WHEN CAST(FechaInicio AS DATE) = CAST(GETDATE() AS DATE) THEN TiempoSolicitadoMin ELSE 0 END), 0) AS minutosHoy
        FROM dbo.Sesiones
        WHERE UsuarioId = @usuarioId AND Completada = 1
      `);

    const stats = statsRes.recordset[0] || { sesionesCompletadas: 0, minutosInvertidos: 0, minutosHoy: 0 };

    const diasRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT DISTINCT DATEDIFF(day, CAST(FechaInicio AS DATE), CAST(GETDATE() AS DATE)) AS diasAtras
        FROM dbo.Sesiones
        WHERE UsuarioId = @usuarioId AND Completada = 1
        ORDER BY diasAtras ASC
      `);

    const dias = diasRes.recordset.map((r) => Number(r.diasAtras)).filter((d) => d >= 0);
    let rachaActual = 0;
    if (dias.length > 0 && (dias[0] === 0 || dias[0] === 1)) {
      rachaActual = 1;
      let esperado = dias[0] + 1;
      for (let i = 1; i < dias.length; i++) {
        if (dias[i] === esperado) {
          rachaActual++;
          esperado++;
        } else {
          break;
        }
      }
    }

    await enviarResumenProgresoEmail({
      email: usuario.Email,
      nombre: usuario.Nombre,
      rachaActual,
      minutosInvertidos: Number(stats.minutosInvertidos || 0),
      sesionesCompletadas: Number(stats.sesionesCompletadas || 0),
      minutosHoy: Number(stats.minutosHoy || 0),
      metaDiariaMin: Number(usuario.metaDiariaMin || 20)
    });

    return res.status(200).json({
      mensaje: `¡Resumen de progreso enviado con éxito a ${usuario.Email}! Revisa tu bandeja de entrada.`
    });
  } catch (error) {
    console.error('❌ Error al enviar resumen por correo:', error);
    return res.status(500).json({
      error: error.message || 'No se pudo enviar el resumen por correo.'
    });
  }
};

// GET /api/usuarios/exportar-historial
const exportarHistorial = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const pool = await poolPromise;

    const historialRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT
          s.Id AS id,
          s.FechaInicio AS fechaInicio,
          s.Ubicacion AS ubicacion,
          s.TiempoSolicitadoMin AS tiempoMin,
          s.Objetivo AS objetivo,
          e.CalificacionEsfuerzo AS calificacionEsfuerzo,
          e.CalificacionUtilidad AS calificacionUtilidad,
          (SELECT COUNT(*) FROM dbo.SesionEjercicios se WHERE se.SesionId = s.Id) AS totalEjercicios
        FROM dbo.Sesiones s
        LEFT JOIN dbo.Evaluaciones e ON e.SesionId = s.Id
        WHERE s.UsuarioId = @usuarioId AND s.Completada = 1
        ORDER BY s.FechaInicio DESC, s.Id DESC
      `);

    return res.status(200).json({
      sesiones: historialRes.recordset
    });
  } catch (error) {
    console.error('❌ Error al exportar historial:', error);
    return res.status(500).json({ error: 'Error al exportar el historial de sesiones.' });
  }
};

// DELETE /api/usuarios/cuenta
const eliminarCuenta = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Debes ingresar tu contraseña para confirmar la eliminación de tu cuenta.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, usuarioId)
      .query('SELECT PasswordHash FROM dbo.Usuarios WHERE Id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const hashActual = result.recordset[0].PasswordHash || '';
    let passwordValida = false;
    if (hashActual.startsWith('$2a$') || hashActual.startsWith('$2b$') || hashActual.startsWith('$2y$')) {
      passwordValida = await bcrypt.compare(password, hashActual);
    } else {
      passwordValida = hashActual === password;
    }

    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta. No se eliminó la cuenta.' });
    }

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .query('DELETE FROM dbo.Usuarios WHERE Id = @id');

    return res.status(200).json({ mensaje: 'Tu cuenta y todo tu historial han sido eliminados permanentemente.' });
  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    return res.status(500).json({ error: 'Error interno al eliminar la cuenta.' });
  }
};

const obtenerProgreso = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const pool = await poolPromise;

    // 1. Datos básicos del usuario
    const userRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT
          Id AS id,
          Nombre AS nombre,
          Ocupacion AS ocupacion,
          tiempoPorDefecto,
          COALESCE(objetivoPorDefecto, 'concentracion') AS objetivoPorDefecto,
          COALESCE(metaDiariaMin, 20) AS metaDiariaMin
        FROM dbo.Usuarios
        WHERE Id = @usuarioId
      `);

    const usuario = userRes.recordset[0] || {
      nombre: 'Usuario',
      ocupacion: 'estudiante',
      tiempoPorDefecto: 10,
      objetivoPorDefecto: 'concentracion',
      metaDiariaMin: 20
    };

    // 2. Totales de sesiones completadas y minutos invertidos (general y de hoy)
    const statsRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT
          COUNT(*) AS sesionesCompletadas,
          COALESCE(SUM(TiempoSolicitadoMin), 0) AS minutosInvertidos,
          SUM(CASE WHEN CAST(FechaInicio AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS sesionesHoy,
          COALESCE(SUM(CASE WHEN CAST(FechaInicio AS DATE) = CAST(GETDATE() AS DATE) THEN TiempoSolicitadoMin ELSE 0 END), 0) AS minutosHoy
        FROM dbo.Sesiones
        WHERE UsuarioId = @usuarioId AND Completada = 1
      `);

    const stats = statsRes.recordset[0] || {
      sesionesCompletadas: 0,
      minutosInvertidos: 0,
      sesionesHoy: 0,
      minutosHoy: 0
    };

    // 3. Cálculo de racha actual en días consecutivos
    const diasRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT DISTINCT DATEDIFF(day, CAST(FechaInicio AS DATE), CAST(GETDATE() AS DATE)) AS diasAtras
        FROM dbo.Sesiones
        WHERE UsuarioId = @usuarioId AND Completada = 1
        ORDER BY diasAtras ASC
      `);

    const dias = diasRes.recordset
      .map(r => Number(r.diasAtras))
      .filter(d => d >= 0);

    let rachaActual = 0;
    if (dias.length > 0 && (dias[0] === 0 || dias[0] === 1)) {
      rachaActual = 1;
      let esperado = dias[0] + 1;
      for (let i = 1; i < dias.length; i++) {
        if (dias[i] === esperado) {
          rachaActual++;
          esperado++;
        } else {
          break;
        }
      }
    }

    // 4. Promedio de evaluaciones del usuario
    const evalRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT
          AVG(CAST(e.CalificacionEsfuerzo AS FLOAT)) AS promedioEsfuerzo,
          AVG(CAST(e.CalificacionUtilidad AS FLOAT)) AS promedioUtilidad
        FROM dbo.Evaluaciones e
        INNER JOIN dbo.Sesiones s ON s.Id = e.SesionId
        WHERE s.UsuarioId = @usuarioId AND s.Completada = 1
      `);

    const evalStats = evalRes.recordset[0] || {};

    // 5. Historial reciente de sesiones completadas
    const historialRes = await pool.request()
      .input('usuarioId', sql.Int, usuarioId)
      .query(`
        SELECT TOP 8
          s.Id AS id,
          s.Ubicacion AS ubicacion,
          s.TiempoSolicitadoMin AS tiempoMin,
          s.Objetivo AS objetivo,
          s.FechaInicio AS fechaInicio,
          e.CalificacionEsfuerzo AS calificacionEsfuerzo,
          e.CalificacionUtilidad AS calificacionUtilidad,
          (SELECT COUNT(*) FROM dbo.SesionEjercicios se WHERE se.SesionId = s.Id) AS totalEjercicios
        FROM dbo.Sesiones s
        LEFT JOIN dbo.Evaluaciones e ON e.SesionId = s.Id
        WHERE s.UsuarioId = @usuarioId AND s.Completada = 1
        ORDER BY s.FechaInicio DESC, s.Id DESC
      `);

    return res.status(200).json({
      usuario: {
        id: usuarioId,
        nombre: usuario.nombre,
        ocupacion: usuario.ocupacion,
        tiempoPorDefecto: Number(usuario.tiempoPorDefecto || 10),
        objetivoPorDefecto: usuario.objetivoPorDefecto || 'concentracion',
        metaDiariaMin: Number(usuario.metaDiariaMin || 20)
      },
      rachaActual,
      minutosInvertidos: Number(stats.minutosInvertidos || 0),
      sesionesCompletadas: Number(stats.sesionesCompletadas || 0),
      sesionesHoy: Number(stats.sesionesHoy || 0),
      minutosHoy: Number(stats.minutosHoy || 0),
      promedioEsfuerzo: evalStats.promedioEsfuerzo ? Number(Number(evalStats.promedioEsfuerzo).toFixed(1)) : null,
      promedioUtilidad: evalStats.promedioUtilidad ? Number(Number(evalStats.promedioUtilidad).toFixed(1)) : null,
      historialReciente: historialRes.recordset.map(item => ({
        id: Number(item.id),
        ubicacion: item.ubicacion,
        tiempoMin: Number(item.tiempoMin),
        objetivo: item.objetivo,
        fechaInicio: item.fechaInicio,
        calificacionEsfuerzo: item.calificacionEsfuerzo ? Number(item.calificacionEsfuerzo) : null,
        calificacionUtilidad: item.calificacionUtilidad ? Number(item.calificacionUtilidad) : null,
        totalEjercicios: Number(item.totalEjercicios || 0)
      }))
    });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL OBTENER PROGRESO:', error);
    return res.status(500).json({ error: 'Error al obtener el resumen de progreso' });
  }
};

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  obtenerProgreso,
  cambiarPassword,
  cambiarEmail,
  enviarResumenEmail,
  exportarHistorial,
  eliminarCuenta
};
