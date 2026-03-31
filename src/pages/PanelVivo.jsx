import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const COLORES_DEFAULT = ["Negro","Bordo","Blanco","Beige","Verde","Azul","Rojo","Rosa","Gris","Marron"];
const TALLES = ["XS","S","M","L","XL","XXL","3XL","Unico"];

function imprimirTicketSamy(pedido, clientaNombre) {
  const prenda = pedido.prendaActiva?.nombre || "—";
  const color = pedido.color || "—";
  const talle = pedido.talle || "—";
  const hora = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const fecha = new Date().toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" });
  const ventana = window.open("", "_blank", "width=320,height=400");
  ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;padding:16px;width:280px;color:#000}
  .centro{text-align:center}.logo{font-size:20px;font-weight:bold;letter-spacing:2px;margin-bottom:4px}
  .sep{border-top:1px dashed #000;margin:8px 0}.campo{display:flex;justify-content:space-between;padding:3px 0}
  .lbl{color:#555;font-size:11px}.val{font-weight:bold;font-size:14px}.grande{font-size:18px;font-weight:bold;text-align:center;padding:8px 0}
  .samy{background:#f5e6ed;padding:4px 8px;border-radius:4px;font-size:11px;text-align:center;color:#A0436A;font-weight:bold;margin-bottom:4px}
  </style></head><body>
  <div class="centro"><div class="logo">AMBERTAP</div><div style="font-size:11px;color:#555">${fecha} · ${hora}hs</div></div>
  <div class="sep"></div>
  <div class="samy">STOCK CON SAMY</div>
  <div class="campo"><span class="lbl">Clienta</span><span class="val">${clientaNombre}</span></div>
  <div class="sep"></div>
  <div class="grande">${prenda}</div>
  <div class="sep"></div>
  <div class="campo"><span class="lbl">Color</span><span class="val">${color}</span></div>
  <div class="campo"><span class="lbl">Talle</span><span class="val">${talle}</span></div>
  <div class="sep"></div>
  <div class="centro" style="font-size:11px;color:#888">Entregado por Samy · Ambertap</div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script>
  </body></html>`);
  ventana.document.close();
}

function ModalNuevaPrenda({ onCrear, onClose }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [coloresInput, setColoresInput] = useState("");
  const [tallesSel, setTallesSel] = useState(["M","L","XL"]);
  const [coloresSel, setColoresSel] = useState([]);
  const [enDeposito, setEnDeposito] = useState(true);
  const [error, setError] = useState("");

  const cbtn = (on) => ({ padding: "6px 14px", borderRadius: 99, border: "1px solid", fontSize: 13, cursor: "pointer", borderColor: on ? "#A0436A" : "#e8dde3", background: on ? "#A0436A" : "#fff", color: on ? "#fff" : "#1a1014", transition: "all .1s" });
  const tbtn = (on) => ({ width: 44, height: 38, borderRadius: 8, border: "1px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", borderColor: on ? "#A0436A" : "#e8dde3", background: on ? "#A0436A" : "#fff", color: on ? "#fff" : "#1a1014" });

  function handleCrear() {
    if (!nombre.trim()) { setError("Pone el nombre de la prenda"); return; }
    const extras = coloresInput.split(",").map((s) => s.trim()).filter(Boolean);
    const cf = [...new Set([...coloresSel, ...extras])];
    if (!cf.length) { setError("Selecciona al menos un color"); return; }
    if (!tallesSel.length) { setError("Selecciona al menos un talle"); return; }
    onCrear({ nombre: nombre.trim(), precio: precio ? parseInt(precio) : null, colores: cf, talles: tallesSel, stockConSamy: !enDeposito });
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Nueva prenda <button className="modal-close" onClick={onClose}>&#x2715;</button></h3>
        <div className="section-label">Nombre</div>
        <input className="input" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(""); }} placeholder="Ej: Vestido flores" autoFocus />
        <div className="section-label">Precio ($)</div>
        <input className="input" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="1500" />
        <div className="section-label">Colores</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {COLORES_DEFAULT.map((c) => (
            <button key={c} style={cbtn(coloresSel.includes(c))} onClick={() => setColoresSel((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}>{c}</button>
          ))}
        </div>
        <input className="input" value={coloresInput} onChange={(e) => setColoresInput(e.target.value)} placeholder="Otros colores separados por coma..." />
        <div className="section-label">Talles</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TALLES.map((t) => (
            <button key={t} style={tbtn(tallesSel.includes(t))} onClick={() => {
              setTallesSel((prev) => {
                if (t === "Unico") return prev.includes("Unico") ? [] : ["Unico"];
                let nuevos = prev.filter((x) => x !== "Unico");
                return nuevos.includes(t) ? nuevos.filter((x) => x !== t) : [...nuevos, t];
              });
            }}>{t}</button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid", borderColor: enDeposito ? "#C0DD97" : "#c4a0b2", background: enDeposito ? "#EAF3DE" : "#f5e6ed", cursor: "pointer", marginBottom: 14, userSelect: "none" }}>
          <input type="checkbox" checked={enDeposito} onChange={(e) => setEnDeposito(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: enDeposito ? "#27500A" : "#A0436A" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: enDeposito ? "#27500A" : "#A0436A" }}>
              {enDeposito ? "Prenda en deposito" : "Stock con Samy"}
            </div>
            <div style={{ fontSize: 11, color: enDeposito ? "#3B6D11" : "#7a3351", marginTop: 1 }}>
              {enDeposito ? "Mariela prepara el pedido" : "Samy entrega y se imprime aca"}
            </div>
          </div>
        </label>

        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <button className="btn-primary" onClick={handleCrear}>Activar prenda</button>
      </div>
    </div>
  );
}

function ModalClientaNueva({ nombre, onGuardar, onClose }) {
  const [tel, setTel] = useState("");
  const [error, setError] = useState("");

  function handleGuardar() {
    const limpio = tel.replace(/\D/g, "");
    if (limpio.length < 8) { setError("Ingresa un numero valido"); return; }
    onGuardar(limpio);
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Clienta nueva <button className="modal-close" onClick={onClose}>&#x2715;</button></h3>
        <p style={{ fontSize: 14, color: "#6b4d5a", marginBottom: 14 }}>
          <strong>{nombre}</strong> no esta en la base. Ingresa su WhatsApp para registrarla.
        </p>
        <div className="section-label">WhatsApp</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#9c7d8a", flexShrink: 0, fontWeight: 500 }}>+598</span>
          <input className={`input ${error ? "error" : ""}`} style={{ marginBottom: 0 }} value={tel} onChange={(e) => { setTel(e.target.value); setError(""); }} placeholder="094 123 456" type="tel" autoFocus />
        </div>
        {error && <p style={{ color: "#A32D2D", fontSize: 13, margin: "6px 0" }}>{error}</p>}
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleGuardar}>Registrar y confirmar</button>
      </div>
    </div>
  );
}

export default function PanelVivo() {
  const navigate = useNavigate();
  const [vivo, setVivo] = useState(null);
  const [prendaActiva, setPrendaActiva] = useState(null);
  const [prendasAnteriores, setPrendasAnteriores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [colorSel, setColorSel] = useState(null);
  const [talleSel, setTalleSel] = useState(null);
  const [nombre, setNombre] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [clientaSel, setClientaSel] = useState(null);
  const [modalNuevaPrenda, setModalNuevaPrenda] = useState(false);
  const [modalNuevaClientaNombre, setModalNuevaClientaNombre] = useState(null);
  const [pendingNombre, setPendingNombre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorNombre, setErrorNombre] = useState(false);
  const sugerRef = useRef(null);

  useEffect(() => {
    cargarEstadoVivo();
    function handleClick(e) {
      if (sugerRef.current && !sugerRef.current.contains(e.target)) setSugerencias([]);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function cargarEstadoVivo() {
    setLoading(true);
    const hoy = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("vivos").select("*").eq("fecha", hoy).order("hora_inicio", { ascending: false }).limit(1).maybeSingle();
    if (data && !data.hora_fin) {
      setVivo(data);
      await cargarPrendas(data.id);
      await cargarPedidos(data.id);
    } else {
      setVivo(null);
    }
    setLoading(false);
  }

  async function iniciarVivo() {
    const hoy = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("vivos").insert({ fecha: hoy, plataforma: "ambas", hora_inicio: new Date().toISOString() }).select().single();
    setVivo(data);
    setPrendaActiva(null);
    setPrendasAnteriores([]);
    setPedidos([]);
  }

  async function cargarPrendas(vivoId) {
    const { data } = await supabase.from("prendas_vivo").select("*, variantes_prenda(*)").eq("vivo_id", vivoId).order("orden", { ascending: false });
    if (!data) return;
    setPrendaActiva(data.find((p) => p.activa) || null);
    setPrendasAnteriores(data.filter((p) => !p.activa));
  }

  async function cargarPedidos(vivoId) {
    const { data } = await supabase.from("pedidos").select("*, clientas(nombre_display), prendas_vivo(nombre, stock_con_samy)").eq("vivo_id", vivoId).order("hora", { ascending: false }).limit(40);
    setPedidos(data || []);
  }

  async function buscarClientas(q) {
    setNombre(q);
    setClientaSel(null);
    setErrorNombre(false);
    if (q.length < 2) { setSugerencias([]); return; }
    const { data } = await supabase.from("clientas").select("id, nombre_display, whatsapp, compras_count").ilike("nombre_display", `%${q}%`).order("compras_count", { ascending: false }).limit(6);
    setSugerencias(data || []);
  }

  function seleccionarClienta(c) {
    setNombre(c.nombre_display);
    setClientaSel(c);
    setSugerencias([]);
  }

  async function handleConfirmar() {
    if (!nombre.trim()) { setErrorNombre(true); return; }
    if (!vivo || !prendaActiva) return;
    if (clientaSel) { await confirmarPedido(clientaSel); return; }
    const { data: existe } = await supabase.from("clientas").select("id, nombre_display, whatsapp, compras_count").ilike("nombre_display", nombre.trim()).maybeSingle();
    if (existe) { setClientaSel(existe); await confirmarPedido(existe); }
    else { setPendingNombre(nombre.trim()); setModalNuevaClientaNombre(nombre.trim()); }
  }

  async function confirmarPedido(clienta) {
    setGuardando(true);
    const incompleto = !colorSel || !talleSel;
    const stockConSamy = prendaActiva?.stock_con_samy || false;
    const estadoInicial = stockConSamy ? "preparado" : "pendiente";

    await supabase.from("clientas").update({ ultima_compra: new Date().toISOString(), compras_count: (clienta.compras_count || 0) + 1 }).eq("id", clienta.id);
    await supabase.from("pedidos").insert({ vivo_id: vivo.id, prenda_vivo_id: prendaActiva.id, clienta_id: clienta.id, color: colorSel, talle: talleSel, incompleto, hora: new Date().toISOString(), estado: estadoInicial });

    if (stockConSamy) {
      imprimirTicketSamy({ color: colorSel, talle: talleSel, prendaActiva }, clienta.nombre_display);
    }

    setNombre(""); setColorSel(null); setTalleSel(null); setClientaSel(null); setErrorNombre(false); setPendingNombre(null);
    await cargarPedidos(vivo.id);
    setGuardando(false);
  }

  async function handleClientaNuevaGuardar(tel) {
    const { data: nueva } = await supabase.from("clientas").insert({ nombre_display: pendingNombre, whatsapp: tel, primera_compra: new Date().toISOString(), ultima_compra: new Date().toISOString(), compras_count: 1 }).select().single();
    setModalNuevaClientaNombre(null);
    setClientaSel(nueva);
    await confirmarPedido(nueva);
  }

  async function handleNuevaPrenda({ nombre, precio, colores, talles, stockConSamy }) {
    if (!vivo) return;
    await supabase.from("prendas_vivo").update({ activa: false }).eq("vivo_id", vivo.id).eq("activa", true);
    const { data: nueva } = await supabase.from("prendas_vivo").insert({ vivo_id: vivo.id, nombre, precio_unitario: precio, activa: true, orden: prendasAnteriores.length + 1, stock_con_samy: stockConSamy }).select().single();
    const variantes = [];
    for (const c of colores) for (const t of talles) variantes.push({ prenda_vivo_id: nueva.id, color: c, talle: t });
    await supabase.from("variantes_prenda").insert(variantes);
    setModalNuevaPrenda(false); setColorSel(null); setTalleSel(null);
    await cargarPrendas(vivo.id);
  }

  async function handleReactivar(prenda) {
    await supabase.from("prendas_vivo").update({ activa: false }).eq("vivo_id", vivo.id).eq("activa", true);
    await supabase.from("prendas_vivo").update({ activa: true }).eq("id", prenda.id);
    setColorSel(null); setTalleSel(null);
    await cargarPrendas(vivo.id);
  }

  async function terminarVivo() {
  if (!vivo) return;
  if (!window.confirm("Terminar el vivo? Samy no podra agregar mas pedidos.")) return;
  await supabase.from("vivos").update({ hora_fin: new Date().toISOString() }).eq("id", vivo.id);

  const pedidosCompletos = [...pedidos].reverse();
  const fecha = new Date(vivo.fecha + "T00:00:00").toLocaleDateString("es", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const horaInicio = new Date(vivo.hora_inicio).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const horaFin = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  const totalPedidos = pedidosCompletos.length;
  const incompletos = pedidosCompletos.filter(p => p.incompleto).length;
  const clientasUnicas = new Set(pedidosCompletos.map(p => p.clientas?.nombre_display).filter(Boolean)).size;
  const totalPotencial = pedidosCompletos.reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0);
  const conSamy = pedidosCompletos.filter(p => p.prendas_vivo?.stock_con_samy).length;

  const tallesConteo = {};
  const coloresConteo = {};
  const prendasConteo = {};
  for (const p of pedidosCompletos) {
    if (p.talle) tallesConteo[p.talle] = (tallesConteo[p.talle] || 0) + 1;
    if (p.color) coloresConteo[p.color] = (coloresConteo[p.color] || 0) + 1;
    const np = p.prendas_vivo?.nombre;
    if (np) prendasConteo[np] = (prendasConteo[np] || 0) + 1;
  }

  const topTalles = Object.entries(tallesConteo).sort((a,b) => b[1]-a[1]).slice(0,6);
  const topColores = Object.entries(coloresConteo).sort((a,b) => b[1]-a[1]).slice(0,6);
  const topPrendas = Object.entries(prendasConteo).sort((a,b) => b[1]-a[1]);

  const barraHTML = (items, max) => items.map(([label, n]) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <div style="width:80px;font-size:11px;color:#555;text-align:right;flex-shrink:0">${label}</div>
      <div style="flex:1;height:10px;background:#f0e8ec;border-radius:99px;overflow:hidden">
        <div style="height:100%;background:#A0436A;border-radius:99px;width:${Math.round(n/max*100)}%"></div>
      </div>
      <div style="width:24px;font-size:11px;color:#555;flex-shrink:0">${n}</div>
    </div>`).join("");

  const filasTabla = pedidosCompletos.map((p, i) => `
    <tr style="background:${i%2===0?'#fff':'#fdf8fa'}">
      <td style="padding:5px 8px;color:#888;font-size:11px">${String(i+1).padStart(2,'0')}</td>
      <td style="padding:5px 8px;font-size:11px">${new Date(p.hora).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</td>
      <td style="padding:5px 8px;font-size:12px;font-weight:500">${p.clientas?.nombre_display||"—"}</td>
      <td style="padding:5px 8px;font-size:11px;color:#555">${p.prendas_vivo?.nombre||"—"}</td>
      <td style="padding:5px 8px;font-size:11px">${p.color||"—"}</td>
      <td style="padding:5px 8px;font-size:11px">${p.talle||"—"}</td>
      <td style="padding:5px 8px;font-size:11px;color:#A0436A;font-weight:500">${p.prendas_vivo?.precio_unitario?'$'+p.prendas_vivo.precio_unitario.toLocaleString('es'):'—'}</td>
      <td style="padding:5px 8px;font-size:11px;text-align:center">${p.incompleto?'<span style="color:#A32D2D">inc</span>':'<span style="color:#27500A">ok</span>'}${p.prendas_vivo?.stock_con_samy?' <span style="color:#A0436A;font-size:10px">Samy</span>':''}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Resumen Vivo ${vivo.fecha}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1014;font-size:13px;padding:32px}
    h1{font-size:22px;font-weight:700;color:#A0436A;letter-spacing:-.5px}
    h2{font-size:14px;font-weight:600;color:#A0436A;margin:24px 0 12px;text-transform:uppercase;letter-spacing:.06em}
    .sep{border-top:1px solid #e8dde3;margin:20px 0}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
    .stat{background:#f7f3f5;border-radius:10px;padding:14px;text-align:center}
    .stat .n{font-size:28px;font-weight:700;color:#A0436A}
    .stat .l{font-size:11px;color:#9c7d8a;margin-top:3px}
    .cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:16px 0}
    table{width:100%;border-collapse:collapse}
    th{background:#A0436A;color:#fff;padding:7px 8px;font-size:11px;font-weight:600;text-align:left}
    @media print{
      @page{margin:20mm}
      .pagebreak{page-break-before:always}
    }
  </style>
  </head><body>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
    <div>
      <h1>Ambertap</h1>
      <div style="font-size:13px;color:#9c7d8a;margin-top:4px;text-transform:capitalize">${fecha}</div>
      <div style="font-size:12px;color:#9c7d8a">${horaInicio}hs — ${horaFin}hs</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#c4a0b2">Generado ${new Date().toLocaleDateString('es',{day:'2-digit',month:'2-digit',year:'numeric'})} · ${new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}hs</div>
  </div>

  <div class="sep"></div>
  <h2>Resumen del vivo</h2>

  <div class="stats">
    <div class="stat"><div class="n">${totalPedidos}</div><div class="l">pedidos totales</div></div>
    <div class="stat"><div class="n">${clientasUnicas}</div><div class="l">clientas</div></div>
    <div class="stat"><div class="n" style="color:${incompletos>0?'#A32D2D':'#A0436A'}">${incompletos}</div><div class="l">incompletos</div></div>
    <div class="stat"><div class="n">$${Math.round(totalPotencial/1000)}k</div><div class="l">potencial total</div></div>
  </div>

  <div style="background:#f7f3f5;border-radius:8px;padding:10px 14px;font-size:12px;color:#6b4d5a;margin-bottom:8px">
    Total potencial: <strong>$${totalPotencial.toLocaleString('es')}</strong> · 
    Promedio por clienta: <strong>$${clientasUnicas>0?Math.round(totalPotencial/clientasUnicas).toLocaleString('es'):'—'}</strong> · 
    Con stock en Samy: <strong>${conSamy} pedidos</strong>
  </div>

  <div class="cols">
    <div>
      <h2>Prendas</h2>
      ${barraHTML(topPrendas, topPrendas[0]?.[1]||1)}
    </div>
    <div>
      <h2>Talles</h2>
      ${barraHTML(topTalles, topTalles[0]?.[1]||1)}
    </div>
    <div>
      <h2>Colores</h2>
      ${barraHTML(topColores, topColores[0]?.[1]||1)}
    </div>
  </div>

  <div class="pagebreak"></div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <h2 style="margin:0">Detalle de pedidos</h2>
    <div style="font-size:11px;color:#9c7d8a">${totalPedidos} pedidos · ${vivo.fecha}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:32px">#</th>
        <th style="width:48px">Hora</th>
        <th>Clienta</th>
        <th>Prenda</th>
        <th style="width:60px">Color</th>
        <th style="width:44px">Talle</th>
        <th style="width:64px">Precio</th>
        <th style="width:60px;text-align:center">Estado</th>
      </tr>
    </thead>
    <tbody>${filasTabla}</tbody>
  </table>

  <div class="sep"></div>
  <div style="font-size:11px;color:#c4a0b2;text-align:center">Ambertap · ${vivo.fecha} · ${totalPedidos} pedidos</div>

  <script>window.onload=function(){window.print()}<\/script>
  </body></html>`;

  const ventana = window.open("", "_blank");
  ventana.document.write(html);
  ventana.document.close();
  setVivo(null);
}

  const coloresActivos = prendaActiva?.variantes_prenda ? [...new Set(prendaActiva.variantes_prenda.map((v) => v.color))] : [];
  const tallesActivos = prendaActiva?.variantes_prenda ? [...new Set(prendaActiva.variantes_prenda.map((v) => v.talle))] : [];
  const esTalleUnico = tallesActivos.length === 1 && tallesActivos[0] === "Unico";
  const incompletos = pedidos.filter((p) => p.incompleto).length;
  const hora = vivo ? new Date(vivo.hora_inicio).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "";
  const fecha = vivo ? new Date(vivo.fecha + "T00:00:00").toLocaleDateString("es", { day: "2-digit", month: "2-digit" }) : "";

  const cbtn = (on) => ({ padding: "6px 14px", borderRadius: 99, border: "1px solid", fontSize: 13, cursor: "pointer", borderColor: on ? "#A0436A" : "#e8dde3", background: on ? "#A0436A" : "#fff", color: on ? "#fff" : "#1a1014" });
  const tbtn = (on) => ({ width: 44, height: 38, borderRadius: 8, border: "1px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", borderColor: on ? "#A0436A" : "#e8dde3", background: on ? "#A0436A" : "#fff", color: on ? "#fff" : "#1a1014" });

  if (loading) return <p style={{ padding: 20, color: "#9c7d8a" }}>Cargando...</p>;

  if (!vivo) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1014", marginBottom: 8 }}>Sin vivo activo</h2>
        <p style={{ fontSize: 14, color: "#9c7d8a", marginBottom: 28 }}>Cuando estes listo, iniciá el vivo del dia</p>
        <button className="btn-primary" style={{ maxWidth: 260, margin: "0 auto" }} onClick={iniciarVivo}>Iniciar vivo</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1014", display: "flex", alignItems: "center", gap: 6 }}>
          <span className="live-dot" />Vivo en curso — {fecha}
        </h2>
        <p style={{ fontSize: 13, color: "#9c7d8a", marginTop: 2 }}>Iniciado {hora}hs</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        <div className="stat-card"><div className="num">{pedidos.length}</div><div className="lbl">pedidos</div></div>
        <div className="stat-card"><div className="num">{pedidos.length - incompletos}</div><div className="lbl">completos</div></div>
        <div className="stat-card"><div className="num" style={{ color: incompletos > 0 ? "#A32D2D" : "#1a1014" }}>{incompletos}</div><div className="lbl">incompletos</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: prendasAnteriores.length > 0 ? "1fr 160px" : "1fr", gap: 12, marginBottom: 12 }}>

        <div>
          {prendaActiva ? (
            <div style={{ background: prendaActiva.stock_con_samy ? "#f5e6ed" : "#EAF3DE", border: `1px solid ${prendaActiva.stock_con_samy ? "#c4a0b2" : "#C0DD97"}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: prendaActiva.stock_con_samy ? "#A0436A" : "#27500A", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>Prenda activa</div>
                <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: prendaActiva.stock_con_samy ? "#f5e6ed" : "#EAF3DE", color: prendaActiva.stock_con_samy ? "#A0436A" : "#27500A", border: `1px solid ${prendaActiva.stock_con_samy ? "#c4a0b2" : "#C0DD97"}`, fontWeight: 500 }}>
                  {prendaActiva.stock_con_samy ? "Stock con Samy" : "En deposito"}
                </div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: prendaActiva.stock_con_samy ? "#7a3351" : "#1a3d1a", marginBottom: 4 }}>{prendaActiva.nombre}</h3>
              <div style={{ fontSize: 13, color: prendaActiva.stock_con_samy ? "#A0436A" : "#27500A", marginBottom: 12 }}>
                {prendaActiva.precio_unitario ? "$" + prendaActiva.precio_unitario.toLocaleString("es") : "sin precio"}
              </div>

              <div className="section-label" style={{ marginTop: 0 }}>Color</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {coloresActivos.map((c) => (
                  <button key={c} style={cbtn(colorSel === c)} onClick={() => setColorSel(colorSel === c ? null : c)}>{c}</button>
                ))}
              </div>

              {!esTalleUnico && (
                <>
                  <div className="section-label">Talle</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {tallesActivos.map((t) => (
                      <button key={t} style={tbtn(talleSel === t)} onClick={() => setTalleSel(talleSel === t ? null : t)}>{t}</button>
                    ))}
                  </div>
                </>
              )}

              <div className="section-label">Clienta</div>
              <div style={{ position: "relative" }} ref={sugerRef}>
                <input className={`input ${errorNombre ? "error" : ""}`} placeholder="Nombre de la clienta..." value={nombre}
                  onChange={(e) => buscarClientas(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
                  autoComplete="off" style={{ marginBottom: clientaSel ? 4 : 8 }} />
                {clientaSel && (
                  <div style={{ fontSize: 12, color: "#27500A", marginBottom: 8 }}>
                    Clienta conocida · {clientaSel.compras_count} compras anteriores
                  </div>
                )}
                {sugerencias.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e8dde3", borderRadius: 10, zIndex: 50, boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
                    {sugerencias.map((c) => (
                      <div key={c.id} onClick={() => seleccionarClienta(c)}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f5f0f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f3f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre_display}</span>
                        <span style={{ fontSize: 11, color: "#9c7d8a" }}>{c.compras_count} compras</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!colorSel && !talleSel && nombre && (
                <p style={{ fontSize: 12, color: "#854F0B", marginBottom: 8 }}>Sin color ni talle — se guarda como incompleto</p>
              )}
              {prendaActiva.stock_con_samy && (
                <p style={{ fontSize: 12, color: "#A0436A", marginBottom: 8, fontWeight: 500 }}>El pedido queda preparado y se imprime el ticket aca</p>
              )}
              <button className="btn-primary" onClick={handleConfirmar} disabled={guardando}
                style={{ background: prendaActiva.stock_con_samy ? "#A0436A" : "#27500A" }}>
                {guardando ? "Guardando..." : "Confirmar pedido"}
              </button>
            </div>
          ) : (
            <div style={{ background: "#f5e6ed", border: "1px solid #c4a0b2", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <p style={{ color: "#A0436A", marginBottom: 12 }}>No hay prenda activa</p>
              <button className="btn-primary" onClick={() => setModalNuevaPrenda(true)}>+ Crear primera prenda</button>
            </div>
          )}

          {prendaActiva && (
            <button onClick={() => setModalNuevaPrenda(true)}
              style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10, border: "1px dashed #c4a0b2", background: "transparent", color: "#A0436A", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              + Nueva prenda
            </button>
          )}
        </div>

        {prendasAnteriores.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e8dde3", borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9c7d8a", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2 }}>Anteriores</div>
            {prendasAnteriores.map((p) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "6px 8px", borderRadius: 8, background: "#f7f3f5" }}>
                <span style={{ fontSize: 12, color: "#6b4d5a", fontWeight: 500, lineHeight: 1.3 }}>{p.nombre}</span>
                {p.precio_unitario && <span style={{ fontSize: 11, color: "#9c7d8a" }}>${p.precio_unitario.toLocaleString("es")}</span>}
                {p.stock_con_samy && <span style={{ fontSize: 10, color: "#A0436A", fontWeight: 500 }}>Stock con Samy</span>}
                <button onClick={() => handleReactivar(p)}
                  style={{ fontSize: 11, color: "#A0436A", border: "1px solid #c4a0b2", borderRadius: 99, padding: "2px 8px", cursor: "pointer", background: "transparent", fontWeight: 500, alignSelf: "flex-start" }}>
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {pedidos.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 14, marginBottom: 8 }}>Ultimos pedidos</div>
          <div className="card" style={{ padding: "4px 14px" }}>
            {pedidos.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f7f3f5" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.clientas?.nombre_display || "—"}</div>
                  <div style={{ fontSize: 12, color: p.incompleto ? "#A32D2D" : "#9c7d8a" }}>
                    {p.prendas_vivo?.nombre} · {p.color || "—"} {p.talle || "—"}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#9c7d8a", marginLeft: 8 }}>
                  {new Date(p.hora).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {p.prendas_vivo?.stock_con_samy && (
                  <span style={{ fontSize: 10, color: "#A0436A", marginLeft: 6, border: "1px solid #c4a0b2", borderRadius: 99, padding: "1px 6px" }}>Samy</span>
                )}
                {p.incompleto
                  ? <span className="badge-incompleto" style={{ marginLeft: 6 }}>inc</span>
                  : <span className="badge-ok" style={{ marginLeft: 6 }}>ok</span>}
              </div>
            ))}
          </div>
        </>
      )}

      <button onClick={terminarVivo} style={{ width: "100%", marginTop: 20, padding: 12, borderRadius: 10, border: "1px solid #F7C1C1", background: "#FCEBEB", color: "#A32D2D", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        Terminar vivo y descargar resumen
      </button>

      {modalNuevaPrenda && <ModalNuevaPrenda onCrear={handleNuevaPrenda} onClose={() => setModalNuevaPrenda(false)} />}
      {modalNuevaClientaNombre && <ModalClientaNueva nombre={modalNuevaClientaNombre} onGuardar={handleClientaNuevaGuardar} onClose={() => setModalNuevaClientaNombre(null)} />}
    </div>
  );
}