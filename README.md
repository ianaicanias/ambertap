# Ambertap — Instrucciones de instalación

## Paso 1 — Crear las tablas en Supabase

1. Entrá a supabase.com → tu proyecto
2. Menú izquierdo → "SQL Editor"
3. "New query"
4. Copiá y pegá todo el contenido de `schema.sql`
5. Apretá "Run"
6. Tiene que decir "Success. No rows returned"

---

## Paso 2 — Bajar el proyecto a tu computadora

Necesitás tener instalado:
- **Node.js** (bajar de nodejs.org, versión LTS)
- **Git** (bajar de git-scm.com)

Después en la terminal:
```bash
git clone https://github.com/TU-USUARIO/ambertap.git
cd ambertap
```

---

## Paso 3 — Crear el archivo .env

En la carpeta del proyecto, creá un archivo llamado `.env` con este contenido:

```
VITE_SUPABASE_URL=https://nuloywpugadfuvbydhjb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bG95d3B1Z2FkZnV2YnlkaGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDA0MzMsImV4cCI6MjA5MDQ3NjQzM30.XETu5E61iWxWzsoPGXpGs7LQ2ijqYIDbQ_tEcOvXBos
```

---

## Paso 4 — Instalar y correr

```bash
npm install
npm run dev
```

Abrir en el navegador: http://localhost:5173

---

## Paso 5 — Subir a GitHub

```bash
git add .
git commit -m "primer commit ambertap"
git push
```

---

## Paso 6 — Deploy en Vercel (para que funcione en otras computadoras)

1. Entrá a vercel.com → login con GitHub
2. "New Project" → importá el repo `ambertap`
3. En "Environment Variables" agregá las dos variables del .env
4. "Deploy"
5. Te da una URL tipo `ambertap.vercel.app` — esa la usan todos

---

## Paneles

| URL | Quién | Cuándo |
|-----|-------|--------|
| /vivo | Papá | Durante el vivo |
| /deposito | Mariela | Durante y después |
| /post-vivo | Gabriela + Romero | Después del vivo |
| /clientas | Todos | Cuando se necesite |
| /dashboard | Papá / vos | Cuando quieran ver stats |
