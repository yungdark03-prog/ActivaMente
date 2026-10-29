const { poolPromise, sql } = require('../config/db');

const columnaUbicacion = {
  aula: 'AptoAula',
  oficina: 'AptoOficina',
  casa: 'AptoCasa',
  area_trabajo: 'AptoAreaTrabajo'
};

const generarRutina = async (req, res) => {
  try {
    const { ubicacion, tiempo, objetivo } = req.body;
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);

    if (!ubicacion || !tiempo || !objetivo) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (ubicacion, tiempo, objetivo)' });
    }

    const campoUbicacion = columnaUbicacion[ubicacion];
    if (!campoUbicacion) {
      return res.status(400).json({ error: 'Ubicación no válida' });
    }

    const tiempoSegundosTotal = parseInt(tiempo, 10) * 60;
    const pool = await poolPromise;

    let condicionObjetivo = '';
    const request = pool.request();
    request.input('objetivo', sql.NVarChar, objetivo);

    if (objetivo === 'mente_cuerpo') {
      condicionObjetivo = "AND (ObjetivoPrimario = 'mente_cuerpo' OR ObjetivoPrimario = 'activacion_fisica' OR ObjetivoPrimario = 'concentracion')";
    } else {
      condicionObjetivo = "AND (ObjetivoPrimario = @objetivo OR ObjetivoPrimario = 'mente_cuerpo')";
    }

    const query = `
      SELECT Id, Titulo, Descripcion, Instrucciones, Tipo, ObjetivoPrimario, DuracionSegundos, UrlMultimedia
      FROM dbo.Ejercicios
      WHERE ${campoUbicacion} = 1
        AND Activo = 1
        ${condicionObjetivo}
      ORDER BY NEWID()
    `;

    const result = await request.query(query);
    const ejerciciosDisponibles = result.recordset;

    if (ejerciciosDisponibles.length === 0) {
      return res.status(404).json({ error: 'No se encontraron ejercicios compatibles para estos criterios.' });
    }

    const rutinaEjercicios = [];
    let acumuladoSegundos = 0;

    for (const ej of ejerciciosDisponibles) {
      const duracion = Number(ej.DuracionSegundos);
      if (acumuladoSegundos + duracion <= tiempoSegundosTotal + 60) {
        rutinaEjercicios.push(ej);
        acumuladoSegundos += duracion;
      }
      if (acumuladoSegundos >= tiempoSegundosTotal) break;
    }

    if (rutinaEjercicios.length === 0) {
      rutinaEjercicios.push(ejerciciosDisponibles[0]);
      acumuladoSegundos = Number(ejerciciosDisponibles[0].DuracionSegundos);
    }

    let sesionId = null;
    if (usuarioId) {
      const sesionReq = pool.request();
      sesionReq.input('usuarioId', sql.Int, usuarioId);
      sesionReq.input('ubicacion', sql.NVarChar, ubicacion);
      sesionReq.input('tiempoMin', sql.Int, parseInt(tiempo, 10));
      sesionReq.input('objetivo', sql.NVarChar, objetivo);

      const sesionResult = await sesionReq.query(`
        INSERT INTO dbo.Sesiones (UsuarioId, Ubicacion, TiempoSolicitadoMin, Objetivo)
        OUTPUT INSERTED.Id
        VALUES (@usuarioId, @ubicacion, @tiempoMin, @objetivo)
      `);

      sesionId = Number(sesionResult.recordset[0].Id);

      for (let i = 0; i < rutinaEjercicios.length; i++) {
        const itemReq = pool.request();
        itemReq.input('sesionId', sql.Int, sesionId);
        itemReq.input('ejercicioId', sql.Int, Number(rutinaEjercicios[i].Id));
        itemReq.input('orden', sql.Int, i + 1);
        itemReq.input('duracion', sql.Int, Number(rutinaEjercicios[i].DuracionSegundos));

        await itemReq.query(`
          INSERT INTO dbo.SesionEjercicios (SesionId, EjercicioId, Orden, DuracionSegundos)
          VALUES (@sesionId, @ejercicioId, @orden, @duracion)
        `);
      }
    }

    return res.status(200).json({
      sesionId,
      nombreRutina: `${objetivo.replace('_', ' ').toUpperCase()} (${tiempo} min)`,
      tiempoTotalMin: parseInt(tiempo, 10),
      duracionEstimadaSegundos: acumuladoSegundos,
      totalActividades: rutinaEjercicios.length,
      actividades: rutinaEjercicios.map((ej, index) => ({
        orden: index + 1,
        id: Number(ej.Id),
        titulo: ej.Titulo,
        tipo: ej.Tipo,
        duracionSegundos: Number(ej.DuracionSegundos),
        duracionTexto: `${Math.ceil(Number(ej.DuracionSegundos) / 60)} min`,
        descripcion: ej.Descripcion,
        instrucciones: ej.Instrucciones,
        multimedia: ej.UrlMultimedia
      }))
    });
  } catch (error) {
    console.error('❌ Error crítico generando rutina:', error);
    return res.status(500).json({ error: 'Error interno al procesar la rutina.' });
  }
};

