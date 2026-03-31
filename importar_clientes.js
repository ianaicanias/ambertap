import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { parse } from 'csv-parse/sync'

const supabase = createClient(
  'https://nuloywpugadfuvbydhjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bG95d3B1Z2FkZnV2YnlkaGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDA0MzMsImV4cCI6MjA5MDQ3NjQzM30.XETu5E61iWxWzsoPGXpGs7LQ2ijqYIDbQ_tEcOvXBos'
)

const CEDULA_RE = /^\d[\d.]*-\d$/

function limpiarTel(tel) {
  if (!tel) return null
  const limpio = tel.replace(/\D/g, '')
  if (!limpio) return null
  return limpio
}

function capitalizar(str) {
  if (!str) return ''
  return str.trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

const contenido = fs.readFileSync('Clientes-Vista_general_de_clientes.csv', 'utf-8').replace(/^\uFEFF/, '')

const filas = parse(contenido, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
})

const clientas = filas
  .filter(r => r['Nombre']?.trim() || r['Apellido']?.trim())
  .map(r => {
    const nombre = capitalizar(r['Nombre'])
    const apellido = capitalizar(r['Apellido'])
    const nombre_display = [nombre, apellido].filter(Boolean).join(' ')

    const obs = r['Observaciones']?.trim() || ''
    const esCedula = CEDULA_RE.test(obs)

    return {
      nombre_display,
      whatsapp: limpiarTel(r['Whatsapp']),
      departamento: r['Departamento']?.trim() || null,
      agencia_preferida: r['Agencia de envío']?.trim() || null,
      direccion: r['Dirección completa (Barrio, Ciudad)']?.trim() || null,
      cedula: esCedula ? obs : null,
      compras_count: 0,
    }
  })
  .filter(c => c.nombre_display.trim())

console.log(`Importando ${clientas.length} clientas...`)

const BATCH = 50
let importadas = 0
let errores = 0

for (let i = 0; i < clientas.length; i += BATCH) {
  const lote = clientas.slice(i, i + BATCH)
  const { error } = await supabase
  .from('clientas')
  .insert(lote)

  if (error) {
    console.error(`Error en lote ${i}-${i+BATCH}:`, error.message)
    errores += lote.length
  } else {
    importadas += lote.length
    console.log(`  ${importadas}/${clientas.length}...`)
  }
}

console.log(`\nListo: ${importadas - errores} importadas, ${errores} errores`)
