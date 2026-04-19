# 📋 DOCUMENTACIÓN TÉCNICA DEL SISTEMA
## ETHER — Plataforma de Mesa de Ayuda con Inteligencia Artificial
**Versión de Documentación:** 1.0.0  
**Fecha:** 18 de Abril de 2026  
**Elaborado por:** Ing. de Sistemas (Análisis Automatizado)  
**Clasificación:** Documento Interno — Técnico y Funcional

---

## 📌 TABLA DE CONTENIDO

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Módulos Funcionales Implementados](#5-módulos-funcionales-implementados)
6. [Sistema de Roles y Permisos](#6-sistema-de-roles-y-permisos)
7. [Flujos de Autenticación y Seguridad](#7-flujos-de-autenticación-y-seguridad)
8. [Componentes Reutilizables](#8-componentes-reutilizables)
9. [Estado Actual por Módulo](#9-estado-actual-por-módulo)
10. [Restricciones y Deuda Técnica](#10-restricciones-y-deuda-técnica)
11. [Roadmap Futuro](#11-roadmap-futuro)
12. [Variables de Entorno Requeridas](#12-variables-de-entorno-requeridas)

---

## 1. RESUMEN EJECUTIVO

**ETHER** es una plataforma web de **Mesa de Ayuda (Help Desk)** orientada al sector hospitalario/clínico, construida con tecnologías modernas serverless. Su propósito central es digitalizar y centralizar la gestión de incidentes de mantenimiento en instituciones de salud, permitiendo:

- Reporte de averías con evidencia fotográfica/video directamente desde el dashboard.
- Gestión topográfica jerárquica: Organización → Edificios → Áreas → Activos.
- Control de acceso por roles con autenticación basada en JWT.
- Un asistente de voz AI nativo (`A.U.R.A.`) para reportar incidentes sin uso de manos.
- Futuras capacidades de análisis predictivo, gestión de costos y cumplimiento normativo.

El sistema opera bajo un modelo **multi-tenant** donde cada organización (hospital, clínica) tiene su propio espacio de datos aislado.

---

## 2. STACK TECNOLÓGICO

| Categoría | Tecnología | Versión | Rol en el Sistema |
|---|---|---|---|
| **Framework Frontend** | Next.js | 16.2.1 | SSR/SSG, enrutamiento, App Router |
| **Lenguaje** | TypeScript | ^5 | Tipado estático en toda la app |
| **UI Framework** | React | 19.2.4 | Motor de componentes |
| **Estilos** | Tailwind CSS | ^4 | Utilitarios CSS, diseño dark/glassmorphism |
| **Animaciones** | Framer Motion | ^12.38.0 | Transiciones y animaciones UI |
| **Iconografía** | Lucide React | ^1.7.0 | Iconos vectoriales consistentes |
| **BaaS (Backend)** | Supabase | ^2.101.1 | Auth, DB PostgreSQL, Storage, RLS |
| **Cliente SSR Supabase** | @supabase/ssr | ^0.10.0 | Integración con Next.js App Router |
| **Generación QR** | qrcode | ^1.5.4 | Generación de códigos QR vectoriales |
| **Validación** | Zod | ^4.3.6 | Esquemas de validación de formularios |
| **Auth Segura (Server)** | jose | ^6.2.2 | Decodificación JWT en Edge Runtime |
| **Hash Contraseñas** | bcryptjs | ^3.0.3 | Cifrado de contraseñas (uso servidor) |
| **Infraestructura** | Vercel / Edge Runtime | — | Despliegue y Middleware Edge-compatible |

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Vista General

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER / CLIENTE                   │
│  Next.js App (React 19 + Tailwind CSS)                  │
│  ├── Landing Page (Marketing)                           │
│  ├── Portal Auth (Login / Registro)                     │
│  └── Dashboard ETHER (App Principal)                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                NEXT.JS EDGE MIDDLEWARE                  │
│  ├── Verifica JWT en cookie (sin librería externa)      │
│  ├── Controla acceso por ruta y por ROL                 │
│  └── Redirige a /auth si no hay sesión válida           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              SUPABASE (BaaS — Backend completo)         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth API   │  │  PostgreSQL  │  │   Storage    │  │
│  │  (JWT/OAuth) │  │  (RLS activa)│  │ (S3-compat.) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ├── 10 tablas con Row Level Security (RLS)             │
│  ├── Trigger automático al crear usuario                │
│  ├── Bucket público 'incidents-media'                   │
│  └── Admin Client (Service Role Key) para acciones     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Estructura de Carpetas del Proyecto

```
mesa-ayuda-ai/
├── src/
│   ├── app/                          # App Router (Next.js 13+)
│   │   ├── page.tsx                  # Landing page marketing
│   │   ├── layout.tsx                # Layout raíz + metadatos
│   │   ├── globals.css               # Estilos globales
│   │   ├── auth/                     # Portal de autenticación
│   │   │   ├── page.tsx              # Pantalla principal auth
│   │   │   ├── login/                # Módulo de Login
│   │   │   └── register/             # Módulo de Registro
│   │   ├── dashboard/                # App principal (protegida)
│   │   │   ├── layout.tsx            # Sidebar + layout dashboard
│   │   │   ├── page.tsx              # Centro de Mando (KPIs)
│   │   │   ├── incidents/            # ✅ Tablero de Tickets (Kanban)
│   │   │   ├── buildings/            # ✅ Gestión de Edificios/Áreas
│   │   │   ├── roles/                # ✅ Gestión de Usuarios y Permisos
│   │   │   ├── technician/           # ✅ Portal del Técnico
│   │   │   ├── requester/            # ✅ Portal del Solicitante
│   │   │   ├── analyst/              # 🟡 Visor de Analista (esqueleto)
│   │   │   ├── compliance/           # 🔴 Cumplimiento 3100 (stub)
│   │   │   ├── finance/              # 🔴 Costos Mantenimiento (stub)
│   │   │   ├── chat/                 # 🔴 Asistente Conversacional (stub)
│   │   │   ├── ai-predictive/        # 🔴 ETHER Brain (stub)
│   │   │   ├── areas/                # 🟡 Áreas Operativas (parcial)
│   │   │   └── qr/                   # 🔴 Generador QR (stub)
│   │   ├── t/                        # Portal Público QR
│   │   │   └── new/[qrId]/           # Creación de ticket vía QR (sin login)
│   │   ├── actions/
│   │   │   └── user-actions.ts       # Server Actions (Admin Supabase)
│   │   ├── demo/                     # Página demo/sales
│   │   ├── sales/                    # Página ventas
│   │   └── setup/                    # Configuración inicial
│   ├── components/
│   │   ├── IncidentFormModal.tsx     # ✅ Modal de reporte de incidente
│   │   ├── AuraVoiceEngine.tsx       # ✅ Asistente de voz A.U.R.A.
│   │   ├── ClosingRatingModal.tsx    # ✅ Modal de calificación al cerrar
│   │   └── TicketSidebarView.tsx     # ✅ Vista lateral de ticket detallado
│   └── lib/
│       ├── supabase.ts               # Cliente básico de Supabase
│       └── supabase/                 # Clientes especializados SSR/Admin
├── middleware.ts                     # Guard de rutas (Edge Runtime)
├── SUPABASE_SCHEMA.sql               # Schema completo de la base de datos
├── package.json
└── next.config.ts
```

---

## 4. MODELO DE DATOS

La base de datos en Supabase (PostgreSQL) tiene **11 tablas** organizadas en capas lógicas:

### 4.1 Diagrama de Entidades

```
organizations (1)
    └──< profiles (N)            ← Usuarios del sistema
         └──< user_permissions   ← Permisos granulares por usuario
    └──< buildings (N)           ← Sedes/Instalaciones físicas
         └──< areas (N)          ← Pisos, zonas, salas
              └──< assets_inventory (N)  ← Equipos/activos
              └──< technician_assignments ← Técnico asignado por área
    └──< qr_codes_matrix (N)     ← QR polimórfico (edificio/área/activo)
    └──< maintenance_incidents (N) ← Tickets de mantenimiento
         └──< audit_logs_3100   ← Trazabilidad de acciones por ticket
         └──< incident_comments  ← Mensajería interna del ticket
```

### 4.2 Tablas Principales

#### `organizations`
Entidad raíz del modelo multi-tenant.
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador único |
| `name` | VARCHAR(255) | Nombre de la institución |
| `status_active` | BOOLEAN | ¿Organización activa? |
| `max_users` | INT | Límite de usuarios (por plan) |
| `created_at` | TIMESTAMPTZ | Fecha de alta |

#### `profiles`
Tabla de perfiles de usuarios vinculada a `auth.users` de Supabase.
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Mapea a `auth.users(id)` |
| `org_id` | UUID FK | Organización a la que pertenece |
| `name` | VARCHAR(255) | Nombre completo |
| `email` | VARCHAR(255) | Correo electrónico |
| `role` | VARCHAR(50) | Rol del sistema (ver sección 6) |
| `is_active` | BOOLEAN | Estado del usuario |

#### `maintenance_incidents`
Corazón del sistema. Cada fila es un ticket de mantenimiento.
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | ID del ticket |
| `org_id` | UUID FK | Organización propietaria |
| `creator_id` | UUID FK | Quien reportó |
| `assigned_tech_id` | UUID FK | Técnico asignado (nullable) |
| `building_id` | UUID FK | Sede afectada |
| `area_id` | UUID FK | Área específica (nullable) |
| `asset_id` | UUID FK | Activo/equipo involucrado (nullable) |
| `requirement_type` | VARCHAR(100) | Tipo: correctivo, preventivo, etc. |
| `equipment_name` | VARCHAR(255) | Nombre del equipo afectado |
| `description` | TEXT | Descripción detallada del daño |
| `media_url` | TEXT | URL de foto/video en Supabase Storage |
| `status` | VARCHAR(50) | Estado: Abierto, En Curso, Mitigado |
| `urgency_level` | VARCHAR(50) | Leve / Moderado / Crítico |
| `ai_risk_score` | INT | Puntuación de riesgo IA (pendiente) |
| `rating_quality` | INT (1-5) | Calificación de calidad del servicio |
| `rating_presentation` | INT (1-5) | Calificación de presentación |
| `rating_solution` | INT (1-5) | Calificación de solución |
| `sla_deadline` | TIMESTAMPTZ | Fecha límite SLA (pendiente) |
| `technician_in_transit` | BOOLEAN | ¿Técnico en camino? |
| `transcribed_text` | TEXT | Texto transcrito por AURA |
| `created_at` | TIMESTAMPTZ | Fecha de apertura |
| `resolved_at` | TIMESTAMPTZ | Fecha de cierre |

### 4.3 Trigger Automático

Al registrar un nuevo usuario en Supabase Auth, se activa `on_auth_user_created`:

```sql
-- Acción automática al INSERT en auth.users:
-- 1. Crea una nueva organización (si el metadata lo indica)
-- 2. Inserta el perfil en tabla `profiles`
-- 3. Genera el registro base en `user_permissions`
```

### 4.4 Storage

- **Bucket:** `incidents-media` (público)
- **Ruta de archivos:** `{org_id}/{random_hash}.{ext}`
- **Tipos soportados:** imágenes JPG/PNG/WEBP y video MP4/MOV
- **⚠️ Política actual:** Acceso total `FOR ALL — USING (true)` (modo desarrollo)

---

## 5. MÓDULOS FUNCIONALES IMPLEMENTADOS

### 5.1 ✅ Landing Page / Marketing (`/`)

**¿Qué hace?**
Página de presentación del producto ETHER con diseño tipo glassmorphism. Contiene secciones de hero, características, llamada a acción (CTA) y acceso al demo.

**Ruta:** `src/app/page.tsx` (44KB — página completa)

**Funciona para:**
- Presentar el sistema a posibles clientes/administradores.
- Redirigir al login (`/auth`) o al registro de nuevas organizaciones.

---

### 5.2 ✅ Portal de Autenticación (`/auth`)

**¿Qué hace?**
Sistema de login/registro integrado con Supabase Auth. Maneja:
- Inicio de sesión con email y contraseña.
- Registro de nuevas organizaciones (flujo onboarding).
- Redireccionamiento post-login según el rol del usuario.

**Archivos:**
- `src/app/auth/page.tsx` — Pantalla de selección
- `src/app/auth/login/` — Módulo login
- `src/app/auth/register/` — Módulo de registro con creación de organización

---

### 5.3 ✅ Centro de Mando / Dashboard Principal (`/dashboard`)

**¿Qué hace?**
Panel analítico en tiempo real que carga métricas del mes actual para el `ORG_ADMIN` y otros roles administrativos.

**KPIs mostrados:**
- **Incidentes activos este mes** (excluye Mitigado/Cerrado).
- **Mantenimientos exitosos** (estado Mitigado o Cerrado).
- **Impacto financiero prevenido** (placeholder `$0.00`, módulo en desarrollo).
- **Mapa de concentración de riesgo:** barras visuales de áreas más afectadas (Top 4).
- **Alertas Críticas recientes:** tickets con `urgency_level = 'Crítico'` (hasta 3).
- **Acciones rápidas:** Botones a Edificios, Áreas y Generador QR.

**Auto-reparador integrado:** Si el perfil del usuario no tiene `org_id`, el dashboard:
1. Crea automáticamente una organización.
2. Vincula el perfil al nuevo `org_id`.
3. Genera los permisos base.

**Archivo:** `src/app/dashboard/page.tsx`

---

### 5.4 ✅ Tablero de Tickets / Kanban de Incidentes (`/dashboard/incidents`)

**¿Qué hace?**
Vista Kanban de 3 columnas para gestionar todos los incidentes de mantenimiento de la organización.

**Columnas:**
| Columna | Estado | Color |
|---|---|---|
| Abiertos / Críticos | `status = 'Abierto'` | Rosa/Rojo |
| Asignados al Taller | Todo excepto Abierto y Mitigado | Ámbar |
| Sellados (Mitigados) | `status = 'Mitigado'` | Esmeralda |

**Características:**
- Muestra foto/video de evidencia en la tarjeta si existe.
- Muestra nivel de urgencia, ID corto, tipo de requerimiento, descripción y reportador.
- Botón para crear nuevo ticket que abre el `IncidentFormModal`.
- Recarga automática tras crear un ticket nuevo.
- Soporte de suscripción en tiempo real (no implementado aún, requiere Supabase Realtime).

**Archivo:** `src/app/dashboard/incidents/page.tsx`

---

### 5.5 ✅ Gestión Topográfica — Edificios y Áreas (`/dashboard/buildings`)

**¿Qué hace?**
Módulo jerárquico de dos niveles para administrar la infraestructura física.

**Vista 1 — Lista de Edificios (Sedes):**
- Grid con tarjetas glassmorphism por edificio.
- Información: nombre, ubicación, número de pisos, estado (Operativo).
- Botón para crear nueva sede con formulario deslizable.
- Eliminación de sede (con confirmación).
- Clic en tarjeta → drill-down al interior del edificio.

**Vista 2 — Interior de Edificio (Áreas/Pisos):**
- Breadcrumb de navegación: Sedes → [Nombre Edificio].
- Formulario para registrar nueva área con: nombre, número de piso y tipo.
- **Tipos de área soportados:** Clínica, Quirúrgica, Administrativa, Técnica, Emergencias, UCI, Farmacia, Laboratorio, Almacén.
- Grid de áreas con indicadores de piso y tipo.
- Eliminación de área individual.

**Auto-reparador:** Si el usuario no tiene `org_id`, lo crea automáticamente.

**Archivo:** `src/app/dashboard/buildings/page.tsx`

---

### 5.6 ✅ Gestión de Usuarios, Roles y Permisos (`/dashboard/roles`)

**Exclusivo para:** `ORG_ADMIN`

**¿Qué hace?**
Panel de "Gobierno ETHER" — control completo del equipo humano de la organización.

**Sub-funcionalidades:**

**A. Nómina Activa (Directorio)**
- Listado de todos los miembros de la organización con buscador en tiempo real.
- Muestra nombre, email, rol con badge coloreado e indicador de activo/inactivo.

**B. Reclutamiento Individual (Modal)**
- Formulario para crear un nuevo usuario directamente en Supabase Auth.
- Campos: Nombre, Email, Contraseña inicial, Rol.
- Selección de rol con UI visual por tarjetas.
- Permisos granulares: `can_export_pdf`, `can_create_building`.
- Para técnicos: asignación de Edificio Base y Área Confinada.
- Usa **Server Action** (`createEtherUser`) con `supabaseAdminClient` (Service Role).

**C. Carga Masiva (CSV)**
- Upload de archivo CSV con columnas: `Nombre, Correo, Rol, Contraseña, EdificioID, AreaID`.
- Preview (primeras 10 filas) antes de confirmar la carga.
- Procesa los usuarios en bucle usando `createEtherUsersBulk`.

**D. Matriz de Permisos (Toggle en tiempo real)**
- Interruptores por cada usuario (excepto ORG_ADMIN) para activar/desactivar:
  - `can_export_pdf` — Exportar reportes
  - `can_create_building` — Crear edificios
- Presets rápidos: "A" (Auditor) y "O" (Operativo).

**Archivo:** `src/app/dashboard/roles/page.tsx`

---

### 5.7 ✅ Portal del Técnico (`/dashboard/technician`)

**Exclusivo para:** `TECHNICIAN`

**¿Qué hace?**
"Mi Búnker Operativo" — Dashboard personal del técnico con sus incidentes asignados.

**Archivo:** `src/app/dashboard/technician/page.tsx`

---

### 5.8 ✅ Portal del Solicitante (`/dashboard/requester`)

**Exclusivo para:** `REQUESTER`

**¿Qué hace?**
Vista simplificada para usuarios que solo necesitan ver y crear sus propias solicitudes.

**Archivo:** `src/app/dashboard/requester/page.tsx`

---

## 6. SISTEMA DE ROLES Y PERMISOS

### 6.1 Roles del Sistema

| Rol | Código | Descripción | Acceso |
|---|---|---|---|
| **Administrador** | `ORG_ADMIN` | Control total de la organización | Todo |
| **Encargado de Sede** | `BUILDING_MANAGER` | Gestiona edificios asignados | Operaciones + Infraestructura |
| **Técnico** | `TECHNICIAN` | Recibe y atiende tickets | Solo su portal + Chat/AI |
| **Analista** | `ANALYST` | Visualiza datos y reportes | Portal analítico |
| **Solicitante** | `REQUESTER` | Crea solicitudes básicas | Solo su portal |

### 6.2 Mapa de Navegación por Rol

```
ORG_ADMIN:
  ├── /dashboard              (Centro de Mando)
  ├── /dashboard/incidents    (Tablero de Tickets)
  ├── /dashboard/compliance   (Cumplimiento 3100)
  ├── /dashboard/finance      (Costos)
  ├── /dashboard/chat         (Asistente AI)
  ├── /dashboard/ai-predictive (ETHER Brain)
  ├── /dashboard/buildings    (Edificios/Áreas)
  ├── /dashboard/areas        (Áreas Operativas)
  ├── /dashboard/qr           (Códigos QR)
  └── /dashboard/roles        (Roles/Permisos)  ← EXCLUSIVO

BUILDING_MANAGER:
  ├── /dashboard/incidents
  ├── /dashboard/buildings
  ├── /dashboard/areas
  └── /dashboard/qr

TECHNICIAN:
  ├── /dashboard/technician   ← Exclusivo
  ├── /dashboard/chat
  └── /dashboard/ai-predictive

ANALYST:
  ├── /dashboard/analyst      ← Exclusivo
  ├── /dashboard/incidents
  ├── /dashboard/finance
  └── /dashboard/compliance

REQUESTER:
  └── /dashboard/requester    ← Exclusivo
```

### 6.3 Cumplimiento en el Middleware

El middleware en `middleware.ts` intercepta **todas las rutas** excepto archivos estáticos. Opera en **Edge Runtime** sin dependencias de terceros:

1. Lee las cookies de sesión de Supabase (`sb-*-auth-token`).
2. Reconstruye el JWT desde fragmentos de cookies si está dividido en chunks.
3. Decodifica el payload con `atob()` (disponible nativo en Edge).
4. Extrae `user_metadata.role`.
5. Aplica las reglas de redirección por rol.

---

## 7. FLUJOS DE AUTENTICACIÓN Y SEGURIDAD

### 7.1 Flujo de Login

```
Usuario → POST /auth/login
    → Supabase Auth valida credenciales
    → Genera JWT con user_metadata.role
    → Guarda en cookie HTTP (sb-*-auth-token)
    → Middleware detecta cookie en siguiente request
    → Redirige a /dashboard (o al portal específico del rol)
```

### 7.2 Flujo de Creación de Usuario (Reclutamiento)

```
ORG_ADMIN llena formulario
    → Server Action: createEtherUser()
    → Llama a adminAuthClient.auth.admin.createUser()
    → Supabase crea usuario en auth.users
    → Trigger handle_new_user() se activa:
         → Crea fila en profiles
         → Crea fila en user_permissions
    → Server Action actualiza el profile: org_id, role
    → Server Action actualiza user_permissions: permisos granulares
    → Si TECHNICIAN: INSERT en technician_assignments
```

### 7.3 Estado actual de RLS (Row Level Security)

> ⚠️ **ADVERTENCIA CRÍTICA:** Todas las tablas tienen RLS habilitado, pero las políticas actuales son `FOR ALL USING (true)`. Esto significa que cualquier usuario autenticado puede leer y escribir en cualquier fila de cualquier organización.

**Esto es un modo de desarrollo temporal. Antes de ir a producción real se debe implementar:**

```sql
-- Ejemplo de política correcta para maintencance_incidents:
CREATE POLICY "Acceso solo a su organización"
ON maintenance_incidents
FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

---

## 8. COMPONENTES REUTILIZABLES

### 8.1 `IncidentFormModal.tsx`

**Propósito:** Modal de creación de incidentes. Usado en el Tablero de Tickets y potencialmente en el Portal del Solicitante.

**Props:**
```typescript
interface IncidentFormModalProps {
  onClose: () => void;      // Callback al cerrar
  onSuccess: () => void;    // Callback al guardar exitosamente
  initialDescription?: string; // Pre-rellenar descripción (AURA → Modal)
}
```

**Campos del formulario:**
- Sede / Edificio afectado (select dinámico desde DB)
- Área / Piso específico (filtrado según sede seleccionada)
- Tipo de requerimiento: Correctivo, Preventivo, Eléctrico, Estructural
- Urgencia: Leve / Moderado / Crítico
- Activo/Hardware involucrado (texto libre)
- **Evidencia multimedia:** Foto (cámara directa), Video (cámara directa), Galería/Archivo
- Preview del archivo antes de enviar con opción de eliminar
- Descripción textual del daño

**Flujo de subida:**
1. Sube el archivo a Supabase Storage (`incidents-media`).
2. Obtiene la URL pública.
3. Inserta el incidente con `media_url` en la tabla.

---

### 8.2 `AuraVoiceEngine.tsx`

**Propósito:** Asistente conversacional de voz para reportar incidentes "manos libres". Especialmente útil en contextos clínicos donde el personal no puede tocar la pantalla.

**Tecnologías usadas:**
- `Web Speech API` → `SpeechRecognition` (STT - Speech to Text)
- `SpeechSynthesis API` → TTS (Text to Speech)
- Idioma forzado: `es-CO` (español colombiano)
- Voz: prioriza voces femeninas naturales disponibles en el OS

**Estados de la máquina de estados (FSM):**
```
IDLE → [hotword "aura"] → WAKING
WAKING → [saludo TTS] → LISTENING_ISSUE
LISTENING_ISSUE → [recoge problema] → ASKING_SEDE / ASKING_PISO
ASKING_SEDE → LISTENING_SEDE → ASKING_PISO
ASKING_PISO → LISTENING_PISO → ASKING_AREA
ASKING_AREA → LISTENING_AREA → CONFIRMING
CONFIRMING → [sí/no] → PROCESSING / IDLE
PROCESSING → [confirma TTS] → onReportGenerated() → IDLE
```

**Props:**
```typescript
interface AuraVoiceEngineProps {
  onReportGenerated: (issue: string, location: string) => void;
  userName?: string;        // Para personalizar el saludo
  currentSede?: string;     // Sede actual (omite paso de preguntar sede)
  availableSedes?: string[]; // Lista de sedes disponibles para orientar
  currentPiso?: string;     // Piso actual conocido
  currentArea?: string;     // Área actual conocida
  compact?: boolean;        // Modo botón compacto (sin panel expandido)
  fullCard?: boolean;       // Modo tarjeta grande
}
```

**Modos de visualización:**
- `compact` → Solo botón de micrófono
- `fullCard` → Tarjeta grande con CTA
- Por defecto → Panel mediano con animaciones de estado

---

### 8.3 `ClosingRatingModal.tsx`

**Propósito:** Modal que aparece al cerrar/mitigar un ticket para recoger calificaciones de calidad del servicio.

**Campos de rating (1-5 estrellas):**
- `rating_quality` — Calidad del trabajo
- `rating_presentation` — Presentación del técnico
- `rating_solution` — Efectividad de la solución

---

### 8.4 `TicketSidebarView.tsx`

**Propósito:** Panel lateral deslizable con el detalle completo de un ticket seleccionado. Muestra la evidencia multimedia, datos del ticket, historial de comentarios y permite tomar acciones.

---

## 9. ESTADO ACTUAL POR MÓDULO

### Leyenda de Estado

| Indicador | Significado |
|---|---|
| ✅ **OPERATIVO** | Funciona completo y consume datos reales de DB |
| 🟡 **PARCIAL** | Existe la UI pero tiene funcionalidad limitada |
| 🔴 **STUB** | Existe solo la página con texto placeholder |
| 🚧 **PLANNIFICADO** | No existe en código, está en el roadmap |

### Tabla de Estado por Módulo

| Módulo | Ruta | Estado | Detalles |
|---|---|---|---|
| Landing Page | `/` | ✅ OPERATIVO | Diseño completo, sin datos DB |
| Portal Auth | `/auth` | ✅ OPERATIVO | Login y registro OK |
| Centro de Mando | `/dashboard` | ✅ OPERATIVO | KPIs en tiempo real, auto-reparador |
| Tablero Kanban | `/dashboard/incidents` | 🟡 PARCIAL | Crea/lista tickets. Faltan: drag&drop, cambio de estado inline, tiempo real |
| Gestión Edificios | `/dashboard/buildings` | ✅ OPERATIVO | CRUD completo edificios y áreas |
| Roles & Permisos | `/dashboard/roles` | ✅ OPERATIVO | CRUD usuarios, CSV bulk, toggles de permisos |
| Portal Técnico | `/dashboard/technician` | 🟡 PARCIAL | UI existe, necesita integración completa |
| Portal Solicitante | `/dashboard/requester` | 🟡 PARCIAL | UI existe, funcionalidad básica |
| Analista | `/dashboard/analyst` | 🔴 STUB | Solo esqueleto de UI |
| Cumplimiento 3100 | `/dashboard/compliance` | 🔴 STUB | Texto placeholder únicamente |
| Costos/Finanzas | `/dashboard/finance` | 🔴 STUB | No implementado |
| Chat AI | `/dashboard/chat` | 🔴 STUB | No implementado |
| ETHER Brain | `/dashboard/ai-predictive` | 🔴 STUB | No implementado |
| Generador QR | `/dashboard/qr` | 🔴 STUB | Existe librería `qrcode`, falta UI funcional |
| Áreas Operativas | `/dashboard/areas` | 🟡 PARCIAL | Las áreas se gestionan desde el módulo de Edificios |
| Ticket Público QR | `/t/new/[qrId]` | 🟡 PARCIAL | Estructura de ruta existe, implementación pendiente |
| AURA Voz | (componente) | ✅ OPERATIVO | FSM completa con TTS+STT |
| Modal Incidente | (componente) | ✅ OPERATIVO | Formulario + upload multimedia |
| Rating Cierre | (componente) | ✅ OPERATIVO | Columnas de BD creadas y soportadas |

---

## 10. RESTRICCIONES Y DEUDA TÉCNICA

### 10.1 🔴 Seguridad — Crítico

1. **RLS en modo desarrollo abierto:** Las políticas `USING (true)` permiten que un usuario de organización A acceda a datos de organización B. **Debe corregirse antes de cualquier uso con datos reales.**

2. **Contraseñas en plaintext en CSV:** El módulo de carga masiva lee contraseñas desde CSV en texto plano. Se debe implementar un flujo de invitación por email con enlace de configuración de contraseña.

3. **Service Role Key en Server Actions:** El `SUPABASE_SERVICE_ROLE_KEY` se usa correctamente en Server Actions (no expuesto al cliente), pero se debe asegurar que nunca sea accedido desde componentes cliente.

### 10.2 🟡 Funcionalidad Incompleta

4. **Cambio de estado de tickets:** No existe UI para mover un ticket de "Abierto" a "En Curso" o "Mitigado". El Kanban es solo de visualización.

5. **Asignación de técnicos:** La columna `assigned_tech_id` existe en la tabla pero no hay UI para asignar un técnico a un ticket.

6. **Módulo QR:** La ruta `/dashboard/qr` existe pero solo muestra un placeholder. La biblioteca `qrcode` está instalada pero no hay UI para generar, descargar o imprimir QRs vinculados a edificios/áreas.

7. **Ticket público vía QR:** La ruta `/t/new/[qrId]` tiene la estructura creada pero la implementación del formulario público (sin login) no está completa.

8. **Supabase Realtime:** No hay suscripciones en tiempo real activas. Los dashboards no se actualizan automáticamente cuando otro usuario crea/modifica un ticket.

9. **Finanzas/Costos:** El KPI "Impacto Financiero" del Centro de Mando siempre muestra `$0.00`. El módulo de costos no existe.

10. **Cumplimiento 3100:** El módulo de auditoría y cumplimiento normativo es solo un placeholder.

11. **Chat AI / ETHER Brain:** Los módulos de inteligencia artificial conversacional y predictiva no están implementados.

### 10.3 🟡 Calidad de Código

12. **Uso de `any[]` en TypeScript:** Gran parte de los datos de Supabase se tipan como `any[]`. Se deben definir interfaces TypeScript propias o usar los tipos generados por Supabase CLI.

13. **`alert()` nativo para errores:** Se usa `window.alert()` para mostrar errores. Se debe reemplazar por un sistema de notificaciones `toast` o un componente de error consistente.

14. **Queries sin filtro de `org_id` en algunos lugares:** El módulo de edificios hace `select('*').from('buildings')` sin filtrar por `org_id` en algunos puntos (confiando en RLS, que actualmente está abierta).

15. **Auto-reparador duplicado:** La lógica de auto-crear organización está repetida en al menos 3 páginas diferentes. Debe centralizarse en un custom hook `useOrg()` o en un Server Component de layout.

---

## 11. ROADMAP FUTURO

### 🚀 Fase 2 — Operatividad Completa (Próximas 4-8 semanas)

| Prioridad | Tarea | Impacto |
|---|---|---|
| 🔴 CRÍTICO | Implementar RLS real en Supabase | Seguridad multitenancy |
| 🔴 CRÍTICO | Completar módulo QR con generación y descarga | Funcionalidad core |
| 🔴 CRÍTICO | Formulario público de ticket vía QR (`/t/new/[qrId]`) | Funcionalidad core |
| 🟠 ALTO | UI para cambio de estado de tickets en el Kanban | Operatividad |
| 🟠 ALTO | Asignación de técnico a un ticket desde la UI | Operatividad |
| 🟠 ALTO | Supabase Realtime en el Kanban y Centro de Mando | UX/Notificaciones |
| 🟡 MEDIO | Módulo de Costos/Finanzas básico | Analítica |
| 🟡 MEDIO | Módulo de Cumplimiento 3100 | Normativa |
| 🟡 MEDIO | Vista detallada de ticket con comentarios | Colaboración |

### 🧠 Fase 3 — Inteligencia Artificial (Mes 2-3)

| Funcionalidad | Descripción |
|---|---|
| **ETHER Brain Predictiva** | Modelo de predicción de fallas basado en historial de incidentes por área |
| **AI Risk Score** | Algoritmo de scoring automático de riesgo en cada ticket nuevo |
| **Chat AI Contextual** | Asistente conversacional que responde preguntas sobre el estado operativo |
| **SLA Automático** | Asignación automática de `sla_deadline` según urgencia y tipo de incidente |
| **Alertas Proactivas** | Notificaciones push/email cuando un ticket supera el SLA o escala a crítico |

### 📊 Fase 4 — Escala Empresarial

| Funcionalidad | Descripción |
|---|---|
| **Exportación de Reportes PDF** | Reportes periódicos con métricas, cumplimiento y costos |
| **App Móvil PWA** | El manifest.json ya está configurado como base |
| **Notificaciones Push** | Alertas en tiempo real al técnico y al administrador |
| **Integraciones ERP** | Conexión con sistemas hospitalarios (SAP, HIS) |
| **Dashboard Gerencial** | Vistas ejecutivas con drill-down por edificio/área |
| **Multi-idioma** | Soporte i18n para despliegue en otros países |

---

## 12. VARIABLES DE ENTORNO REQUERIDAS

El archivo `.env.local` debe contener las siguientes variables para el correcto funcionamiento:

```env
# ─── SUPABASE ───────────────────────────────────────────
# URL del proyecto Supabase (encontrar en Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# Clave pública anon (segura para exponer en cliente)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Clave de rol de servicio (NUNCA exponer al cliente!)
# Solo para Server Actions y Middleware admin
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Nota de seguridad:** `NEXT_PUBLIC_*` se expone automáticamente al navegador. `SUPABASE_SERVICE_ROLE_KEY` sin prefijo `NEXT_PUBLIC_` es accesible solo en el servidor.

---

## 13. CONCLUSIONES DEL INGENIERO

### Fortalezas del Sistema Actual

1. **Arquitectura moderna:** Next.js App Router + Supabase es una stack robusta, escalable y con excelente DX (Developer Experience).
2. **Modelo multi-tenant bien estructurado:** La columna `org_id` en todas las tablas es la base correcta para escalar a múltiples clientes.
3. **AURA es un diferenciador:** El asistente de voz con FSM es una característica única que da ventaja competitiva en el sector salud.
4. **Middleware Edge-compatible:** La solución de autenticación sin dependencias externas en el middleware es correcto para despliegues en Vercel Edge.
5. **Schema de DB bien diseñado:** Las relaciones FK, el sistema de auditoría y los campos de calificación reflejan pensamiento a largo plazo.

### Riesgos Principales

1. **Seguridad no productiva:** Las políticas RLS abiertas son el riesgo más crítico del sistema en este momento.
2. **Alta deuda técnica en módulos stub:** Más de la mitad de los módulos del menú de navegación no están implementados, lo que puede generar una percepción incompleta si se presenta a usuarios reales.
3. **Sin manejo de errores uniforme:** La mezcla de `alert()`, `console.error()` y `setErrorMsg()` hace difícil el diagnóstico de problemas en producción.

### Recomendaciones Inmediatas

1. ✅ Implementar las políticas RLS correctas con `auth.uid()`.
2. ✅ Crear un hook `useCurrentOrg()` para centralizar la lógica repetida de resolución de `org_id`.
3. ✅ Reemplazar `any[]` por tipos generados con `supabase gen types typescript`.
4. ✅ Instalar una librería de toast notifications (ej. `sonner` o `react-hot-toast`).
5. ✅ Activar Supabase Realtime en el Canal de incidentes para actualizaciones en vivo.

---

*Documento generado basado en análisis completo del código fuente del proyecto ETHER — Mesa de Ayuda AI.*  
*Fecha de análisis: 18 de Abril de 2026 | Versión Código: 0.1.0*
