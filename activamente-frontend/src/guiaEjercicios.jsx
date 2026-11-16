import React from 'react';

/**
 * Catálogo visual e instructivo de ejercicios para ActivaMente.
 * Detecta automáticamente el tipo de ejercicio por su título, descripción o categoría
 * y proporciona:
 *  - Ilustración SVG animada demostrativa del movimiento
 *  - Pasos numerados claros (Postura, Movimiento, Respiración, Repetición)
 *  - Consejo ergonómico de seguridad
 *  - Etiqueta de zona corporal / enfoque
 */

const CATALOGO_GUIAS = [
  {
    id: 'cuello',
    keywords: ['cuello', 'cervical', 'cabeza', 'barbilla', 'menton', 'mentón', 'inclinacion lateral', 'inclinación lateral'],
    categoria: 'Movilidad Cervical',
    icono: '🦒',
    colorBadge: 'bg-sky-100 text-sky-800 border-sky-200',
    postura: 'Sentado o de pie con la espalda recta',
    respiracion: 'Inhala al centro, exhala al inclinar suavemente',
    consejo: 'Nunca hagas giros bruscos ni lleves la cabeza totalmente hacia atrás; el movimiento debe sentirse como un alivio suave, sin dolor.',
    pasosPorDefecto: [
      'Siéntate con la espalda recta, apoya ambos pies en el piso y relaja los hombros hacia abajo.',
      'Inclina lentamente la cabeza llevando tu oreja derecha hacia el hombro derecho (sin levantar el hombro).',
      'Mantén la posición de 10 a 15 segundos sintiendo el estiramiento lateral y respira profundo.',
      'Regresa despacio al centro y repite el movimiento hacia el lado izquierdo. Alterna suavemente.'
    ]
  },
  {
    id: 'hombros',
    keywords: ['hombro', 'hombros', 'trapecio', 'omoplato', 'omóplato', 'escapula', 'escápula', 'encogimiento'],
    categoria: 'Liberación de Hombros',
    icono: '🙆‍♂️',
    colorBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    postura: 'Sentado o de pie con brazos sueltos a los costados',
    respiracion: 'Inhala al subir los hombros, exhala al rotarlos hacia atrás y bajar',
    consejo: 'Mantén la mandíbula relajada y evita arquear la espalda baja mientras realizas los círculos.',
    pasosPorDefecto: [
      'Deja caer tus brazos relajados a los costados del cuerpo o apoya las manos sobre tus muslos.',
      'Inhala profundo mientras subes ambos hombros lentamente hacia las orejas.',
      'Lleva los hombros hacia atrás juntando ligeramente los omóplatos y exhala bajándolos por completo.',
      'Realiza 8 círculos lentos hacia atrás y luego 8 círculos suaves hacia adelante.'
    ]
  },
  {
    id: 'visual',
    keywords: ['ojo', 'ojos', 'visual', 'vista', '20-20-20', 'parpadeo', 'parpadear', 'pantalla', 'mirada', 'palming'],
    categoria: 'Descanso Visual',
    icono: '👁️',
    colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    postura: 'Sentado cómodamente, apartando la vista del monitor',
    respiracion: 'Respiración lenta y natural mientras relajas los párpados',
    consejo: 'No presiones tus globos oculares con las manos y procura no mover la cabeza, solo los ojos.',
    pasosPorDefecto: [
      'Aparta la mirada de la pantalla y enfoca un objeto lejano (a unos 6 metros o a través de una ventana) durante 20 segundos.',
      'Parpadea de forma consciente y suave 10 veces seguidas para lubricar naturalmente tus ojos.',
      'Sin mover la cabeza, mira lentamente hacia arriba, abajo, izquierda y derecha (3 segundos en cada dirección).',
      'Cierra los ojos durante 10 segundos finales y respira profundo antes de volver a tu actividad.'
    ]
  },
  {
    id: 'munecas',
    keywords: ['muñeca', 'muneca', 'mano', 'manos', 'dedo', 'dedos', 'antebrazo', 'carpiano', 'teclado', 'ratón', 'mouse'],
    categoria: 'Manos y Muñecas',
    icono: '🤲',
    colorBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    postura: 'Sentado o de pie con los brazos extendidos al frente',
    respiracion: 'Respira de forma continua y relajada durante cada estiramiento',
    consejo: 'Detén el estiramiento apenas sientas una tensión agradable en el antebrazo; no dobles los dedos con fuerza excesiva.',
    pasosPorDefecto: [
      'Extiende tu brazo derecho al frente a la altura del hombro con la palma mirando hacia arriba.',
      'Con tu mano izquierda, toma suavemente los dedos de la mano derecha y llévalos hacia abajo y hacia ti durante 15 segundos.',
      'Ahora gira la palma hacia abajo y presiona suavemente el dorso de la mano para estirar la parte superior del antebrazo.',
      'Cambia de brazo y al finalizar realiza 10 giros circulares con ambas muñecas y abre/cierra los dedos.'
    ]
  },
  {
    id: 'espalda',
    keywords: ['espalda', 'columna', 'lumbar', 'torso', 'tronco', 'estiramiento superior', 'brazos arriba', 'postura', 'postural', 'pecho', 'torsion', 'torsión'],
    categoria: 'Espalda y Postura',
    icono: '🧘',
    colorBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    postura: 'Sentado al borde de la silla o de pie con pies al ancho de hombros',
    respiracion: 'Inhala al alargar la columna, exhala al estirar o girar suavemente',
    consejo: 'Alarga la espalda hacia el techo antes de girar o inclinarte, manteniendo el abdomen ligeramente activo.',
    pasosPorDefecto: [
      'Entrelaza los dedos de ambas manos y extiende los brazos hacia arriba con las palmas apuntando al techo.',
      'Inhala profundo alargando toda tu columna como si quisieras tocar el techo con las manos.',
      'Inclina ligeramente el torso hacia un costado durante 10 segundos, vuelve al centro y repite hacia el otro lado.',
      'Baja los brazos lentamente exhalando y lleva las manos detrás de la espalda para abrir el pecho por 10 segundos.'
    ]
  },
  {
    id: 'respiracion',
    keywords: ['respiracion', 'respiración', 'inhalar', 'exhalar', 'diafragmatica', 'diafragmática', 'oxigenacion', 'oxigenación', '4-7-8', 'cuadrada', 'aliento', 'pulmonar'],
    categoria: 'Respiración Consciente',
    icono: '🌬️',
    colorBadge: 'bg-teal-100 text-teal-800 border-teal-200',
    postura: 'Sentado con la espalda apoyada y una mano sobre el abdomen',
    respiracion: 'Inhala por la nariz (4 seg), mantén (4 seg) y exhala lento por la boca (4-6 seg)',
    consejo: 'Si sientes ligero mareo, retoma tu ritmo normal de respiración; el objetivo es calmar el sistema nervioso.',
    pasosPorDefecto: [
      'Adopta una postura cómoda, relaja los hombros y coloca una mano sobre tu pecho y otra sobre tu abdomen.',
      'Inhala lentamente por la nariz durante 4 segundos, sintiendo cómo se expande tu abdomen (no tus hombros).',
      'Mantén el aire suavemente durante 4 segundos manteniendo el cuerpo relajado.',
      'Exhala despacio por la boca durante 6 segundos liberando toda la tensión acumulada. Repite el ciclo.'
    ]
  },
  {
    id: 'piernas',
    keywords: ['pierna', 'piernas', 'tobillo', 'tobillos', 'rodilla', 'rodillas', 'sentadilla', 'caminata', 'pies', 'pantorrilla', 'gemelos', 'circulacion', 'circulación', 'marcha'],
    categoria: 'Activación de Piernas',
    icono: '🦵',
    colorBadge: 'bg-orange-100 text-orange-800 border-orange-200',
    postura: 'De pie junto a tu lugar (o sentado con espacio para extender las piernas)',
    respiracion: 'Inhala al preparar el movimiento y exhala durante el esfuerzo o extensión',
    consejo: 'Usa el respaldo de tu silla o el escritorio como apoyo si necesitas mantener el equilibrio.',
    pasosPorDefecto: [
      'Ponte de pie (o siéntate erguido) y despega un pie ligeramente del suelo para hacer 8 círculos con el tobillo hacia cada lado.',
      'Alterna elevando los talones (poniéndote de puntitas) y luego las puntas de los pies 10 veces para activar la circulación.',
      'Si estás de pie, realiza marchas suaves en tu lugar elevando las rodillas de forma alternada a ritmo moderado.',
      'Finaliza estirando una pierna al frente con el talón apoyado y la punta hacia arriba durante 12 segundos por lado.'
    ]
  },
  {
    id: 'mente',
    keywords: ['mente', 'concentracion', 'concentración', 'enfoque', 'mindfulness', 'atencion', 'atención', 'relajacion', 'relajación', 'escaneo', 'pausa mental', 'cognitivo'],
    categoria: 'Enfoque y Calma Mental',
    icono: '🧠',
    colorBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    postura: 'Sentado en posición cómoda con manos descansando sobre las piernas',
    respiracion: 'Respiración profunda, rítmica y silenciosa por la nariz',
    consejo: 'No pelees con los pensamientos pendientes del trabajo; simplemente obsérvalos pasar y regresa tu atención a tu cuerpo.',
    pasosPorDefecto: [
      'Cierra los ojos o baja la mirada a un punto fijo y toma 3 respiraciones profundas para desconectar de tu tarea anterior.',
      'Realiza un escaneo rápido desde tu frente hasta tus pies: relaja el entrecejo, suelta la mandíbula y baja los hombros.',
      'Concentra toda tu atención en el sonido y la sensación del aire entrando y saliendo por tu nariz durante 30 segundos.',
      'Antes de abrir los ojos, define una sola prioridad clara en la que te enfocarás al terminar esta pausa.'
    ]
  }
];

