'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { SecopResponse, Contrato } from './api/secop/route'

type ViewId = 'dashboard' | 'contratos' | 'contratistas' | 'entidades' | 'alertas' | 'red' | 'mapa' | 'comparador' | 'watchlist' | 'reportes' | 'ia' | 'config'
type AI = Record<string, string>

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Dashboard', contratos: 'Contratos', contratistas: 'Perfil de contratista',
  entidades: 'Entidades públicas', alertas: 'Gestión de alertas', red: 'Red de contratistas',
  mapa: 'Mapa de riesgo', comparador: 'Comparador', watchlist: 'Watchlist',
  reportes: 'Generar informe', ia: 'Investigar con IA', config: 'Configuración',
}

// Geographic positions of departments (static coordinates for the map)
const DEP_GEO: Record<string, { x: number; y: number; r: number }> = {
  'Cundinamarca': {x:295,y:230,r:22}, 'Antioquia': {x:195,y:195,r:20},
  'Valle del Cauca': {x:165,y:280,r:18}, 'Bolívar': {x:190,y:130,r:17},
  'Atlántico': {x:205,y:92,r:15}, 'Meta': {x:340,y:285,r:16},
  'Santander': {x:270,y:170,r:14}, 'Córdoba': {x:210,y:152,r:13},
  'Nariño': {x:175,y:350,r:13}, 'Huila': {x:255,y:315,r:12},
  'Boyacá': {x:305,y:200,r:12}, 'Tolima': {x:245,y:265,r:12},
  'Cesar': {x:265,y:112,r:12}, 'La Guajira': {x:255,y:72,r:11},
  'Magdalena': {x:233,y:103,r:11}, 'Cauca': {x:195,y:320,r:11},
  'Chocó': {x:145,y:232,r:10}, 'Risaralda': {x:198,y:252,r:10},
  'Caldas': {x:213,y:237,r:10}, 'Caquetá': {x:285,y:350,r:11},
  'Vichada': {x:428,y:212,r:10}, 'Amazonas': {x:348,y:425,r:10},
  'Putumayo': {x:255,y:390,r:10},
}

const RC: Record<string,string> = {c:'#8F1F18',a:'#C8332A',m:'#C97B1E',b:'#2D7D52'}
const RS: Record<string,string> = {c:'#6B1210',a:'#8F1F18',m:'#8A5210',b:'#1A5534'}
const RL: Record<string,string> = {c:'Crítico',a:'Alto',m:'Medio',b:'Bajo'}

