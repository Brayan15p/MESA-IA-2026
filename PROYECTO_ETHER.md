# ETHER — Mesa de Ayuda IA para Infraestructura Hospitalaria

> Plataforma SaaS multi-tenant de gestión de incidentes de mantenimiento, cumplimiento normativo y operaciones de infraestructura para hospitales y clínicas.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js App Router | 16.2.1 |
| UI | React + Tailwind CSS | 19.2.4 / 4 |
| Animaciones | Framer Motion | 12.38 |
| Backend/DB | Supabase (PostgreSQL) | 2.101.1 |
| Auth | Supabase SSR + JWT Edge | 0.10.0 |
| Validación | Zod | 4.3.6 |
| Hashing | bcryptjs | 3.0.3 |
| JWT Edge | jose | 6.2.2 |
| QR | qrcode | 1.5.4 |
| IA Voz | Web Speech API (nativo) | — |
| Deploy | Vercel (Next.js native) | — |
| PWA | manifest.json + Service Worker (pendiente) | — |

---

## Arquitectura

### Multi-tenancy
Toda la data está aislada por `org_id`. Cada organización (hospital) tiene sus propios edificios, áreas, incidentes y usuarios. Supabase RLS (Row Level Security) enforce este aislamiento en todas las queries.

```
Organization (org_id)
  └── Buildings (edificios/sedes)
        └── Areas (pisos/zonas)
              └── Incidents (tickets de mantenimiento)
                    ├── Comments (hilo de conversación)
                    ├── Media (fotos/videos en Supabase Storage)
                    └── Ratings (calificación de servicio)
              └── Technician Assignments
  └── Profiles (usuarios con rol)
        └── User Permissions (permisos granulares)
```

### Autenticación y Routing
- **Login/Signup**: `/auth` — JWT via Supabase Auth
- **Middleware Edge**: Decodifica JWT con `atob()` (sin dependencias externas, compatible con Vercel Edge Runtime)
- **Redirección por rol**: El middleware intercepta TODAS las rutas `/dashboard/*` y redirige según rol

### Roles y Rutas Permitidas

| Rol | Ruta Principal | Rutas Adicionales |
|-----|---------------|-------------------|
| `ORG_ADMIN` | `/dashboard` | Todo |
| `BUILDING_MANAGER` | `/dashboard` | Todo excepto `/dashboard/roles` |
| `TECHNICIAN` | `/dashboard/technician` | `/dashboard/incidents`, `/dashboard/chat`, `/dashboard/ai-predictive` |
| `ANALYST` | `/dashboard/analyst` | `/dashboard/compliance`, `/dashboard/finance` |
| `REQUESTER` | `/dashboard/requester` | Solo su portal |

### Sidebar Dinámico
El componente `NavLinks` en `layout.tsx` filtra los items de navegación según el rol del usuario autenticado. El rol se lee desde Supabase Auth y se cachea en `localStorage` para evitar flash de UI entre renders.

---

## Módulos

### Implementados (Producción)

#### Landing Page (`/`)
- Hero premium con gradientes púrpura/fucsia
- Sección "La Enfermedad vs La Cura" (problema/solución)
- ROI Calculator interactivo (sliders para activos, costos, ahorro)
- 7 capacidades con sticky scroll y animaciones
- Marquee ticker con features
- CTA a login y demo de ventas
- Responsive mobile-first

#### Autenticación (`/auth`)
- Login y Signup en pantalla unificada (toggle)
- Signup crea organización y asigna rol `ORG_ADMIN`
- Error handling con mensajes en español
- Redirect automático si ya hay sesión activa

#### Dashboard Layout (`/dashboard/layout.tsx`)
- Sidebar sticky (desktop)
- Drawer móvil con hamburger
- Filtrado de nav por rol en tiempo real
- Rol cacheado en `localStorage` para evitar flash
- **Logout real**: llama `supabase.auth.signOut()` + limpia localStorage

#### Centro de Mando (`/dashboard`)
- Métricas: incidentes activos, resueltos, concentración de riesgo
- Auto-repair de perfiles huérfanos sin `org_id`
- Mapa de riesgo por área/piso
- Alertas críticas sidebar
- Cards de acceso rápido