/**
 * Divide un texto de instrucciones de la base de datos en pasos limpios,
 * o usa los pasos detallados por defecto si el texto es muy corto.
 */
function extraerPasos(instruccionesDB, pasosPorDefecto) {
  if (!instruccionesDB || typeof instruccionesDB !== 'string') {
    return pasosPorDefecto;
  }

  const limpio = instruccionesDB.trim();
  if (limpio.length < 25) {
    return pasosPorDefecto;
  }

  // Intentar separar por saltos de línea o numeración ("1.", "1)", "•", "-")
  const porLineas = limpio
    .split(/\r?\n|(?=\d+[\.\)\-]\s)/)
    .map((s) => s.replace(/^(\d+[\.\)\-]|•|\-|\*)\s*/, '').trim())
    .filter((s) => s.length > 5);

  if (porLineas.length >= 2) {
    return porLineas;
  }

  // Si es un párrafo con varias oraciones separadas por punto
  const porOraciones = limpio
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter((s) => s.length > 8);

  if (porOraciones.length >= 2) {
    return porOraciones.map((s) => (s.endsWith('.') ? s : `${s}.`));
  }

  // Si solo tiene 1 frase corta en la BD, la ponemos como paso 1 y complementamos con los pasos guía
  return [limpio.endsWith('.') ? limpio : `${limpio}.`, ...pasosPorDefecto.slice(1)];
}