// POST /api/rutinas/completar
const completarRutina = async (req, res) => {
  try {
    const { sesionId } = req.body;
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);

    if (!sesionId) {
      return res.status(400).json({ error: 'Falta el identificador de la sesión (sesionId).' });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input('sesionId', sql.Int, parseInt(sesionId, 10));
    request.input('usuarioId', sql.Int, usuarioId);

    await request.query(`
      UPDATE dbo.Sesiones
      SET Completada = 1
      WHERE Id = @sesionId AND UsuarioId = @usuarioId;
    `);

    return res.status(200).json({ mensaje: 'Sesión marcada como completada exitosamente.' });
  } catch (error) {
    console.error('❌ Error crítico completando sesión:', error);
    return res.status(500).json({ error: 'Error interno al completar la sesión.' });
  }
};

// POST /api/rutinas/evaluar
const evaluarRutina = async (req, res) => {
  try {
    const { sesionId, calificacionEsfuerzo, calificacionUtilidad, comentarios } = req.body;
    const usuarioId = Number(req.usuario.id || req.usuario.usuarioId);

    if (!sesionId || !calificacionEsfuerzo || !calificacionUtilidad) {
      return res.status(400).json({ error: 'Faltan parámetros de evaluación.' });
    }

    const pool = await poolPromise;
    const request = pool.request();

    request.input('sesionId', sql.Int, parseInt(sesionId, 10));
    request.input('usuarioId', sql.Int, usuarioId);
    request.input('calificacionEsfuerzo', sql.TinyInt, parseInt(calificacionEsfuerzo, 10));
    request.input('calificacionUtilidad', sql.TinyInt, parseInt(calificacionUtilidad, 10));
    request.input('comentarios', sql.NVarChar, comentarios || '');

    await request.query(`
      UPDATE dbo.Sesiones
      SET Completada = 1
      WHERE Id = @sesionId AND UsuarioId = @usuarioId;

      IF EXISTS (SELECT 1 FROM dbo.Evaluaciones WHERE SesionId = @sesionId)
      BEGIN
        UPDATE dbo.Evaluaciones
        SET CalificacionEsfuerzo = @calificacionEsfuerzo,
            CalificacionUtilidad = @calificacionUtilidad,
            Comentarios = @comentarios,
            FechaEvaluacion = SYSDATETIME()
        WHERE SesionId = @sesionId;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.Evaluaciones (SesionId, CalificacionEsfuerzo, CalificacionUtilidad, Comentarios)
        VALUES (@sesionId, @calificacionEsfuerzo, @calificacionUtilidad, @comentarios);
      END
    `);

    return res.status(200).json({ mensaje: 'Evaluación guardada exitosamente.' });
  } catch (error) {
    console.error('❌ Error crítico guardando evaluación:', error);
    return res.status(500).json({ error: 'Error interno guardando la evaluación.' });
  }
};

module.exports = { generarRutina, completarRutina, evaluarRutina };
