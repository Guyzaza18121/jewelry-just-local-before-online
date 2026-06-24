import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, Search, X } from 'lucide-react'
import { getStockStatus, isUploadedImage } from '../utils/product'

export default function Sell({ prods, setProds, hist, setHist, psizes, api }) {
  const [srch, setSrch] = useState('')
  const [cart, setCart] = useState([])
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewProd, setViewProd] = useState(null)
  const prodsRef = useRef(prods)
  useEffect(() => { prodsRef.current = prods }, [prods])

  const filtered = prods.filter(p => {
    const st = getStockStatus(p)
    if (!srch) return st==='active' || st==='low'
    return (p.name.toLowerCase().includes(srch.toLowerCase()) || p.sku.toLowerCase().includes(srch.toLowerCase())) && (st==='active' || st==='low')
  })

  const addCart = (p, size) => {
    const ex = cart.find(x => x.prod.id===p.id && x.size===size)
    if (ex) {
      if (ex.qty >= p.stock) return alert('จำนวนเกินสต็อกที่มี')
      setCart(cart.map(x => x===ex ? { ...x, qty: x.qty+1 } : x))
    } else {
      if (p.stock < 1) return alert('สินค้าหมด')
      setCart([...cart, { prod: p, size: size||'', qty: 1 }])
    }
  }

  const adj = (i, d) => {
    const arr = [...cart]
    const item = arr[i]
    const current = prodsRef.current.find(p => p.id === item.prod.id)
    const max = current ? current.stock : 0
    const newQty = item.qty + d
    if (d > 0 && newQty > max) return alert('จำนวนเกินสต็อกที่มี')
    arr[i] = { ...arr[i], qty: Math.max(1, newQty) }
    setCart(arr)
  }
  const delItem = i => { const arr=[...cart]; arr.splice(i,1); setCart(arr) }
  const clearCart = () => { setCart([]); setNote(''); setConfirm(false) }

  const total = cart.reduce((a,x) => a + x.prod.price*x.qty, 0)
  const totalCost = cart.reduce((a,x) => a + (x.prod.cost||0)*x.qty, 0)
  const profit = total - totalCost

  const doSell = async () => {
    setLoading(true)
    try {
      // Create sale record first (safer: we can rollback stock if this fails, but not vice versa)
      const rec = {
        date: new Date().toISOString(),
        items: cart.map(x => ({ pid:x.prod.id, name:x.prod.name, qty:x.qty, price:x.prod.price, cost:x.prod.cost||0, size:x.size })),
        total, cost: totalCost, profit, note
      }
      const created = await api.createSale(rec)

      const updates = cart.map(item => {
        const p = prods.find(x => x.id === item.prod.id)
        const ns = Math.max(0, p.stock - item.qty)
        return { id: p.id, data: { stock: ns, sold: p.sold + item.qty, status: getStockStatus({ stock: ns }) } }
      })

      try {
        await api.bulkUpdateProducts(updates)
      } catch (stockErr) {
        // Rollback: delete the sale we just created since stock update failed
        try { await api.deleteSale(created.id) } catch (rollbackErr) { /* best effort */ }
        throw new Error('อัปเดตสต็อกไม่สำเร็จ บิลถูกยกเลิกอัตโนมัติ')
      }

      setProds(prev => prev.map(p => {
        const item = cart.find(c => c.prod.id === p.id)
        if (!item) return p
        const ns = Math.max(0, p.stock - item.qty)
        return { ...p, stock: ns, sold: p.sold + item.qty, status: getStockStatus({ stock: ns }) }
      }))
      setHist(prev => [created, ...prev])
      clearCart()
      alert('ขายสำเร็จ! ฿'+total.toLocaleString())
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถบันทึกการขายได้'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full border rounded-md pl-7 pr-2 py-1.5 text-xs" placeholder="ค้นหาสินค้า..." value={srch} onChange={e=>setSrch(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
              <div
                className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-80"
                onClick={() => setViewProd(p)}
              >
                {(() => {
                  const imgs = [p.img, p.img2].filter(img => img && isUploadedImage(img))
                  if (imgs.length === 2) {
                    return (
                      <div className="grid grid-cols-2 gap-0.5 w-full h-full p-1">
                        <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                        <img src={imgs[1]} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                    )
                  }
                  if (imgs.length === 1) {
                    return <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover" />
                  }
                  return <span className="text-4xl">{p.img||'💎'}</span>
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {p.name}
                  {p.sizes?.length>0 && <span className="text-gray-400 font-normal"> (ไซส์: {p.sizes.join(', ')})</span>}
                </div>
                <div className="text-xs text-gray-400">{p.sku} · ฿{p.price.toLocaleString()}</div>
                <div className="text-xs text-gray-400">คงเหลือ {p.stock} ชิ้น</div>
                <button onClick={()=>addCart(p,'')} className="mt-2 px-3 py-1 rounded text-xs bg-indigo-500 text-white hover:bg-indigo-600">+ เพิ่ม</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="col-span-2 text-center text-xs text-gray-400 py-8">ไม่พบสินค้า</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit sticky top-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><ShoppingCart size={16}/> ตะกร้า ({cart.length})</div>
        {cart.length===0 && <div className="text-xs text-gray-400 text-center py-6">ยังไม่มีสินค้า</div>}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cart.map((item,i) => (
            <div key={i} className="flex items-center gap-2 text-xs border-b border-gray-50 pb-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {item.prod.name}
                  {item.size && <span className="text-gray-400 font-normal"> (ไซส์: {item.size})</span>}
                </div>
                <div className="text-[10px] text-gray-400">฿{item.prod.price.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={()=>adj(i,-1)} className="p-0.5 border rounded hover:bg-gray-50"><Minus size={10}/></button>
                <span className="w-4 text-center text-[11px]">{item.qty}</span>
                <button onClick={()=>adj(i,1)} className="p-0.5 border rounded hover:bg-gray-50"><Plus size={10}/></button>
              </div>
              <button onClick={()=>delItem(i)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
        {cart.length>0 && (
          <>
            <div className="mt-3 pt-2 border-t border-gray-100 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">ยอดรวม</span><span className="font-semibold">฿{total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ต้นทุน</span><span className="text-gray-600">฿{totalCost.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">กำไร</span><span className="font-semibold text-green-600">฿{profit.toLocaleString()}</span></div>
            </div>
            <input className="w-full border rounded-md px-2 py-1 text-xs mt-2" placeholder="หมายเหตุ..." value={note} onChange={e=>setNote(e.target.value)} />
            {!confirm ? (
              <button onClick={()=>setConfirm(true)} className="w-full mt-2 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 font-medium">ยืนยันการขาย</button>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-[11px] text-gray-500">ยืนยันขาย ฿{total.toLocaleString()}?</p>
                <div className="flex gap-2">
                  <button onClick={()=>setConfirm(false)} className="flex-1 py-2 text-xs border rounded-md hover:bg-gray-50">ยกเลิก</button>
                  <button disabled={loading} onClick={doSell} className="flex-1 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'กำลังบันทึก...' : '✓ ยืนยัน'}
              </button>
                </div>
              </div>
            )}
            <button onClick={clearCart} className="w-full mt-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-600">ล้างตะกร้า</button>
          </>
        )}
      </div>

      {viewProd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setViewProd(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{viewProd.name}</h3>
              <button onClick={()=>setViewProd(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button>
            </div>
            {(() => {
              const images = [viewProd.img, viewProd.img2].filter(img => img && isUploadedImage(img))
              if (images.length > 0) {
                return (
                  <div className={`grid gap-2 mb-4 ${images.length===2?'grid-cols-2':'grid-cols-1'}`}>
                    {images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img src={img} alt={viewProd.name + ' ' + (i+1)} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )
              }
              return (
                <div className="aspect-video rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center mb-4">
                  <span className="text-4xl">{viewProd.img||'💎'}</span>
                </div>
              )
            })()}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">รหัสสินค้า</div><div className="font-mono font-medium">{viewProd.sku}</div></div>
              <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">หมวดหมู่</div><div className="font-medium">{viewProd.cat}</div></div>
              <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ราคาขาย</div><div className="font-medium text-indigo-600">฿{viewProd.price.toLocaleString()}</div></div>
              <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">สต็อก</div><div className="font-medium">{viewProd.stock} ชิ้น</div></div>
              <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ไซส์</div><div className="font-medium">{(viewProd.sizes||[]).join(', ')||'—'}</div></div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={()=>setViewProd(null)} className="px-4 py-2 text-xs border rounded-md hover:bg-gray-50">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