/**
 * Obtiene toda la información visual y de instrucciones para una actividad.
 */
export function obtenerGuiaEjercicio(actividad = {}) {
  const textoBusqueda = `${actividad.titulo || ''} ${actividad.descripcion || ''} ${actividad.instrucciones || ''} ${actividad.tipo || ''}`.toLowerCase();

  let guiaSeleccionada = CATALOGO_GUIAS.find((item) =>
    item.keywords.some((kw) => textoBusqueda.includes(kw))
  );

  // Fallback según tipo u objetivo si ninguna palabra clave coincidió directamente
  if (!guiaSeleccionada) {
    const tipo = (actividad.tipo || '').toLowerCase();
    if (tipo.includes('visual') || tipo.includes('ojo')) {
      guiaSeleccionada = CATALOGO_GUIAS.find((g) => g.id === 'visual');
    } else if (tipo.includes('respir') || tipo.includes('relaj')) {
      guiaSeleccionada = CATALOGO_GUIAS.find((g) => g.id === 'respiracion');
    } else if (tipo.includes('mental') || tipo.includes('cognitiv') || tipo.includes('concentra')) {
      guiaSeleccionada = CATALOGO_GUIAS.find((g) => g.id === 'mente');
    } else {
      guiaSeleccionada = CATALOGO_GUIAS.find((g) => g.id === 'espalda');
    }
  }

  const pasos = extraerPasos(actividad.instrucciones, guiaSeleccionada.pasosPorDefecto);

  return {
    idGuia: guiaSeleccionada.id,
    categoria: guiaSeleccionada.categoria,
    icono: guiaSeleccionada.icono,
    colorBadge: guiaSeleccionada.colorBadge,
    postura: guiaSeleccionada.postura,
    respiracion: guiaSeleccionada.respiracion,
    consejo: guiaSeleccionada.consejo,
    pasos
  };
}

