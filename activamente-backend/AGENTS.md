# Proyecto ActivaMente - Contexto Técnico

## 🛠️ Stack Tecnológico
- **Frontend**: React + Vite (Puerto por defecto: 5174), Axios para peticiones HTTP.
- **Backend**: Node.js, Express (Puerto por defecto: 3000).
- **Base de Datos**: Microsoft SQL Server (Manejo de conexiones mediante `mssql` y `poolPromise`).
- **Autenticación**: JSON Web Tokens (JWT) y Bcrypt.

## 📂 Estructura del Repositorio
- `/` (Raíz)
  - `activamente-backend/` -> Servidor API REST, controladores, rutas y conexión a SQL Server.
  - `activamente-frontend/` -> Interfaz de usuario, vistas (Ajustes, Login, Registro) y servicios de Axios.

## ⚠️ Reglas críticas de desarrollo
1. **Conexión a Base de Datos**: Nunca usar `(localdb)` con paréntesis directos en el driver `tedious` para evitar errores de DNS (`ENOTFOUND`). Usar la instancia local limpia o conexión por TCP/IP.
2. **Controladores**: Asegurar el uso de `poolPromise` importado desde `src/config/db.js` en lugar de conexiones sueltas por cada consulta.
3. **Manejo de Errores**: Todo controlador debe devolver respuestas JSON claras con códigos de estado HTTP correctos (200, 401, 500) y registrar los errores críticos en la terminal del backend.