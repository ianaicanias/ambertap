import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

function sonar(ctx) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function imprimirTicket(pedido) {
  const nombre = pedido.clientas?.nombre_display || "—";
  const prenda = pedido.prendas_vivo?.nombre || "—";
  const color = pedido.color || "—";
  const talle = pedido.talle || "—";
  const hora = new Date(pedido.hora).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fecha = new Date().toLocaleDateString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const ventana = window.open("", "_blank", "width=320,height=400");
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket Ambertap</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          padding: 16px;
          width: 280px;
          color: #000;
        }
        .centro { text-align: center; }
        .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; margin-bottom: 4px; }
        .sep { border-top: 1px dashed #000; margin: 8px 0; }
        .campo { display: flex; justify-content: space-between; padding: 3px 0; }
        .lbl { color: #555; font-size: 11px; }
        .val { font-weight: bold; font-size: 14px; }
        .grande { font-size: 18px; font-weight: bold; text-align: center; padding: 8px 0; }
      </style>
    </head>
    <body>
      <div class="centro">
        <div class="logo">AMBERTAP</div>
        <div style="font-size:11px; color:#555">${fecha} · ${hora}hs</div>
      </div>
      <div class="sep"></div>
      <div class="campo"><span class="lbl">Clienta</span><span class="val">${nombre}</span></div>
      <div class="sep"></div>
      <div class="grande">${prenda}</div>
      <div class="sep"></div>
      <div class="campo"><span class="lbl">Color</span><span class="val">${color}</span></div>
      <div class="campo"><span class="lbl">Talle</span><span class="val">${talle}</span></div>
      <div class="campo"><span class="lbl">Precio</span><span class="val">${pedido.prendas_vivo?.precio_unitario ? "$" + pedido.prendas_vivo.precio_unitario.toLocaleString("es") : "—"}</span></div>
      ${pedido.incompleto ? '<div class="sep"></div><div style="text-align:center;font-weight:bold;color:#c00">⚠ INCOMPLETO</div>' : ""}
      <div class="sep"></div>
      <div class="centro" style="font-size:11px;color:#888">Preparado · Ambertap</div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }<\/script>
    </body>
    </html>
  `);
  ventana.document.close();
}

export default function PanelDeposito() {
  const [pendientes, setPendientes] = useState([]);
  const [preparados, setPreparados] = useState([]);
  const [tab, setTab] = useState("pend");
  const [filtro, setFiltro] = useState("todos");
  const [prendas, setPrendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vivoNuevo, setVivoNuevo] = useState(false);
  const [audioActivo, setAudioActivo] = useState(false);
  const [marcando, setMarcando] = useState(null);
  const audioCtx = useRef(null);
  const vivoIdRef = useRef(null);

  const cargarPedidos = useCallback(async (vivoId) => {
    const { data } = await supabase
      .from("pedidos")
      .select(
        "*, clientas(nombre_display), prendas_vivo(nombre, precio_unitario, stock_con_samy)",
      )
      .eq("vivo_id", vivoId)
      .not("estado", "eq", "cancelado")
      .order("hora", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }
    const pend = data.filter(
      (p) => p.estado === "pendiente" && !p.prendas_vivo?.stock_con_samy,
    );
    const prep = data.filter(
      (p) => p.estado === "preparado" || p.estado === "enviado",
    );
    setPendientes(pend);
    setPreparados(prep);
    const prendasUnicas = [
      ...new Map(
        pend.map((p) => [p.prendas_vivo?.nombre, p.prendas_vivo?.nombre]),
      ).entries(),
    ]
      .map(([n]) => n)
      .filter(Boolean);
    setPrendas(prendasUnicas);
    setLoading(false);
  }, []);

  const cargar = useCallback(async () => {
    const hoy = new Date().toISOString().split("T")[0];
    const { data: vivo } = await supabase
      .from("vivos")
      .select("id")
      .eq("fecha", hoy)
      .is("hora_fin", null)
      .maybeSingle();

    if (!vivo) {
      const { data: vivoTerminado } = await supabase
        .from("vivos")
        .select("id")
        .eq("fecha", hoy)
        .order("hora_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!vivoTerminado) {
        setLoading(false);
        return;
      }
      vivoIdRef.current = vivoTerminado.id;
      await cargarPedidos(vivoTerminado.id);
      return;
    }
    vivoIdRef.current = vivo.id;
    await cargarPedidos(vivo.id);
  }, [cargarPedidos]);

  useEffect(() => {
    let canal = null;

    async function init() {
      await cargar();

      canal = supabase
        .channel("deposito-v4")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "pedidos" },
          () => {
            if (vivoIdRef.current) {
              cargarPedidos(vivoIdRef.current);
              sonar(audioCtx.current);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "pedidos" },
          () => {
            if (vivoIdRef.current) cargarPedidos(vivoIdRef.current);
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "vivos" },
          () => {
            setVivoNuevo(true);
            cargar();
            setTimeout(() => setVivoNuevo(false), 6000);
          },
        )
        .subscribe((status) => console.log("Supabase canal:", status));
    }

    init();

    return () => {
      if (canal) supabase.removeChannel(canal);
    };
  }, [cargar, cargarPedidos]);

  async function marcarPreparado(pedido) {
    setMarcando(pedido.id);
    await supabase
      .from("pedidos")
      .update({ estado: "preparado" })
      .eq("id", pedido.id);
    imprimirTicket(pedido);
    setMarcando(null);
  }

  function activarAudio() {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    setAudioActivo(true);
    sonar(audioCtx.current);
  }

  const filtrados =
    filtro === "todos"
      ? pendientes
      : pendientes.filter((p) => p.prendas_vivo?.nombre === filtro);

  const tabStyle = (t) => ({
    padding: "9px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? "#A0436A" : "#9c7d8a",
    background: "none",
    border: "none",
    borderBottom: tab === t ? "2px solid #A0436A" : "2px solid transparent",
    marginBottom: -1,
  });
  const fbStyle = (val) => ({
    padding: "5px 12px",
    borderRadius: 99,
    border: "1px solid",
    fontSize: 12,
    cursor: "pointer",
    borderColor: filtro === val ? "#A0436A" : "#e8dde3",
    background: filtro === val ? "#f5e6ed" : "#fff",
    color: filtro === val ? "#A0436A" : "#9c7d8a",
    fontWeight: filtro === val ? 500 : 400,
  });

  if (loading)
    return <p style={{ padding: 20, color: "#9c7d8a" }}>Cargando...</p>;

  return (
    <div>
      {!audioActivo && (
        <button
          onClick={activarAudio}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #C0DD97",
            background: "#EAF3DE",
            color: "#27500A",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          Activar sonido de notificacion
        </button>
      )}
      {audioActivo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: "8px 12px",
            background: "#EAF3DE",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#27500A",
            }}
          />
          <span style={{ fontSize: 12, color: "#27500A", fontWeight: 500 }}>
            Sonido activado — ding por cada pedido nuevo
          </span>
        </div>
      )}
      {vivoNuevo && (
        <div
          style={{
            background: "#27500A",
            color: "#C0DD97",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 14,
            fontSize: 16,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          Arranco el vivo — empiezan a entrar pedidos
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Deposito — Mariela</h2>
        <p style={{ fontSize: 13, color: "#9c7d8a", marginTop: 2 }}>
          {pendientes.length} para preparar · {preparados.length} preparados
        </p>
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e8dde3",
          marginBottom: 14,
        }}
      >
        <button style={tabStyle("pend")} onClick={() => setTab("pend")}>
          Para preparar ({pendientes.length})
        </button>
        <button style={tabStyle("prep")} onClick={() => setTab("prep")}>
          Preparados ({preparados.length})
        </button>
      </div>

      {tab === "pend" && (
        <>
          {prendas.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <button
                style={fbStyle("todos")}
                onClick={() => setFiltro("todos")}
              >
                Todos
              </button>
              {prendas.map((p) => (
                <button key={p} style={fbStyle(p)} onClick={() => setFiltro(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}
          {filtrados.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#9c7d8a",
                fontSize: 15,
              }}
            >
              {pendientes.length === 0
                ? "Esperando pedidos..."
                : "Todos preparados"}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {" "}
              {filtrados.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8dde3",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#1a1014",
                        marginBottom: 5,
                      }}
                    >
                      {p.clientas?.nombre_display || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#6b4d5a",
                        marginBottom: 2,
                      }}
                    >
                      {p.prendas_vivo?.nombre}
                    </div>
                    <div style={{ fontSize: 14, color: "#9c7d8a" }}>
                      {p.color || "—"} — {p.talle || "—"}
                      {p.incompleto && (
                        <span
                          style={{
                            color: "#A32D2D",
                            marginLeft: 8,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          incompleto
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => marcarPreparado(p)}
                    disabled={marcando === p.id}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      border: "none",
                      background: marcando === p.id ? "#aaa" : "#27500A",
                      color: "#C0DD97",
                      fontSize: 26,
                      cursor: marcando === p.id ? "wait" : "pointer",
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "prep" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {preparados.length === 0 ? (
            <p style={{ padding: 20, textAlign: "center", color: "#9c7d8a" }}>
              Sin preparados todavia
            </p>
          ) : (
            preparados.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#f7f3f5",
                  border: "1px solid #e8dde3",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: 0.7,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#EAF3DE",
                    border: "1px solid #C0DD97",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "#27500A",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>
                    {p.clientas?.nombre_display || "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "#9c7d8a" }}>
                    {p.prendas_vivo?.nombre} · {p.color || "—"} {p.talle || "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
