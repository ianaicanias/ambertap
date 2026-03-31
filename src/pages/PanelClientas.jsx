import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEPARTAMENTOS = ['Montevideo','Canelones','Maldonado','Colonia','San Jose','Soriano','Rio Negro','Paysandu','Salto','Artigas','Rivera','Tacuarembo','Cerro Largo','Treinta y Tres','Rocha','Lavalleja','Florida','Flores','Durazno']

export default function PanelClientas() {
  const [clientas, setClientas] = useState([])
  const [query, setQuery] = useState('')
  const [filtroDep, setFiltroDep] = useState('')
  const [filtroOrden, setFiltroOrden] = useState('compras')
  const [loading, setLoading] = useState(true)
  const [clientaSel, setClientaSel] = useState(null)
  const [historialClienta, setHistorialClienta] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('clientas')
      .select('id, nombre_display, whatsapp, compras_count, primera_compra, ultima_compra, departamento, agencia_preferida')

    if (query.trim().length >= 2) {
      q = q.or(`nombre_display.ilike.%${query}%,whatsapp.ilike.%${query}%`)
    }
    if (filtroDep) {
      q = q.eq('departamento', filtroDep)
    }
    if (filtroOrden === 'compras') q = q.order('compras_count', { ascending: false })
    else if (filtroOrden === 'reciente') q = q.order('ultima_compra', { ascending: false })
    else if (filtroOrden === 'nombre') q = q.order('nombre_display', { ascending: true })

    q = q.limit(50)
    const { data } = await q
    setClientas(data || [])
    setLoading(false)
  }, [query, filtroDep, filtroOrden])

  useEffect(() => {
    const t = setTimeout(() => cargar(), 300)
    return () => clearTimeout(t)
  }, [cargar])

  async function abrirClienta(c) {
    setClientaSel(c)
    setLoadingHistorial(true)
    const { data } = await supabase
      .from('pedidos')
      .select('id, color, talle, hora, incompleto, estado, prendas_vivo(nombre, precio_unitario), pagos(estado)')
      .eq('clienta_id', c.id)
      .order('hora', { ascending: false })
      .limit(20)
    setHistorialClienta(data || [])
    setLoadingHistorial(false)
  }

  const avatarColor = (n = '') => {
    const cs = ['#f5e6ed:#A0436A','#EAF3DE:#27500A','#E6F1FB:#185FA5','#FAEEDA:#854F0B','#E1F5EE:#0F6E56']
    const [bg, fg] = cs[(n.charCodeAt(0) || 0) % cs.length].split(':')
    return { background: bg, color: fg }
  }
  const initials = (n = '') => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const formatFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

  const ordenBtns = [
    { val: 'compras', label: 'Mas compras' },
    { val: 'reciente', label: 'Mas reciente' },
    { val: 'nombre', label: 'Nombre A-Z' },
  ]

  const btnStyle = (val) => ({
    padding: '4px 10px', borderRadius: 99, border: '1px solid', fontSize: 11, cursor: 'pointer',
    borderColor: filtroOrden === val ? '#A0436A' : '#e8dde3',
    background: filtroOrden === val ? '#f5e6ed' : '#fff',
    color: filtroOrden === val ? '#A0436A' : '#9c7d8a',
    fontWeight: filtroOrden === val ? 500 : 400,
  })

  if (clientaSel) {
    const totalGastado = historialClienta
      .filter(p => p.pagos?.some(pg => pg.estado === 'confirmado'))
      .reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0)

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setClientaSel(null)}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b4d5a', padding: 0 }}>&#8592;</button>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Perfil de clienta</h2>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0, ...avatarColor(clientaSel.nombre_display) }}>
              {initials(clientaSel.nombre_display)}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{clientaSel.nombre_display}</div>
              <div style={{ fontSize: 13, color: '#9c7d8a' }}>
                Clienta desde {formatFecha(clientaSel.primera_compra)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div className="stat-card"><div className="num">{clientaSel.compras_count}</div><div className="lbl">compras</div></div>
            <div className="stat-card"><div className="num">{totalGastado > 0 ? '$' + Math.round(totalGastado / 1000) + 'k' : '—'}</div><div className="lbl">total gastado</div></div>
          </div>

          <div style={{ borderTop: '1px solid #f7f3f5', paddingTop: 12 }}>
            {[
              ['WhatsApp', clientaSel.whatsapp ? '+598 ' + clientaSel.whatsapp : 'Sin registrar'],
              ['Departamento', clientaSel.departamento || 'Sin registrar'],
              ['Agencia', clientaSel.agencia_preferida || 'Sin registrar'],
              ['Ultima compra', formatFecha(clientaSel.ultima_compra)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f7f3f5' }}>
                <span style={{ fontSize: 13, color: '#9c7d8a' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: v === 'Sin registrar' ? '#c4a0b2' : '#1a1014' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-label" style={{ marginBottom: 8 }}>Historial de compras</div>
        {loadingHistorial && <p style={{ color: '#9c7d8a', fontSize: 13 }}>Cargando...</p>}
        <div className="card" style={{ padding: '4px 14px' }}>
          {historialClienta.length === 0 && !loadingHistorial && (
            <p style={{ padding: 16, textAlign: 'center', color: '#9c7d8a', fontSize: 13 }}>Sin historial</p>
          )}
          {historialClienta.map(p => {
            const pago = p.pagos?.some(pg => pg.estado === 'confirmado')
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f7f3f5' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.prendas_vivo?.nombre || '—'}</div>
                  <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                    {p.color || '—'} {p.talle || '—'} · {formatFecha(p.hora)}
                    {p.prendas_vivo?.precio_unitario ? ` · $${p.prendas_vivo.precio_unitario.toLocaleString('es')}` : ''}
                  </div>
                </div>
                {pago
                  ? <span className="badge-ok">pagado</span>
                  : <span className="badge-incompleto">pendiente</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Base de clientas</h2>
        <p style={{ fontSize: 13, color: '#9c7d8a', marginTop: 2 }}>{clientas.length} mostradas</p>
      </div>

      <input
        className="input"
        style={{ marginBottom: 8 }}
        placeholder="Buscar por nombre o WhatsApp..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {ordenBtns.map(b => <button key={b.val} style={btnStyle(b.val)} onClick={() => setFiltroOrden(b.val)}>{b.label}</button>)}
      </div>

      <select className="input" style={{ marginBottom: 12 }} value={filtroDep} onChange={e => setFiltroDep(e.target.value)}>
        <option value="">Todos los departamentos</option>
        {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      {loading && <p style={{ color: '#9c7d8a', fontSize: 13, textAlign: 'center' }}>Buscando...</p>}

      <div className="card" style={{ padding: '4px 14px' }}>
        {clientas.length === 0 && !loading && (
          <p style={{ padding: 20, textAlign: 'center', color: '#9c7d8a' }}>Sin resultados</p>
        )}
        {clientas.map(c => (
          <div key={c.id}
            onClick={() => abrirClienta(c)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid #f7f3f5', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#faf8f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0, ...avatarColor(c.nombre_display) }}>
              {initials(c.nombre_display)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre_display}</div>
              <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                {c.departamento || 'sin depto'}
                {c.ultima_compra ? ` · ultima: ${formatFecha(c.ultima_compra)}` : ''}
                {c.whatsapp ? ` · +598 ${c.whatsapp}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#A0436A' }}>{c.compras_count}</div>
              <div style={{ fontSize: 10, color: '#9c7d8a' }}>compras</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
