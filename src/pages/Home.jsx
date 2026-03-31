import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const USUARIOS = [
  {
    id: "papa",
    label: "Samy",
    sub: "Panel del vivo",
    ruta: "/vivo",
    color: "#A0436A",
    bg: "#f5e6ed",
  },
  {
    id: "mariela",
    label: "Mariela",
    sub: "Deposito",
    ruta: "/deposito",
    color: "#27500A",
    bg: "#EAF3DE",
  },
  {
    id: "gabriela",
    label: "Gabriela",
    sub: "Post-vivo",
    ruta: "/post-vivo",
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  {
    id: "romero",
    label: "Romero",
    sub: "Post-vivo",
    ruta: "/post-vivo",
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  {
    id: "stats",
    label: "Dashboard",
    sub: "Estadisticas",
    ruta: "/dashboard",
    color: "#854F0B",
    bg: "#FAEEDA",
  },
];

const LINKS = [
  { label: "Historial de vivos", ruta: "/historial-vivos", icon: "📋" },
  { label: "Base de clientas", ruta: "/clientas", icon: "👥" },
];

export default function Home() {
  const navigate = useNavigate();
  const [vivoActivo, setVivoActivo] = useState(null);
  const [loadingVivo, setLoadingVivo] = useState(true);

  useEffect(() => {
    checkVivo();
    const guardado = localStorage.getItem("ambertap_usuario");
    if (guardado) {
      const u = USUARIOS.find((u) => u.id === guardado);
      if (u) navigate(u.ruta);
    }
  }, []);

  async function checkVivo() {
    setLoadingVivo(true);
    const hoy = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("vivos")
      .select("id, hora_inicio, hora_fin, plataforma, fecha")
      .eq("fecha", hoy)
      .is("hora_fin", null)
      .maybeSingle();
    setVivoActivo(data);
    setLoadingVivo(false);
  }

  function elegir(usuario) {
    localStorage.setItem("ambertap_usuario", usuario.id);
    navigate(usuario.ruta);
  }

  return (
    <div style={{ paddingTop: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#A0436A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            color: "#fff",
            fontWeight: 700,
            fontSize: 28,
            fontFamily: "Georgia, serif",
          }}
        >
          A
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#A0436A",
            letterSpacing: "-.5px",
          }}
        >
          Ambertap
        </h1>

        {loadingVivo ? (
          <p style={{ marginTop: 8, fontSize: 13, color: "#9c7d8a" }}>
            Verificando...
          </p>
        ) : vivoActivo ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 16px",
              borderRadius: 10,
              background: "#FCEBEB",
              border: "1px solid #F7C1C1",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#E24B4A",
                display: "inline-block",
                animation: "pulse 1.5s infinite",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#A32D2D" }}>
              Vivo en curso desde{" "}
              {new Date(vivoActivo.hora_inicio).toLocaleTimeString("es", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              hs
            </span>
          </div>
        ) : (
          <div
            style={{
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 10,
              background: "#f5f5f5",
              display: "inline-block",
            }}
          >
            <span style={{ fontSize: 13, color: "#9c7d8a" }}>
              Sin vivo activo hoy
            </span>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: '#9c7d8a', marginBottom: 10, textAlign: 'center', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>BIENVENIDO, EQUIPO AMBERTAP</p>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
  {USUARIOS.filter(u => u.id !== 'stats').map(u => (
    <button key={u.id} onClick={() => elegir(u)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, border: '1px solid #e8dde3', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#A0436A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e8dde3'}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.bg, color: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
        {u.label[0]}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1014' }}>{u.label}</div>
        <div style={{ fontSize: 11, color: '#9c7d8a' }}>{u.sub}</div>
      </div>
    </button>
  ))}
</div>

{(() => {
  const dash = USUARIOS.find(u => u.id === 'stats')
  return (
    <button onClick={() => elegir(dash)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 12, border: '1px solid #e8dde3', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color .15s', marginBottom: 8 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#A0436A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e8dde3'}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: dash.bg, color: dash.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
        {dash.label[0]}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1014' }}>{dash.label}</div>
        <div style={{ fontSize: 11, color: '#9c7d8a' }}>{dash.sub}</div>
      </div>
    </button>
  )
})()}

<div style={{ borderTop: '1px solid #f0e8ec', paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
  {LINKS.map(l => (
    <button key={l.ruta} onClick={() => navigate(l.ruta)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: '1px solid #e8dde3', background: '#fff', cursor: 'pointer', width: '100%', transition: 'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#A0436A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e8dde3'}
    >
      <span style={{ fontSize: 13, color: '#6b4d5a', fontWeight: 500 }}>{l.label}</span>
      <span style={{ color: '#c4a0b2', fontSize: 16 }}>›</span>
    </button>
  ))}
</div>
    </div>
  );
}
