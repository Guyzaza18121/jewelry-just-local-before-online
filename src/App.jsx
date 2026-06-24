import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import Sell from './components/Sell'
import History from './components/History'
import Reports from './components/Reports'
import Settings from './components/Settings'
import { api } from './api.js'
import { LayoutDashboard, Package, ShoppingCart, ClipboardList, BarChart3, AlertTriangle, Bell, Settings as SettingsIcon } from 'lucide-react'
import { isSaleToday } from './utils/date'

const CATS = ['เพชรร่วง','แหวน','จี้','ต่างหู','กำไล']
const PSIZES = ['47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62']

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [prods, setProds] = useState([])
  const [hist, setHist] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)

  const fetchAll = async () => {
    try {
      setLoading(true)
      setErr(null)
      const [products, sales] = await Promise.all([api.getProducts(), api.getSales()])
      setProds(products)
      setHist(sales)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const nav = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'products', label: 'สินค้า', icon: Package },
    { id: 'sell', label: 'ขาย', icon: ShoppingCart },
    { id: 'history', label: 'ประวัติ', icon: ClipboardList },
    { id: 'reports', label: 'รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่า', icon: SettingsIcon },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="text-sm text-gray-500">กำลังโหลด...</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="text-sm text-red-500">เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ: {err}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">JA</div>
          <div>
            <div className="text-sm font-semibold">Jewelry Admin</div>
            <div className="text-[10px] text-gray-500">Admin Panel</div>
          </div>
        </div>
        <nav className="p-2 flex-1">
          {nav.map(n => {
            const Icon = n.icon
            return (
              <button key={n.id} onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${page===n.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                <Icon size={16} /> {n.label}
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-13 bg-white border-b border-gray-200 flex items-center px-5 relative">
          <h1 className="text-sm font-semibold flex-1">{nav.find(n=>n.id===page)?.label}</h1>
          <div className="relative mr-2">
            <button onClick={()=>setNotifOpen(!notifOpen)} className="relative p-1.5 rounded-md hover:bg-gray-50 border border-gray-200">
              <Bell size={14} className="text-gray-500" />
              {(() => {
                const low = prods.filter(p => p.stock > 0 && p.stock < 2).length
                const out = prods.filter(p => p.stock === 0).length
                const count = low + out
                if (count > 0) return <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{count}</span>
              })()}
            </button>
            {notifOpen && (
              <div className="fixed inset-0 z-40" onClick={()=>setNotifOpen(false)} />)}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold">แจ้งเตือน</div>
                <div className="max-h-64 overflow-y-auto">
                  {(() => {
                    const low = prods.filter(p => p.stock > 0 && p.stock < 2)
                    const out = prods.filter(p => p.stock === 0)
                    const today = hist.filter(isSaleToday)
                    const items = []
                    if (today.length > 0) {
                      items.push({ type: 'info', text: `ขายวันนี้ ${today.length} บิล ฿${today.reduce((a,s)=>a+s.total,0).toLocaleString()}` })
                    }
                    low.forEach(p => items.push({ type: 'warning', text: `สต็อกใกล้หมด: ${p.name} (${p.stock} ชิ้น)` }))
                    out.forEach(p => items.push({ type: 'danger', text: `สต็อกหมด: ${p.name}` }))
                    if (items.length === 0) return <div className="px-3 py-4 text-xs text-gray-400 text-center">ไม่มีแจ้งเตือน</div>
                    return items.map((it, i) => (
                      <div key={i} className="px-3 py-2 border-b border-gray-50 last:border-0 flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${it.type==='danger'?'bg-red-500':it.type==='warning'?'bg-amber-500':'bg-blue-500'}`} />
                        <div className="text-[11px] text-gray-600">{it.text}</div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
          <button className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50">ออกจากระบบ</button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {page==='dashboard' && <Dashboard prods={prods} hist={hist} />}
          {page==='products' && <Products prods={prods} setProds={setProds} cats={CATS} psizes={PSIZES} api={api} />}
          {page==='sell' && <Sell prods={prods} setProds={setProds} hist={hist} setHist={setHist} psizes={PSIZES} api={api} />}
          {page==='history' && <History hist={hist} setHist={setHist} setProds={setProds} api={api} />}
          {page==='reports' && <Reports prods={prods} hist={hist} />}
          {page==='settings' && <Settings api={api} setProds={setProds} setHist={setHist} />}
        </div>
      </main>
    </div>
  )
}