#### Tablero de Tickets — Kanban (`/dashboard/incidents`)
- 3 columnas: Abiertos | Asignados | Mitigados
- Cards con thumbnail de media, badge de urgencia, nombre del técnico
- Botón de creación que abre `IncidentFormModal`
- Conteo por columna

#### Modal de Incidente (`IncidentFormModal.tsx`)
- Dropdowns en cascada: Edificio → Área/Piso
- Tipo de requerimiento, nombre de equipo, descripción
- Nivel de urgencia: Crítico / Moderado / Bajo
- Upload de foto/video a Supabase Storage (`incidents-media` bucket)
- URL pública auto-generada

#### Portal del Solicitante (`/dashboard/requester`)
- Métricas personales: Total | Pendientes | Resueltos
- Filtros: Todos | Críticos | Resueltos
- Grid de tickets propios con thumbnails
- Integración AURA Voice Engine
- Sidebar de detalle con comentarios
- Modal de calificación al cerrar ticket

#### AURA Voice Engine (`AuraVoiceEngine.tsx`)
Máquina de estados con 11 estados para reporte de incidentes por voz:
1. `IDLE` → Usuario activa el escáner
2. `LISTENING_ISSUE` → "¿Cuál es el daño?"
3. `ASKING_SEDE` → Captura edificio por voz
4. `LISTENING_SEDE` → Fuzzy matching vs edificios disponibles
5. `ASKING_FLOOR` → Captura piso/área
6. `LISTENING_FLOOR` → Captura confirmación
7. `CONFIRMING` → "¿Confirmamos? Daño X en Sede Y"
8. `PROCESSING` → Puebla el form con los datos capturados
- STT: Web Speech API nativa del browser
- TTS: SpeechSynthesis API, voz española, rate 0.95, pitch 1.15
- Preferencia por voces Google/Natural femeninas en español

#### Sidebar de Ticket (`TicketSidebarView.tsx`)
- Detalle completo del incidente
- Countdown SLA
- Hilo de comentarios con polling cada 5s
- Posting de comentarios con metadata de autor

#### Modal de Calificación (`ClosingRatingModal.tsx`)
- Se activa cuando ticket = "Mitigado" y sin calificación previa
- 3 dimensiones con 5 estrellas cada una:
  1. Calidad (Amabilidad y Trato)
  2. Presentación (Higiene y Uniforme)
  3. Solución (¿El daño ya no existe?)
- Guarda en DB al confirmar

#### Gestión de Edificios (`/dashboard/buildings`)
- CRUD completo: crear, listar, eliminar edificios
- Drill-down a áreas por edificio

#### Gestión de Usuarios (`/dashboard/roles`)
- Creación individual con nombre, email, contraseña, rol, área asignada
- Toggles de permisos granulares
- Import masivo por CSV (UI lista, parsing en progreso)
- Server Action `createEtherUser` via admin client (service role)

---

### En Progreso (Parcial)

#### Dashboard Técnico (`/dashboard/technician`)
- Título y placeholder "Mi Búnker Operativo"
- **Pendiente**: Filtrado de tickets por área asignada, cambio de estado, upload de evidencia

#### Dashboard Analista (`/dashboard/analyst`)
- Shell con título "Visor de Datos"
- **Pendiente**: Queries BI, gráficas de tendencias

---

### Stubs — Próximos a Implementar

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| QR Generator | `/dashboard/qr` | Generar QR por edificio/área para reporte rápido |
| Compliance | `/dashboard/compliance` | Auditoría Resolución 3100 colombiana |
| Finanzas | `/dashboard/finance` | Costos de mantenimiento, ROI, tendencias |
| Chat AI | `/dashboard/chat` | Asistente conversacional con LLM (Claude API) |
| IA Predictiva | `/dashboard/ai-predictive` | Riesgo por área a 30/60/90 días |

---

## Base de Datos (Supabase PostgreSQL)

### Tablas Principales

