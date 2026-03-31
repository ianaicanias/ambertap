import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEPARTAMENTOS = ['Montevideo','Canelones','Maldonado','Colonia','San Jose','Soriano','Rio Negro','Paysandu','Salto','Artigas','Rivera','Tacuarembo','Cerro Largo','Treinta y Tres','Rocha','Lavalleja','Florida','Flores','Durazno']

export default function PanelPostVivo() {
  const [vivos, setVivos] = useState([])
  const [vivoSel, setVivoSel] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [modalWA, setModalWA] = useState(null)
  const [modalDatos, setModalDatos] = useState(null)
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { cargarVivos() }, [])
  useEffect(() => { if (vivoSel) cargarPedidos(vivoSel) }, [vivoSel])

  async function cargarVivos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vivos')
      .select('id, fecha, hora_inicio')
      .order('fecha', { ascending: false })
      .limit(10)

    if (error) { setError('Error cargando vivos: ' + error.message); setLoading(false); return }
    setVivos(data || [])
    if (data && data.length > 0) {
      setVivoSel(data[0].id)
    } else {
      setLoading(false)
    }
  }

  async function cargarPedidos(vivoId) {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id, color, talle, incompleto, hora, estado,
        clientas (id, nombre_display, whatsapp, departamento, agencia_preferida, compras_count),
        prendas_vivo (id, nombre, precio_unitario),
        pagos (id, estado)
      `)
      .eq('vivo_id', vivoId)
      .not('estado', 'eq', 'cancelado')
      .order('hora', { ascending: true })

    if (error) {
      setError('Error: ' + error.message)
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setGrupos([])
      setLoading(false)
      return
    }

    const mapa = {}
    for (const p of data) {
      const cid = p.clientas?.id || ('sin-clienta-' + p.id)
      if (!mapa[cid]) {
        mapa[cid] = {
          clienta: p.clientas,
          pedidos: [],
          pago: p.pagos?.[0]?.estado || 'pendiente',
          pagoId: p.pagos?.[0]?.id || null
        }
      }
      mapa[cid].pedidos.push(p)
    }
    setGrupos(Object.values(mapa))
    setLoading(false)
  }

  async function actualizarPago(grupo, estado) {
    if (grupo.pagoId) {
      await supabase.from('pagos').update({ estado }).eq('id', grupo.pagoId)
    } else {
      const pedidoId = grupo.pedidos[0].id
      await supabase.from('pagos').insert({ pedido_id: pedidoId, estado })
    }
    await cargarPedidos(vivoSel)
  }

  async function guardarDatos(clientaId, datos) {
    setGuardandoDatos(true)
    const { error } = await supabase.from('clientas').update(datos).eq('id', clientaId)
    if (error) alert('Error guardando: ' + error.message)
    setGuardandoDatos(false)
    setModalDatos(null)
    await cargarPedidos(vivoSel)
  }

  function abrirWA(grupo) {
    const nombre = grupo.clienta?.nombre_display || '—'
    const lineas = grupo.pedidos.map(p =>
      `${p.prendas_vivo?.nombre || '—'} — ${p.color || '—'} ${p.talle || '—'}`
    ).join('\n')
    const total = grupo.pedidos.reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0)
const msg = `¡Hola ${nombre}! 😊 ¿Cómo estás?

*🧾 Te confirmamos tu pedido de AmberTap:*

${lineas}

*💰 Total: ${total > 0 ? '$' + total.toLocaleString('es') : '—'}*

🚚 Para coordinar el envío necesitamos:
- 📍 Dirección completa
- 🏢 Agencia de preferencia

💳 Medios de pago:
- Mercado Pago
- MiDinero
- Prex

🙌 ¡Gracias por confiar en nosotros!
Un abrazo de parte del equipo AmberTap 💙`;    const tel = grupo.clienta?.whatsapp?.replace(/\D/g, '') || ''
    const url = tel
      ? `https://wa.me/598${tel}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    setModalWA({ msg, url, nombre })
  }

  const datoCompleto = (g) => !!(g.clienta?.whatsapp && g.clienta?.departamento)

  const gruposFiltrados = grupos.filter(g => {
    if (filtro === 'sinpagar') return g.pago === 'pendiente'
    if (filtro === 'incompleto') return !datoCompleto(g)
    if (filtro === 'completo') return datoCompleto(g)
    return true
  })

  const avatarColor = (n = '') => {
    const cs = ['#f5e6ed:#A0436A','#EAF3DE:#27500A','#E6F1FB:#185FA5','#FAEEDA:#854F0B','#E1F5EE:#0F6E56']
    const [bg, fg] = cs[(n.charCodeAt(0) || 0) % cs.length].split(':')
    return { background: bg, color: fg }
  }
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const fbStyle = (val) => ({
    padding: '5px 12px', borderRadius: 99, border: '1px solid', fontSize: 12, cursor: 'pointer',
    borderColor: filtro === val ? '#A0436A' : '#e8dde3',
    background: filtro === val ? '#f5e6ed' : '#fff',
    color: filtro === val ? '#A0436A' : '#9c7d8a',
    fontWeight: filtro === val ? 500 : 400,
  })

  const formatFecha = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Post-vivo — Gabriela y Romero</h2>
      </div>

      {error && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: '#A32D2D' }}>
          {error}
        </div>
      )}

      {vivos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {vivos.map(v => (
            <button key={v.id} onClick={() => setVivoSel(v.id)} style={{
              padding: '5px 12px', borderRadius: 99, border: '1px solid', fontSize: 12, cursor: 'pointer',
              borderColor: vivoSel === v.id ? '#A0436A' : '#e8dde3',
              background: vivoSel === v.id ? '#f5e6ed' : '#fff',
              color: vivoSel === v.id ? '#A0436A' : '#9c7d8a',
              fontWeight: vivoSel === v.id ? 500 : 400,
            }}>
              {formatFecha(v.fecha)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button style={fbStyle('todas')} onClick={() => setFiltro('todas')}>Todas ({grupos.length})</button>
        <button style={fbStyle('sinpagar')} onClick={() => setFiltro('sinpagar')}>Sin pagar</button>
        <button style={fbStyle('incompleto')} onClick={() => setFiltro('incompleto')}>Datos incompletos</button>
        <button style={fbStyle('completo')} onClick={() => setFiltro('completo')}>Datos completos</button>
      </div>

      {loading && <p style={{ color: '#9c7d8a', fontSize: 13, padding: 20, textAlign: 'center' }}>Cargando pedidos...</p>}

      {!loading && !error && grupos.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#9c7d8a' }}>
          <p style={{ fontSize: 15 }}>Sin pedidos en este vivo</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Selecciona otro dia arriba</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gruposFiltrados.map((g, i) => {
          const total = g.pedidos.reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0)
          const completo = datoCompleto(g)
          return (
            <div key={i} style={{ background: '#fff', border: `1px solid ${completo ? '#e8dde3' : '#FAC775'}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0, ...avatarColor(g.clienta?.nombre_display) }}>
                  {initials(g.clienta?.nombre_display || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.clienta?.nombre_display || 'Sin nombre'}</div>
                  <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                    {g.pedidos.length} {g.pedidos.length === 1 ? 'prenda' : 'prendas'}
                    {total > 0 ? ` · $${total.toLocaleString('es')}` : ''}
                    {g.clienta?.whatsapp ? ` · +598 ${g.clienta.whatsapp}` : ' · sin WA'}
                  </div>
                  {g.clienta?.departamento && (
                    <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                      {g.clienta.departamento}{g.clienta.agencia_preferida ? ` · ${g.clienta.agencia_preferida}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setModalDatos(g)} style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid',
                    borderColor: completo ? '#e8dde3' : '#FAC775',
                    background: completo ? '#f7f3f5' : '#FAEEDA',
                    color: completo ? '#9c7d8a' : '#854F0B',
                    fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    {completo ? 'Editar' : 'Datos'}
                  </button>
                  <button onClick={() => abrirWA(g)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #C0DD97', background: '#EAF3DE', color: '#27500A', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                    WA
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f7f3f5', paddingTop: 8, marginBottom: 10 }}>
                {g.pedidos.map(p => (
                  <div key={p.id} style={{ fontSize: 13, color: p.incompleto ? '#A32D2D' : '#6b4d5a', padding: '3px 0', display: 'flex', gap: 8 }}>
                    <span>·</span>
                    <span>
                      {p.prendas_vivo?.nombre || '—'} — {p.color || '—'} {p.talle || '—'}
                      {p.prendas_vivo?.precio_unitario ? ` ($${p.prendas_vivo.precio_unitario.toLocaleString('es')})` : ''}
                      {p.incompleto ? ' [incompleto]' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['confirmado', 'pendiente', 'problema'].map(est => (
                  <span key={est} onClick={() => actualizarPago(g, est)} style={{
                    padding: '4px 10px', borderRadius: 99, border: '1px solid', fontSize: 12, cursor: 'pointer',
                    borderColor: g.pago === est ? (est === 'confirmado' ? '#C0DD97' : est === 'problema' ? '#F7C1C1' : '#A0436A') : '#e8dde3',
                    background: g.pago === est ? (est === 'confirmado' ? '#EAF3DE' : est === 'problema' ? '#FCEBEB' : '#f5e6ed') : '#f7f3f5',
                    color: g.pago === est ? (est === 'confirmado' ? '#27500A' : est === 'problema' ? '#A32D2D' : '#A0436A') : '#9c7d8a',
                    fontWeight: g.pago === est ? 500 : 400,
                  }}>{est}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {modalWA && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModalWA(null)}>
          <div className="modal">
            <h3>WA — {modalWA.nombre} <button className="modal-close" onClick={() => setModalWA(null)}>&#x2715;</button></h3>
            <pre style={{ background: '#f7f3f5', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap', border: '1px solid #e8dde3' }}>{modalWA.msg}</pre>
            <a href={modalWA.url} target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: 12, borderRadius: 10, background: '#27500A', color: '#C0DD97', fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
              Abrir WhatsApp
            </a>
          </div>
        </div>
      )}

      {modalDatos && (
        <ModalDatosClienta grupo={modalDatos} onGuardar={guardarDatos} onClose={() => setModalDatos(null)} guardando={guardandoDatos} />
      )}
    </div>
  )
}

function ModalDatosClienta({ grupo, onGuardar, onClose, guardando }) {
  const [whatsapp, setWhatsapp] = useState(grupo.clienta?.whatsapp || '')
  const [departamento, setDepartamento] = useState(grupo.clienta?.departamento || '')
  const [agencia, setAgencia] = useState(grupo.clienta?.agencia_preferida || '')

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Datos de {grupo.clienta?.nombre_display} <button className="modal-close" onClick={onClose}>&#x2715;</button></h3>
        <div className="section-label">WhatsApp</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#9c7d8a', flexShrink: 0 }}>+598</span>
          <input className="input" style={{ marginBottom: 0 }} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="094 123 456" type="tel" />
        </div>
        <div className="section-label">Departamento</div>
        <select className="input" value={departamento} onChange={e => setDepartamento(e.target.value)}>
          <option value="">Seleccionar...</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="section-label">Agencia preferida</div>
        <input className="input" value={agencia} onChange={e => setAgencia(e.target.value)} placeholder="Ej: DAC, correo, Copay..." />
        <button className="btn-primary" disabled={guardando}
          onClick={() => onGuardar(grupo.clienta?.id, {
            whatsapp: whatsapp.replace(/\D/g, ''),
            departamento,
            agencia_preferida: agencia
          })}>
          {guardando ? 'Guardando...' : 'Guardar datos'}
        </button>
      </div>
    </div>
  )
}
