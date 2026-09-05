# Informe del trabajo realizado en PetMatch

## 1. Resumen general

PetMatch es una plataforma web full-stack para facilitar la adopción responsable
de mascotas. El sistema conecta adoptantes con refugios y ofrece un flujo
completo para buscar mascotas, enviar solicitudes, gestionar entrevistas,
registrar adopciones y supervisar la operación mediante paneles administrativos.

El trabajo realizado tuvo dos objetivos:

1. Revisar el proyecto y comprobar si existían errores de ejecución o
   configuración.
2. Organizar y documentar los pendientes indicados en la imagen de entrega:
   publicación en GitHub, despliegue en Render y Vercel, capturas para el README,
   configuración de Resend, revisión legal y operación con Redis, backups,
   almacenamiento persistente y monitorización.

## 2. Estructura del proyecto

El repositorio está organizado como un monorepo npm:

```text
Petmatch/
├── backend/                 API REST con Express y Node.js
│   ├── src/
│   │   ├── config/          Entorno, base de datos y configuración legal
│   │   ├── controllers/     Traducción entre HTTP y servicios
│   │   ├── middleware/      Seguridad, validación, autenticación y errores
│   │   ├── models/          Acceso a PostgreSQL o almacenamiento en memoria
│   │   ├── routes/          Rutas de la API
│   │   ├── services/        Reglas de negocio
│   │   └── validators/      Validaciones con Zod
│   └── test/                Pruebas de integración
├── frontend/                Aplicación React
│   ├── src/
│   │   ├── components/      Componentes reutilizables
│   │   ├── context/         Estado global de autenticación y notificaciones
│   │   ├── layouts/         Layout público y paneles
│   │   ├── pages/           Pantallas públicas y privadas
│   │   ├── services/        Cliente HTTP de la API
│   │   └── styles/          Sistema visual global
│   └── vercel.json           Reescritura para rutas de React
├── database/                 Migraciones SQL
├── docker/                   Imágenes y configuración de nginx
├── docs/                     Documentación técnica y de despliegue
├── render.yaml               Blueprint de Render
├── docker-compose.yml        Entorno local con PostgreSQL
└── package.json              Scripts del monorepo
```

## 3. Tecnologías utilizadas

### Frontend

- React 19.
- React Router.
- Vite.
- Lucide React para iconos.
- Vitest y Testing Library para pruebas.

### Backend

- Node.js.
- Express 5.
- PostgreSQL mediante `pg`.
- Almacenamiento en memoria para demostraciones y pruebas.
- JWT para autenticación.
- `bcryptjs` para contraseñas.
- Zod para validación.
- Helmet y CORS para seguridad.
- `express-rate-limit` para límites de peticiones.
- Multer para fotografías.
- Nodemailer y Resend para correo transaccional.
- Swagger/OpenAPI para documentación de la API.

### Infraestructura

- Docker Compose para desarrollo local.
- Render para API y PostgreSQL.
- Vercel para el frontend.
- Redis para compartir los límites de peticiones entre instancias.

## 4. Revisión realizada

Se revisaron:

- La estructura del frontend y backend.
- Las rutas públicas y privadas.
- La configuración de Vite.
- La configuración de variables de entorno.
- El cliente de API.
- El servicio de correo.
- La configuración de Render.
- La configuración de Docker Compose.
- La documentación de despliegue.
- Las pruebas automatizadas.

La aplicación tenía una base funcional amplia: autenticación, roles,
mascotas, refugios, favoritos, adopciones, entrevistas, notificaciones,
documentos legales, auditoría, subida de imágenes y reportes.

## 5. Cambios realizados

### 5.1 Soporte para Resend

Se agregó soporte para Resend como alternativa moderna al SMTP tradicional.

Se añadieron las variables:

```env
RESEND_API_KEY=
RESEND_FROM=PetMatch <no-reply@petmatch.example>
```

Cuando `RESEND_API_KEY` está configurada, el backend envía los mensajes a:

```text
https://api.resend.com/emails
```

El envío incluye:

- Destinatario.
- Remitente.
- Asunto.
- Texto plano.
- Versión HTML.

Si Resend no está configurado, el sistema conserva el comportamiento local:

- Usa SMTP si existe una configuración válida.
- Si no existe SMTP, imprime el correo en la consola.

Esto permite probar recuperación de contraseña y verificación de correo sin
exigir una cuenta externa durante el desarrollo.

### 5.2 Variables de Render

El archivo `render.yaml` ahora contempla:

- `DATABASE_URL`.
- `JWT_SECRET`.
- `FRONTEND_URL`.
- `API_URL`.
- `RESEND_API_KEY`.
- `RESEND_FROM`.
- `REDIS_URL`.

Las claves sensibles se dejan como valores que deben configurarse manualmente
en Render. No se incluyeron secretos reales en el repositorio.

### 5.3 Checklist de entrega

Se incorporó una sección de salida en
[`docs/deployment.md`](./deployment.md) con los seis puntos solicitados:

1. Publicar el proyecto en GitHub.
2. Desplegar API y base de datos en Render.
3. Desplegar el frontend en Vercel.
4. Preparar capturas para el README.
5. Configurar la API key de Resend.
6. Completar revisión legal, Redis, backups, disco persistente y
   monitorización.

La checklist distingue entre tareas que sí pueden resolverse en código y tareas
que requieren cuentas, dominios o decisiones del equipo.

### 5.4 Documentación de operación

Se documentó que:

- Render utiliza un disco efímero si no se contrata almacenamiento persistente.
- Las fotografías deben guardarse en un volumen persistente o en un servicio de
  objetos como S3 o Cloudinary.
