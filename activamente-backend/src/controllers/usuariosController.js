const { poolPromise, sql } = require('../config/db');

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
          tiempoPorDefecto
        FROM dbo.Usuarios
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const perfil = result.recordset[0];
    return res.status(200).json({
      ...perfil,
      id: Number(perfil.id)
    });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO AL OBTENER PERFIL:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);
    const { nombre, ocupacion, fotoPerfil, ubicacionPorDefecto, tiempoPorDefecto } = req.body;

    const nombreLimpio = typeof nombre === 'string' && nombre.trim() !== '' ? nombre.trim() : null;
    const ocupacionLimpia = typeof ocupacion === 'string' && ocupacion.trim() !== '' ? ocupacion.trim() : null;
    const fotoLimpia = typeof fotoPerfil === 'string' && fotoPerfil.trim() !== '' ? fotoPerfil : null;
    const ubicacionLimpia = typeof ubicacionPorDefecto === 'string' && ubicacionPorDefecto.trim() !== '' ? ubicacionPorDefecto.trim() : null;
    const tiempoLimpio = tiempoPorDefecto !== undefined && tiempoPorDefecto !== null ? (parseInt(tiempoPorDefecto, 10) || 10) : null;

    const pool = await poolPromise;

    await pool.request()
      .input('id', sql.Int, usuarioId)
      .input('nombre', sql.NVarChar(100), nombreLimpio)
      .input('ocupacion', sql.NVarChar(30), ocupacionLimpia)
      .input('fotoPerfil', sql.VarChar(sql.MAX), fotoLimpia)
      .input('ubicacionPorDefecto', sql.VarChar(50), ubicacionLimpia)
      .input('tiempoPorDefecto', sql.Int, tiempoLimpio)
      .query(`
        UPDATE dbo.Usuarios
        SET Nombre = COALESCE(@nombre, Nombre),
            Ocupacion = COALESCE(@ocupacion, Ocupacion),
            fotoPerfil = COALESCE(@fotoPerfil, fotoPerfil),
            ubicacionPorDefecto = COALESCE(@ubicacionPorDefecto, ubicacionPorDefecto),
            tiempoPorDefecto = COALESCE(@tiempoPorDefecto, tiempoPorDefecto)
        WHERE Id = @id
      `);

    return res.status(200).json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN SQL SERVER (ACTUALIZAR PERFIL):', error);
    return res.status(500).json({
      error: 'Error al actualizar el perfil en la base de datos',
      detalle: error.message
    });
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
        SELECT Id AS id, Nombre AS nombre, Ocupacion AS ocupacion, tiempoPorDefecto
        FROM dbo.Usuarios
        WHERE Id = @usuarioId
      `);

    const usuario = userRes.recordset[0] || { nombre: 'Usuario', ocupacion: 'estudiante', tiempoPorDefecto: 10 };

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
        tiempoPorDefecto: Number(usuario.tiempoPorDefecto || 10)
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

module.exports = { obtenerPerfil, actualizarPerfil, obtenerProgreso };
