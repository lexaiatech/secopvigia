import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://www.datos.gov.co/resource/jbjy-vk9h.json'

export type Contrato = {
  id: string
  referencia: string
  entidad: string
  departamento: string
  objeto: string
  modalidad: string
  fecha: string
  valor: number
  estado: string
  contratista: string
  nit: string
  dias_adicionados: number
  riesgo: number
  url: string
}

export type SecopMetrics = {
  total: number
  directa: number
  valorTotal: number
  criticos: number
  medios: number
}

export type SecopResponse = {
  contratos: Contrato[]
  metrics: SecopMetrics
  departamentos: Record<string, { valor: number; count: number; irregulares: number }>
  entidades: Record<string, { valor: number; count: number; alertas: number }>
}

function calcRiesgo(c: Record<string, string>): number {
  let s = 15
  const mod = (c.modalidad_de_contratacion || '').toLowerCase()
  if (mod.includes('directa')) s += 35
  else if (mod.includes('mínima') || mod.includes('minima')) s += 20
  else if (mod.includes('abreviada')) s += 12

  const val = parseFloat(c.valor_del_contrato || '0')
  if (val > 10_000_000_000) s += 20
  else if (val > 5_000_000_000) s += 15
  else if (val > 1_000_000_000) s += 8

  const dias = parseInt(c.dias_adicionados || '0')
  if (dias > 180) s += 20
  else if (dias > 90) s += 12
  else if (dias > 0) s += 6

  if (!c.proveedor_adjudicado) s += 8

  return Math.min(s, 99)
}

let cache: { data: SecopResponse; ts: number } | null = null
const CACHE_MS = 15 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '150'), 200)

  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data)
  }

  try {
    const params = new URLSearchParams({
      $limit: String(limit),
      $order: 'fecha_de_firma DESC',
      $where: 'valor_del_contrato > 0',
    })

    const res = await fetch(`${BASE}?${params}`, {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: Record<string, string>[] = await res.json()

    const contratos: Contrato[] = raw.map(c => ({
      id: c.id_contrato || c.referencia_del_contrato || '',
      referencia: c.referencia_del_contrato || c.id_contrato || 'N/D',
      entidad: c.nombre_entidad || '',
      departamento: c.departamento || '',
      objeto: (c.objeto_del_contrato || c.descripcion_del_proceso || '').slice(0, 150),
      modalidad: c.modalidad_de_contratacion || '',
      fecha: (c.fecha_de_firma || '').slice(0, 10),
      valor: parseFloat(c.valor_del_contrato || '0'),
      estado: c.estado_contrato || '',
      contratista: c.proveedor_adjudicado || '',
      nit: c.documento_proveedor || '',
      dias_adicionados: parseInt(c.dias_adicionados || '0'),
      riesgo: calcRiesgo(c),
      url: c.urlproceso || '',
    }))

    contratos.sort((a, b) => b.riesgo - a.riesgo)

    const metrics: SecopMetrics = {
      total: contratos.length,
      directa: contratos.filter(c => c.modalidad.toLowerCase().includes('directa')).length,
      valorTotal: contratos.reduce((s, c) => s + c.valor, 0),
      criticos: contratos.filter(c => c.riesgo >= 70).length,
      medios: contratos.filter(c => c.riesgo >= 50 && c.riesgo < 70).length,
    }

    const departamentos: Record<string, { valor: number; count: number; irregulares: number }> = {}
    const entidades: Record<string, { valor: number; count: number; alertas: number }> = {}

    contratos.forEach(c => {
      const dep = c.departamento || 'Otros'
      if (!departamentos[dep]) departamentos[dep] = { valor: 0, count: 0, irregulares: 0 }
      departamentos[dep].valor += c.valor
      departamentos[dep].count++
      if (c.riesgo >= 60) departamentos[dep].irregulares++

      const ent = c.entidad || 'Sin entidad'
      if (!entidades[ent]) entidades[ent] = { valor: 0, count: 0, alertas: 0 }
      entidades[ent].valor += c.valor
      entidades[ent].count++
      if (c.riesgo >= 60) entidades[ent].alertas++
    })

    const data: SecopResponse = { contratos, metrics, departamentos, entidades }
    cache = { data, ts: Date.now() }
    return NextResponse.json(data)
  } catch (e) {
    console.error('SECOP fetch error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