/**
 * Ilustración SVG animada que demuestra visualmente cómo realizar el ejercicio.
 */
export function IlustracionEjercicio({ idGuia, multimedia, titulo }) {
  // Si en la BD existe una imagen/gif válida, mostrarla con fallback seguro
  const [errorImagen, setErrorImagen] = React.useState(false);

  if (multimedia && !errorImagen && (multimedia.startsWith('http') || multimedia.startsWith('/'))) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100">
        <img
          src={multimedia}
          alt={titulo || 'Demostración del ejercicio'}
          onError={() => setErrorImagen(true)}
          className="max-h-44 w-auto object-contain rounded-xl"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-52 bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] rounded-2xl flex flex-col items-center justify-center overflow-hidden border border-blue-100 p-3 select-none">
      {/* Estilos de animación locales para las demostraciones corporales */}
      <style>{`
        @keyframes tiltNeck {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(16deg); }
          75% { transform: rotate(-16deg); }
        }
        @keyframes rollShoulders {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes breatheCircle {
          0%, 100% { transform: scale(0.82); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0.95; }
        }
        @keyframes eyeScan {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes stretchArms {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-7px) scaleY(1.05); }
        }
        @keyframes flexWrist {
          0%, 100% { transform: rotate(0deg); }
          35% { transform: rotate(-22deg); }
          70% { transform: rotate(22deg); }
        }
        @keyframes legLift {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-12deg); }
        }
        @keyframes pulseWave {
          0%, 100% { transform: scale(0.95); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }
      `}</style>

      {/* CUELLO / MOVILIDAD CERVICAL */}
      {idGuia === 'cuello' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Arco guía de movimiento */}
          <path d="M 70 35 Q 110 12 150 35" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="4 4" />
          <polygon points="66,37 75,30 74,40" fill="#0284C7" />
          <polygon points="154,37 145,30 146,40" fill="#0284C7" />
          {/* Torso y hombros fijos */}
          <path d="M 65 135 C 65 100, 155 100, 155 135 Z" fill="#0284C7" opacity="0.85" />
          <rect x="102" y="82" width="16" height="22" rx="6" fill="#38BDF8" />
          {/* Cabeza animada inclinándose */}
          <g style={{ transformOrigin: '110px 90px', animation: 'tiltNeck 4s ease-in-out infinite' }}>
            <circle cx="110" cy="60" r="24" fill="#0369A1" />
            <circle cx="102" cy="56" r="2.5" fill="#FFFFFF" />
            <circle cx="118" cy="56" r="2.5" fill="#FFFFFF" />
            <path d="M 103 67 Q 110 72 117 67" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {/* HOMBROS / ROTACIÓN ESCAPULAR */}
      {idGuia === 'hombros' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Cabeza fija */}
          <circle cx="110" cy="48" r="21" fill="#0369A1" />
          <rect x="103" y="68" width="14" height="16" rx="5" fill="#38BDF8" />
          {/* Hombros y brazos animados */}
          <g style={{ animation: 'rollShoulders 2.6s ease-in-out infinite' }}>
            <path d="M 60 132 C 60 92, 160 92, 160 132 Z" fill="#0284C7" />
            <circle cx="68" cy="98" r="14" fill="#0369A1" />
            <circle cx="152" cy="98" r="14" fill="#0369A1" />
            {/* Flechas circulares en hombros */}
            <path d="M 42 95 A 14 14 0 1 1 56 112" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="58,112 51,107 52,116" fill="#0284C7" />
            <path d="M 178 95 A 14 14 0 1 0 164 112" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="162,112 169,107 168,116" fill="#0284C7" />
          </g>
        </svg>
      )}

      {/* DESCANSO VISUAL / REGLA 20-20-20 */}
      {idGuia === 'visual' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Contorno de ojos */}
          <path d="M 35 75 Q 72 45 105 75 Q 72 105 35 75 Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
          <path d="M 115 75 Q 148 45 185 75 Q 148 105 115 75 Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
          {/* Pupilas animadas moviéndose suavemente */}
          <g style={{ animation: 'eyeScan 3.5s ease-in-out infinite' }}>
            <circle cx="70" cy="75" r="11" fill="#0369A1" />
            <circle cx="67" cy="72" r="3.5" fill="#FFFFFF" />
            <circle cx="150" cy="75" r="11" fill="#0369A1" />
            <circle cx="147" cy="72" r="3.5" fill="#FFFFFF" />
          </g>
          {/* Indicadores de dirección */}
          <path d="M 75 26 L 145 26" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 4" />
          <polygon points="70,26 78,21 78,31" fill="#0284C7" />
          <polygon points="150,26 142,21 142,31" fill="#0284C7" />
          <text x="110" y="130" textAnchor="middle" fill="#0369A1" fontSize="11" fontWeight="bold">
            Mira a 6m de distancia • Parpadea
          </text>
        </svg>
      )}

      {/* MANOS Y MUÑECAS */}
      {idGuia === 'munecas' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Antebrazo */}
          <rect x="35" y="68" width="75" height="22" rx="10" fill="#0284C7" />
          {/* Articulación de la muñeca */}
          <circle cx="112" cy="79" r="9" fill="#38BDF8" />
          {/* Mano y dedos flexionándose */}
          <g style={{ transformOrigin: '112px 79px', animation: 'flexWrist 3s ease-in-out infinite' }}>
            <rect x="112" y="65" width="42" height="28" rx="8" fill="#0369A1" />
            <rect x="148" y="65" width="24" height="6" rx="3" fill="#0369A1" />
            <rect x="152" y="73" width="26" height="6" rx="3" fill="#0369A1" />
            <rect x="150" y="81" width="24" height="6" rx="3" fill="#0369A1" />
            <rect x="144" y="88" width="18" height="5" rx="2.5" fill="#0369A1" />
          </g>
          {/* Arco de flexión/extensión */}
          <path d="M 165 40 Q 190 79 165 118" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="4 4" />
          <polygon points="163,37 171,41 163,46" fill="#0284C7" />
          <polygon points="163,121 171,117 163,112" fill="#0284C7" />
        </svg>
      )}

      {/* ESPALDA Y POSTURA */}
      {idGuia === 'espalda' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          <g style={{ transformOrigin: '110px 130px', animation: 'stretchArms 3.2s ease-in-out infinite' }}>
            {/* Brazos estirados arriba */}
            <path d="M 82 95 Q 68 50 92 22" fill="none" stroke="#0284C7" strokeWidth="11" strokeLinecap="round" />
            <path d="M 138 95 Q 152 50 128 22" fill="none" stroke="#0284C7" strokeWidth="11" strokeLinecap="round" />
            {/* Manos entrelazadas arriba */}
            <ellipse cx="110" cy="20" rx="18" ry="6" fill="#0369A1" />
            {/* Cabeza y torso */}
            <circle cx="110" cy="58" r="17" fill="#0369A1" />
            <path d="M 78 135 L 85 82 L 135 82 L 142 135 Z" fill="#0284C7" />
            {/* Línea de columna erguida */}
            <line x1="110" y1="84" x2="110" y2="132" stroke="#E0F2FE" strokeWidth="3" strokeDasharray="4 4" />
          </g>
          {/* Flechas de elongación hacia arriba */}
          <path d="M 45 95 L 45 40" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="45,33 40,42 50,42" fill="#0284C7" />
          <path d="M 175 95 L 175 40" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="175,33 170,42 180,42" fill="#0284C7" />
        </svg>
      )}

      {/* RESPIRACIÓN CONSCIENTE */}
      {idGuia === 'respiracion' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Ondas de expansión respiratoria */}
          <circle
            cx="110"
            cy="72"
            r="48"
            fill="#38BDF8"
            style={{ transformOrigin: '110px 72px', animation: 'breatheCircle 5s ease-in-out infinite' }}
          />
          <circle
            cx="110"
            cy="72"
            r="34"
            fill="#0284C7"
            style={{ transformOrigin: '110px 72px', animation: 'breatheCircle 5s ease-in-out infinite' }}
          />
          <circle cx="110" cy="72" r="22" fill="#0369A1" />
          <text x="110" y="76" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
            4s - 4s - 6s
          </text>
          <text x="110" y="138" textAnchor="middle" fill="#0369A1" fontSize="11" fontWeight="bold">
            Inhala al expandir • Exhala al contraer
          </text>
        </svg>
      )}

      {/* PIERNA / ACTIVACIÓN INFERIOR */}
      {idGuia === 'piernas' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Silla de apoyo */}
          <path d="M 55 55 L 55 130 M 55 95 L 95 95 L 95 130" fill="none" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
          {/* Persona sentada/apoyada activando pierna */}
          <circle cx="82" cy="40" r="13" fill="#0369A1" />
          <path d="M 80 55 L 80 92" stroke="#0284C7" strokeWidth="14" strokeLinecap="round" />
          {/* Pierna de apoyo */}
          <path d="M 82 92 L 105 92 L 105 128" fill="none" stroke="#0369A1" strokeWidth="10" strokeLinecap="round" />
          {/* Pierna en extensión animada */}
          <g style={{ transformOrigin: '85px 92px', animation: 'legLift 2.8s ease-in-out infinite' }}>
            <path d="M 85 92 L 148 92" fill="none" stroke="#0284C7" strokeWidth="10" strokeLinecap="round" />
            <path d="M 148 92 L 154 80" fill="none" stroke="#0369A1" strokeWidth="8" strokeLinecap="round" />
          </g>
          {/* Flecha de movimiento */}
          <path d="M 168 105 Q 175 82 164 65" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="3 3" />
          <polygon points="162,61 170,65 162,70" fill="#0284C7" />
        </svg>
      )}

      {/* MENTE / MINDFULNESS Y CONCENTRACIÓN */}
      {idGuia === 'mente' && (
        <svg viewBox="0 0 220 150" className="w-48 h-36">
          {/* Ondas de calma mental */}
          <circle
            cx="110"
            cy="68"
            r="46"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            style={{ transformOrigin: '110px 68px', animation: 'pulseWave 4s ease-in-out infinite' }}
          />
          <circle
            cx="110"
            cy="68"
            r="34"
            fill="#BAE6FD"
            opacity="0.6"
            style={{ transformOrigin: '110px 68px', animation: 'pulseWave 4s ease-in-out infinite' }}
          />
          {/* Silueta meditando */}
          <circle cx="110" cy="48" r="14" fill="#0369A1" />
          <path d="M 86 96 C 86 68, 134 68, 134 96 Z" fill="#0284C7" />
          <path d="M 75 102 Q 110 114 145 102" fill="none" stroke="#0369A1" strokeWidth="8" strokeLinecap="round" />
          <text x="110" y="135" textAnchor="middle" fill="#0369A1" fontSize="11" fontWeight="bold">
            Relaja hombros • Enfoca tu atención
          </text>
        </svg>
      )}

      <span className="text-[11px] font-semibold text-[#0369A1] bg-white/90 px-3 py-0.5 rounded-full shadow-sm border border-blue-100 mt-1">
        Guía visual animada en tiempo real
      </span>
    </div>
  );
}
