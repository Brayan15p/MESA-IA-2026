# ETHER: Centro de Mando Hospitalario - Guía de Proyecto

Este documento resume las capacidades actuales de la plataforma **ETHER**, diseñada para la gestión técnica y operativa de infraestructuras de salud.

## 🚀 Módulos Implementados

### 1. Centro de Mando (Dashboard)
- Visualización de métricas críticas (ROI, SLA, tickets activos).
- Acceso rápido a los reportes de incidentes.

### 2. Gestión de Incidentes (Tickets)
- **Kanban Operativo:** Clasificación de tickets por estado (Abierto, En Proceso, Mitigado).
- **Reporte Multimedia:** Permite adjuntar fotos o videos capturados directamente desde la cámara del celular.
- **Cascada de Ubicación:** Selección dinámica de Sede y Área/Piso para una trazabilidad exacta.

### 3. Topografía Hospitalaria
- **Gestión de Sedes:** CRUD completo de edificios.
- **Áreas y Pisos:** Sub-división de edificios en zonas específicas para auditorías y mantenimiento.

### 4. Gobierno y Roles
- **Niveles de Acceso:** 5 roles distintos que regulan los permisos de la interfaz.
- **Asignación Técnica:** Capacidad de anclar técnicos a áreas específicas del hospital.

## 📱 Acceso Móvil (Red Local)
Para usar la app desde el celular:
1. Conecta el PC y el Celular al mismo WiFi.
2. IP del Servidor: `http://192.168.1.22:3000`
3. Se han eliminado animaciones pesadas de `framer-motion` que causaban pantallas en blanco en dispositivos móviles.

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js 16 (React 19) + Tailwind CSS.
- **Backend:** Supabase (Auth + PostgreSQL + Storage).
- **Seguridad:** Políticas RLS para aislamiento de datos por organización (Multi-tenant).

---
*ETHER - Inteligencia Artificial aplicada a la infraestructura clínica.*
