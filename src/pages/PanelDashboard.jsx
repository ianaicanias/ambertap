import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DEPTO_COORDS = {
  'Montevideo':    { x: 340, y: 370 },
  'Canelones':     { x: 330, y: 320 },
  'Maldonado':     { x: 410, y: 360 },
  'Rocha':         { x: 460, y: 330 },
  'Lavalleja':     { x: 390, y: 300 },
  'Florida':       { x: 330, y: 270 },
  'Flores':        { x: 270, y: 280 },
  'Colonia':       { x: 240, y: 350 },
  'San Jose':      { x: 280, y: 340 },
  'Soriano':       { x: 220, y: 270 },
  'Rio Negro':     { x: 200, y: 210 },
  'Paysandu':      { x: 190, y: 160 },
  'Salto':         { x: 200, y: 110 },
  'Artigas':       { x: 240, y: 70  },
  'Rivera':        { x: 330, y: 110 },
  'Tacuarembo':    { x: 310, y: 180 },
  'Cerro Largo':   { x: 400, y: 200 },
  'Treinta y Tres':{ x: 420, y: 260 },
  'Durazno':       { x: 300, y: 240 },
}

export default function PanelDashboard() {
  const [periodo, setPeriodo] = useState('semana')
  const [stats, setStats] = useState(null)
  const [statsClientes, setStatsClientes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('ventas')

  useEffect(() => { cargar(periodo) }, [periodo])

  async function cargar(per) {
    setLoading(true)
    const ahora = new Date()
    let desde = new Date('2024-01-01')
    if (per === 'hoy') desde = new Date(ahora.toISOString().split('T')[0] + 'T00:00:00')
    else if (per === 'semana') { desde = new Date(ahora); desde.setDate(ahora.getDate() - 7) }
    else if (per === 'mes') { desde = new Date(ahora); desde.setDate(ahora.getDate() - 30) }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id, color, talle, incompleto, hora, estado, prendas_vivo(precio_unitario), pagos(estado), clientas(id, departamento)')
      .gte('hora', desde.toISOString())
      .not('estado', 'eq', 'cancelado')

    const { data: clientes } = await supabase
      .from('clientas')
      .select('id, nombre_display, compras_count, primera_compra, ultima_compra, departamento, whatsapp')
      .order('compras_count', { ascending: false })

    if (!pedidos) { setLoading(false); return }

    const total = pedidos.length
    const pagados = pedidos.filter(p => p.pagos?.some(pg => pg.estado === 'confirmado')).length
    const pctPagados = total > 0 ? Math.round(pagados / total * 100) : 0
    const recaudado = pedidos
      .filter(p => p.pagos?.some(pg => pg.estado === 'confirmado'))
      .reduce((s, p) => s + (p.prendas_vivo?.precio_unitario || 0), 0)

    const talles = {}
    const colores = {}
    const porDia = {}
    const porDepto = {}

    for (const p of pedidos) {
      if (p.talle) talles[p.talle] = (talles[p.talle] || 0) + 1
      if (p.color) colores[p.color] = (colores[p.color] || 0) + 1
      const dia = p.hora.split('T')[0]
      porDia[dia] = (porDia[dia] || 0) + 1
      const dep = p.clientas?.departamento
      if (dep) porDepto[dep] = (porDepto[dep] || 0) + 1
    }

    setStats({
      total, pctPagados, recaudado,
      talles: Object.entries(talles).sort((a, b) => b[1] - a[1]).slice(0, 6),
      colores: Object.entries(colores).sort((a, b) => b[1] - a[1]).slice(0, 6),
      dias: Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0])),
      porDepto,
    })

    if (clientes) {
      const ahora30 = new Date(); ahora30.setDate(ahora30.getDate() - 30)
      const sinComprar = clientes.filter(c => c.ultima_compra && new Date(c.ultima_compra) < ahora30)
      const nuevas = clientes.filter(c => c.primera_compra && new Date(c.primera_compra) >= desde)
      setStatsClientes({
        total: clientes.length,
        top: clientes.slice(0, 5),
        sinComprar: sinComprar.length,
        nuevas: nuevas.length,
        conWA: clientes.filter(c => c.whatsapp).length,
        conDepto: clientes.filter(c => c.departamento).length,
      })
    }
    setLoading(false)
  }

  const formatRec = (n) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return '$' + Math.round(n / 1000) + 'k'
    return '$' + n
  }

  const perBtns = [
    { val: 'hoy', label: 'Hoy' },
    { val: 'semana', label: 'Semana' },
    { val: 'mes', label: 'Mes' },
    { val: 'total', label: 'Total' },
  ]

  const dpStyle = (val) => ({
    padding: '5px 14px', borderRadius: 99, border: '1px solid', fontSize: 12, cursor: 'pointer',
    borderColor: periodo === val ? '#A0436A' : '#e8dde3',
    background: periodo === val ? '#f5e6ed' : '#fff',
    color: periodo === val ? '#A0436A' : '#9c7d8a',
    fontWeight: periodo === val ? 500 : 400,
  })

  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: 13, cursor: 'pointer',
    color: vista === t ? '#A0436A' : '#9c7d8a', fontWeight: vista === t ? 600 : 400,
    background: 'none', border: 'none',
    borderBottom: vista === t ? '2px solid #A0436A' : '2px solid transparent',
    marginBottom: -1,
  })

  const maxDepto = stats?.porDepto ? Math.max(...Object.values(stats.porDepto), 1) : 1

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Dashboard</h2>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {perBtns.map(b => <button key={b.val} style={dpStyle(b.val)} onClick={() => setPeriodo(b.val)}>{b.label}</button>)}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e8dde3', marginBottom: 14 }}>
        <button style={tabStyle('ventas')} onClick={() => setVista('ventas')}>Ventas</button>
        <button style={tabStyle('clientes')} onClick={() => setVista('clientes')}>Clientes</button>
        <button style={tabStyle('mapa')} onClick={() => setVista('mapa')}>Mapa</button>
      </div>

      {loading && <p style={{ color: '#9c7d8a', fontSize: 13, textAlign: 'center', padding: 20 }}>Calculando...</p>}

      {!loading && stats && vista === 'ventas' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            <div className="stat-card"><div className="num">{stats.total.toLocaleString('es')}</div><div className="lbl">pedidos</div></div>
            <div className="stat-card"><div className="num">{formatRec(stats.recaudado)}</div><div className="lbl">recaudado</div></div>
            <div className="stat-card"><div className="num">{stats.pctPagados}%</div><div className="lbl">pagados</div></div>
          </div>

          {stats.total === 0 && (
            <p style={{ textAlign: 'center', color: '#9c7d8a', padding: 20 }}>Sin datos para este periodo</p>
          )}

          {stats.total > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
                <div className="card" style={{ padding: 12, margin: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9c7d8a', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Talles</div>
                  {stats.talles.map(([t, n]) => {
                    const max = stats.talles[0]?.[1] || 1
                    return (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: '#9c7d8a', width: 28, textAlign: 'right', flexShrink: 0 }}>{t}</div>
                        <div style={{ flex: 1, height: 8, background: '#f7f3f5', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#A0436A', borderRadius: 99, width: Math.round(n / max * 100) + '%' }} />
                        </div>
                        <div style={{ fontSize: 12, color: '#9c7d8a', width: 28, textAlign: 'right', flexShrink: 0 }}>{n}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="card" style={{ padding: 12, margin: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9c7d8a', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Colores</div>
                  {stats.colores.map(([c, n]) => {
                    const max = stats.colores[0]?.[1] || 1
                    return (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: '#9c7d8a', width: 40, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</div>
                        <div style={{ flex: 1, height: 8, background: '#f7f3f5', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#A0436A', borderRadius: 99, width: Math.round(n / max * 100) + '%' }} />
                        </div>
                        <div style={{ fontSize: 12, color: '#9c7d8a', width: 28, textAlign: 'right', flexShrink: 0 }}>{n}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card">
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9c7d8a', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>Pedidos por dia</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  {stats.dias.map(([dia, cnt]) => {
                    const max = Math.max(...stats.dias.map(d => d[1]), 1)
                    const h = Math.max(Math.round((cnt / max) * 68), 4)
                    const label = dia.slice(5).replace('-', '/')
                    return (
                      <div key={dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: '#A0436A', height: h }} />
                        <div style={{ fontSize: 9, color: '#9c7d8a', whiteSpace: 'nowrap' }}>{label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!loading && statsClientes && vista === 'clientes' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
            <div className="stat-card"><div className="num">{statsClientes.total}</div><div className="lbl">clientas totales</div></div>
            <div className="stat-card"><div className="num">{statsClientes.nuevas}</div><div className="lbl">nuevas este periodo</div></div>
            <div className="stat-card"><div className="num">{statsClientes.conWA}</div><div className="lbl">con WhatsApp</div></div>
            <div className="stat-card"><div className="num" style={{ color: statsClientes.sinComprar > 0 ? '#A32D2D' : undefined }}>{statsClientes.sinComprar}</div><div className="lbl">sin comprar 30 dias</div></div>
          </div>

          <div className="section-label" style={{ marginBottom: 8 }}>Top clientas</div>
          <div className="card" style={{ padding: '4px 14px' }}>
            {statsClientes.top.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < statsClientes.top.length - 1 ? '1px solid #f7f3f5' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5e6ed', color: '#A0436A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre_display}</div>
                  <div style={{ fontSize: 12, color: '#9c7d8a' }}>
                    {c.departamento || 'sin depto'}
                    {c.ultima_compra ? ` · ultima: ${new Date(c.ultima_compra).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#A0436A' }}>{c.compras_count}</div>
                  <div style={{ fontSize: 10, color: '#9c7d8a' }}>compras</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-label" style={{ marginBottom: 8, marginTop: 14 }}>Clientas por departamento</div>
          <div className="card" style={{ padding: 12 }}>
            {Object.entries(stats?.porDepto || {}).sort((a, b) => b[1] - a[1]).map(([dep, n]) => (
              <div key={dep} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: '#9c7d8a', width: 110, flexShrink: 0 }}>{dep}</div>
                <div style={{ flex: 1, height: 8, background: '#f7f3f5', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#A0436A', borderRadius: 99, width: Math.round(n / maxDepto * 100) + '%' }} />
                </div>
                <div style={{ fontSize: 12, color: '#9c7d8a', width: 24, textAlign: 'right', flexShrink: 0 }}>{n}</div>
              </div>
            ))}
            {Object.keys(stats?.porDepto || {}).length === 0 && (
              <p style={{ fontSize: 13, color: '#9c7d8a', textAlign: 'center', padding: 12 }}>Sin datos de departamento todavia — se cargan desde post-vivo</p>
            )}
          </div>
        </>
      )}

      {!loading && stats && vista === 'mapa' && (
        <>
          <p style={{ fontSize: 13, color: '#9c7d8a', marginBottom: 12 }}>
            Clientas por departamento. Los circulos mas grandes = mas clientas.
            {Object.keys(stats.porDepto).length === 0 && ' Carga departamentos desde el panel post-vivo para ver el mapa.'}
          </p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <svg width="100%" viewBox="0 0 580 440" style={{ display: 'block' }}>
              <rect x="0" y="0" width="580" height="440" fill="#f7f3f5" rx="12"/>
              <text style={{ fontSize: 11, fill: '#c4a0b2', fontFamily: 'sans-serif' }} x="290" y="24" textAnchor="middle">Uruguay — clientas por departamento</text>

              {Object.entries(DEPTO_COORDS).map(([dep, pos]) => {
                const count = stats.porDepto[dep] || 0
                const radio = count > 0 ? Math.min(8 + count * 3, 32) : 5
                const alpha = count > 0 ? 0.85 : 0.25
                return (
                  <g key={dep}>
                    <circle
                      cx={pos.x} cy={pos.y} r={radio}
                      fill={`rgba(160, 67, 106, ${alpha})`}
                      stroke="#7a3351" strokeWidth="0.5"
                    />
                    <text
                      x={pos.x} y={pos.y + radio + 10}
                      textAnchor="middle"
                      style={{ fontSize: 9, fill: '#6b4d5a', fontFamily: 'sans-serif', fontWeight: count > 0 ? 600 : 400 }}
                    >
                      {dep.length > 10 ? dep.slice(0, 9) + '.' : dep}
                      {count > 0 ? ` (${count})` : ''}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
