'use client'

import { useState, useCallback } from 'react'

type ViewId = 'dashboard' | 'contratos' | 'contratistas' | 'entidades' | 'alertas' | 'red' | 'mapa' | 'comparador' | 'watchlist' | 'reportes' | 'ia' | 'config'
type AI = Record<string, string>

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Dashboard', contratos: 'Contratos', contratistas: 'Perfil de contratista',
  entidades: 'Entidades públicas', alertas: 'Gestión de alertas', red: 'Red de contratistas',
  mapa: 'Mapa de riesgo', comparador: 'Comparador', watchlist: 'Watchlist',
  reportes: 'Generar informe', ia: 'Investigar con IA', config: 'Configuración',
}

const DEPS = [
  {n:'Cundinamarca',x:295,y:230,r:22,risk:'c',v:'$8.2B',c:48,i:31},
  {n:'Antioquia',x:195,y:195,r:20,risk:'c',v:'$6.1B',c:41,i:24},
  {n:'Valle del Cauca',x:165,y:280,r:18,risk:'a',v:'$4.3B',c:37,i:18},
  {n:'Bolívar',x:190,y:130,r:17,risk:'a',v:'$3.8B',c:29,i:15},
  {n:'Atlántico',x:205,y:92,r:15,risk:'a',v:'$2.9B',c:22,i:12},
  {n:'Meta',x:340,y:285,r:16,risk:'a',v:'$2.1B',c:19,i:10},
  {n:'Santander',x:270,y:170,r:14,risk:'m',v:'$1.4B',c:18,i:7},
  {n:'Córdoba',x:210,y:152,r:13,risk:'m',v:'$1.1B',c:15,i:6},
  {n:'Nariño',x:175,y:350,r:13,risk:'m',v:'$0.9B',c:14,i:5},
  {n:'Huila',x:255,y:315,r:12,risk:'m',v:'$0.7B',c:11,i:4},
  {n:'Boyacá',x:305,y:200,r:12,risk:'m',v:'$0.6B',c:10,i:3},
  {n:'Tolima',x:245,y:265,r:12,risk:'m',v:'$0.5B',c:9,i:3},
  {n:'Cesar',x:265,y:112,r:12,risk:'m',v:'$0.8B',c:12,i:4},
  {n:'La Guajira',x:255,y:72,r:11,risk:'b',v:'$0.3B',c:8,i:2},
  {n:'Magdalena',x:233,y:103,r:11,risk:'b',v:'$0.4B',c:9,i:2},
  {n:'Cauca',x:195,y:320,r:11,risk:'b',v:'$0.4B',c:8,i:2},
  {n:'Chocó',x:145,y:232,r:10,risk:'b',v:'$0.2B',c:6,i:1},
  {n:'Risaralda',x:198,y:252,r:10,risk:'b',v:'$0.3B',c:7,i:2},
  {n:'Caldas',x:213,y:237,r:10,risk:'b',v:'$0.3B',c:7,i:2},
  {n:'Caquetá',x:285,y:350,r:11,risk:'b',v:'$0.2B',c:5,i:1},
  {n:'Vichada',x:428,y:212,r:10,risk:'b',v:'$0.1B',c:3,i:0},
  {n:'Amazonas',x:348,y:425,r:10,risk:'b',v:'$0.1B',c:3,i:0},
  {n:'Putumayo',x:255,y:390,r:10,risk:'b',v:'$0.2B',c:4,i:1},
]
const RC: Record<string,string> = {c:'#8F1F18',a:'#C8332A',m:'#C97B1E',b:'#2D7D52'}
const RS: Record<string,string> = {c:'#6B1210',a:'#8F1F18',m:'#8A5210',b:'#1A5534'}
const RL: Record<string,string> = {c:'Crítico',a:'Alto',m:'Medio',b:'Bajo'}

const REPORT_PROMPTS: Record<number,string> = {
  0: 'Redacta un informe ejecutivo de control político sobre irregularidades en SECOP Colombia 2024 con: resumen ejecutivo, 3 hallazgos principales con datos, irregularidades por modalidad y recomendaciones legales (Ley 80/1150). Máximo 280 palabras.',
  1: 'Redacta un análisis de redes de contratistas para la Cámara de Representantes: cómo detectar redes en SECOP, señales de alerta, normativa y 5 preguntas para citar ministros. Máximo 280 palabras.',
  2: 'Redacta un informe regional de los 5 departamentos colombianos con mayor riesgo de corrupción en contratos públicos 2024, con valor en riesgo y recomendaciones. Máximo 280 palabras.',
  3: 'Genera 8 preguntas concretas para un debate de control político en la Cámara sobre irregularidades SECOP. Cada pregunta debe citar datos o normativa específica colombiana. Máximo 280 palabras.',
}