const REPORT_PROMPTS: Record<number,string> = {
  0: 'Redacta un informe ejecutivo de control político sobre irregularidades en SECOP Colombia 2024 con: resumen ejecutivo, 3 hallazgos principales con datos, irregularidades por modalidad y recomendaciones legales (Ley 80/1150). Máximo 280 palabras.',
  1: 'Redacta un análisis de redes de contratistas para la Cámara de Representantes: cómo detectar redes en SECOP, señales de alerta, normativa y 5 preguntas para citar ministros. Máximo 280 palabras.',
  2: 'Redacta un informe regional de los 5 departamentos colombianos con mayor riesgo de corrupción en contratos públicos 2024, con valor en riesgo y recomendaciones. Máximo 280 palabras.',
  3: 'Genera 8 preguntas concretas para un debate de control político en la Cámara sobre irregularidades SECOP. Cada pregunta debe citar datos o normativa específica colombiana. Máximo 280 palabras.',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtCOP(v: number): string {
  if (v >= 1e12) return `$${(v/1e12).toFixed(1)}T`
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${Math.round(v/1e6)}M`
  return `$${Math.round(v/1e3)}K`
}
function rBadge(r: number) { return r >= 70 ? 'red' : r >= 50 ? 'amber' : 'green' }
function rLabel(r: number) { return r >= 70 ? 'Crítico' : r >= 50 ? 'Alto' : r >= 30 ? 'Medio' : 'Bajo' }
function rColor(r: number) { return r >= 70 ? 'var(--red)' : r >= 50 ? 'var(--amber)' : 'var(--green)' }
function depRisk(v: number): string { return v > 8e9 ? 'c' : v > 3e9 ? 'a' : v > 8e8 ? 'm' : 'b' }

function Spin() { return <span className="spin" /> }
function AIOut({ id, ai, defaultText }: { id: string; ai: AI; defaultText: string }) {
  const v = ai[id]
  if (v === 'loading') return <div className="ai-out"><Spin /> Analizando...</div>
  return <div className="ai-out">{v || defaultText}</div>
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <div className="login-logo-text">
            <div className="t1">SECOP Vigía</div>
            <div className="t2">Sistema Anticorrupción</div>
          </div>
        </div>
        <div className="login-heading">Bienvenido de vuelta</div>
        <div className="login-sub">Ingresa tus credenciales para acceder al sistema de vigilancia de contratos públicos.</div>
        <label className="login-label">Correo electrónico</label>
        <input className="login-input" type="email" placeholder="demo@secopvigia.co" />
        <label className="login-label">Contraseña</label>
        <input className="login-input" type="password" placeholder="••••••••••" onKeyDown={(e) => { if (e.key === 'Enter') onLogin() }} />
        <button className="login-btn" onClick={onLogin}>Ingresar al sistema →</button>
        <div className="login-divider">o continúa con</div>
        <button className="login-google" onClick={onLogin}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar con Google
        </button>
        <div className="login-footer">¿Problemas de acceso? <a href="#">Contactar soporte</a></div>
      </div>
    </div>
  )
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onClose }: { onClose: () => void }) {
  const [sel, setSel] = useState<Set<number>>(new Set([0, 2]))
  const toggle = (i: number) => setSel(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const opts = [
    { name: 'Cundinamarca / Bogotá D.C.', desc: 'Alta concentración de contratos nacionales' },
    { name: 'Antioquia', desc: 'Contratos de infraestructura y obra pública' },
    { name: 'Bolívar / Atlántico', desc: 'Costa Caribe — alto riesgo detectado' },
    { name: 'Valle del Cauca', desc: 'Contratos de salud y educación' },
  ]
  return (
    <div className="onboarding-overlay">
      <div className="ob-card">
        <div className="ob-step">Paso 1 de 3</div>
        <div className="ob-title">¿Qué departamentos quieres vigilar?</div>
        <div className="ob-desc">Selecciona las regiones prioritarias para tu investigación. Recibirás alertas automáticas de nuevos contratos sospechosos en estas zonas.</div>
        <div className="ob-options">
          {opts.map((o, i) => (
            <div key={i} className={`ob-option${sel.has(i) ? ' sel' : ''}`} onClick={() => toggle(i)}>
              <div className="ob-check" />
              <div><div className="ob-opt-name">{o.name}</div><div className="ob-opt-desc">{o.desc}</div></div>
            </div>
          ))}
        </div>
        <div className="ob-actions">
          <span className="ob-skip" onClick={onClose}>Omitir configuración</span>
          <div className="ob-dots"><div className="ob-dot active" /><div className="ob-dot" /><div className="ob-dot" /></div>
          <button className="ob-next" onClick={onClose}>Continuar →</button>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, onLogout, criticos }: { view: ViewId; setView: (v: ViewId) => void; onLogout: () => void; criticos: number }) {
  const nav = (id: ViewId, icon: React.ReactNode, label: string, badge?: { text: string; amber?: boolean }) => (
    <div className={`nav-item${view === id ? ' active' : ''}`} onClick={() => setView(id)}>
      {icon}{label}
      {badge && <span className={`nav-badge${badge.amber ? ' amber' : ''}`}>{badge.text}</span>}
    </div>
  )
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div>
        <div><div className="sidebar-logo-name">SECOP Vigía</div><div className="sidebar-logo-sub">Anticorrupción</div></div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Principal</div>
        {nav('dashboard', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, 'Dashboard')}
        {nav('contratos', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, 'Contratos', criticos > 0 ? { text: String(criticos), amber: true } : undefined)}
        {nav('contratistas', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, 'Contratistas')}
        {nav('entidades', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9"/></svg>, 'Entidades')}
        <div className="sidebar-section-label">Análisis</div>
        {nav('alertas', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, 'Alertas', criticos > 0 ? { text: String(criticos) } : undefined)}
        {nav('red', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M10.5 17.5l-3.5-5M13.5 17.5l3.5-5"/></svg>, 'Red de contratistas')}
        {nav('mapa', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/></svg>, 'Mapa de riesgo')}
        {nav('comparador', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>, 'Comparador')}
        <div className="sidebar-section-label">Reportes</div>
        {nav('watchlist', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, 'Watchlist')}
        {nav('reportes', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, 'Generar informe')}
        {nav('ia', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, 'Investigar con IA')}
        <div className="sidebar-section-label">Cuenta</div>
        {nav('config', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, 'Configuración')}
      </nav>
      <div className="sidebar-user" onClick={onLogout}>
        <div className="user-avatar">SV</div>
        <div><div className="user-name">Usuario Demo</div><div className="user-role">Investigador Anticorrupción</div></div>
        <div className="user-logout"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
      </div>
    </aside>
  )
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function Dashboard({ ai, callAI, setView, secop, loading }: { ai: AI; callAI: (p:string,id:string)=>void; setView: (v:ViewId)=>void; secop: SecopResponse | null; loading: boolean }) {
  const m = secop?.metrics
  const contratos = secop?.contratos.slice(0, 5) ?? []

  // Modality distribution for bar chart
  const total = m?.total || 1
  const directaPct = m ? Math.round(m.directa / total * 100) : 87
  const licitacionCount = secop?.contratos.filter(c => c.modalidad.toLowerCase().includes('licitación') || c.modalidad.toLowerCase().includes('licitacion')).length ?? 0
  const abreviadaCount = secop?.contratos.filter(c => c.modalidad.toLowerCase().includes('abreviada')).length ?? 0
  const meritosCount = secop?.contratos.filter(c => c.modalidad.toLowerCase().includes('mérito') || c.modalidad.toLowerCase().includes('merito')).length ?? 0
  const minimaCount = secop?.contratos.filter(c => c.modalidad.toLowerCase().includes('mínima') || c.modalidad.toLowerCase().includes('minima')).length ?? 0

  const licitPct = Math.round(licitacionCount / total * 100)
  const abrevPct = Math.round(abreviadaCount / total * 100)
  const meritosPct = Math.round(meritosCount / total * 100)
  const minimaPct = Math.round(minimaCount / total * 100)

  // Generate alerts from high-risk contracts
  const alertContratos = secop?.contratos.filter(c => c.riesgo >= 60).slice(0, 5) ?? []

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Resumen ejecutivo</div>
        <div className="page-sub">
          {loading ? 'Cargando datos de SECOP II...' : `Actualizado · SECOP II · datos.gov.co · ${m?.total ?? 0} contratos analizados`}
        </div>
      </div>
      <div className="grid4" style={{marginBottom:14}}>
        <div className="metric-card">
          <div className="mc-label">Alertas críticas</div>
          <div className="mc-val red">{loading ? '—' : (m?.criticos ?? 0)}</div>
          <div className="mc-sub"><span className="mc-trend-up">Score ≥ 70/100</span></div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Contratos sospechosos</div>
          <div className="mc-val amber">{loading ? '—' : ((m?.criticos ?? 0) + (m?.medios ?? 0))}</div>
          <div className="mc-sub"><span className="mc-trend-up">Score ≥ 50/100</span></div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Valor en riesgo</div>
          <div className="mc-val">{loading ? '—' : fmtCOP(secop?.contratos.filter(c=>c.riesgo>=60).reduce((s,c)=>s+c.valor,0)??0)}</div>
          <div className="mc-sub" style={{color:'var(--text3)'}}>COP estimado</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Contratos analizados</div>
          <div className="mc-val green">{loading ? '—' : (m?.total ?? 0)}</div>
          <div className="mc-sub"><span className="mc-trend-ok">SECOP II en tiempo real</span></div>
        </div>
      </div>
      <div className="grid2" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-title">Alertas tempranas activas</div>
          {loading ? (
            <div style={{padding:'16px 0',color:'var(--text3)',fontSize:13}}><Spin /> Cargando alertas de SECOP II...</div>
          ) : alertContratos.length > 0 ? alertContratos.map((c, i) => {
            const sev = c.riesgo >= 70 ? 'h' : 'm'
            const badge = c.riesgo >= 70 ? 'red' : 'amber'
            const label = c.riesgo >= 70 ? 'Alta' : 'Media'
            let tipo = 'Contrato bajo vigilancia'
            if (c.modalidad.toLowerCase().includes('directa') && c.valor > 1e9) tipo = 'Contratación directa de alto valor'
            if (c.dias_adicionados > 90) tipo = 'Adición excesiva detectada'
            if (!c.contratista) tipo = 'Contratista no registrado en SECOP'
            return (
              <div className="alert-row" key={i}>
                <div className={`sev-dot ${sev}`} style={{marginTop:4,flexShrink:0}} />
                <div className="ar-body">
                  <div className="ar-title">{tipo}</div>
                  <div className="ar-meta">{c.entidad} · {c.objeto.slice(0,80)} · {fmtCOP(c.valor)} COP</div>
                </div>
                <span className={`badge ${badge}`} style={{flexShrink:0}}>{label}</span>
              </div>
            )
          }) : (
            <div style={{padding:'16px 0',color:'var(--text3)',fontSize:13}}>No se encontraron alertas activas en este momento.</div>
          )}
        </div>
        <div className="card">
          <div className="card-title">Irregularidades por modalidad</div>
          <div className="bar-chart">
            {[
              ['Contrat. Directa', `${directaPct}%`, 'var(--red)', `${m?.directa??0} contratos`],
              ['Licitación Pública', `${licitPct}%`, 'var(--amber)', `${licitacionCount} contratos`],
              ['Selec. Abreviada', `${abrevPct}%`, 'var(--amber)', `${abreviadaCount} contratos`],
              ['Concurso Méritos', `${meritosPct}%`, 'var(--green)', `${meritosCount} contratos`],
              ['Mínima Cuantía', `${minimaPct}%`, 'var(--amber)', `${minimaCount} contratos`],
            ].map(([l,w,c,v],i)=>(
              <div className="bc-row" key={i}><span className="bc-label">{l}</span><div className="bc-track"><div className="bc-fill" style={{width:w,background:c}}/></div><span className="bc-val">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Contratos bajo vigilancia activa — SECOP II en tiempo real</div>
        {loading ? (
          <div style={{padding:'24px',color:'var(--text3)',fontSize:13,textAlign:'center'}}><Spin /> Consultando SECOP II...</div>
        ) : (
          <div className="tbl-wrap">
            <table><thead><tr><th>Contratista</th><th>Entidad</th><th>Modalidad</th><th>Valor</th><th>Score de riesgo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {contratos.map((r,i)=>(
                <tr key={i}>
                  <td>
                    <div className="tbl-entity">{r.contratista || 'No registrado'}</div>
                    <div className="tbl-meta">{r.referencia}</div>
                  </td>
                  <td>{r.entidad}</td>
                  <td><span className="badge gray">{r.modalidad.slice(0,18)}</span></td>
                  <td style={{fontWeight:600}}>{fmtCOP(r.valor)} COP</td>
                  <td>
                    <div className="risk-bar-wrap">
                      <div className="risk-bar"><div className="risk-fill" style={{width:`${r.riesgo}%`,background:rColor(r.riesgo)}}/></div>
                      <span className="risk-val" style={{color:rColor(r.riesgo)}}>{r.riesgo}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${rBadge(r.riesgo)}`}>{rLabel(r.riesgo)}</span></td>
                  <td><button className="action-btn" onClick={()=>setView('contratistas')}>Ver perfil</button></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  )
}

