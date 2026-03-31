import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function HistorialVivos() {
  const navigate = useNavigate()
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPeriodo, setFiltroPeriodo] = useState('todo')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [fechaAbierta, setFechaAbierta] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('vivos')
      .select('id, fecha, plataforma, hora_inicio, hora_fin')
      .order('fecha', { ascending: false })
      .limit(60)

    if (!data) { setLoading(false); return }

    const conStats = await Promise.all(data.map(async (v) => {
      const { count } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('vivo_id', v.id)
      return { ...v, totalPedidos: count || 0 }
    }))

    setHistorial(conStats)
    if (conStats.length > 0) setFechaAbierta(conStats[0].fecha)
    setLoading(false)
  }

  function filtrados() {
    if (!historial.length) return []
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return historial.filter(v => {
      const fecha = new Date(v.fecha + 'T00:00:00')
      if (filtroPeriodo === 'hoy') return v.fecha === hoy.toISOString().split('T')[0]
      if (filtroPeriodo === 'semana') { const h = new Date(hoy); h.setDate(hoy.getDate() - 7); return fecha >= h }
      if (filtroPeriodo === 'mes') { const h = new Date(hoy); h.setDate(hoy.getDate() - 30); return fecha >= h }
      if (filtroPeriodo === 'personalizado') {
        const desde = fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null
        const hasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null
        if (desde && fecha < desde) return false
        if (hasta && fecha > hasta) return false
        return true
      }
      return true
    })
  }

  const fpStyle = (val) => ({
    padding: '5px 12px', borderRadius: 99, border: '1px solid', fontSize: 12, cursor: 'pointer',
    borderColor: filtroPeriodo === val ? '#A0436A' : '#e8dde3',
    background: filtroPeriodo === val ? '#f5e6ed' : '#fff',
    color: filtroPeriodo === val ? '#A0436A' : '#9c7d8a',
    fontWeight: filtroPeriodo === val ? 500 : 400,
  })

  const lista = filtrados()

  const vivosPorFecha = lista.reduce((acc, v) => {
    if (!acc[v.fecha]) acc[v.fecha] = []
    acc[v.fecha].push(v)
    return acc
  }, {})

  const fechasOrdenadas = Object.keys(vivosPorFecha).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Historial de vivos</h2>
        <p style={{ fontSize: 13, color: '#9c7d8a', marginTop: 2 }}>{historial.length} vivos en total</p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button style={fpStyle('todo')} onClick={() => setFiltroPeriodo('todo')}>Todos</button>
        <button style={fpStyle('hoy')} onClick={() => setFiltroPeriodo('hoy')}>Hoy</button>
        <button style={fpStyle('semana')} onClick={() => setFiltroPeriodo('semana')}>Esta semana</button>
        <button style={fpStyle('mes')} onClick={() => setFiltroPeriodo('mes')}>Este mes</button>
        <button style={fpStyle('personalizado')} onClick={() => setFiltroPeriodo('personalizado')}>Personalizado</button>
      </div>

      {filtroPeriodo === 'personalizado' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9c7d8a', marginBottom: 4, fontWeight: 500 }}>Desde</div>
            <input type="date" className="input" style={{ marginBottom: 0 }} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9c7d8a', marginBottom: 4, fontWeight: 500 }}>Hasta</div>
            <input type="date" className="input" style={{ marginBottom: 0 }} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#9c7d8a', fontSize: 13, padding: 20, textAlign: 'center' }}>Cargando...</p>}

      {!loading && lista.length === 0 && (
        <p style={{ color: '#9c7d8a', fontSize: 13, textAlign: 'center', padding: 20 }}>Sin vivos en este periodo</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fechasOrdenadas.map(fecha => {
          const vivosDelDia = [...vivosPorFecha[fecha]].sort((a, b) => new Date(a.hora_inicio) - new Date(b.hora_inicio))
          const abierto = fechaAbierta === fecha
          const fechaLabel = new Date(fecha + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: '2-digit' })
          const totalPedidosDia = vivosDelDia.reduce((s, v) => s + (v.totalPedidos || 0), 0)

          return (
            <div key={fecha} style={{ background: '#fff', border: '1px solid #e8dde3', borderRadius: 12, overflow: 'hidden' }}>
              <div onClick={() => setFechaAbierta(abierto ? null : fecha)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fdf8fa'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1014', textTransform: 'capitalize' }}>{fechaLabel}</div>
                  <div style={{ fontSize: 12, color: '#9c7d8a', marginTop: 2 }}>
                    {vivosDelDia.length} {vivosDelDia.length === 1 ? 'vivo' : 'vivos'} · {totalPedidosDia} pedidos
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {vivosDelDia.some(v => !v.hora_fin) && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#FCEBEB', color: '#A32D2D', fontWeight: 500 }}>en curso</span>
                  )}
                  <span style={{ color: '#c4a0b2', fontSize: 16, display: 'inline-block', transition: 'transform .2s', transform: abierto ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                </div>
              </div>

              {abierto && (
                <div style={{ borderTop: '1px solid #f7f3f5' }}>
                  {vivosDelDia.map(v => {
                    const hora = new Date(v.hora_inicio).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={v.id} onClick={() => navigate('/historial/' + v.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 12px 28px', borderBottom: '1px solid #f7f3f5', cursor: 'pointer', background: '#fdf8fa' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f7f3f5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fdf8fa'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.hora_fin ? '#c4a0b2' : '#E24B4A', flexShrink: 0, animation: v.hora_fin ? 'none' : 'pulse 1.5s infinite' }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1014' }}>{hora}hs</div>
                            <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                              {v.totalPedidos} pedidos · {v.hora_fin ? 'finalizado' : 'en curso'}
                            </div>
                          </div>
                        </div>
                        <span style={{ color: '#c4a0b2', fontSize: 16 }}>›</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}