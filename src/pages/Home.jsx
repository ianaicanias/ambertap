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

export default function Home() {
  const navigate = useNavigate();
  const [vivoActivo, setVivoActivo] = useState(null);
  const [loadingVivo, setLoadingVivo] = useState(true);
  const [vistaHistorial, setVistaHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState("todo");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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

  async function cargarHistorial() {
    setLoadingHistorial(true);
    const { data } = await supabase
      .from("vivos")
      .select("id, fecha, plataforma, hora_inicio, hora_fin")
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false })
      .limit(60);

    if (!data) {
      setLoadingHistorial(false);
      return;
    }

    const conStats = await Promise.all(
      data.map(async (v) => {
        const { count } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true })
          .eq("vivo_id", v.id);
        return { ...v, totalPedidos: count || 0 };
      }),
    );
    setHistorial(conStats);
    setLoadingHistorial(false);
  }

  function elegir(usuario) {
    localStorage.setItem("ambertap_usuario", usuario.id);
    navigate(usuario.ruta);
  }

  function formatFecha(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("es", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  }

  function formatHora(hora) {
    if (!hora) return "--:--";
    return new Date(hora).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function historialFiltrado() {
    if (!historial.length) return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return historial.filter((v) => {
      const fecha = new Date(v.fecha + "T00:00:00");

      if (filtroPeriodo === "hoy") {
        return v.fecha === hoy.toISOString().split("T")[0];
      }
      if (filtroPeriodo === "semana") {
        const hace7 = new Date(hoy);
        hace7.setDate(hoy.getDate() - 7);
        return fecha >= hace7;
      }
      if (filtroPeriodo === "mes") {
        const hace30 = new Date(hoy);
        hace30.setDate(hoy.getDate() - 30);
        return fecha >= hace30;
      }
      if (filtroPeriodo === "personalizado") {
        const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
        const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;
        if (desde && fecha < desde) return false;
        if (hasta && fecha > hasta) return false;
        return true;
      }
      return true;
    });
  }

  const filtrados = historialFiltrado();

  const fpStyle = (val) => ({
    padding: "5px 12px",
    borderRadius: 99,
    border: "1px solid",
    fontSize: 12,
    cursor: "pointer",
    borderColor: filtroPeriodo === val ? "#A0436A" : "#e8dde3",
    background: filtroPeriodo === val ? "#f5e6ed" : "#fff",
    color: filtroPeriodo === val ? "#A0436A" : "#9c7d8a",
    fontWeight: filtroPeriodo === val ? 500 : 400,
  });

  if (vistaHistorial) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setVistaHistorial(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#6b4d5a",
              padding: 0,
              lineHeight: 1,
            }}
          >
            &#8592;
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1014" }}>
            Historial de vivos
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <button
            style={fpStyle("todo")}
            onClick={() => setFiltroPeriodo("todo")}
          >
            Todos
          </button>
          <button
            style={fpStyle("hoy")}
            onClick={() => setFiltroPeriodo("hoy")}
          >
            Hoy
          </button>
          <button
            style={fpStyle("semana")}
            onClick={() => setFiltroPeriodo("semana")}
          >
            Esta semana
          </button>
          <button
            style={fpStyle("mes")}
            onClick={() => setFiltroPeriodo("mes")}
          >
            Este mes
          </button>
          <button
            style={fpStyle("personalizado")}
            onClick={() => setFiltroPeriodo("personalizado")}
          >
            Personalizado
          </button>
        </div>

        {filtroPeriodo === "personalizado" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9c7d8a",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Desde
              </div>
              <input
                type="date"
                className="input"
                style={{ marginBottom: 0 }}
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9c7d8a",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Hasta
              </div>
              <input
                type="date"
                className="input"
                style={{ marginBottom: 0 }}
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>
        )}

        {loadingHistorial && (
          <p style={{ color: "#9c7d8a", fontSize: 13 }}>Cargando...</p>
        )}

        {!loadingHistorial && filtrados.length === 0 && (
          <p
            style={{
              color: "#9c7d8a",
              fontSize: 13,
              textAlign: "center",
              padding: 20,
            }}
          >
            Sin vivos en este periodo
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map((v, i) => (
            <div
              key={v.id}
              onClick={() => navigate("/historial/" + v.id)}
              style={{
                background: "#fff",
                border: "1px solid #e8dde3",
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9c7d8a",
                    minWidth: 32,
                  }}
                >
                  #{historial.length - historial.indexOf(v)}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1a1014",
                      textTransform: "capitalize",
                    }}
                  >
                    {formatFecha(v.fecha)}
                  </div>

                  <div style={{ fontSize: 12, color: "#9c7d8a" }}>
                    🕒 {formatHora(v.hora_inicio)} -{" "}
                    {v.hora_fin ? formatHora(v.hora_fin) : "en curso"}
                  </div>

                  <div style={{ fontSize: 12, color: "#9c7d8a" }}>
                    {v.totalPedidos} pedidos
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!v.hora_fin && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: "#FCEBEB",
                      color: "#A32D2D",
                      fontWeight: 500,
                    }}
                  >
                    en curso
                  </span>
                )}
                <span style={{ color: "#c4a0b2", fontSize: 18 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", paddingTop: 32 }}>
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

      <p
        style={{
          fontSize: 12,
          color: "#9c7d8a",
          marginBottom: 10,
          textAlign: "center",
          fontWeight: 500,
          letterSpacing: ".04em",
          textTransform: "uppercase",
        }}
      >
        Quien sos?
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {USUARIOS.map((u) => (
          <button
            key={u.id}
            onClick={() => elegir(u)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "13px 16px",
              borderRadius: 12,
              border: "1px solid #e8dde3",
              background: "#fff",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "border-color .15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#A0436A")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#e8dde3")
            }
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: u.bg,
                color: u.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {u.label[0]}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1014" }}>
                {u.label}
              </div>
              <div style={{ fontSize: 12, color: "#9c7d8a" }}>{u.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          setVistaHistorial(true);
          cargarHistorial();
        }}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #e8dde3",
          background: "#fff",
          cursor: "pointer",
          fontSize: 14,
          color: "#6b4d5a",
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        Historial de vivos
      </button>
    </div>
  );
}
