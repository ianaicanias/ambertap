<div align="center">

<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel&logoColor=white" />

# Ambertap

**Sistema interno de gestión de ventas en vivo**

*Digitaliza en tiempo real las ventas por TikTok y Facebook Live de una tienda de ropa familiar uruguaya*

</div>

---

## ¿Qué es Ambertap?

Ambertap reemplaza el sistema de papel y anotaciones manuales que se usaba para registrar pedidos durante transmisiones en vivo. Antes, durante cada vivo se anotaban los pedidos a mano, lo que generaba errores, pedidos perdidos y un proceso de post-venta caótico.

Hoy, con Ambertap, **todo el equipo trabaja en tiempo real desde sus propios dispositivos**:

- El dueño registra cada pedido en segundos mientras la vendedora muestra la ropa en cámara
- La encargada de depósito ve los pedidos aparecer instantáneamente en su pantalla y los prepara uno a uno
- El equipo de post-venta contacta a cada clienta por WhatsApp con el mensaje ya armado
- Todos los datos quedan guardados para análisis futuros

---

## El equipo y sus paneles

| Persona | Panel | Dispositivo | Función |
|---------|-------|-------------|---------|
| **Samy** (dueño) | `/vivo` | Celular / tablet | Registra pedidos durante el vivo |
| **Mariela** (depósito) | `/deposito` | Tablet fija | Prepara e imprime ticket por pedido |
| **Gabriela** | `/post-vivo` | Celular | Contacta clientas, registra pagos |
| **Romero** | `/post-vivo` | Celular | Contacta clientas, registra pagos |
| **Dashboard** | `/dashboard` | Cualquiera | Estadísticas y análisis |
| **Clientas** | `/clientas` | Cualquiera | Base de datos de clientas |

---

## Flujo completo de un vivo

```
ANTES DEL VIVO
──────────────
Samy abre la app → toca "Iniciar vivo"
    └─→ Supabase registra el vivo del día
        └─→ Mariela ve "Arrancó el vivo" en su pantalla


DURANTE EL VIVO
───────────────
Patricia muestra prenda en cámara
    └─→ Samy crea la prenda (nombre, precio, colores, talles)
        └─→ Queda como "prenda activa"

Clienta comenta "bordo XL"
    └─→ Samy selecciona color + talle + escribe el nombre
        └─→ Toca "Confirmar pedido"
            └─→ Supabase guarda el pedido (real-time)
                └─→ Mariela ve la tarjeta aparecer + suena un ding
                    └─→ Mariela prepara el pedido y toca ✓
                        └─→ Se imprime el ticket automáticamente
                            └─→ El pedido pasa a "Preparados"

↻ Se repite por cada prenda y cada clienta


TERMINAR EL VIVO
────────────────
Samy toca "Terminar vivo"
    └─→ Se descarga resumen .txt con todos los pedidos
        └─→ Mariela sigue viendo sus pedidos pendientes
            └─→ El vivo queda cerrado en el historial


POST-VIVO
─────────
Gabriela / Romero abren el panel
    └─→ Ven todas las clientas del vivo agrupadas
        └─→ Para cada una: tocan WA → se abre WhatsApp con mensaje listo
            └─→ Clienta paga → marcan "confirmado"
                └─→ Cargan departamento y agencia si no estaban
                    └─→ Datos guardados para futuros vivos
```

---

## Arquitectura técnica

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                  │
│                                                       │
│   React 18 + Vite 5                                  │
│                                                       │
│   /vivo      /deposito   /post-vivo                  │
│   /clientas  /dashboard  /historial/:id              │
│                                                       │
│   React Router v6  ·  CSS Variables  ·  localStorage │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS + WebSocket
┌────────────────────▼────────────────────────────────┐
│                    SUPABASE                          │
│                                                       │
│   PostgreSQL  ·  Row Level Security  ·  Real-time    │
│                                                       │
│   Tablas:                                            │
│   vivos → prendas_vivo → variantes_prenda            │
│   clientas → perfiles_clienta                        │
│   pedidos → pagos                                    │
└─────────────────────────────────────────────────────┘

Deploy: Vercel (frontend estático)
Región DB: South America (São Paulo)
```

---

## Schema de base de datos

```sql
vivos
├── id (uuid)
├── fecha (date)
├── hora_inicio (timestamptz)
├── hora_fin (timestamptz)        -- null = vivo activo
└── plataforma (text)             -- 'ambas'

prendas_vivo
├── id, vivo_id
├── nombre, precio_unitario
├── activa (bool)                 -- solo una activa por vivo
└── orden

variantes_prenda
├── id, prenda_vivo_id
├── color, talle
└── disponible

clientas
├── id
├── nombre_display, whatsapp
├── compras_count
├── primera_compra, ultima_compra
├── departamento                  -- 19 deptos Uruguay
└── agencia_preferida

pedidos
├── id, vivo_id, prenda_vivo_id, clienta_id
├── color, talle
├── incompleto (bool)             -- faltó color o talle
├── hora
└── estado                        -- pendiente | preparado | enviado | cancelado