function Spin() {
  return <span className="spin" />
}

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
function Sidebar({ view, setView, onLogout }: { view: ViewId; setView: (v: ViewId) => void; onLogout: () => void }) {
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
        {nav('contratos', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, 'Contratos', { text: '87', amber: true })}
        {nav('contratistas', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, 'Contratistas')}
        {nav('entidades', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9"/></svg>, 'Entidades')}
        <div className="sidebar-section-label">Análisis</div>
        {nav('alertas', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, 'Alertas', { text: '14' })}
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

function Dashboard({ ai, callAI, setView }: { ai: AI; callAI: (p:string,id:string)=>void; setView: (v:ViewId)=>void }) {
  return (
    <div>
      <div className="page-header"><div className="page-title">Resumen ejecutivo</div><div className="page-sub">Actualizado hace 2 horas · SECOP II · datos.gov.co</div></div>
      <div className="grid4" style={{marginBottom:14}}>
        <div className="metric-card"><div className="mc-label">Alertas críticas</div><div className="mc-val red">14</div><div className="mc-sub"><span className="mc-trend-up">↑ 3 hoy</span></div></div>
        <div className="metric-card"><div className="mc-label">Contratos sospechosos</div><div className="mc-val amber">87</div><div className="mc-sub"><span className="mc-trend-up">↑ 12 esta semana</span></div></div>
        <div className="metric-card"><div className="mc-label">Valor en riesgo</div><div className="mc-val">$31.4B</div><div className="mc-sub" style={{color:'var(--text3)'}}>COP estimado</div></div>
        <div className="metric-card"><div className="mc-label">Contratos analizados</div><div className="mc-val green">3.841</div><div className="mc-sub"><span className="mc-trend-ok">↑ 204 hoy</span></div></div>
      </div>
      <div className="grid2" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-title">Alertas tempranas activas</div>
          {[
            {sev:'h',title:'Fraccionamiento de contratos detectado',meta:'Min. Educación · 8 contratos bajo umbral · $890M COP',badge:'red',label:'Alta'},
            {sev:'h',title:'Contratista sin RUT activo adjudicado',meta:'Gobernación Bolívar · Contrato $1.2B COP',badge:'red',label:'Alta'},
            {sev:'m',title:'Adición superior al 50% sin justificación',meta:'INVIAS · Contrato 2024-0781 · Adición $2.1B COP',badge:'amber',label:'Media'},
            {sev:'m',title:'Proceso declarado desierto y renegociado',meta:'IDU Bogotá · Licitación LP-047',badge:'amber',label:'Media'},
            {sev:'l',title:'Plazos de ejecución inusualmente cortos',meta:'Alcaldía Barranquilla · 3 contratos · 2 días hábiles',badge:'green',label:'Baja'},
          ].map((a,i) => (
            <div className="alert-row" key={i}>
              <div className={`sev-dot ${a.sev}`} style={{marginTop:4,flexShrink:0}} />
              <div className="ar-body"><div className="ar-title">{a.title}</div><div className="ar-meta">{a.meta}</div></div>
              <span className={`badge ${a.badge}`} style={{flexShrink:0}}>{a.label}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Irregularidades por modalidad</div>
          <div className="bar-chart">
            {[['Contrat. Directa','87%','var(--red)','87 casos'],['Licitación Pública','39%','var(--amber)','34 casos'],['Selec. Abreviada','32%','var(--amber)','28 casos'],['Concurso Méritos','22%','var(--green)','19 casos'],['Mínima Cuantía','47%','var(--amber)','41 casos']].map(([l,w,c,v],i)=>(
              <div className="bc-row" key={i}><span className="bc-label">{l}</span><div className="bc-track"><div className="bc-fill" style={{width:w,background:c}}/></div><span className="bc-val">{v}</span></div>
            ))}
          </div>
          <div style={{marginTop:16}}>
            <div className="card-title" style={{marginBottom:10}}>Sobre-precio promedio por sector</div>
            <div className="bar-chart">
              {[['Equipos médicos','82%','var(--red)','+41%'],['Obra pública','76%','var(--red)','+38%'],['Software / TI','58%','var(--amber)','+29%'],['Consultoría','44%','var(--amber)','+22%']].map(([l,w,c,v],i)=>(
                <div className="bc-row" key={i}><span className="bc-label">{l}</span><div className="bc-track"><div className="bc-fill" style={{width:w,background:c}}/></div><span className="bc-val">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Contratos bajo vigilancia activa</div>
        <div className="tbl-wrap">
          <table><thead><tr><th>Contratista</th><th>Entidad</th><th>Modalidad</th><th>Valor</th><th>Score de riesgo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {[
              {name:'Consorcio Infraestructura 2024',num:'CD-2024-0034',ent:'INVIAS',mod:'Directa',val:'$12.3B COP',score:88,color:'var(--red)',badge:'red',est:'Crítico'},
              {name:'Unión Temporal Obras GVA',num:'LP-2024-091',ent:'Min. Educación',mod:'Licitación',val:'$4.7B COP',score:74,color:'var(--red)',badge:'red',est:'Alto'},
              {name:'Servimedic SAS',num:'CD-2024-118',ent:'Minsalud',mod:'Directa',val:'$890M COP',score:61,color:'var(--amber)',badge:'amber',est:'Medio'},
              {name:'Grupo Consultor Andino Ltda',num:'CV-2024-227',ent:'DNP',mod:'Concurso',val:'$2.1B COP',score:55,color:'var(--amber)',badge:'amber',est:'Medio'},
              {name:'Tecnologías e Innovación SAS',num:'CD-2024-445',ent:'Min. TIC',mod:'Directa',val:'$340M COP',score:28,color:'var(--green)',badge:'green',est:'Bajo'},
            ].map((r,i)=>(
              <tr key={i}>
                <td><div className="tbl-entity">{r.name}</div><div className="tbl-meta">{r.num}</div></td>
                <td>{r.ent}</td><td><span className="badge gray">{r.mod}</span></td>
                <td style={{fontWeight:600}}>{r.val}</td>
                <td><div className="risk-bar-wrap"><div className="risk-bar"><div className="risk-fill" style={{width:`${r.score}%`,background:r.color}}/></div><span className="risk-val" style={{color:r.color}}>{r.score}</span></div></td>
                <td><span className={`badge ${r.badge}`}>{r.est}</span></td>
                <td><button className="action-btn" onClick={()=>setView('contratistas')}>Ver perfil</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}

function Contratos({ setView }: { setView: (v:ViewId)=>void }) {
  return (
    <div>
      <div className="page-header"><div className="page-title">Contratos</div><div className="page-sub">9.4M contratos en SECOP II · 87 bajo vigilancia activa</div></div>
      <div className="filter-bar">
        <input className="filter-input" type="text" placeholder="Buscar por entidad, contratista, objeto o número..." />
        <select className="filter-select"><option>Todos los departamentos</option><option>Cundinamarca</option><option>Antioquia</option><option>Valle del Cauca</option><option>Bolívar</option></select>
        <select className="filter-select"><option>Todas las modalidades</option><option>Contratación Directa</option><option>Licitación Pública</option><option>Selección Abreviada</option><option>Concurso de Méritos</option></select>
        <select className="filter-select"><option>Todos los estados</option><option>En ejecución</option><option>Perfeccionado</option><option>Terminado</option><option>Liquidado</option></select>
        <button className="filter-btn active">Buscar</button>
        <button className="filter-btn">Exportar CSV</button>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table><thead><tr><th>Nº Contrato</th><th>Contratista</th><th>Entidad</th><th>Objeto</th><th>Modalidad</th><th>Valor COP</th><th>Riesgo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {[
              {num:'CD-2024-0034',name:'Consorcio Infra 2024',nit:'NIT 901.234.567-1',ent:'INVIAS',obj:'Mantenimiento vial Bogotá-Villavicencio',mod:'Directa',val:'$12.3B',r:'88/100',rb:'red',est:'En ejecución',eb:'red'},
              {num:'LP-2024-091',name:'UT Obras GVA',nit:'NIT 890.123.456-2',ent:'Min. Educación',obj:'Construcción infraestructura educativa',mod:'Licitación',val:'$4.7B',r:'74/100',rb:'red',est:'En ejecución',eb:'amber'},
              {num:'CD-2024-118',name:'Servimedic SAS',nit:'NIT 901.111.222-3',ent:'Minsalud',obj:'Suministro equipos biomédicos',mod:'Directa',val:'$890M',r:'61/100',rb:'amber',est:'En ejecución',eb:'amber'},
              {num:'CV-2024-227',name:'G. Consultor Andino',nit:'NIT 800.999.111-4',ent:'DNP',obj:'Consultoría política pública innovación',mod:'Concurso',val:'$2.1B',r:'55/100',rb:'amber',est:'Perfeccionado',eb:'green'},
              {num:'CD-2024-445',name:'Tecno e Innovación',nit:'NIT 901.555.888-5',ent:'Min. TIC',obj:'Licenciamiento software gestión',mod:'Directa',val:'$340M',r:'28/100',rb:'green',est:'Activo',eb:'green'},
            ].map((r,i)=>(
              <tr key={i}>
                <td><div className="tbl-entity">{r.num}</div></td>
                <td><div className="tbl-entity">{r.name}</div><div className="tbl-meta">{r.nit}</div></td>
                <td>{r.ent}</td>
                <td style={{maxWidth:200,fontSize:12}}>{r.obj}</td>
                <td><span className="badge gray">{r.mod}</span></td>
                <td style={{fontWeight:600}}>{r.val}</td>
                <td><span className={`badge ${r.rb}`}>{r.r}</span></td>
                <td><span className={`badge ${r.eb}`}>{r.est}</span></td>
                <td><button className="action-btn" onClick={()=>setView('contratistas')}>→</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}

function Contratistas() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Perfil de contratista</div><div className="page-sub">Consorcio Infraestructura 2024 · NIT 901.234.567-1</div></div>
      <div className="grid2" style={{marginBottom:14}}>
        <div className="card">
          <div className="profile-header">
            <div className="profile-avatar"><svg viewBox="0 0 24 24" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
            <div>
              <div className="profile-name">Consorcio Infraestructura 2024</div>
              <div className="profile-meta">NIT 901.234.567-1 · Cámara Comercio: Bogotá · Constituida: 14 Feb 2024</div>
              <div className="profile-badges">
                <span className="badge red">⚑ Alto riesgo</span>
                <span className="badge amber">4 contratos sin liquidar</span>
                <span className="badge gray">Obras civiles</span>
              </div>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-item"><div className="stat-lbl">Contratos activos</div><div className="stat-val" style={{color:'var(--red)'}}>4</div></div>
            <div className="stat-item"><div className="stat-lbl">Valor total</div><div className="stat-val">$18.4B</div></div>
            <div className="stat-item"><div className="stat-lbl">Entidades</div><div className="stat-val">3</div></div>
            <div className="stat-item"><div className="stat-lbl">Meses activo</div><div className="stat-val" style={{color:'var(--amber)'}}>14</div></div>
          </div>
          <div>
            <div className="card-title" style={{marginBottom:8}}>Señales de alerta</div>
            <span className="flag-pill red">⚑ Empresa con &lt;1 año de antigüedad</span>
            <span className="flag-pill red">⚑ Antecedentes disciplinarios Repr. Legal</span>
            <span className="flag-pill red">⚑ Contratación directa sobre umbral legal</span>
            <span className="flag-pill amber">⚠ 4 contratos previos sin liquidar</span>
            <span className="flag-pill amber">⚠ Sin estudios previos publicados</span>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Score de riesgo</div>
          <div className="gauge-wrap">
            <svg className="gauge-svg" viewBox="0 0 160 90">
              <path d="M20 85 A60 60 0 0 1 140 85" fill="none" stroke="#F0EDE8" strokeWidth="10" strokeLinecap="round"/>
              <path d="M20 85 A60 60 0 0 1 140 85" fill="none" stroke="url(#gGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset="22.6"/>
              <defs><linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2D7D52"/><stop offset="50%" stopColor="#C97B1E"/><stop offset="100%" stopColor="#C8332A"/></linearGradient></defs>
              <text x="80" y="75" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="800" fontFamily="Syne,sans-serif" fill="#1A1815">88</text>
            </svg>
            <div className="gauge-lbl">Score de riesgo / 100</div>
          </div>
          <div className="risk-breakdown">
            {([['Empresa / NIT',95,'var(--red)'],['Proceso',80,'var(--red)'],['Precio mercado',72,'var(--amber)'],['Documentación',85,'var(--red)'],['Ejecución',60,'var(--amber)']] as [string,number,string][]).map(([l,v,c],i)=>(
              <div className="rb-row" key={i}><span className="rb-label">{l}</span><div className="rb-track"><div className="rb-fill" style={{width:`${v}%`,background:c}}/></div><span className="rb-val" style={{color:c}}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Entidades() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Entidades públicas</div><div className="page-sub">Ranking por score de transparencia y alertas activas</div></div>
      <div className="card">
        <div className="tbl-wrap">
          <table><thead><tr><th>Entidad</th><th>Sector</th><th>Contratos activos</th><th>Alertas</th><th>Valor vigilado</th><th>Transparencia</th><th></th></tr></thead>
          <tbody>
            {[
              {name:'Min. Educación',sub:'Gobierno Nacional',sec:'Educación',cnt:241,ab:'red',al:'18 alertas',val:'$24.1B COP',score:42,sc:'amber'},
              {name:'INVIAS',sub:'Gobierno Nacional',sec:'Infraestructura',cnt:189,ab:'red',al:'22 alertas',val:'$41.3B COP',score:38,sc:'red'},
              {name:'Gobernación Bolívar',sub:'Territorial',sec:'Mixto',cnt:97,ab:'amber',al:'9 alertas',val:'$8.7B COP',score:51,sc:'amber'},
              {name:'Ministerio de Salud',sub:'Gobierno Nacional',sec:'Salud',cnt:312,ab:'amber',al:'7 alertas',val:'$18.2B COP',score:64,sc:'green'},
              {name:'DNP',sub:'Gobierno Nacional',sec:'Planeación',cnt:54,ab:'green',al:'2 alertas',val:'$4.1B COP',score:72,sc:'green'},
            ].map((r,i)=>(
              <tr key={i}>
                <td><div className="tbl-entity">{r.name}</div><div className="tbl-meta">{r.sub}</div></td>
                <td>{r.sec}</td><td>{r.cnt}</td>
                <td><span className={`badge ${r.ab}`}>{r.al}</span></td>
                <td>{r.val}</td>
                <td><div className="risk-bar-wrap"><div className="risk-bar"><div className="risk-fill" style={{width:`${r.score}%`,background:`var(--${r.sc})`}}/></div><span className="risk-val" style={{color:`var(--${r.sc})`}}>{r.score}</span></div></td>
                <td><button className="action-btn">Ver</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}

function Alertas() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Gestión de alertas</div><div className="page-sub">14 críticas · 31 medias · 42 bajas · Última actualización: hace 2h</div></div>
      <div className="filter-bar">
        <select className="filter-select"><option>Todas las severidades</option><option>Alta</option><option>Media</option><option>Baja</option></select>
        <select className="filter-select"><option>Todos los tipos</option><option>Fraccionamiento</option><option>Sobre-precio</option><option>Empresa inhabilitada</option><option>Adición excesiva</option></select>
        <select className="filter-select"><option>Todos los estados</option><option>Sin revisar</option><option>En revisión</option><option>Escalada</option><option>Cerrada</option></select>
        <button className="filter-btn active">Filtrar</button>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table><thead><tr><th>Severidad</th><th>Tipo</th><th>Entidad</th><th>Detalle</th><th>Valor</th><th>Detectada</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {[
              {sev:'red',sl:'Alta',tipo:'Fraccionamiento',ent:'Min. Educación',det:'12 contratos bajo umbral en 3 días',val:'$2.1B',fecha:'Hoy 09:12',est:'amber',el:'Sin revisar'},
              {sev:'red',sl:'Alta',tipo:'Empresa inhabilitada',ent:'INVIAS',det:'Contratista con cámara de comercio cancelada',val:'$890M',fecha:'Hoy 07:44',est:'amber',el:'Sin revisar'},
              {sev:'red',sl:'Alta',tipo:'Red empresas',ent:'G. Bolívar',det:'5 empresas con mismo RUT beneficiario',val:'$3.4B',fecha:'Ayer 08:02',est:'blue',el:'En revisión'},
              {sev:'amber',sl:'Media',tipo:'Adición excesiva',ent:'IDU Bogotá',det:'Adición del 48% sin justificación técnica',val:'$1.8B',fecha:'Ayer 16:30',est:'amber',el:'Sin revisar'},
              {sev:'amber',sl:'Media',tipo:'Plazo imposible',ent:'Alcaldía Sincelejo',det:'3 contratos con plazo de 1 día hábil',val:'$340M',fecha:'Ayer 11:15',est:'green',el:'Escalada'},
            ].map((r,i)=>(
              <tr key={i}>
                <td><span className={`badge ${r.sev}`}>{r.sl}</span></td>
                <td>{r.tipo}</td><td>{r.ent}</td>
                <td style={{fontSize:12,maxWidth:180}}>{r.det}</td>
                <td style={{fontWeight:600}}>{r.val}</td>
                <td style={{fontSize:11,color:'var(--text3)'}}>{r.fecha}</td>
                <td><span className={`badge ${r.est}`}>{r.el}</span></td>
                <td><button className="action-btn">Revisar</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
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
          <g className="net-node" onClick={()=>ask('Consorcio Infraestructura 2024 es el hub principal con $12.3B en contratos. Analiza su riesgo.')}>
            <circle cx="320" cy="170" r="28" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1.5" opacity=".95"/>
            <text x="320" y="166" textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight="600" fill="#8F1F18" fontFamily="Syne,sans-serif">CI-2024</text>
            <text x="320" y="179" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fill="#C8332A">$12.3B</text>
          </g>
          <g className="net-node" onClick={()=>ask('Min. Educación tiene contratos con CI-2024 por $4.7B bajo licitación con un único proponente.')}><circle cx="160" cy="70" r="20" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="160" y="67" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontWeight="600" fill="#0C3E80">Min.Edu</text><text x="160" y="79" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#1B5FA8">$4.7B</text></g>
          <g className="net-node" onClick={()=>ask('INVIAS tiene $8.1B en contratos con CI-2024 bajo contratación directa sobre umbral legal.')}><circle cx="480" cy="70" r="18" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="480" y="70" textAnchor="middle" dominantBaseline="central" fontSize="8.5" fontWeight="600" fill="#0C3E80">INVIAS</text></g>
          <g className="net-node" onClick={()=>ask('Gobernación Bolívar tiene vínculos con 5 empresas del mismo beneficiario real por $3.2B.')}><circle cx="120" cy="210" r="18" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="120" y="207" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#0C3E80">G.Bolívar</text><text x="120" y="219" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#1B5FA8">$3.2B</text></g>
          <g className="net-node" onClick={()=>ask('Minsalud tiene contrato con Servimedic SAS por $890M con precio 40% sobre mercado.')}><circle cx="520" cy="210" r="15" fill="#EBF2FB" stroke="#1B5FA8" strokeWidth="1" opacity=".9"/><text x="520" y="210" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#0C3E80">Minsalud</text></g>
          <g className="net-node" onClick={()=>ask('UT Obras GVA es contratista relacionado con $2.1B, posible subcontratación del hub principal.')}><circle cx="270" cy="290" r="14" fill="#FDF4E7" stroke="#C97B1E" strokeWidth="1" opacity=".9"/><text x="270" y="290" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#633806">GVA</text></g>
          <g className="net-node" onClick={()=>ask('Servimedic SAS tiene 1 año de antigüedad y precios muy superiores al mercado en equipos médicos.')}><circle cx="420" cy="290" r="12" fill="#FDF4E7" stroke="#C97B1E" strokeWidth="1" opacity=".9"/><text x="420" y="290" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="#633806">Srv.</text></g>
          <g className="net-node" onClick={()=>ask('Empresa fantasma EF-3 sin actividad verificable vinculada a la red de Gobernación Bolívar.')}><circle cx="70" cy="130" r="11" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1" strokeDasharray="3 2" opacity=".85"/><text x="70" y="127" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#8F1F18">EF-3</text><text x="70" y="138" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#C8332A">?</text></g>
          <g className="net-node" onClick={()=>ask('Subcontratista C vinculado a INVIAS sin contrato registrado en SECOP.')}><circle cx="570" cy="130" r="10" fill="#EDEAE4" stroke="#7A746C" strokeWidth="0.5" opacity=".8"/><text x="570" y="130" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#4A4540">Sub-C</text></g>
          <g className="net-node" onClick={()=>ask('Empresa fantasma EF-1 sin actividad verificable vinculada a Gobernación Bolívar.')}><circle cx="60" cy="280" r="10" fill="#FDF1F0" stroke="#C8332A" strokeWidth="1" strokeDasharray="3 2" opacity=".85"/><text x="60" y="277" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#8F1F18">EF-1</text><text x="60" y="288" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#C8332A">?</text></g>
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

function Mapa({ ai, callAI }: { ai: AI; callAI: (p:string,id:string)=>void }) {
  const [tooltip, setTooltip] = useState<{x:number;y:number;d:typeof DEPS[0]}|null>(null)
  return (
    <div>
      <div className="page-header"><div className="page-title">Mapa de riesgo</div><div className="page-sub">Colombia · Riesgo de corrupción en contratación pública por departamento</div></div>
      <div className="grid4" style={{marginBottom:14}}>
        <div className="metric-card"><div className="mc-label">Dep. críticos</div><div className="mc-val red">8</div></div>
        <div className="metric-card"><div className="mc-label">Valor total riesgo</div><div className="mc-val">$31.4B</div></div>
        <div className="metric-card"><div className="mc-label">Irregulares detectados</div><div className="mc-val red">234</div></div>
        <div className="metric-card"><div className="mc-label">Dep. sin datos</div><div className="mc-val amber">4</div></div>
      </div>
      <div className="card" style={{position:'relative'}}>
        {tooltip && (
          <div className="map-tooltip" style={{left:tooltip.x+12,top:tooltip.y-10}}>
            <div className="tt-name">{tooltip.d.n}</div>
            <div className="tt-row"><span>Riesgo:</span><span style={{fontWeight:600,color:RC[tooltip.d.risk]}}>{RL[tooltip.d.risk]}</span></div>
            <div className="tt-row"><span>Valor:</span><span>{tooltip.d.v} COP</span></div>
            <div className="tt-row"><span>Irregularidades:</span><span>{tooltip.d.i}/{tooltip.d.c}</span></div>
          </div>
        )}
        <svg width="100%" viewBox="0 0 640 520" style={{display:'block'}}>
          {DEPS.map(d => (
            <g key={d.n}>
              <circle
                cx={d.x} cy={d.y+20} r={d.r}
                fill={RC[d.risk]} stroke={RS[d.risk]} strokeWidth="1" opacity="0.88"
                style={{cursor:'pointer'}}
                onMouseEnter={e => { const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect(); setTooltip({x:e.clientX-r.left,y:e.clientY-r.top,d}) }}
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
          {[['#8F1F18','Crítico (>$5B)'],['#C8332A','Alto ($2–5B)'],['#C97B1E','Medio ($500M–2B)'],['#2D7D52','Bajo (<$500M)']].map(([c,l])=>(
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
          <span className="chip" onClick={()=>callAI('¿Qué preguntas haría en un debate de control político sobre el Contrato A de INVIAS (CD-2024-0034) frente al ministro de transporte, basándome en las irregularidades detectadas?','comp-ai-out')}>Generar preguntas para debate</span>
        </div>
      </div>
    </div>
  )
}

function Watchlist() {
  const [on, setOn] = useState<Record<string,boolean>>({ci:true,gva:true,srv:true,inv:true,edu:true,bol:true})
  const tog = (k:string) => setOn(p=>({...p,[k]:!p[k]}))
  return (
    <div>
      <div className="page-header"><div className="page-title">Watchlist</div><div className="page-sub">Entidades y contratistas bajo seguimiento personalizado</div></div>
      <div className="grid2">
        <div>
          <div className="card-title" style={{marginBottom:10}}>Contratistas vigilados</div>
          {[{k:'ci',color:'var(--red-bg)',stroke:'var(--red)',name:'Consorcio Infraestructura 2024',meta:'Riesgo crítico · 4 contratos activos',score:'88',sb:'red'},
            {k:'gva',color:'var(--amber-bg)',stroke:'var(--amber)',name:'Unión Temporal Obras GVA',meta:'Riesgo alto · 2 contratos activos',score:'74',sb:'red'},
            {k:'srv',color:'var(--amber-bg)',stroke:'var(--amber)',name:'Servimedic SAS',meta:'Riesgo medio · 1 contrato activo',score:'61',sb:'amber'}].map(r=>(
            <div className="watch-item" key={r.k}>
              <div className="watch-icon" style={{background:r.color}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={r.stroke} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div><div className="watch-name">{r.name}</div><div className="watch-meta">{r.meta}</div></div>
              <div className="watch-status"><span className={`badge ${r.sb}`}>{r.score}</span><div className={`toggle${on[r.k]?' on':''}`} onClick={()=>tog(r.k)}/></div>
            </div>
          ))}
        </div>
        <div>
          <div className="card-title" style={{marginBottom:10}}>Entidades bajo vigilancia</div>
          {[{k:'inv',color:'var(--red-bg)',stroke:'var(--red)',name:'INVIAS',meta:'22 alertas activas · $41.3B vigilados',score:'38',sb:'red'},
            {k:'edu',color:'var(--red-bg)',stroke:'var(--red)',name:'Min. Educación',meta:'18 alertas activas · $24.1B vigilados',score:'42',sb:'red'},
            {k:'bol',color:'var(--amber-bg)',stroke:'var(--amber)',name:'Gobernación Bolívar',meta:'9 alertas activas · $8.7B vigilados',score:'51',sb:'amber'}].map(r=>(
            <div className="watch-item" key={r.k}>
              <div className="watch-icon" style={{background:r.color}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={r.stroke} strokeWidth="1.8"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V12h6v9"/></svg></div>
              <div><div className="watch-name">{r.name}</div><div className="watch-meta">{r.meta}</div></div>
              <div className="watch-status"><span className={`badge ${r.sb}`}>{r.score}</span><div className={`toggle${on[r.k]?' on':''}`} onClick={()=>tog(r.k)}/></div>
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

function IA({ ai, callAI }: { ai: AI; callAI: (p:string,id:string)=>void }) {
  const [input, setInput] = useState('')
  const send = () => {
    if (!input.trim()) return
    callAI('Eres experto anticorrupción en contratación pública colombiana. ' + input.trim() + ' Basa tu respuesta en normativa colombiana (Ley 80, 1150, 1474, etc.). Máximo 220 palabras.', 'ia-ai-out')
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
      <div className="page-header"><div className="page-title">Investigar con IA</div><div className="page-sub">Chat de investigación anticorrupción · Basado en normativa colombiana</div></div>
      <div className="ai-panel">
        <div className="ai-header">
          <div className="ai-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
          <span className="ai-title">Asistente de investigación SECOP</span>
          <span style={{marginLeft:'auto',fontSize:11,color:'var(--text3)'}}>Claude · Normativa Ley 80/1150</span>
        </div>
        <div className="chip-row">
          {chips.map(([label, prompt]) => (
            <span key={label} className="chip" onClick={() => callAI(prompt, 'ia-ai-out')}>{label}</span>
          ))}
        </div>
        <AIOut id="ia-ai-out" ai={ai} defaultText="Escribe tu consulta investigativa o selecciona una consulta rápida arriba. Tengo acceso a normativa colombiana de contratación pública, jurisprudencia relevante y patrones de detección de corrupción en SECOP." />
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
    callAI(`Busca en SECOP contratos relacionados con "${q}". Identifica posibles irregularidades y recomienda qué investigar. Máximo 200 palabras.`, 'ia-ai-out')
  }

  if (!loggedIn) return <LoginScreen onLogin={() => { setLoggedIn(true); setShowOnboarding(true) }} />

  return (
    <div className="app">
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <Sidebar view={view} setView={setView} onLogout={() => setLoggedIn(false)} />
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
              <div className="notif-dot" />
            </div>
            <button className="topbar-btn primary" onClick={() => setView('ia')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Investigar ↗
            </button>
          </div>
        </div>
        <div className="content">
          {view === 'dashboard'    && <Dashboard ai={ai} callAI={callAI} setView={setView} />}
          {view === 'contratos'    && <Contratos setView={setView} />}
          {view === 'contratistas' && <Contratistas />}
          {view === 'entidades'    && <Entidades />}
          {view === 'alertas'      && <Alertas />}
          {view === 'red'          && <Red ai={ai} callAI={callAI} />}
          {view === 'mapa'         && <Mapa ai={ai} callAI={callAI} />}
          {view === 'comparador'   && <Comparador ai={ai} callAI={callAI} />}
          {view === 'watchlist'    && <Watchlist />}
          {view === 'reportes'     && <Reportes ai={ai} callAI={callAI} />}
          {view === 'ia'           && <IA ai={ai} callAI={callAI} />}
          {view === 'config'       && <Config />}
        </div>
      </div>
    </div>
  )
}
