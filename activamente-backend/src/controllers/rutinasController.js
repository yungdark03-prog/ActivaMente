const { poolPromise, sql } = require('../config/db');

const columnaUbicacion = {
  aula: 'AptoAula',
  oficina: 'AptoOficina',
  casa: 'AptoCasa',
  area_trabajo: 'AptoAreaTrabajo'
};

const obtenerInstruccionesPorDefecto = (ej = {}) => {
  const texto = `${ej.Titulo || ''} ${ej.Descripcion || ''} ${ej.Tipo || ''}`.toLowerCase();
  if (texto.includes('cuello') || texto.includes('cervical') || texto.includes('cabeza')) {
    return '1. Siéntate con la espalda recta y relaja los hombros.\n2. Inclina suavemente la cabeza llevando la oreja hacia el hombro derecho por 12 segundos.\n3. Regresa al centro inhalando y repite hacia el lado izquierdo.\n4. Evita movimientos bruscos o forzar el cuello.';
  }
  if (texto.includes('hombro') || texto.includes('trapecio') || texto.includes('escapul')) {
    return '1. Relaja los brazos a los costados del cuerpo.\n2. Inhala subiendo ambos hombros hacia las orejas.\n3. Exhala llevándolos hacia atrás y hacia abajo en círculos amplios.\n4. Realiza 8 repeticiones hacia atrás y 8 hacia adelante.';
  }
  if (texto.includes('ojo') || texto.includes('visual') || texto.includes('20-20-20') || texto.includes('vista') || texto.includes('parpade')) {
    return '1. Aparta la vista del monitor y enfoca un punto a 6 metros de distancia durante 20 segundos.\n2. Parpadea suavemente 10 veces para hidratar los ojos.\n3. Mira hacia arriba, abajo, izquierda y derecha sin mover la cabeza.\n4. Cierra los ojos 10 segundos respirando profundo.';
  }
  if (texto.includes('muñeca') || texto.includes('muneca') || texto.includes('mano') || texto.includes('dedo') || texto.includes('carpiano')) {
    return '1. Extiende un brazo al frente con la palma hacia arriba.\n2. Con la otra mano, lleva suavemente los dedos hacia abajo durante 15 segundos.\n3. Cambia de brazo y repite con la palma hacia abajo.\n4. Finaliza haciendo 10 círculos suaves con ambas muñecas.';
  }
  if (texto.includes('respir') || texto.includes('inhal') || texto.includes('diafragm') || texto.includes('oxigen')) {
    return '1. Apoya la espalda en el respaldo y coloca una mano sobre el abdomen.\n2. Inhala lento por la nariz durante 4 segundos inflando el abdomen.\n3. Mantén el aire 4 segundos con los hombros relajados.\n4. Exhala suavemente por la boca durante 6 segundos y repite el ciclo.';
  }
  if (texto.includes('pierna') || texto.includes('tobillo') || texto.includes('rodilla') || texto.includes('caminata') || texto.includes('circulac')) {
    return '1. Despega ligeramente un pie del suelo y realiza 8 giros de tobillo hacia cada lado.\n2. Alterna elevando talones y puntas de los pies 10 veces.\n3. Extiende una pierna al frente manteniendo 10 segundos y cambia de lado.\n4. Si estás de pie, marcha suavemente en tu lugar durante 30 segundos.';
  }
  if (texto.includes('mente') || texto.includes('concentra') || texto.includes('enfoque') || texto.includes('mindful')) {
    return '1. Cierra los ojos o baja la mirada y realiza 3 respiraciones profundas.\n2. Relaja la frente, la mandíbula y deja caer los hombros.\n3. Enfoca tu atención únicamente en la entrada y salida del aire por 30 segundos.\n4. Abre los ojos lentamente definiendo tu siguiente objetivo del día.';
  }
  return '1. Adopta una postura erguida con los pies bien apoyados en el suelo.\n2. Entrelaza las manos y estira los brazos suavemente alargando la espalda.\n3. Mantén el estiramiento de 12 a 15 segundos acompañando con respiración profunda.\n4. Regresa despacio a la posición inicial y repite el movimiento sin forzar.';
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
        descripcion: ej.Descripcion || 'Realiza el movimiento con suavidad y acompáñalo de respiración consciente.',
        instrucciones:
          ej.Instrucciones && String(ej.Instrucciones).trim().length >= 25
            ? ej.Instrucciones
            : obtenerInstruccionesPorDefecto(ej),
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
