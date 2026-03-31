import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function HistorialVivo() {
  const { vivoId } = useParams()
  const navigate = useNavigate()
  const [vivo, setVivo] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [vivoId])

  async function cargar() {
    const { data: v } = await supabase.from('vivos').select('*').eq('id', vivoId).single()
    setVivo(v)
    const { data: p } = await supabase
      .from('pedidos')
      .select('*, clientas(nombre_display), prendas_vivo(nombre, precio_unitario), pagos(*)')
      .eq('vivo_id', vivoId)
      .order('hora', { ascending: true })
    setPedidos(p || [])
    setLoading(false)
  }

  if (loading) return <p style={{ padding: 20, color: '#9c7d8a' }}>Cargando...</p>
  if (!vivo) return <p style={{ padding: 20 }}>Vivo no encontrado</p>

  const total = pedidos.length
  const incompletos = pedidos.filter(p => p.incompleto).length
  const pagados = pedidos.filter(p => p.pagos?.some(pg => pg.estado === 'confirmado')).length
  const recaudado = pedidos.filter(p => p.pagos?.some(pg => pg.estado === 'confirmado')).reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0)

  const talles = {}
  const colores = {}
  const prendaConteo = {}
  for (const p of pedidos) {
    if (p.talle) talles[p.talle] = (talles[p.talle] || 0) + 1
    if (p.color) colores[p.color] = (colores[p.color] || 0) + 1
    const np = p.prendas_vivo?.nombre
    if (np) prendaConteo[np] = (prendaConteo[np] || 0) + 1
  }

  const fecha = new Date(vivo.fecha + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaI = new Date(vivo.hora_inicio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const horaF = vivo.hora_fin ? new Date(vivo.hora_fin).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : null

  const barStyle = (pct, color = '#A0436A') => ({
    height: 8, borderRadius: 99, background: color, width: pct + '%', transition: 'width .4s'
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b4d5a', padding: 0 }}>&#8592;</button>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>{fecha}</h2>
          <p style={{ fontSize: 13, color: '#9c7d8a' }}>{horaI}hs{horaF ? ` — ${horaF}hs` : ' · en curso'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <div className="stat-card"><div class="num">{total}</div><div class="lbl">pedidos</div></div>
        <div className="stat-card"><div class="num">${Math.round(recaudado/1000)}k</div><div class="lbl">recaudado</div></div>
        <div className="stat-card"><div class="num">{pagados}</div><div class="lbl">pagados</div></div>
        <div className="stat-card"><div class="num" style={{ color: incompletos > 0 ? '#A32D2D' : '#1a1014' }}>{incompletos}</div><div class="lbl">incompletos</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9c7d8a', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Talles</div>
          {Object.entries(talles).sort((a,b) => b[1]-a[1]).map(([t, n]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: '#9c7d8a', width: 28, textAlign: 'right', flexShrink: 0 }}>{t}</div>
              <div style={{ flex: 1, height: 8, background: '#f7f3f5', borderRadius: 99, overflow: 'hidden' }}>
                <div style={barStyle(Math.round(n/Object.values(talles)[0]*100))} />
              </div>
              <div style={{ fontSize: 12, color: '#9c7d8a', width: 24, flexShrink: 0 }}>{n}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9c7d8a', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Colores</div>
          {Object.entries(colores).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c, n]) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#9c7d8a', width: 36, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</div>
              <div style={{ flex: 1, height: 8, background: '#f7f3f5', borderRadius: 99, overflow: 'hidden' }}>
                <div style={barStyle(Math.round(n/Object.values(colores)[0]*100))} />
              </div>
              <div style={{ fontSize: 12, color: '#9c7d8a', width: 24, flexShrink: 0 }}>{n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-label" style={{ marginBottom: 8 }}>Pedidos del vivo</div>
      <div className="card" style={{ padding: '4px 14px' }}>
        {pedidos.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f7f3f5' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.clientas?.nombre_display || '—'}</div>
              <div style={{ fontSize: 12, color: p.incompleto ? '#A32D2D' : '#9c7d8a' }}>
                {p.prendas_vivo?.nombre} · {p.color || '—'} {p.talle || '—'}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#9c7d8a', marginLeft: 8 }}>
              {new Date(p.hora).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {p.pagos?.some(pg => pg.estado === 'confirmado')
              ? <span className="badge-ok" style={{ marginLeft: 6 }}>pagado</span>
              : <span className="badge-incompleto" style={{ marginLeft: 6 }}>pend</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
