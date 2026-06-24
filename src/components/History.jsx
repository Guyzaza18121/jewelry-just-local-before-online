import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getStockStatus } from '../utils/product'
import { isSaleToday, fmtThaiDate } from '../utils/date'

export default function History({ hist, setHist, setProds, api }) {
  const [confirmId, setConfirmId] = useState(null)
  const [loading, setLoading] = useState(false)
  const today = hist.filter(isSaleToday)
  const totalAll = hist.reduce((a,s) => a + s.total, 0)
  const profitAll = hist.reduce((a,s) => a + (s.profit||0), 0)

  const doVoid = async sid => {
    const s = hist.find(x=>x.id===sid)
    if (!s) return
    setLoading(true)
    try {
      // 1) Fetch current products and update stock first
      const currentProds = await api.getProducts()
      const bulkUpdates = s.items.map(it => {
        const p = currentProds.find(x => x.id === it.pid)
        if (!p) return null
        const ns = p.stock + it.qty
        return { id: it.pid, data: { stock: ns, sold: Math.max(0, p.sold - it.qty), status: getStockStatus({ stock: ns }) } }
      }).filter(Boolean)
      await api.bulkUpdateProducts(bulkUpdates)

      // 2) Delete sale only after stock restored (rollback-safe)
      try {
        await api.deleteSale(sid)
      } catch (delErr) {
        // Rollback: remove the stock we just added back
        const rollbackUpdates = s.items.map(it => {
          const p = currentProds.find(x => x.id === it.pid)
          if (!p) return null
          const ns = p.stock
          return { id: it.pid, data: { stock: ns, sold: p.sold, status: getStockStatus({ stock: ns }) } }
        }).filter(Boolean)
        try { await api.bulkUpdateProducts(rollbackUpdates) } catch (rbErr) { /* best effort */ }
        throw new Error('ลบบิลไม่สำเร็จ ระบบได้คืนสต็อกกลับแล้ว')
      }

      // 3) Update state functionally
      setProds(prev => prev.map(p => {
        const it = s.items.find(x => x.pid === p.id)
        if (!it) return p
        const ns = p.stock + it.qty
        return { ...p, stock: ns, sold: Math.max(0, p.sold - it.qty), status: getStockStatus({ stock: ns }) }
      }))
      setHist(prev => prev.filter(x => x.id !== sid))
      setConfirmId(null)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถยกเลิกบิลได้'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">ยอดขายวันนี้</div>
          <div className="text-xl font-bold text-green-600">฿{today.reduce((a,s)=>a+s.total,0).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{today.length} บิล</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">บิลทั้งหมด</div>
          <div className="text-xl font-bold">{hist.length}</div>
          <div className="text-xs text-gray-400 mt-1">รายการ</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">ยอดรวมทั้งหมด</div>
          <div className="text-xl font-bold">฿{totalAll.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">กำไรรวม</div>
          <div className="text-xl font-bold text-green-600">฿{profitAll.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold">ประวัติการขายทั้งหมด</div>
        {hist.length===0 ? (
          <div className="text-center py-8 text-xs text-gray-400">ยังไม่มีประวัติ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 text-[11px]">
                <tr><th className="px-3 py-2 text-left">บิล</th><th className="px-3 py-2 text-left">เวลา</th><th className="px-3 py-2 text-left">รายการ</th><th className="px-3 py-2 text-left">หมายเหตุ</th><th className="px-3 py-2 text-right">ยอด</th><th className="px-3 py-2 text-right">กำไร</th><th className="px-3 py-2 text-left">จัดการ</th></tr>
              </thead>
              <tbody>
                {hist.map(s => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-mono text-gray-500">{s.id}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtThaiDate(s.createdAt || s.date)}</td>
                    <td className="px-3 py-2 max-w-[260px]">
                      {s.items.map(it => `${it.name}${it.size?' ['+it.size+']':''} ×${it.qty}`).join(', ')}
                    </td>
                    <td className="px-3 py-2 text-gray-400">{s.note||'—'}</td>
                    <td className="px-3 py-2 text-right font-semibold">฿{s.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-600">฿{(s.profit||0).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {confirmId===s.id ? (
                        <div className="flex gap-1">
                          <button onClick={()=>setConfirmId(null)} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-50">ยกเลิก</button>
                          <button onClick={()=>doVoid(s.id)} className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100">ยืนยันยกเลิก</button>
                        </div>
                      ) : (
                        <button disabled={loading} onClick={()=>setConfirmId(s.id)} className="p-1 border rounded text-red-500 hover:bg-red-50 disabled:opacity-50"><Trash2 size={12}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
