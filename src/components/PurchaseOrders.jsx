import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Package, Search, X } from 'lucide-react'

function POModal({ prods, onSave, onClose }) {
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')

  const addItem = (p) => {
    if (items.find(it => it.pid === p.id)) return
    setItems([...items, { pid: p.id, name: p.name, sku: p.sku, qty: 1, cost: p.cost || 0, receivedQty: 0 }])
    setSearch('')
  }
  const updateItem = (pid, key, val) => {
    setItems(items.map(it => it.pid === pid ? { ...it, [key]: Number(val) || 0 } : it))
  }
  const removeItem = (pid) => setItems(items.filter(it => it.pid !== pid))

  const total = items.reduce((a, it) => a + it.qty * it.cost, 0)
  const filtered = useMemo(() => {
    if (!search) return []
    return prods.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  }, [prods, search])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">สร้างใบสั่งซื้อใหม่</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">ซัพพลายเออร์</label><input className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={supplier} onChange={e=>setSupplier(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500">หมายเหตุ</label><input className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={note} onChange={e=>setNote(e.target.value)} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-500">เพิ่มสินค้า</label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full border rounded-md pl-7 pr-2 py-1.5 text-xs" placeholder="ค้นหาสินค้า..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            {filtered.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-md max-h-32 overflow-y-auto">
                {filtered.map(p => (
                  <button key={p.id} onClick={()=>addItem(p)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between">
                    <span>{p.name} ({p.sku})</span>
                    <span className="text-gray-400">คงเหลือ {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500">รายการ ({items.length})</div>
              {items.map(it => (
                <div key={it.pid} className="flex items-center gap-2 text-xs bg-gray-50 rounded-md p-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-[10px] text-gray-400">{it.sku}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-gray-400">จำนวน</label>
                    <input type="number" min="1" className="w-12 border rounded px-1 py-0.5 text-xs text-center" value={it.qty} onChange={e=>updateItem(it.pid, 'qty', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-gray-400">ต้นทุน/ชิ้น</label>
                    <input type="number" min="0" className="w-16 border rounded px-1 py-0.5 text-xs text-center" value={it.cost} onChange={e=>updateItem(it.pid, 'cost', e.target.value)} />
                  </div>
                  <button onClick={()=>removeItem(it.pid)} className="p-1 text-gray-400 hover:text-red-500"><X size={12}/></button>
                </div>
              ))}
              <div className="text-right text-xs font-semibold">รวมต้นทุน: ฿{total.toLocaleString()}</div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs border rounded-md hover:bg-gray-50">ยกเลิก</button>
          <button disabled={items.length===0 || !supplier} onClick={()=>onSave({ supplier, items, note })} className="px-4 py-2 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50">สร้างใบสั่งซื้อ</button>
        </div>
      </div>
    </div>
  )
}

function ReceiveModal({ po, onSave, onClose }) {
  const [items, setItems] = useState(po.items.map(it => ({ ...it, receiveNow: 0 })))

  const updateReceive = (pid, val) => {
    setItems(items.map(it => it.pid === pid ? { ...it, receiveNow: Math.max(0, Math.min((it.qty || 0) - (it.receivedQty || 0), Number(val) || 0)) } : it))
  }

  const canReceive = items.some(it => it.receiveNow > 0)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e=>e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">รับสินค้าเข้าคลัง — {po.id}</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map(it => (
            <div key={it.pid} className="flex items-center gap-2 text-xs bg-gray-50 rounded-md p-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{it.name}</div>
                <div className="text-[10px] text-gray-400">สั่ง {it.qty} · รับแล้ว {it.receivedQty || 0}</div>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-gray-400">รับเพิ่ม</label>
                <input type="number" min="0" max={(it.qty || 0) - (it.receivedQty || 0)} className="w-12 border rounded px-1 py-0.5 text-xs text-center" value={it.receiveNow} onChange={e=>updateReceive(it.pid, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs border rounded-md hover:bg-gray-50">ยกเลิก</button>
          <button disabled={!canReceive} onClick={()=>onSave(items.filter(it => it.receiveNow > 0).map(it => ({ pid: it.pid, receivedQty: it.receiveNow })))} className="px-4 py-2 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50">ยืนยันรับสินค้า</button>
        </div>
      </div>
    </div>
  )
}

export default function PurchaseOrders({ prods, setProds, api }) {
  const [pos, setPos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [receivePo, setReceivePo] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getPurchaseOrders().then(data => { setPos(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = {
      pending: { text: 'รอรับ', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
      partial: { text: 'รับบางส่วน', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      received: { text: 'รับครบ', cls: 'bg-green-50 text-green-600 border-green-100' },
      cancelled: { text: 'ยกเลิก', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
    }
    const s = map[status] || map.pending
    return <span className={`px-2 py-0.5 rounded text-[10px] border ${s.cls}`}>{s.text}</span>
  }

  const doCreate = async (data) => {
    try {
      const created = await api.createPurchaseOrder({ ...data, status: 'pending', date: new Date().toISOString() })
      setPos(prev => [created, ...prev])
      setModal(null)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถสร้างใบสั่งซื้อได้'))
    }
  }

  const doReceive = async (items) => {
    try {
      const { po: updated, products } = await api.receivePurchaseOrder(receivePo.id, items)
      setPos(prev => prev.map(p => p.id === updated.id ? updated : p))
      setProds(products)
      setReceivePo(null)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถรับสินค้าได้'))
    }
  }

  const doDelete = async (id) => {
    if (!confirm('ลบใบสั่งซื้อนี้?')) return
    try {
      await api.deletePurchaseOrder(id)
      setPos(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถลบได้'))
    }
  }

  const filtered = pos.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.id.toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q) || p.items.some(it => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
  })

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold">ใบสั่งซื้อ <span className="text-gray-400 font-normal">({pos.length} รายการ)</span></span>
          <button onClick={()=>setModal('create')} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600"><Plus size={14}/> สร้างใบสั่งซื้อ</button>
        </div>
        <div className="flex gap-2 items-center px-4 py-2 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full border rounded-md pl-7 pr-2 py-1.5 text-xs" placeholder="ค้นหาใบสั่งซื้อ..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} รายการ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 text-[11px]">
              <tr><th className="px-3 py-2 text-left">เลขที่</th><th className="px-3 py-2 text-left">ซัพพลายเออร์</th><th className="px-3 py-2 text-left">รายการ</th><th className="px-3 py-2 text-left">สถานะ</th><th className="px-3 py-2 text-right">ต้นทุนรวม</th><th className="px-3 py-2 text-left">วันที่</th><th className="px-3 py-2 text-left">จัดการ</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>}
              {!loading && filtered.length===0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">ไม่มีข้อมูล</td></tr>}
              {filtered.map(po => (
                <tr key={po.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-mono text-gray-500">{po.id}</td>
                  <td className="px-3 py-2">{po.supplier || '—'}</td>
                  <td className="px-3 py-2 max-w-[260px]">
                    {po.items.map(it => `${it.name} ×${it.qty}`).join(', ')}
                  </td>
                  <td className="px-3 py-2">{statusBadge(po.status)}</td>
                  <td className="px-3 py-2 text-right font-medium">฿{(po.totalCost||0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{new Date(po.date).toLocaleDateString('th-TH')}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {(po.status === 'pending' || po.status === 'partial') && (
                        <button onClick={()=>setReceivePo(po)} className="p-1 border rounded hover:bg-green-50 text-green-600" title="รับสินค้า"><CheckCircle size={12}/></button>
                      )}
                      <button onClick={()=>doDelete(po.id)} className="p-1 border rounded hover:bg-red-50 text-red-500"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal==='create' && <POModal prods={prods} onSave={doCreate} onClose={()=>setModal(null)} />}
      {receivePo && <ReceiveModal po={receivePo} onSave={doReceive} onClose={()=>setReceivePo(null)} />}
    </div>
  )
}