```sql
organizations       — org_id, name, ...
profiles            — id, email, name, role, org_id, is_active
user_permissions    — profile_id, can_export_pdf, can_create_building, can_delete_users
buildings           — id, name, location, total_floors, org_id
areas               — id, building_id, name, floor, type
maintenance_incidents — id, org_id, building_id, area_id, creator_id,
                        requirement_type, equipment_name, description,
                        media_url, urgency_level, status, sla_deadline,
                        rating_quality, rating_presentation, rating_solution
incident_comments   — id, incident_id, author_id, comment, created_at
technician_assignments — id, org_id, profile_id, area_id
```

### Seguridad
- RLS habilitado en todas las tablas con filtro por `org_id`
- Bucket `incidents-media`: uploads autenticados, URLs públicas
- Trigger `handle_new_user`: auto-crea perfil en `profiles` al registrar usuario

---

## Seguridad Web

Headers configurados en `next.config.ts`:
```
Strict-Transport-Security: max-age=63072000; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

Middleware Edge con decoding JWT sin librerías externas (compatible Vercel Edge Runtime).

---

## PWA y Distribución Móvil

### Estado Actual
- `manifest.json` configurado (instalable como PWA)
- Responsive mobile-first
- Acceso cámara para upload de media

### Plan de Distribución
1. **PWA (inmediato)** — HTTPS en Vercel + Service Worker para offline → instalable en Android e iOS desde browser
2. **APK privado (futuro)** — Capacitor wrapping Next.js → distribución directa por link/email a técnicos

---

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

---

## Comandos de Desarrollo

```bash
npm run dev          # Dev server en http://0.0.0.0:3000 (accesible en LAN)
npm run build        # Build de producción
npm run start        # Servidor de producción
```

---

## Historial de Cambios Técnicos

### v0.2 — 2026-04-18
**Auth & Routing Fixes (Fase 1)**
- **Fix**: TECHNICIAN bloqueado de `/dashboard/incidents` por middleware — ahora permitido (los técnicos necesitan ver los tickets)
- **Fix**: Botón "Salir" no cerraba sesión — reemplazado `<Link href="/">` por `LogoutButton` que llama `supabase.auth.signOut()` y limpia `localStorage`
- **Fix**: Flash de sidebar incorrecto al cargar — rol ahora se lee primero de `localStorage` y se sincroniza con Supabase en background
- **Nuevo**: Componente `LogoutButton` con signOut real + limpieza de caché

### v0.4 — 2026-04-19
**Sprint 4 — Aislamiento Multi-Tenant Real (Seguridad)**

**Problema detectado:** Un admin nuevo al registrarse veía edificios e incidentes de otras organizaciones porque las queries no filtraban por `org_id` y las políticas RLS estaban abiertas con `USING(true)`.

- **Fix crítico**: `IncidentFormModal.tsx` — queries de buildings y areas ahora filtran por `org_id` del usuario autenticado
- **Fix crítico**: `buildings/page.tsx` — `fetchBuildings()` recibía `oid` pero nunca lo usaba en el query; corregido con `.eq('org_id', oid)`
- **Fix crítico**: `roles/page.tsx` — buildings y areas para asignar técnicos ahora filtran por `org_id`
- **Fix**: `requester/page.tsx` — edificios cargados para contexto de AURA ahora filtran por `org_id`
- **Fix**: `report/page.tsx` — valida que el `building_id` y `area_id` del QR pertenezcan a la org del usuario antes de renderizar
- **Nuevo**: `MIGRACION_RLS_PRODUCCION.sql` — script de migración que reemplaza todas las políticas `USING(true)` con políticas reales por `org_id`
  - Función helper `public.get_user_org_id()` en esquema `public` (Supabase no permite escribir en `auth`)
  - Políticas para: `organizations`, `profiles`, `user_permissions`, `buildings`, `areas`, `maintenance_incidents`, `incident_comments`, `technician_assignments`, `assets_inventory`, `qr_codes_matrix`, `audit_logs_3100`
  - `audit_logs_3100` filtra via subquery a `maintenance_incidents` (no tiene `org_id` directo)
- **Resultado**: Admin nuevo parte de cero — sin edificios, sin usuarios, sin incidentes ajenos. Cada hospital es un silo completamente aislado tanto en frontend como en base de datos.

### v0.3 — 2026-04-19
**Sprint 1 — Kanban fixes + Status Management**
- **Fix crítico**: Columna "Mitigados" en Kanban nunca renderizaba tickets (faltaba `.map()`). Ahora muestra correctamente con conteo
- **Fix**: Admin/BuildingManager pueden ver detalle de cualquier ticket desde Kanban vía `TicketSidebarView`
- **Nuevo**: `TicketSidebarView` ahora tiene botón de cambio de estado `Abierto → En Taller → Mitigado` para roles TECHNICIAN/ORG_ADMIN/BUILDING_MANAGER
- **Nuevo**: Comentario de sistema automático al cambiar estado ("Estado cambiado a X por Nombre")
- **Nuevo**: Evidencia de trabajo — técnicos pueden subir foto desde el sidebar cuando ticket está "En Taller"
- **Nuevo**: Imágenes de evidencia se renderizan inline en el chat del expediente

**Sprint 2 — Technician Workflow completo**
- **Nuevo**: `/dashboard/technician` completamente reconstruido — muestra tickets reales filtrados por `technician_assignments.area_id`
- Fallback: si no tiene área asignada, muestra todos los tickets de la organización
- Métricas por estado: Pendientes / En Trabajo / Resueltos
- Tabs de filtro por estado
- Grid de cards de tickets con click → sidebar
- Técnico puede cambiar estado y subir evidencia desde su dashboard

**Sprint 3 — QR Generator + Ruta pública de reporte**
- **Nuevo**: `/dashboard/qr` — generador funcional de QR codes usando librería `qrcode`
- QR por sede (obligatorio) o sede + área específica
- Preview inline del QR con descarga PNG
- Grid de accesos rápidos por sede
- **Nuevo**: `/report` — ruta pública para escaneo de QR
  - Detecta `?building_id=xxx&area_id=xxx` de la URL
  - Si no hay sesión → redirige a `/auth?redirect=...` con callback
  - Formulario completo de reporte con foto
  - Submit crea incidente en Supabase directamente

### v0.2 — 2026-04-18
**Auth & Routing Fixes**
- Fix: TECHNICIAN bloqueado de `/dashboard/incidents` — ahora permitido
- Fix: Logout no cerraba sesión — `LogoutButton` con `signOut()` + limpia localStorage
- Fix: Flash de sidebar — rol cacheado en localStorage

### v0.1 — Baseline
- Landing page, auth, dashboard multi-rol
- Kanban de incidentes con upload de media
- Portal requester + AURA Voice Engine
- CRUD edificios, gestión de usuarios
- Middleware Edge con RBAC

---

## Roadmap

### ✅ Completado
- ~~Completar workflow Técnico (asignación, cambio de estado, evidencia)~~ → Sprint 2
- ~~QR Generator funcional (generación + escaneo por área)~~ → Sprint 3
- ~~Transiciones de estado en tickets (Abierto → En Taller → Mitigado)~~ → Sprint 1
- ~~Aislamiento multi-tenant real (RLS + filtros org_id en frontend)~~ → Sprint 4

### Sprint 5 — Próximo
1. **Supabase Realtime** — reemplazar polling de comentarios (cada 5s) con WebSockets
2. **Chat AI** (`/dashboard/chat`) — asistente conversacional con Claude API, contexto: historial de incidentes de la org
3. **Dashboard Analista** (`/dashboard/analyst`) — gráficas de tendencias, tickets por área, tiempo promedio de resolución

### Prioridad Media
4. Módulo predictivo (`/dashboard/ai-predictive`) — frecuencia + recencia → riesgo por área a 30/60/90 días
5. Finance Module (`/dashboard/finance`) — costos de mantenimiento, ROI, tendencias mensuales
6. Notificaciones — email al crear incidente crítico, push PWA para técnicos

### Prioridad Baja
7. Compliance Resolución 3100 (`/dashboard/compliance`) — checklist + exportar auditoría PDF
8. Service Worker PWA — offline cache, instalación nativa Android/iOS
9. Capacitor → APK para Play Store privada

---

## Deploy en Producción (Vercel)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Configurar env vars en Vercel Dashboard
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY

# 4. Dominio custom en Vercel Dashboard → Domains → agregar dominio
# HTTPS automático via Let's Encrypt
```
