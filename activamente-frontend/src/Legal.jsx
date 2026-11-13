import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Legal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pestana, setPestana] = useState(
    location.pathname.includes('terminos') ? 'terminos' : 'privacidad'
  );

  useEffect(() => {
    setPestana(location.pathname.includes('terminos') ? 'terminos' : 'privacidad');
  }, [location.pathname]);

  const tieneSesion = Boolean(localStorage.getItem('token'));

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#0284C7] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-2">
              Marco Legal y Privacidad • Nuevo León, México
            </span>
            <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Centro Legal de ActivaMente
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-white hover:bg-gray-100 border border-gray-200 text-[#0F172A] font-semibold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              ← Regresar
            </button>
            <Link
              to={tieneSesion ? '/app/inicio' : '/registro'}
              className="bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              {tieneSesion ? 'Ir a la App' : 'Crear Cuenta'}
            </Link>
          </div>
        </div>

        {/* Selector de pestañas */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setPestana('privacidad')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              pestana === 'privacidad'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            🔒 Aviso de Privacidad
          </button>
          <button
            type="button"
            onClick={() => setPestana('terminos')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              pestana === 'terminos'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0F172A]'
            }`}
          >
            📜 Términos y Deslinde Médico
          </button>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10 space-y-6 text-sm leading-relaxed text-gray-600">
          {pestana === 'privacidad' ? (
            <>
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-extrabold text-[#0F172A]">
                  Aviso de Privacidad Integral
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de los Estados Unidos Mexicanos.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">1. Identidad y Domicilio del Responsable</h3>
                <p>
                  <strong>ActivaMente</strong>, proyecto digital operado en el Estado de <strong>Nuevo León, México</strong>, es responsable del tratamiento, uso y protección de sus datos personales. Para cualquier duda o solicitud relacionada con su privacidad, puede contactarnos a través del correo de soporte de la plataforma.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">2. Datos Personales que Recabamos</h3>
                <p>Para brindarle los servicios de la plataforma, recabamos únicamente los siguientes datos:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Datos de identificación y contacto:</strong> Nombre completo y correo electrónico real.</li>
                  <li><strong>Datos de perfil y preferencias:</strong> Ocupación, fotografía de perfil o avatar, ubicación habitual de pausa, duración y objetivo preferido, meta diaria y configuración de tema/notificaciones.</li>
                  <li><strong>Datos de actividad en la plataforma:</strong> Historial de pausas activas completadas, duración y calificaciones de esfuerzo/utilidad.</li>
                </ul>
                <p className="text-xs bg-blue-50 text-blue-900 border border-blue-100 p-3 rounded-xl">
                  ℹ️ ActivaMente <strong>no recaba datos financieros, bancarios ni historiales clínicos médicos</strong>. Su contraseña se almacena cifrada de forma irreversible mediante algoritmos criptográficos (`bcrypt`).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">3. Finalidades del Tratamiento</h3>
                <p>Sus datos personales se utilizan exclusivamente para las siguientes finalidades primarias necesarias para el servicio:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Crear, autenticar y administrar su cuenta de usuario.</li>
                  <li>Enviar correos electrónicos de verificación de cuenta (con plazo de 7 días para confirmar) y enlaces temporales de recuperación de contraseña.</li>
                  <li>Personalizar sus rutinas de pausas activas, calcular su racha de días y mostrar su progreso diario.</li>
                  <li>Enviar resúmenes de progreso por correo electrónico cuando usted lo solicite expresamente.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">4. Transferencia de Datos a Terceros</h3>
                <p>
                  ActivaMente no vende ni comercializa sus datos personales. Únicamente se comparten los datos mínimos indispensables con proveedores tecnológicos para operar funciones específicas:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Brevo (Sendinblue):</strong> Proveedor de envío de correo electrónico transaccional para entregar enlaces de confirmación, recuperación de contraseña y resúmenes solicitados.</li>
                  <li><strong>Google Gemini API:</strong> Cuando el usuario decide utilizar el asistente virtual opcional "Menti", el texto de su consulta se envía para generar la respuesta orientativa. Evite ingresar datos personales sensibles en el chat.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h3>
                <p>
                  Usted tiene derecho a acceder a sus datos, rectificarlos si son inexactos, cancelarlos (eliminarlos) u oponerse a su tratamiento. Para facilitarle el ejercicio inmediato de sus Derechos ARCO, la plataforma le ofrece directamente en la sección <strong>Ajustes de Cuenta</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Acceso:</strong> Descarga inmediata de su historial completo en formato CSV (Excel).</li>
                  <li><strong>Rectificación:</strong> Edición directa de su nombre, ocupación, correo y preferencias.</li>
                  <li><strong>Cancelación:</strong> Botón de eliminación permanente de cuenta e historial en la sección <em>Zona de Peligro</em>, además de la eliminación automática a los 7 días si una cuenta nueva no confirma su correo.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">6. Uso de Almacenamiento Local (`localStorage`)</h3>
                <p>
                  Utilizamos almacenamiento local del navegador estrictamente para fines técnicos: mantener su sesión iniciada mediante token JWT, recordar su preferencia de Modo Oscuro/Claro, visibilidad del asistente virtual y caché de su avatar.
                </p>
              </section>
            </>
          ) : (
            <>
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-extrabold text-[#0F172A]">
                  Términos y Condiciones de Uso
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Aplicables al uso de la plataforma web ActivaMente conforme a la legislación vigente en México.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">1. Aceptación de los Términos</h3>
                <p>
                  Al registrarse y utilizar <strong>ActivaMente</strong>, el usuario acepta cumplir con los presentes Términos y Condiciones y con nuestro Aviso de Privacidad. Si no está de acuerdo, deberá abstenerse de utilizar la plataforma.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">2. Deslinde de Responsabilidad Médica y Física</h3>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed">
                  ⚠️ <strong>Importante:</strong> ActivaMente es una herramienta informativa de bienestar y pausas activas. <strong>No ofrece diagnóstico médico, tratamiento clínico ni asesoría fisioterapéutica personalizada.</strong>
                  <br /><br />
                  Si usted padece lesiones musculares, articulares, problemas cervicales/lumbares, mareos o cualquier condición médica preexistente, consulte a un profesional de la salud antes de realizar cualquier ejercicio o estiramiento. Detenga cualquier movimiento de inmediato si siente dolor agudo. Cada usuario ejecuta las pausas bajo su propia responsabilidad.
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">3. Registro, Veracidad de Correo y Vigencia</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>El usuario se compromete a proporcionar un correo electrónico real y de su titularidad. No se permite el registro con correos temporales o ficticios.</li>
                  <li>Las cuentas nuevas cuentan con un plazo de <strong>7 días naturales (1 semana)</strong> para confirmar su correo electrónico. De no hacerlo, la cuenta y sus registros serán eliminados automáticamente.</li>
                  <li>Si el usuario es menor de edad (por ejemplo, en el perfil de Estudiante), declara contar con la autorización de su padre, madre o tutor legal.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">4. Uso Adecuado y Seguridad Informática</h3>
                <p>
                  Queda estrictamente prohibido intentar vulnerar la seguridad del sitio, realizar ataques automatizados de fuerza bruta, extraer datos masivamente o usar el asistente virtual para fines ilícitos, conforme a lo dispuesto por el Código Penal Federal y el Código Penal para el Estado de Nuevo León.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-[#0F172A]">5. Jurisdicción</h3>
                <p>
                  Para la interpretación y cumplimiento de estos términos, las partes se someten a las leyes aplicables de los Estados Unidos Mexicanos y a los tribunales competentes en el Estado de <strong>Nuevo León, México</strong>.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
