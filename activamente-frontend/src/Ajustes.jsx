import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export default function Ajustes() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerificado, setEmailVerificado] = useState(true);
  const [diasRestantesVerificacion, setDiasRestantesVerificacion] = useState(7);
  const [fechaLimiteVerificacion, setFechaLimiteVerificacion] = useState(null);
  const [reenviandoCorreo, setReenviandoCorreo] = useState(false);
  const [estadoVerificacion, setEstadoVerificacion] = useState({
    tipo: '',
    texto: '',
    previewUrl: '',
    enlaceVerificacion: ''
  });

  // Preferencias del perfil y pausas
  const [ocupacion, setOcupacion] = useState('estudiante');
  const [fotoPerfil, setFotoPerfil] = useState('https://api.dicebear.com/7.x/notionists/svg?seed=Generico');
  const [fotoModificada, setFotoModificada] = useState(false);
  const [ubicacionPorDefecto, setUbicacionPorDefecto] = useState('oficina');
  const [tiempoPorDefecto, setTiempoPorDefecto] = useState('10');
  const [objetivoPorDefecto, setObjetivoPorDefecto] = useState('concentracion');
  const [metaDiariaMin, setMetaDiariaMin] = useState('20');
  const [sonidoTemporizador, setSonidoTemporizador] = useState(true);
  const [frecuenciaRecordatorioMin, setFrecuenciaRecordatorioMin] = useState('0');
  const [notificacionesEmail, setNotificacionesEmail] = useState(true);
  const [temaOscuro, setTemaOscuro] = useState(false);
  const [chatbotHabilitado, setChatbotHabilitado] = useState(true);

  const [estadoGuardado, setEstadoGuardado] = useState({ tipo: '', texto: '' });

  // Estados para Cambiar Correo
  const [nuevoEmailInput, setNuevoEmailInput] = useState('');
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [estadoCambioEmail, setEstadoCambioEmail] = useState({ tipo: '', texto: '' });

  // Estados para Cambiar Contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [estadoPassword, setEstadoPassword] = useState({ tipo: '', texto: '' });

  // Estados para Resumen por Correo y Exportación CSV
  const [enviandoResumen, setEnviandoResumen] = useState(false);
  const [estadoResumen, setEstadoResumen] = useState({ tipo: '', texto: '' });
  const [exportandoCsv, setExportandoCsv] = useState(false);

  // Estados para Eliminar Cuenta
  const [mostrarZonaPeligro, setMostrarZonaPeligro] = useState(false);
  const [passwordEliminar, setPasswordEliminar] = useState('');
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const avataresPredefinidos = [
    'https://api.dicebear.com/7.x/notionists/svg?seed=Ramses',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Caleb',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Jude'
  ];

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const response = await api.get('/usuarios/perfil');
        const data = response.data;
        setNombre(data.nombre || '');
        setEmail(data.email || '');
        setNuevoEmailInput(data.email || '');
        setEmailVerificado(Boolean(data.emailVerificado));
        setDiasRestantesVerificacion(data.diasRestantesVerificacion ?? 7);
        setFechaLimiteVerificacion(data.fechaLimiteVerificacion || null);
        setOcupacion(data.ocupacion || 'estudiante');
        const foto = data.fotoPerfil || 'https://api.dicebear.com/7.x/notionists/svg?seed=Generico';
        setFotoPerfil(foto);
        setUbicacionPorDefecto(data.ubicacionPorDefecto || 'oficina');
        setTiempoPorDefecto(data.tiempoPorDefecto ? String(data.tiempoPorDefecto) : '10');
        setObjetivoPorDefecto(data.objetivoPorDefecto || 'concentracion');
        setMetaDiariaMin(data.metaDiariaMin ? String(data.metaDiariaMin) : '20');
        setSonidoTemporizador(data.sonidoTemporizador !== undefined ? Boolean(data.sonidoTemporizador) : true);
        setFrecuenciaRecordatorioMin(data.frecuenciaRecordatorioMin !== undefined ? String(data.frecuenciaRecordatorioMin) : '0');
        setNotificacionesEmail(data.notificacionesEmail !== undefined ? Boolean(data.notificacionesEmail) : true);
        const botActivo = data.chatbotHabilitado !== undefined ? Boolean(data.chatbotHabilitado) : true;
        setChatbotHabilitado(botActivo);
        localStorage.setItem('chatbotHabilitado', String(botActivo));

        const esOscuro = Boolean(data.temaOscuro);
        setTemaOscuro(esOscuro);
        document.documentElement.classList.toggle('tema-oscuro', esOscuro);
        localStorage.setItem('temaOscuro', String(esOscuro));
        localStorage.setItem('fotoPerfil', foto);
        window.dispatchEvent(new Event('perfilActualizado'));
      } catch (error) {
        if (error.response?.status === 401 && error.response?.data?.cuentaEliminada) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        console.error('Error al cargar el perfil:', error);
      }
    };
    cargarPerfil();
  }, [navigate]);

  const probarSonidoCampana = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.6);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTemaOscuro = (nuevoValor) => {
    setTemaOscuro(nuevoValor);
    document.documentElement.classList.toggle('tema-oscuro', nuevoValor);
    localStorage.setItem('temaOscuro', String(nuevoValor));
  };

  const handleSeleccionarRecordatorio = async (valorMinutos) => {
    setFrecuenciaRecordatorioMin(valorMinutos);
    if (Number(valorMinutos) > 0 && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        // Ignorar si no soporta permisos
      }
    }
  };

  const handleReenviarVerificacion = async () => {
    setReenviandoCorreo(true);
    setEstadoVerificacion({ tipo: '', texto: '', previewUrl: '', enlaceVerificacion: '' });
    try {
      const res = await api.post('/auth/reenviar-verificacion', { email });
      if (res.data.email) {
        setEmail(res.data.email);
        setNuevoEmailInput(res.data.email);
      }
      setEstadoVerificacion({
        tipo: 'exito',
        texto: res.data.mensaje || '¡Correo de confirmación reenviado exitosamente!',
        previewUrl: res.data.previewUrl || '',
        enlaceVerificacion: res.data.enlaceVerificacion || ''
      });
    } catch (error) {
      setEstadoVerificacion({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo reenviar el correo de confirmación.',
        previewUrl: '',
        enlaceVerificacion: ''
      });
    } finally {
      setReenviandoCorreo(false);
    }
  };

  const handleSubirFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFotoPerfil(compressedDataUrl);
        setFotoModificada(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const construirPayloadPerfil = () => ({
    nombre,
    ocupacion,
    fotoPerfil,
    ubicacionPorDefecto,
    tiempoPorDefecto: parseInt(tiempoPorDefecto, 10) || 10,
    objetivoPorDefecto,
    metaDiariaMin: parseInt(metaDiariaMin, 10) || 20,
    sonidoTemporizador,
    frecuenciaRecordatorioMin: parseInt(frecuenciaRecordatorioMin, 10) || 0,
    notificacionesEmail,
    temaOscuro,
    chatbotHabilitado
  });

  const confirmarCambioFoto = async () => {
    setEstadoGuardado({ tipo: '', texto: '' });
    try {
      await api.put('/usuarios/perfil', construirPayloadPerfil());
      localStorage.setItem('fotoPerfil', fotoPerfil);
      window.dispatchEvent(new Event('perfilActualizado'));
      setFotoModificada(false);
      setEstadoGuardado({ tipo: 'exito', texto: '¡Foto de perfil actualizada correctamente en la base de datos!' });
    } catch (error) {
      setEstadoGuardado({ tipo: 'error', texto: error.response?.data?.detalle || 'Error al guardar la foto en el servidor' });
    }
  };

  const guardarCambiosPersonales = async (e) => {
    e.preventDefault();
    setEstadoGuardado({ tipo: '', texto: '' });
    try {
      await api.put('/usuarios/perfil', construirPayloadPerfil());
      localStorage.setItem('fotoPerfil', fotoPerfil);
      window.dispatchEvent(new Event('perfilActualizado'));
      setFotoModificada(false);
      setEstadoGuardado({ tipo: 'exito', texto: '¡Todos tus ajustes y preferencias se guardaron correctamente!' });
    } catch (error) {
      setEstadoGuardado({ tipo: 'error', texto: error.response?.data?.detalle || 'Error al guardar los ajustes' });
    }
  };

  const handleCambiarEmail = async (e) => {
    e.preventDefault();
    setEstadoCambioEmail({ tipo: '', texto: '' });
    setCambiandoEmail(true);
    try {
      const res = await api.put('/usuarios/cambiar-email', { nuevoEmail: nuevoEmailInput });
      setEmail(res.data.email);
      setEmailVerificado(false);
      setEstadoCambioEmail({ tipo: 'exito', texto: res.data.mensaje });
      window.dispatchEvent(new Event('perfilActualizado'));
    } catch (error) {
      setEstadoCambioEmail({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo actualizar el correo electrónico.'
      });
    } finally {
      setCambiandoEmail(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setEstadoPassword({ tipo: '', texto: '' });

    if (passwordNueva !== passwordConfirmar) {
      setEstadoPassword({ tipo: 'error', texto: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    setCambiandoPassword(true);
    try {
      const res = await api.put('/usuarios/cambiar-password', {
        passwordActual,
        passwordNueva
      });
      setEstadoPassword({ tipo: 'exito', texto: res.data.mensaje });
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (error) {
      setEstadoPassword({
        tipo: 'error',
        texto: error.response?.data?.error || 'No se pudo cambiar la contraseña.'
      });
    } finally {
      setCambiandoPassword(false);
    }
  };

  const handleEnviarResumenCorreo = async () => {
    setEnviandoResumen(true);
    setEstadoResumen({ tipo: '', texto: '' });
    try {
      const res = await api.post('/usuarios/enviar-resumen-email');
      setEstadoResumen({ tipo: 'exito', texto: res.data.mensaje });
    } catch (error) {
      setEstadoResumen({
        tipo: 'error',
        texto: error.response?.data?.error || 'Error al enviar el resumen por correo.'
      });
    } finally {
      setEnviandoResumen(false);
    }
  };

  const handleExportarCsv = async () => {
    setExportandoCsv(true);
    try {
      const res = await api.get('/usuarios/exportar-historial');
      const sesiones = res.data?.sesiones || [];

      const encabezados = [
        'ID Sesion',
        'Fecha y Hora',
        'Objetivo',
        'Ubicacion',
        'Duracion (min)',
        'Total Ejercicios',
        'Calificacion Esfuerzo (1-5)',
        'Calificacion Utilidad (1-5)'
      ];

      const filas = sesiones.map((s) => [
        s.id,
        s.fechaInicio ? new Date(s.fechaInicio).toLocaleString('es-MX') : '',
        s.objetivo || '',
        s.ubicacion || '',
        s.tiempoMin || 0,
        s.totalEjercicios || 0,
        s.calificacionEsfuerzo ?? 'Sin evaluar',
        s.calificacionUtilidad ?? 'Sin evaluar'
      ]);

      const csvContent =
        '\uFEFF' +
        [encabezados, ...filas]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Historial_ActivaMente_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
    } finally {
      setExportandoCsv(false);
    }
  };

  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    setErrorEliminar('');
    setEliminandoCuenta(true);
    try {
      await api.delete('/usuarios/cuenta', { data: { password: passwordEliminar } });
      localStorage.removeItem('token');
      localStorage.removeItem('fotoPerfil');
      navigate('/');
    } catch (error) {
      setErrorEliminar(error.response?.data?.error || 'No se pudo eliminar la cuenta.');
    } finally {
      setEliminandoCuenta(false);
    }
  };

  const formatearFechaLimite = (fechaIso) => {
    if (!fechaIso) return '';
    return new Date(fechaIso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in text-gray-800 font-sans pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Ajustes de Cuenta</h1>
          <p className="text-gray-500 mt-1">
            Personaliza tu experiencia, metas de bienestar, recordatorios y seguridad.
          </p>
        </div>

        {/* Interruptor rápido de Modo Oscuro / Claro */}
        <button
          type="button"
          onClick={() => handleToggleTemaOscuro(!temaOscuro)}
          className="flex items-center gap-2.5 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl shadow-sm text-sm font-bold text-[#0F172A] hover:border-[#0284C7] transition-all cursor-pointer self-start sm:self-auto"
        >
          <span>{temaOscuro ? '🌙 Modo Oscuro Activo' : '☀️ Modo Claro Activo'}</span>
        </button>
      </div>

      {/* SECCIÓN DE ESTADO DE VERIFICACIÓN DE LA CUENTA */}
      {!emailVerificado ? (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="text-lg font-extrabold text-amber-900">
                    Cuenta aún no verificada
                  </h2>
                  <span className="bg-amber-200/80 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    ⏳ {diasRestantesVerificacion} {diasRestantesVerificacion === 1 ? 'día restante' : 'días restantes'}
                  </span>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Tu cuenta está pendiente de confirmación en el correo <strong>{email}</strong>. Si no confirmas tu correo en <strong>1 semana (7 días)</strong> desde su creación
                  {fechaLimiteVerificacion ? ` (antes del ${formatearFechaLimite(fechaLimiteVerificacion)})` : ''}, la cuenta se eliminará automáticamente.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 max-w-sm">
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Correo electrónico para verificación:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.correo@gmail.com"
                      className="w-full border border-amber-300 rounded-xl px-3.5 py-2 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-[#0284C7] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleReenviarVerificacion}
                    disabled={reenviandoCorreo}
                    className="sm:mt-5 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    {reenviandoCorreo ? 'Enviando correo...' : '📨 Reenviar correo de confirmación'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {estadoVerificacion.texto && (
            <div
              className={`mt-4 p-4 rounded-2xl text-sm font-medium border ${
                estadoVerificacion.tipo === 'exito'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <p>
                {estadoVerificacion.tipo === 'exito' ? '✅ ' : '❌ '}
                {estadoVerificacion.texto}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
              ✅
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-emerald-900">
                Cuenta Verificada
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Tu correo electrónico <strong>{email}</strong> ha sido confirmado y tu cuenta está activa permanentemente.
              </p>
            </div>
          </div>
          <span className="bg-white text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full self-start sm:self-auto">
            Correo verificado
          </span>
        </div>
      )}

      {estadoGuardado.texto && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border ${estadoGuardado.tipo === 'exito' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {estadoGuardado.tipo === 'exito' ? '✅ ' : '❌ '}{estadoGuardado.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA: Foto de Perfil + Exportar Datos + Resumen por Correo */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-[#0F172A] mb-6 w-full text-left">Foto de Perfil</h2>

            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-50 shadow-md mb-4 bg-gray-50">
              <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
            </div>

            <label className="bg-[#F8FAFC] hover:bg-gray-100 border border-gray-200 text-[#0F172A] font-semibold py-2 px-4 rounded-xl cursor-pointer transition-colors text-sm w-full mb-6">
              📷 Subir mi propia foto
              <input type="file" accept="image/*" className="hidden" onChange={handleSubirFoto} />
            </label>

            <h3 className="text-sm font-semibold text-gray-500 mb-3 w-full text-left">O elige un avatar:</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {avataresPredefinidos.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFotoPerfil(avatar);
                    setFotoModificada(true);
                  }}
                  className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all hover:scale-110 ${fotoPerfil === avatar ? 'border-[#0284C7] shadow-md scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full bg-gray-50" />
                </button>
              ))}
            </div>

            {fotoModificada && (
              <button
                type="button"
                onClick={confirmarCambioFoto}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm animate-fade-in cursor-pointer"
              >
                ✅ Confirmar nueva foto
              </button>
            )}
          </div>

          {/* TARJETA DE REPORTES Y DATOS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Mis Datos y Reportes</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Recibe un reporte de tu racha actual en tu correo o descarga tu historial completo en formato Excel (CSV).
            </p>

            <button
              type="button"
              onClick={handleEnviarResumenCorreo}
              disabled={enviandoResumen}
              className="w-full bg-[#0284C7] hover:bg-[#0369a1] disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs cursor-pointer"
            >
              {enviandoResumen ? 'Enviando a tu correo...' : '📧 Enviarme resumen de progreso al correo'}
            </button>

            {estadoResumen.texto && (
              <p className={`text-xs font-semibold p-2.5 rounded-xl ${estadoResumen.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {estadoResumen.tipo === 'exito' ? '✅ ' : '❌ '}{estadoResumen.texto}
              </p>
            )}

            <button
              type="button"
              onClick={handleExportarCsv}
              disabled={exportandoCsv}
              className="w-full bg-[#F8FAFC] hover:bg-gray-100 border border-gray-200 text-[#0F172A] font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer"
            >
              {exportandoCsv ? 'Generando archivo...' : '📥 Descargar historial en CSV (Excel)'}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formularios de Preferencias y Seguridad */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* FORMULARIO 1: Preferencias Generales, Metas y Recordatorios */}
          <form onSubmit={guardarCambiosPersonales} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-4">1. Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ocupación</label>
                  <select
                    value={ocupacion}
                    onChange={(e) => setOcupacion(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="trabajador_oficina">Trabajador de Oficina</option>
                    <option value="docente">Docente</option>
                    <option value="operativo">Personal Operativo</option>
                    <option value="personal_administrativo">Personal Administrativo</option>
                    <option value="oficinista">Oficinista</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">2. Personalización de Pausas y Metas</h2>
              <p className="text-sm text-gray-500 mb-5">Configura tus valores favoritos y tu meta diaria de bienestar.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">Ubicación frecuente</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['oficina', 'casa', 'aula', 'area_trabajo'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setUbicacionPorDefecto(loc)}
                        className={`py-2 px-2 rounded-xl border text-sm font-medium transition-all capitalize cursor-pointer ${ubicacionPorDefecto === loc ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {loc.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">Tiempo preferido por pausa</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['5', '10', '12'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTiempoPorDefecto(t)}
                        className={`py-2 px-1 rounded-xl border text-sm font-medium transition-all cursor-pointer ${tiempoPorDefecto === t ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {t} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">Objetivo favorito por defecto</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'concentracion', label: '🎯 Concentración y Enfoque' },
                      { id: 'activacion_fisica', label: '💪 Activación Física' },
                      { id: 'mente_cuerpo', label: '🧠 Mente y Cuerpo' }
                    ].map((obj) => (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => setObjetivoPorDefecto(obj.id)}
                        className={`py-2 px-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${objetivoPorDefecto === obj.id ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {obj.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">🎯 Meta diaria de bienestar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['10', '20', '30', '45'].map((meta) => (
                      <button
                        key={meta}
                        type="button"
                        onClick={() => setMetaDiariaMin(meta)}
                        className={`py-2.5 px-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${metaDiariaMin === meta ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0369a1]' : 'border-gray-200 text-gray-600'}`}
                      >
                        {meta} min / día
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Se mostrará como barra de progreso diaria en tu pantalla de Inicio.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">3. Recordatorios Inteligentes y Sonido</h2>
              <p className="text-sm text-gray-500 mb-5">Configura avisos automáticos para no olvidar tus pausas activas.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔔 Frecuencia de recordatorio en navegador
                  </label>
                  <select
                    value={frecuenciaRecordatorioMin}
                    onChange={(e) => handleSeleccionarRecordatorio(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-sm"
                  >
                    <option value="0">Desactivado</option>
                    <option value="30">Cada 30 minutos</option>
                    <option value="45">Cada 45 minutos (Recomendado)</option>
                    <option value="60">Cada 1 hora</option>
                    <option value="120">Cada 2 horas</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer">
                    <span className="text-sm font-semibold text-gray-700">🔔 Sonido al terminar temporizador</span>
                    <input
                      type="checkbox"
                      checked={sonidoTemporizador}
                      onChange={(e) => setSonidoTemporizador(e.target.checked)}
                      className="w-4 h-4 accent-[#0284C7]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={probarSonidoCampana}
                    className="text-xs font-bold text-[#0284C7] hover:underline self-start cursor-pointer"
                  >
                    🔊 Probar sonido de campana
                  </button>
                </div>

                {/* INTERRUPTOR DEL ASISTENTE VIRTUAL MENTI */}
                <div className="md:col-span-2 pt-2">
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        🤖 Mostrar Asistente Virtual Menti
                        {chatbotHabilitado ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Activo</span>
                        ) : (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Oculto</span>
                        )}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Muestra u oculta la burbuja flotante del asistente inteligente en la esquina inferior derecha de la plataforma.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={chatbotHabilitado}
                      onChange={(e) => {
                        const nuevoEstado = e.target.checked;
                        setChatbotHabilitado(nuevoEstado);
                        localStorage.setItem('chatbotHabilitado', String(nuevoEstado));
                        window.dispatchEvent(new Event('perfilActualizado'));
                      }}
                      className="w-5 h-5 accent-[#0284C7] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold py-3 px-8 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Guardar Preferencias
              </button>
            </div>
          </form>

          {/* FORMULARIO 2: Seguridad (Cambiar Correo y Cambiar Contraseña) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-1">4. Seguridad de la Cuenta</h2>
              <p className="text-sm text-gray-500 mb-5">Actualiza tu correo electrónico real o cambia tu contraseña de acceso.</p>

              {/* Cambiar Correo Electrónico */}
              <form onSubmit={handleCambiarEmail} className="mb-8 pb-8 border-b border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cambiar Correo Electrónico (Se enviará confirmación vía Brevo)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={nuevoEmailInput}
                    onChange={(e) => setNuevoEmailInput(e.target.value)}
                    placeholder="nuevo.correo@gmail.com"
                    required
                    className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={cambiandoEmail}
                    className="bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    {cambiandoEmail ? 'Verificando...' : 'Actualizar Correo'}
                  </button>
                </div>
                {estadoCambioEmail.texto && (
                  <p className={`mt-3 text-xs font-semibold p-3 rounded-xl ${estadoCambioEmail.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {estadoCambioEmail.tipo === 'exito' ? '✅ ' : '❌ '}{estadoCambioEmail.texto}
                  </p>
                )}
              </form>

              {/* Cambiar Contraseña */}
              <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-[#0F172A]">Cambiar Contraseña</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña Actual</label>
                    <input
                      type="password"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={passwordNueva}
                      onChange={(e) => setPasswordNueva(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      value={passwordConfirmar}
                      onChange={(e) => setPasswordConfirmar(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0284C7] outline-none text-sm"
                    />
                  </div>
                </div>

                {estadoPassword.texto && (
                  <p className={`text-xs font-semibold p-3 rounded-xl ${estadoPassword.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {estadoPassword.tipo === 'exito' ? '✅ ' : '❌ '}{estadoPassword.texto}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={cambiandoPassword}
                    className="bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer"
                  >
                    {cambiandoPassword ? 'Actualizando...' : '🔑 Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ZONA DE PELIGRO: Eliminar Cuenta */}
          <div className="bg-red-50/60 p-6 rounded-3xl border border-red-200 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-red-900">⚠️ Zona de Peligro</h2>
                <p className="text-xs text-red-700 mt-0.5">
                  Eliminar tu cuenta borrará permanentemente tu perfil, sesiones y progreso guardado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarZonaPeligro(!mostrarZonaPeligro)}
                className="bg-white hover:bg-red-100 text-red-700 border border-red-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
              >
                {mostrarZonaPeligro ? 'Cancelar' : '🗑️ Quiero eliminar mi cuenta'}
              </button>
            </div>

            {mostrarZonaPeligro && (
              <form onSubmit={handleEliminarCuenta} className="pt-3 border-t border-red-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-red-900 mb-1">
                    Ingresa tu contraseña actual para confirmar la eliminación definitiva:
                  </label>
                  <input
                    type="password"
                    value={passwordEliminar}
                    onChange={(e) => setPasswordEliminar(e.target.value)}
                    placeholder="Tu contraseña actual"
                    required
                    className="w-full border border-red-300 rounded-xl p-2.5 bg-white text-sm outline-none"
                  />
                  {errorEliminar && <p className="text-xs text-red-700 font-bold mt-1">❌ {errorEliminar}</p>}
                </div>
                <button
                  type="submit"
                  disabled={eliminandoCuenta}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  {eliminandoCuenta ? 'Eliminando...' : 'Confirmar eliminación permanente'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