pagos
├── id, pedido_id
├── estado                        -- pendiente | confirmado | problema
└── medio                         -- mercadopago | midinero | prex | otro
```

---

## Features por panel

### Panel del vivo (`/vivo`) — Samy

- **Iniciar / terminar vivo** con un botón. Al terminar descarga `.txt` con el resumen completo
- **Prenda activa** con colores y talles configurables al crearla
- **Autocomplete de clientas** — al escribir el nombre sugiere clientas de la base con sus compras anteriores
- **Clienta nueva** — si no existe, pide el número de WhatsApp obligatoriamente antes de confirmar
- **Pedidos incompletos** — si falta color o talle se guarda igual, marcado como incompleto
- **Reactivar prendas** anteriores del mismo vivo
- **Contador en tiempo real** de pedidos e incompletos

### Panel depósito (`/deposito`) — Mariela

- **Tarjetas grandes** con nombre, prenda, color y talle — pensado para tablet a distancia
- **Botón ✓ verde** de 60px — fácil de tocar
- **Sonido ding** por cada pedido nuevo que entra (requiere toque inicial para activar)
- **Notificación** "Arrancó el vivo" cuando Samy inicia el vivo
- **Impresión automática** de ticket al marcar preparado — abre el diálogo de impresión del navegador
- **Filtro por prenda** cuando hay múltiples prendas en el vivo
- **Pestaña Preparados** con historial del día
- **Real-time instantáneo** vía Supabase WebSocket — sin recargar la página

### Panel post-vivo (`/post-vivo`) — Gabriela y Romero

- **Selector de vivos** por día, con sub-selector por hora si hubo más de un vivo ese día
- **Agrupado por clienta** — si pidió 3 prendas, aparece una sola tarjeta con las 3
- **WA con un toque** — abre WhatsApp con el mensaje completo ya armado (todas las prendas + total + instrucciones de envío)
- **Estados de pago** — confirmado / pendiente / problema, con color por estado
- **Modal de datos** — carga WhatsApp, departamento y agencia. Se guardan para futuros vivos
- **Filtros** — todas / sin pagar / datos incompletos / datos completos

### Panel clientas (`/clientas`)

- **Búsqueda en tiempo real** por nombre o WhatsApp
- **Filtro por departamento** — los 19 departamentos de Uruguay
- **Orden** por más compras / más reciente / nombre A-Z
- **Perfil de clienta** con total gastado, datos de contacto e historial completo de compras

### Dashboard (`/dashboard`)

- **Filtros de período** — hoy / semana / mes / total
- **Pestaña Ventas** — pedidos, recaudado, % pagados, barras de talles y colores, gráfico de pedidos por día
- **Pestaña Clientes** — total de clientas, nuevas en el período, sin comprar hace 30+ días, top 5 clientas
- **Pestaña Mapa** — mapa de Uruguay con círculos proporcionales por departamento

### Historial de vivos

- Lista navegable de todos los vivos con número correlativo
- **Filtros** — hoy / esta semana / este mes / rango de fechas personalizado
- **Detalle por vivo** — stats completas, barras de talles y colores, lista de pedidos (solo lectura)

---

## Instalación

### Prerequisitos

- [Node.js LTS](https://nodejs.org)
- [Git](https://git-scm.com)
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/ambertap.git
cd ambertap
```

### 2. Crear las tablas en Supabase

1. Supabase → SQL Editor → New query
2. Pegar el contenido de `schema.sql` → Run
3. Pegar el contenido de `schema_v2.sql` → Run

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. Instalar y correr

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`

---

## Deploy en Vercel

1. Subir el repositorio a GitHub
2. [vercel.com](https://vercel.com) → New Project → importar el repo
3. En Environment Variables agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Deploy

La URL generada (`ambertap.vercel.app`) es la que usa todo el equipo desde cualquier dispositivo.

---

## Decisiones de diseño

**¿Por qué una sola app y no apps separadas?**
Un solo deploy, una sola URL. Cada persona elige su panel al entrar. El navegador recuerda la elección.

**¿Por qué sin login?**
App interna de 5 personas en una red de confianza. El overhead de autenticación no justifica la complejidad para este caso de uso. Se puede agregar en v2.

**¿Por qué no se envía WhatsApp automáticamente?**
Riesgo de baneo de la cuenta. WhatsApp detecta mensajes automatizados y puede bloquear el número permanentemente. El sistema arma el mensaje, el humano lo envía.

**¿Por qué Supabase y no Firebase u otro?**
PostgreSQL real con joins, RLS granular, real-time incluido, y tier gratuito generoso. Para una app de 5 usuarios con ~250 pedidos diarios, el free tier alcanza por años.

**¿Por qué no captura comentarios de TikTok automáticamente?**
TikTok no tiene una API pública estable para live comments. Las soluciones existentes son frágiles y violan los términos de servicio.

---

## Stack

| Tecnología | Uso |
|-----------|-----|
| React 18 | UI y estado |
| Vite 5 | Bundler y dev server |
| React Router v6 | Navegación entre paneles |
| Supabase JS v2 | Base de datos + real-time |
| Vercel | Hosting |

Sin TypeScript. Sin librerías de UI. Sin Redux. CSS puro con variables.

---

## Contexto

Ambertap fue construido para **AmberTap**, una tienda de ropa familiar uruguaya que vende exclusivamente a través de transmisiones en vivo por TikTok y Facebook. Antes del sistema, todo se manejaba con papel y anotaciones manuales durante cada vivo, con los problemas que eso conlleva: pedidos perdidos, talles confundidos, clientas sin contactar.

El sistema fue diseñado con el equipo real en mente — en particular Mariela, encargada del depósito, para quien la interfaz usa texto grande, botones grandes y la menor fricción posible.

---

<div align="center">
Hecho con React + Supabase · Uruguay 🇺🇾
</div>