- Redis es necesario cuando hay varias instancias de la API.
- PostgreSQL debe tener copias de seguridad automáticas.
- El endpoint `/api/health` debe ser monitorizado.
- Los errores de producción deben conectarse a Sentry o a un servicio similar.
- Los textos legales deben ser revisados por una persona cualificada.

## 6. Funcionamiento de la aplicación

### 6.1 Área pública

El visitante puede:

- Consultar la portada.
- Ver estadísticas públicas.
- Buscar mascotas.
- Filtrar por especie, sexo, edad, tamaño, ciudad y características.
- Ver el detalle de una mascota.
- Consultar refugios.
- Leer los términos y la política de privacidad.
- Consultar la documentación Swagger de la API.

### 6.2 Adoptante

El usuario adoptante puede:

- Crear una cuenta.
- Aceptar los documentos legales.
- Verificar su correo.
- Recuperar su contraseña.
- Guardar favoritos.
- Enviar solicitudes de adopción.
- Consultar estados de solicitudes.
- Revisar entrevistas.
- Consultar adopciones y notificaciones.
- Descargar sus datos o eliminar su cuenta.

### 6.3 Refugio

El refugio puede:

- Administrar su perfil.
- Registrar mascotas.
- Editar información y estado.
- Subir imágenes.
- Revisar solicitudes.
- Programar entrevistas.
- Registrar adopciones.
- Consultar estadísticas.

### 6.4 Administrador

El administrador puede:

- Supervisar usuarios.
- Verificar o suspender refugios.
- Supervisar mascotas.
- Revisar solicitudes y adopciones.
- Consultar reportes.
- Revisar el registro de auditoría.

## 7. Seguridad y datos legales

La aplicación incluye:

- JWT con expiración.
- Contraseñas protegidas con bcrypt.
- CORS configurable.
- Helmet.
- Validación de entradas con Zod.
- Límites de peticiones para login, registro, escrituras y solicitudes.
- Protección de archivos subidos mediante tipos MIME y tamaño máximo.
- Documentos legales versionados.
- Registro de aceptación de términos y privacidad.

Antes de publicar se deben completar:

```env
LEGAL_ORGANIZATION=
LEGAL_CONTACT_EMAIL=
LEGAL_ADDRESS=
LEGAL_COUNTRY=Perú
```

También es necesario que una persona responsable revise los textos legales
antes de activar el registro público.

## 8. Validaciones ejecutadas

Se ejecutaron correctamente los siguientes comandos:

```bash
npm run lint
npm run test:api
npm run test:web
npm run build
```

Resultados:

- ESLint: correcto.
- Backend: pruebas correctas.
- Frontend: 7 archivos de prueba y 134 pruebas correctas.
- Build de Vite: correcto.

También se verificaron manualmente:

```text
http://localhost:5173
http://localhost:4000/api
http://localhost:4000/api/health
http://localhost:4000/api/stats
```

## 9. Ejecución local

### Opción A: modo demostración sin PostgreSQL

Desde la carpeta raíz:

```bash
npm install
npm run dev
```

El backend utiliza el almacenamiento en memoria cuando no existe
`DATABASE_URL`. Este modo carga datos de demostración y permite probar la
interfaz sin instalar PostgreSQL.

Direcciones:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Salud: `http://localhost:4000/api/health`

### Opción B: PostgreSQL con Docker

```bash
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

### Opción C: stack completo con Docker

```bash
docker compose --profile full up --build
```

En esta opción el frontend queda disponible en `http://localhost:8080`.

## 10. Despliegue

### Render

1. Publicar el repositorio en GitHub.
2. En Render seleccionar **New → Blueprint**.
3. Elegir el repositorio.
4. Render leerá `render.yaml`.
5. Configurar `FRONTEND_URL`.
6. Configurar Resend y Redis si se van a utilizar.
7. Ejecutar migraciones:

```bash
npm run db:migrate
npm run db:seed
```

8. Confirmar:

```text
https://tu-api.onrender.com/api/health
```

### Vercel

1. Importar el mismo repositorio.
2. Seleccionar `frontend` como directorio raíz.
3. Usar `npm run build`.
4. Usar `dist` como directorio de salida.
5. Configurar:

```env
VITE_API_URL=https://tu-api.onrender.com/api
```

6. Copiar el dominio de Vercel a `FRONTEND_URL` en Render.

## 11. Qué queda pendiente

El código y la documentación quedaron preparados, pero estas acciones
requieren acceso a servicios externos:

- Crear o seleccionar el repositorio de GitHub.
- Configurar protección de ramas.
- Crear el proyecto de Render.
- Crear el proyecto de Vercel.
- Registrar y verificar el dominio remitente en Resend.
- Generar la API key de Resend.
- Crear Redis para producción.
- Contratar o activar almacenamiento persistente.
- Activar backups de PostgreSQL.
- Configurar monitorización y alertas.
- Obtener capturas reales de la aplicación.
- Completar los datos legales de la organización.

## 12. Conclusión

PetMatch cuenta con una base funcional completa y validada. Los errores
encontrados durante la revisión no estaban en el flujo principal de React,
sino principalmente en la preparación operacional para publicar el sistema.

La aplicación puede ejecutarse localmente en modo demostración, conectarse a
PostgreSQL cuando esté disponible y desplegarse separando frontend y backend.
La principal diferencia entre el entorno local y producción es que producción
debe completar secretos, correo, Redis, almacenamiento, backups, monitorización
y revisión legal antes de aceptar usuarios reales.