function Contratos({ setView, secop, loading }: { setView: (v:ViewId)=>void; secop: SecopResponse | null; loading: boolean }) {
  const [query, setQuery] = useState('')
  const [filtroMod, setFiltroMod] = useState('')
  const [filtroEst, setFiltroEst] = useState('')

  const contratos = useMemo(() => {
    let list = secop?.contratos ?? []
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.entidad.toLowerCase().includes(q) ||
        c.contratista.toLowerCase().includes(q) ||
        c.objeto.toLowerCase().includes(q) ||
        c.referencia.toLowerCase().includes(q)
      )
    }
    if (filtroMod) list = list.filter(c => c.modalidad.toLowerCase().includes(filtroMod.toLowerCase()))
    if (filtroEst) list = list.filter(c => c.estado.toLowerCase().includes(filtroEst.toLowerCase()))
    return list
  }, [secop, query, filtroMod, filtroEst])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Contratos</div>
        <div className="page-sub">{loading ? 'Cargando...' : `${secop?.contratos.length ?? 0} contratos reales de SECOP II · ${(secop?.metrics.criticos??0) + (secop?.metrics.medios??0)} bajo vigilancia activa`}</div>
      </div>
      <div className="filter-bar">
        <input className="filter-input" type="text" placeholder="Buscar por entidad, contratista, objeto o número..." value={query} onChange={e=>setQuery(e.target.value)} />
        <select className="filter-select" value={filtroMod} onChange={e=>setFiltroMod(e.target.value)}>
          <option value="">Todas las modalidades</option>
          <option value="directa">Contratación Directa</option>
          <option value="licitación">Licitación Pública</option>
          <option value="abreviada">Selección Abreviada</option>
          <option value="mérito">Concurso de Méritos</option>
          <option value="mínima">Mínima Cuantía</option>
        </select>
        <select className="filter-select" value={filtroEst} onChange={e=>setFiltroEst(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ejecución">En ejecución</option>
          <option value="liquidado">Liquidado</option>
          <option value="terminado">Terminado</option>
        </select>
        <button className="filter-btn active" onClick={()=>{}}>Buscar</button>
      </div>
      <div className="card">
        {loading ? (
          <div style={{padding:'32px',textAlign:'center',color:'var(--text3)'}}><Spin /> Consultando SECOP II (datos.gov.co)...</div>
        ) : (
          <div className="tbl-wrap">
            <table><thead><tr><th>Nº Contrato</th><th>Contratista</th><th>Entidad</th><th>Objeto</th><th>Modalidad</th><th>Valor COP</th><th>Riesgo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {contratos.slice(0, 50).map((r,i)=>(
                <tr key={i}>
                  <td><div className="tbl-entity">{r.referencia}</div></td>
                  <td>
                    <div className="tbl-entity">{r.contratista || 'No registrado'}</div>
                    <div className="tbl-meta">{r.nit}</div>
                  </td>
                  <td>{r.entidad}</td>
                  <td style={{maxWidth:200,fontSize:12}}>{r.objeto.slice(0,80)}</td>
                  <td><span className="badge gray">{r.modalidad.slice(0,18)}</span></td>
                  <td style={{fontWeight:600}}>{fmtCOP(r.valor)}</td>
                  <td><span className={`badge ${rBadge(r.riesgo)}`}>{r.riesgo}/100</span></td>
                  <td><span className="badge green">{r.estado.slice(0,14) || 'Activo'}</span></td>
                  <td><button className="action-btn" onClick={()=>setView('contratistas')}>→</button></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  )
}

function Contratistas({ secop }: { secop: SecopResponse | null }) {
  const top = secop?.contratos[0]
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Perfil de contratista</div>
        <div className="page-sub">{top ? `${top.contratista || 'Contratista'} · ${top.nit || 'NIT no disponible'}` : 'Cargando...'}</div>
      </div>
      <div className="grid2" style={{marginBottom:14}}>
        <div className="card">
          <div className="profile-header">
            <div className="profile-avatar"><svg viewBox="0 0 24 24" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
            <div>
              <div className="profile-name">{top?.contratista || 'Contratista de mayor riesgo'}</div>
              <div className="profile-meta">{top?.nit || 'NIT'} · {top?.departamento} · Contrato: {top?.referencia}</div>
              <div className="profile-badges">
                <span className={`badge ${top ? rBadge(top.riesgo) : 'amber'}`}>⚑ {top ? rLabel(top.riesgo) : 'Alto riesgo'}</span>
                {top?.dias_adicionados && top.dias_adicionados > 0 ? <span className="badge amber">{top.dias_adicionados} días adicionados</span> : null}
                <span className="badge gray">{top?.modalidad.slice(0,20)}</span>
              </div>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-item"><div className="stat-lbl">Valor contrato</div><div className="stat-val" style={{color:'var(--red)'}}>{top ? fmtCOP(top.valor) : '—'}</div></div>
            <div className="stat-item"><div className="stat-lbl">Score riesgo</div><div className="stat-val">{top?.riesgo ?? '—'}/100</div></div>
            <div className="stat-item"><div className="stat-lbl">Días adicionados</div><div className="stat-val" style={{color:'var(--amber)'}}>{top?.dias_adicionados ?? 0}</div></div>
            <div className="stat-item"><div className="stat-lbl">Estado</div><div className="stat-val">{top?.estado || '—'}</div></div>
          </div>
          <div>
            <div className="card-title" style={{marginBottom:8}}>Señales de alerta</div>
            {top && top.modalidad.toLowerCase().includes('directa') && <span className="flag-pill red">⚑ Contratación directa — modalidad de mayor riesgo</span>}
            {top && top.valor > 1e9 && <span className="flag-pill red">⚑ Valor superior a $1B COP</span>}
            {top && top.dias_adicionados > 90 && <span className="flag-pill red">⚑ Adición excesiva ({top.dias_adicionados} días)</span>}
            {top && !top.contratista && <span className="flag-pill red">⚑ Contratista sin nombre registrado en SECOP</span>}
            {top && top.riesgo >= 70 && <span className="flag-pill amber">⚠ Score de riesgo crítico ({top.riesgo}/100)</span>}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Score de riesgo</div>
          <div className="gauge-wrap">
            <svg className="gauge-svg" viewBox="0 0 160 90">
              <path d="M20 85 A60 60 0 0 1 140 85" fill="none" stroke="#F0EDE8" strokeWidth="10" strokeLinecap="round"/>
              <path d="M20 85 A60 60 0 0 1 140 85" fill="none" stroke="url(#gGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset={top ? 188.5 * (1 - top.riesgo/100) : 94}/>
              <defs><linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2D7D52"/><stop offset="50%" stopColor="#C97B1E"/><stop offset="100%" stopColor="#C8332A"/></linearGradient></defs>
              <text x="80" y="75" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="800" fontFamily="Syne,sans-serif" fill="#1A1815">{top?.riesgo ?? '—'}</text>
            </svg>
            <div className="gauge-lbl">Score de riesgo / 100</div>
          </div>
          <div className="risk-breakdown">
            {([
              ['Modalidad contratación', top?.modalidad.toLowerCase().includes('directa') ? 90 : 30, top?.modalidad.toLowerCase().includes('directa') ? 'var(--red)' : 'var(--green)'],
              ['Valor del contrato', top ? Math.min(Math.round(top.valor/1e10*50+30),95) : 50, 'var(--amber)'],
              ['Adiciones al contrato', top ? Math.min((top.dias_adicionados/365)*80+20,95) : 20, top && top.dias_adicionados > 90 ? 'var(--red)' : 'var(--green)'],
              ['Documentación', top && !top.contratista ? 80 : 40, top && !top.contratista ? 'var(--red)' : 'var(--green)'],
              ['Score general', top?.riesgo ?? 50, rColor(top?.riesgo ?? 50)],
            ] as [string,number,string][]).map(([l,v,c],i)=>(
              <div className="rb-row" key={i}><span className="rb-label">{l}</span><div className="rb-track"><div className="rb-fill" style={{width:`${v}%`,background:c}}/></div><span className="rb-val" style={{color:c}}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Entidades({ secop, loading }: { secop: SecopResponse | null; loading: boolean }) {
  const entidades = useMemo(() => {
    if (!secop) return []
    return Object.entries(secop.entidades)
      .sort((a,b) => b[1].alertas - a[1].alertas)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        cnt: data.count,
        alertas: data.alertas,
        val: data.valor,
        score: Math.max(10, 100 - Math.round((data.alertas / Math.max(data.count,1)) * 100)),
      }))
  }, [secop])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Entidades públicas</div>
        <div className="page-sub">Ranking por alertas activas — datos reales SECOP II</div>
      </div>
      <div className="card">
        {loading ? (
          <div style={{padding:'32px',textAlign:'center',color:'var(--text3)'}}><Spin /> Cargando entidades...</div>
        ) : (
          <div className="tbl-wrap">
            <table><thead><tr><th>Entidad</th><th>Contratos</th><th>Alertas</th><th>Valor vigilado</th><th>Transparencia</th><th></th></tr></thead>
            <tbody>
              {entidades.map((r,i)=>(
                <tr key={i}>
                  <td><div className="tbl-entity">{r.name}</div></td>
                  <td>{r.cnt}</td>
                  <td><span className={`badge ${r.alertas > 5 ? 'red' : r.alertas > 2 ? 'amber' : 'green'}`}>{r.alertas} alertas</span></td>
                  <td>{fmtCOP(r.val)} COP</td>
                  <td>
                    <div className="risk-bar-wrap">
                      <div className="risk-bar"><div className="risk-fill" style={{width:`${r.score}%`,background:r.score>60?'var(--green)':r.score>40?'var(--amber)':'var(--red)'}}/></div>
                      <span className="risk-val" style={{color:r.score>60?'var(--green)':r.score>40?'var(--amber)':'var(--red)'}}>{r.score}</span>
                    </div>
                  </td>
                  <td><button className="action-btn">Ver</button></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  )
}

function Alertas({ secop, loading }: { secop: SecopResponse | null; loading: boolean }) {
  const alertas = useMemo(() => {
    if (!secop) return []
    return secop.contratos
      .filter(c => c.riesgo >= 50)
      .slice(0, 20)
      .map(c => {
        let tipo = 'Contrato bajo vigilancia'
        let sev: 'red'|'amber' = c.riesgo >= 70 ? 'red' : 'amber'
        let sl = c.riesgo >= 70 ? 'Alta' : 'Media'
        let est: 'amber'|'blue'|'green' = 'amber'
        if (c.modalidad.toLowerCase().includes('directa') && c.valor > 1e9) tipo = 'Contratación directa alto valor'
        else if (c.dias_adicionados > 180) { tipo = 'Adición excesiva al contrato'; sev = 'red' }
        else if (c.dias_adicionados > 90) tipo = 'Adición sin justificación visible'
        else if (!c.contratista) tipo = 'Contratista no registrado en SECOP'
        else if (c.riesgo >= 80) tipo = 'Score de riesgo muy alto detectado'
        return { sev, sl, tipo, ent: c.entidad, det: c.objeto.slice(0,60), val: fmtCOP(c.valor), fecha: c.fecha, est, el: 'Sin revisar' }
      })
  }, [secop])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Gestión de alertas</div>
        <div className="page-sub">
          {loading ? 'Cargando...' : `${secop?.metrics.criticos??0} críticas · ${secop?.metrics.medios??0} medias · Datos reales SECOP II`}
        </div>
      </div>
      <div className="card">
        {loading ? (
          <div style={{padding:'32px',textAlign:'center',color:'var(--text3)'}}><Spin /> Cargando alertas de SECOP II...</div>
        ) : (
          <div className="tbl-wrap">
            <table><thead><tr><th>Severidad</th><th>Tipo</th><th>Entidad</th><th>Detalle</th><th>Valor</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {alertas.map((r,i)=>(
                <tr key={i}>
                  <td><span className={`badge ${r.sev}`}>{r.sl}</span></td>
                  <td>{r.tipo}</td>
                  <td>{r.ent}</td>
                  <td style={{fontSize:12,maxWidth:180}}>{r.det}</td>
                  <td style={{fontWeight:600}}>{r.val}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{r.fecha}</td>
                  <td><span className={`badge ${r.est}`}>{r.el}</span></td>
                  <td><button className="action-btn">Revisar</button></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  )
}

function Red({ ai, callAI }: { ai: AI; callAI: (p:string,id:string)=>void }) {
  const ask = (p: string) => callAI(p + ' Máximo 180 palabras en español.', 'red-ai-out')
  return (
    <div>
      <div className="page-header"><div className="page-title">Red de contratistas</div><div className="page-sub">47 conexiones detectadas · 23 entidades involucradas</div></div>
      <div className="grid4" style={{marginBottom:14}}>
        <div className="metric-card"><div className="mc-label">Nodos vigilados</div><div className="mc-val red">23</div></div>
        <div className="metric-card"><div className="mc-label">Conexiones</div><div className="mc-val amber">47</div></div>
        <div className="metric-card"><div className="mc-label">Empresas fantasma</div><div className="mc-val red">3</div></div>
        <div className="metric-card"><div className="mc-label">Índice red</div><div className="mc-val red">7.8/10</div></div>
      </div>
      <div className="card">
        <div className="card-title">Grafo de relaciones — haz clic en un nodo</div>
        <svg width="100%" viewBox="0 0 640 340" style={{display:'block'}}>
          <defs><marker id="na2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
          <line x1="320" y1="170" x2="160" y2="70" stroke="#C8332A" strokeWidth="2" opacity=".6" markerEnd="url(#na2)"/>
          <line x1="320" y1="170" x2="480" y2="70" stroke="#C8332A" strokeWidth="1.5" opacity=".5" markerEnd="url(#na2)"/>
          <line x1="320" y1="170" x2="120" y2="210" stroke="#C8332A" strokeWidth="2" opacity=".6" markerEnd="url(#na2)"/>
          <line x1="320" y1="170" x2="520" y2="210" stroke="#C8332A" strokeWidth="1" opacity=".4" markerEnd="url(#na2)"/>
          <line x1="320" y1="170" x2="270" y2="290" stroke="#C97B1E" strokeWidth="1.5" opacity=".5" markerEnd="url(#na2)"/>
          <line x1="320" y1="170" x2="420" y2="290" stroke="#C97B1E" strokeWidth="1" opacity=".4" markerEnd="url(#na2)"/>
          <line x1="160" y1="70" x2="70" y2="130" stroke="#C8C4BC" strokeWidth="0.8" opacity=".4" markerEnd="url(#na2)"/>
          <line x1="480" y1="70" x2="570" y2="130" stroke="#C8C4BC" strokeWidth="0.8" opacity=".35" markerEnd="url(#na2)"/>
          <line x1="120" y1="210" x2="60" y2="280" stroke="#C8C4BC" strokeWidth="0.8" opacity=".3" markerEnd="url(#na2)"/>
          <g className="net-node" onClick={()=>ask('Analiza el riesgo de redes de contratistas en SECOP Colombia: patrones de fraccionamiento, mismos representantes legales y empresas relacionadas.')}>
            <circle cx="320" cy="170" r="28" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1.5" opacity=".95"/>
            <text x="320" y="166" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight="600" fill="#8F1F18" fontFamily="Syne,sans-serif">Hub</text>
            <text x="320" y="179" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fill="#C8332A">Principal</text>
          </g>
          <g className="net-node" onClick={()=>ask('Analiza patrones de corrupción en contratos del Ministerio de Educación Colombia según SECOP.')}><circle cx="160" cy="70" r="20" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="160" y="70" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontWeight="600" fill="#0C3E80">Min.Edu</text></g>
          <g className="net-node" onClick={()=>ask('Analiza contratos de INVIAS en SECOP: irregularidades detectadas y valor en riesgo.')}><circle cx="480" cy="70" r="18" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="480" y="70" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontWeight="600" fill="#0C3E80">INVIAS</text></g>
          <g className="net-node" onClick={()=>ask('Analiza patrones de corrupción en contratos de la Gobernación de Bolívar Colombia según SECOP.')}><circle cx="120" cy="210" r="18" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="120" y="210" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#0C3E80">G.Bolívar</text></g>
          <g className="net-node" onClick={()=>ask('Analiza irregularidades en contratos de Minsalud Colombia: precios de mercado y sobreprecios detectados.')}><circle cx="520" cy="210" r="15" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="520" y="210" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#0C3E80">Minsalud</text></g>
          <g className="net-node" onClick={()=>ask('Explica qué es un contratista relacionado en SECOP y cómo detectar subcontratación ilegal en Colombia.')}><circle cx="270" cy="290" r="14" fill="#FDF4E7" stroke="#C97B1E" strokeWidth="1" opacity=".9"/><text x="270" y="290" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#633806">GVA</text></g>
          <g className="net-node" onClick={()=>ask('¿Cómo detectar empresas de fachada en SECOP Colombia? ¿Qué señales de alerta existen?')}><circle cx="420" cy="290" r="12" fill="#FDF4E7" stroke="#C97B1E" strokeWidth="1" opacity=".9"/><text x="420" y="290" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#633806">Srv.</text></g>
          <g className="net-node" onClick={()=>ask('¿Qué es una empresa fantasma en SECOP y qué normas colombianas regulan su detección?')}><circle cx="70" cy="130" r="11" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1" strokeDasharray="3 2" opacity=".85"/><text x="70" y="127" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#8F1F18">EF-3</text><text x="70" y="138" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#C8332A">?</text></g>
          <g className="net-node" onClick={()=>ask('Explica cómo detectar subcontratistas no registrados en SECOP y qué responsabilidad tiene la entidad contratante.')}><circle cx="570" cy="130" r="10" fill="#EDEAE4" stroke="#7A746C" strokeWidth="0.5" opacity=".8"/><text x="570" y="130" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#4A4540">Sub-C</text></g>
          <g className="net-node" onClick={()=>ask('¿Qué dice la Ley 1474 sobre empresas fantasma y cómo sancionarlas en Colombia?')}><circle cx="60" cy="280" r="10" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1" strokeDasharray="3 2" opacity=".85"/><text x="60" y="277" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#8F1F18">EF-1</text><text x="60" y="288" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#C8332A">?</text></g>
          <text x="20" y="332" fontSize="8.5" fill="#7A746C">Tamaño = valor · Rojo = riesgo alto · Azul = entidad · Naranja = contratista · Dashes = empresa sospechosa · Clic para analizar con IA</text>
        </svg>
      </div>
      <div className="ai-panel section-gap">
        <div className="ai-header"><div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div><span className="ai-title">Análisis de red con IA</span></div>
        <AIOut id="red-ai-out" ai={ai} defaultText="Haz clic en cualquier nodo del grafo para analizar sus relaciones y detectar irregularidades." />
      </div>
    </div>
  )
}

function Mapa({ ai, callAI, secop, loading }: { ai: AI; callAI: (p:string,id:string)=>void; secop: SecopResponse | null; loading: boolean }) {
  const [tooltip, setTooltip] = useState<{x:number;y:number;n:string;risk:string;v:string;c:number;i:number}|null>(null)

  const deps = useMemo(() => {
    return Object.entries(DEP_GEO).map(([name, geo]) => {
      const data = secop?.departamentos[name] ?? { valor: 0, count: 0, irregulares: 0 }
      const risk = depRisk(data.valor)
      return { n: name, ...geo, risk, v: fmtCOP(data.valor), c: data.count, i: data.irregulares }
    })
  }, [secop])

  const totalIrreg = deps.reduce((s,d) => s + d.i, 0)
  const totalVal = deps.reduce((s,d) => s + (secop?.departamentos[d.n]?.valor ?? 0), 0)
  const criticos = deps.filter(d => d.risk === 'c' || d.risk === 'a').length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Mapa de riesgo</div>
        <div className="page-sub">Colombia · {loading ? 'Cargando datos SECOP II...' : 'Riesgo de corrupción por departamento — datos reales SECOP II'}</div>
      </div>
      <div className="grid4" style={{marginBottom:14}}>
        <div className="metric-card"><div className="mc-label">Dep. alto/crítico</div><div className="mc-val red">{loading ? '—' : criticos}</div></div>
        <div className="metric-card"><div className="mc-label">Valor total vigilado</div><div className="mc-val">{loading ? '—' : fmtCOP(totalVal)}</div></div>
        <div className="metric-card"><div className="mc-label">Irregulares detectados</div><div className="mc-val red">{loading ? '—' : totalIrreg}</div></div>
        <div className="metric-card"><div className="mc-label">Fuente</div><div className="mc-val amber" style={{fontSize:13}}>SECOP II</div></div>
      </div>
      <div className="card" style={{position:'relative'}}>
        {tooltip && (
          <div className="map-tooltip" style={{left:tooltip.x+12,top:tooltip.y-10}}>
            <div className="tt-name">{tooltip.n}</div>
            <div className="tt-row"><span>Riesgo:</span><span style={{fontWeight:600,color:RC[tooltip.risk]}}>{RL[tooltip.risk]}</span></div>
            <div className="tt-row"><span>Valor:</span><span>{tooltip.v} COP</span></div>
            <div className="tt-row"><span>Irregularidades:</span><span>{tooltip.i}/{tooltip.c}</span></div>
          </div>
        )}
        <svg width="100%" viewBox="0 0 640 520" style={{display:'block'}}>
          {deps.map(d => (
            <g key={d.n}>
              <circle
                cx={d.x} cy={d.y+20} r={d.r}
                fill={RC[d.risk]} stroke={RS[d.risk]} strokeWidth="1" opacity="0.88"
                style={{cursor:'pointer'}}
                onMouseEnter={e => { const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect(); setTooltip({x:e.clientX-r.left,y:e.clientY-r.top,n:d.n,risk:d.risk,v:d.v,c:d.c,i:d.i}) }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => callAI(`Analiza el departamento de ${d.n} en SECOP: ${d.i} irregularidades en ${d.c} contratos, valor en riesgo ${d.v} COP, nivel ${RL[d.risk]}. Dame: causas posibles, tipos de contratos más problemáticos y acción investigativa recomendada. Máximo 180 palabras.`, 'mapa-ai-out')}
              />
              <text x={d.x} y={d.y+20+d.r+10} textAnchor="middle" fontSize="8" fill="#4A4540" fontFamily="DM Sans,sans-serif">
                {d.n.length > 11 ? d.n.slice(0,10)+'.' : d.n}
              </text>
            </g>
          ))}
        </svg>
        <div style={{display:'flex',flexWrap:'wrap',gap:14,marginTop:12,fontSize:11,color:'var(--text3)'}}>
          {[['#8F1F18','Crítico (>$8B)'],['#C8332A','Alto ($3–8B)'],['#C97B1E','Medio ($800M–3B)'],['#2D7D52','Bajo (<$800M)']].map(([c,l])=>(
            <span key={l} style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:c,display:'inline-block'}}/>{l}</span>
          ))}
        </div>
      </div>
      <div className="ai-panel section-gap">
        <div className="ai-header"><div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div><span className="ai-title">Análisis regional</span></div>
        <AIOut id="mapa-ai-out" ai={ai} defaultText="Haz clic en un departamento para ver el análisis detallado de irregularidades en esa región." />
      </div>
    </div>
  )
}

function Comparador({ ai, callAI }: { ai: AI; callAI: (p:string,id:string)=>void }) {
  return (
    <div>
      <div className="page-header"><div className="page-title">Comparador de contratos</div><div className="page-sub">Analiza diferencias lado a lado para detectar irregularidades</div></div>
      <div style={{display:'flex',gap:14,marginBottom:14}}>
        <div className="compare-col">
          <div className="compare-header" style={{background:'var(--red-bg)',borderBottomColor:'var(--red-border)'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--red-dark)'}}>Contrato A — Alto riesgo</div>
            <div style={{fontSize:11,color:'var(--red)',marginTop:2}}>CD-2024-0034 · INVIAS</div>
          </div>
          {[['Contratista','Consorcio Infraestructura 2024',true],['Modalidad','Contratación Directa',true],['Valor','$12.3B COP',true],['Plazo','24 meses',false],['Garantías','No registradas',true],['Adiciones','30% en primer mes',true],['Score riesgo','88/100',true],['Antigüedad empresa','14 meses',true]].map(([k,v,d])=>(
            <div className="compare-row" key={String(k)}><span className="cr-key">{k}</span><span className={`cr-val${d?' diff':''}`}>{v}</span></div>
          ))}
        </div>
        <div className="compare-col">
          <div className="compare-header" style={{background:'var(--green-bg)'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--green)'}}>Contrato B — Bajo riesgo</div>
            <div style={{fontSize:11,color:'var(--green)',marginTop:2}}>LP-2023-112 · INVIAS</div>
          </div>
          {[['Contratista','Constructora Nacional SA'],['Modalidad','Licitación Pública'],['Valor','$11.8B COP'],['Plazo','24 meses'],['Garantías','Registradas completas'],['Adiciones','Sin adiciones'],['Score riesgo','22/100'],['Antigüedad empresa','18 años']].map(([k,v])=>(
            <div className="compare-row" key={k}><span className="cr-key">{k}</span><span className="cr-val">{v}</span></div>
          ))}
        </div>
      </div>
      <div className="ai-panel">
        <div className="ai-header"><div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div><span className="ai-title">Análisis comparativo con IA</span></div>
        <AIOut id="comp-ai-out" ai={ai} defaultText="Selecciona un análisis o escribe tu consulta sobre los dos contratos." />
        <div className="chip-row">
          <span className="chip" onClick={()=>callAI('Compara estos dos contratos de INVIAS de similar valor. El A es contratación directa con empresa de 14 meses, sin garantías, con adición del 30% en el primer mes, score 88/100. El B es licitación pública con empresa de 18 años, garantías completas, sin adiciones, score 22/100. ¿Cuáles son las irregularidades más graves del Contrato A y qué normas colombianas viola?','comp-ai-out')}>Analizar diferencias críticas</span>
          <span className="chip" onClick={()=>callAI('¿Qué preguntas haría en un debate de control político sobre el Contrato A de INVIAS frente al ministro de transporte, basándome en las irregularidades detectadas?','comp-ai-out')}>Generar preguntas para debate</span>
        </div>
      </div>
    </div>
  )
}

function Watchlist({ secop }: { secop: SecopResponse | null }) {
  const [on, setOn] = useState<Record<string,boolean>>({})
  const tog = (k:string) => setOn(p=>({...p,[k]:!p[k]}))

  const topContratistas = secop?.contratos.filter(c => c.contratista).slice(0, 3) ?? []
  const topEntidades = Object.entries(secop?.entidades ?? {}).sort((a,b)=>b[1].alertas-a[1].alertas).slice(0,3)

  return (
    <div>
      <div className="page-header"><div className="page-title">Watchlist</div><div className="page-sub">Entidades y contratistas bajo seguimiento personalizado</div></div>
      <div className="grid2">
        <div>
          <div className="card-title" style={{marginBottom:10}}>Contratistas vigilados</div>
          {topContratistas.map((c,i) => (
            <div className="watch-item" key={i}>
              <div className="watch-icon" style={{background:'var(--red-bg)'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div><div className="watch-name">{c.contratista}</div><div className="watch-meta">{rLabel(c.riesgo)} · {fmtCOP(c.valor)} COP · {c.modalidad.slice(0,20)}</div></div>
              <div className="watch-status"><span className={`badge ${rBadge(c.riesgo)}`}>{c.riesgo}</span><div className={`toggle${on[`c${i}`]?' on':''}`} onClick={()=>tog(`c${i}`)}/></div>
            </div>
          ))}
        </div>
        <div>
          <div className="card-title" style={{marginBottom:10}}>Entidades bajo vigilancia</div>
          {topEntidades.map(([name, data], i) => (
            <div className="watch-item" key={i}>
              <div className="watch-icon" style={{background:'var(--red-bg)'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.8"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9"/></svg></div>
              <div><div className="watch-name">{name}</div><div className="watch-meta">{data.alertas} alertas activas · {fmtCOP(data.valor)} vigilados</div></div>
              <div className="watch-status"><span className={`badge ${data.alertas>3?'red':'amber'}`}>{data.count}</span><div className={`toggle${on[`e${i}`]?' on':''}`} onClick={()=>tog(`e${i}`)}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Reportes({ ai, callAI }: { ai: AI; callAI: (p:string,id:string)=>void }) {
  const [sel, setSel] = useState(0)
  const types = [
    {icon:'var(--red-bg)',stroke:'var(--red)',name:'Informe completo de irregularidades',desc:'Todas las alertas · Gráficas · Recomendaciones legales'},
    {icon:'var(--amber-bg)',stroke:'var(--amber)',name:'Análisis de red de contratistas',desc:'Conexiones · Conflictos de interés · Socios ocultos'},
    {icon:'var(--blue-bg)',stroke:'var(--blue)',name:'Informe regional por departamento',desc:'Mapa de riesgo · Entidades locales · Valor en riesgo'},
    {icon:'var(--green-bg)',stroke:'var(--green)',name:'Cuestionario para debate en Cámara',desc:'Preguntas concretas · Citación a ministros · Con datos'},
  ]
  return (
    <div>
      <div className="page-header"><div className="page-title">Generar informe</div><div className="page-sub">Reportes listos para debate de control político en el Congreso</div></div>
      <div className="grid2">
        <div>
          <div className="card-title" style={{marginBottom:10}}>Tipo de informe</div>
          {types.map((t,i)=>(
            <div key={i} className={`report-type${sel===i?' selected':''}`} onClick={()=>setSel(i)}>
              <div className="report-icon2" style={{background:t.icon}}><svg viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div><div className="rt-name">{t.name}</div><div className="rt-desc">{t.desc}</div></div>
              <div className="rt-sel"/>
            </div>
          ))}
          <div className="export-actions">
            <button className="exp-btn primary" onClick={()=>callAI(REPORT_PROMPTS[sel],'rep-ai-out')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>Generar con IA
            </button>
            <button className="exp-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>PDF</button>
            <button className="exp-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Excel</button>
          </div>
        </div>
        <div className="ai-panel" style={{height:'fit-content'}}>
          <div className="ai-header"><div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div><span className="ai-title">Vista previa del informe</span></div>
          <AIOut id="rep-ai-out" ai={ai} defaultText={'Selecciona un tipo de informe y haz clic en "Generar con IA" para obtener un informe listo para presentar.'} />
        </div>
      </div>
    </div>
  )
}

function IA({ ai, callAI, secop }: { ai: AI; callAI: (p:string,id:string)=>void; secop: SecopResponse | null }) {
  const [input, setInput] = useState('')

  const contextPrefix = useMemo(() => {
    if (!secop) return ''
    const top3 = secop.contratos.slice(0, 3).map(c =>
      `- ${c.entidad}: ${c.objeto.slice(0,60)} · ${fmtCOP(c.valor)} · ${c.modalidad} · Score ${c.riesgo}/100`
    ).join('\n')
    return `Contexto actual SECOP II (${secop.metrics.total} contratos analizados, ${secop.metrics.criticos} críticos, valor total ${fmtCOP(secop.metrics.valorTotal)}):\n${top3}\n\n`
  }, [secop])

  const send = () => {
    if (!input.trim()) return
    callAI(contextPrefix + 'Eres experto anticorrupción en contratación pública colombiana. ' + input.trim() + ' Basa tu respuesta en normativa colombiana (Ley 80, 1150, 1474, etc.). Máximo 220 palabras.', 'ia-ai-out')
    setInput('')
  }
  const chips = [
    ['Contratistas más favorecidos','¿Cuáles son los contratistas que más han recibido contratos de contratación directa en los últimos 90 días y cuál es su nivel de riesgo?'],
    ['Adiciones excesivas 2024','Identifica contratos con adiciones superiores al 50% del valor original en 2024. Analiza si hay un patrón de corrupción y cita la norma colombiana violada.'],
    ['Fraccionamiento Min. Educación','Analiza el fraccionamiento de contratos en el Ministerio de Educación. ¿Qué dice el artículo 95 de la Ley 1474 sobre esto?'],
    ['Sobreprecios en INVIAS','Analiza contratos de INVIAS en 2024 y compara precios con el mercado para detectar sobre-costos. ¿Qué herramientas ofrece SECOP para verificar esto?'],
    ['Conflictos de interés','¿Qué contratistas tienen contratos activos con varias entidades simultáneamente que puedan configurar un conflicto de interés según la Ley 1952 de 2019?'],
    ['Picos preelectorales','¿Se detectan picos de contratación directa en períodos preelectorales en Colombia? ¿Qué dice el Consejo de Estado sobre esto?'],
  ]
  return (
    <div>
      <div className="page-header"><div className="page-title">Investigar con IA</div><div className="page-sub">Chat de investigación anticorrupción · Basado en normativa colombiana · Contexto SECOP II en tiempo real</div></div>
      <div className="ai-panel">
        <div className="ai-header">
          <div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
          <span className="ai-title">Asistente de investigación SECOP</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)'}}>Claude · Normativa Ley 80/1150 · {secop ? `${secop.metrics.total} contratos cargados` : 'Cargando datos...'}</span>
        </div>
        <div className="chip-row">
          {chips.map(([label, prompt]) => (
            <span key={label} className="chip" onClick={() => callAI(contextPrefix + prompt, 'ia-ai-out')}>{label}</span>
          ))}
        </div>
        <AIOut id="ia-ai-out" ai={ai} defaultText="Escribe tu consulta investigativa o selecciona una consulta rápida arriba. Tengo acceso a normativa colombiana de contratación pública y al contexto de los contratos más recientes de SECOP II." />
        <div className="ai-input-row">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ej: ¿Hay empresas con contratos en varias entidades y posible conflicto de interés?"
            onKeyDown={e => { if (e.key === 'Enter') send() }}
          />
          <button className="ai-send" onClick={send}>Investigar →</button>
        </div>
      </div>
    </div>
  )
}

function Config() {
  const [notif, setNotif] = useState({criticas:true,medias:true,semanal:false,push:true})
  const tog = (k: keyof typeof notif) => setNotif(p=>({...p,[k]:!p[k]}))
  return (
    <div>
      <div className="page-header"><div className="page-title">Configuración</div><div className="page-sub">Preferencias de cuenta y del sistema</div></div>
      <div className="grid2">
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="settings-section">
              <div className="settings-title">Perfil de usuario</div>
              <div className="settings-sub">Información de tu cuenta en SECOP Vigía</div>
              <div className="settings-row"><div><div className="sr-label">Nombre completo</div></div><input className="settings-input" defaultValue="Usuario Demo" /></div>
              <div className="settings-row"><div><div className="sr-label">Correo electrónico</div></div><input className="settings-input" defaultValue="demo@secopvigia.co" /></div>
              <div className="settings-row"><div><div className="sr-label">Cargo</div></div><input className="settings-input" defaultValue="Investigador" /></div>
              <div className="settings-row"><div><div className="sr-label">Cobertura</div></div><input className="settings-input" defaultValue="Nacional" /></div>
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="settings-section">
              <div className="settings-title">Notificaciones</div>
              <div className="settings-sub">Configura cuándo y cómo recibir alertas</div>
              {([['criticas','Alertas críticas','Notificación inmediata por email'],['medias','Alertas medias','Resumen diario'],['semanal','Informe semanal','Cada lunes a las 8am'],['push','Notificaciones push','En el navegador']] as const).map(([k,l,d])=>(
                <div className="settings-row" key={k}>
                  <div><div className="sr-label">{l}</div><div className="sr-desc">{d}</div></div>
                  <div className={`toggle${notif[k]?' on':''}`} onClick={()=>tog(k)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function SecopVigia() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [view, setView] = useState<ViewId>('dashboard')
  const [ai, setAi] = useState<AI>({})
  const [search, setSearch] = useState('')
  const [secop, setSecop] = useState<SecopResponse | null>(null)
  const [secopLoading, setSecopLoading] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    setSecopLoading(true)
    fetch('/api/secop?limit=150')
      .then(r => r.json())
      .then(data => { if (!data.error) setSecop(data) })
      .catch(() => {})
      .finally(() => setSecopLoading(false))
  }, [loggedIn])

  const callAI = useCallback(async (prompt: string, outId: string) => {
    setAi(p => ({ ...p, [outId]: 'loading' }))
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await resp.json()
      setAi(p => ({ ...p, [outId]: data.text || data.error || 'Sin respuesta.' }))
    } catch {
      setAi(p => ({ ...p, [outId]: 'Error de conexión con el servicio de IA.' }))
    }
  }, [])

  const quickSearch = (q: string) => {
    if (!q.trim()) return
    setView('ia')
    const ctx = secop ? `Contexto: ${secop.metrics.total} contratos analizados en SECOP II. ` : ''
    callAI(`${ctx}Busca en SECOP contratos relacionados con "${q}". Identifica posibles irregularidades y recomienda qué investigar. Máximo 200 palabras.`, 'ia-ai-out')
  }

  if (!loggedIn) return <LoginScreen onLogin={() => { setLoggedIn(true); setShowOnboarding(true) }} />

  const criticos = secop?.metrics.criticos ?? 0

  return (
    <div className="app">
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <Sidebar view={view} setView={setView} onLogout={() => setLoggedIn(false)} criticos={criticos} />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{VIEW_LABELS[view]}</div>
            <div className="topbar-breadcrumb"><span>SECOP Vigía</span><span>›</span><span>{VIEW_LABELS[view]}</span></div>
          </div>
          <div className="topbar-search" style={{marginLeft:24}}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contrato, entidad, contratista..." onKeyDown={e=>{ if(e.key==='Enter') quickSearch(search) }} />
          </div>
          <div className="topbar-actions">
            <div className="topbar-notif">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              {criticos > 0 && <div className="notif-dot" />}
            </div>
            <button className="topbar-btn primary" onClick={() => setView('ia')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Investigar ↗
            </button>
          </div>
        </div>
        <div className="content">
          {view === 'dashboard'    && <Dashboard ai={ai} callAI={callAI} setView={setView} secop={secop} loading={secopLoading} />}
          {view === 'contratos'    && <Contratos setView={setView} secop={secop} loading={secopLoading} />}
          {view === 'contratistas' && <Contratistas secop={secop} />}
          {view === 'entidades'    && <Entidades secop={secop} loading={secopLoading} />}
          {view === 'alertas'      && <Alertas secop={secop} loading={secopLoading} />}
          {view === 'red'          && <Red ai={ai} callAI={callAI} />}
          {view === 'mapa'         && <Mapa ai={ai} callAI={callAI} secop={secop} loading={secopLoading} />}
          {view === 'comparador'   && <Comparador ai={ai} callAI={callAI} />}
          {view === 'watchlist'    && <Watchlist secop={secop} />}
          {view === 'reportes'     && <Reportes ai={ai} callAI={callAI} />}
          {view === 'ia'           && <IA ai={ai} callAI={callAI} secop={secop} />}
          {view === 'config'       && <Config />}
        </div>
      </div>
    </div>
  )
}
