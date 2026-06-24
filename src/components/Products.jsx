import { useState, useEffect, useMemo } from 'react'
import { Pencil, Trash2, Plus, Search, SlidersHorizontal, X, FileDown, Eye, Package } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isUploadedImage, getStockStatus } from '../utils/product'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

function CostCalc({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const cb = value || {}
  const n = x => Number(x)||0

  const diamonds = useMemo(() => {
    if (Array.isArray(cb.diamonds) && cb.diamonds.length > 0) return cb.diamonds
    if (cb.diamondQty) {
      return [{
        qty: cb.diamondQty,
        caratPerPiece: cb.caratPerPiece,
        price: cb.diamondPrice,
        size: cb.diamondSize
      }]
    }
    return []
  }, [cb.diamonds, cb.diamondQty, cb.caratPerPiece, cb.diamondPrice, cb.diamondSize])

  const setBody = (k, v) => {
    if (v === '' || v === '-') { onChange({ ...cb, [k]: v }); return }
    const s = String(v)
    if (s.includes('.')) { onChange({ ...cb, [k]: s }) }
    else { onChange({ ...cb, [k]: Number(v)||0 }) }
  }

  const updateDiamond = (idx, field, val) => {
    const arr = diamonds.map((d, i) => i === idx ? { ...d, [field]: val } : d)
    onChange({ ...cb, diamonds: arr })
  }
  const addDiamond = () => {
    onChange({ ...cb, diamonds: [...diamonds, { qty: '', caratPerPiece: '', price: '', size: '' }] })
  }
  const removeDiamond = (idx) => {
    const arr = diamonds.filter((_, i) => i !== idx)
    onChange({ ...cb, diamonds: arr })
  }

  const totalDiamondQty = diamonds.reduce((a, d) => a + n(d.qty), 0)
  const totalCarat = diamonds.reduce((a, d) => a + n(d.qty) * n(d.caratPerPiece), 0).toFixed(3)
  const diamondCost = diamonds.reduce((a, d) => a + n(d.qty) * n(d.price), 0)
  const total = n(cb.body) + diamondCost + totalDiamondQty * n(cb.setting) + n(cb.polish) + n(cb.shipping) + n(cb.cert)

  return (
    <div className="border border-gray-200 rounded-lg p-3 mt-2">
      <button type="button" onClick={()=>setOpen(!open)} className="text-xs font-medium text-indigo-600 hover:underline">
        {open ? '▼' : '▶'} คำนวณต้นทุนแหวน
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[10px] text-gray-500">ตัวเรือน (฿)</label><input type="number" className="w-full border rounded px-2 py-1 text-xs" value={cb.body||''} onChange={e=>setBody('body',e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">ค่าชุบ (฿)</label><input type="number" className="w-full border rounded px-2 py-1 text-xs" value={cb.polish||''} onChange={e=>setBody('polish',e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">ค่าส่ง+กล่อง (฿)</label><input type="number" className="w-full border rounded px-2 py-1 text-xs" value={cb.shipping||''} onChange={e=>setBody('shipping',e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">ค่าใบเซอร์ (฿)</label><input type="number" className="w-full border rounded px-2 py-1 text-xs" value={cb.cert||''} onChange={e=>setBody('cert',e.target.value)} /></div>
            <div><label className="text-[10px] text-gray-500">ค่าฝัง/เม็ด (฿)</label><input type="number" className="w-full border rounded px-2 py-1 text-xs" value={cb.setting||''} onChange={e=>setBody('setting',e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-gray-500 font-medium">รายการเพชร</label>
              <span className="text-[10px] text-gray-400">{diamonds.length} ชนิด · {totalDiamondQty} เม็ด</span>
            </div>
            {diamonds.length === 0 && (
              <div className="text-[11px] text-gray-400 bg-gray-50 rounded p-2 text-center">ยังไม่มีรายการเพชร</div>
            )}
            {diamonds.length > 0 && (
              <div className="space-y-1.5">
                {diamonds.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                    <div><input type="number" min="0" placeholder="จำนวน" className="w-full border rounded px-2 py-1 text-xs" value={d.qty} onChange={e=>updateDiamond(i,'qty',e.target.value)} /></div>
                    <div><input type="number" step="0.001" placeholder="กะรัต/เม็ด" className="w-full border rounded px-2 py-1 text-xs" value={d.caratPerPiece} onChange={e=>updateDiamond(i,'caratPerPiece',e.target.value)} /></div>
                    <div><input type="number" placeholder="ราคา/เม็ด" className="w-full border rounded px-2 py-1 text-xs" value={d.price} onChange={e=>updateDiamond(i,'price',e.target.value)} /></div>
                    <div><input type="number" step="any" placeholder="ขนาด(mm)" className="w-full border rounded px-2 py-1 text-xs" value={d.size} onChange={e=>updateDiamond(i,'size',e.target.value)} /></div>
                    <button type="button" onClick={()=>removeDiamond(i)} className="p-1 text-gray-400 hover:text-red-500" title="ลบ"><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addDiamond} className="mt-1.5 w-full py-1 text-[11px] border border-dashed border-gray-300 rounded hover:bg-gray-50 text-gray-600">
              + เพิ่มเพชร
            </button>
          </div>

          <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 flex items-center justify-between">
            <span>รวมต้นทุน: <span className="font-bold text-indigo-600">฿{total.toLocaleString()}</span></span>
            <span>น้ำหนักเพชรรวม: {totalCarat} กะรัต</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductModal({ p, draft, cats, psizes, onSave, onClose, isAdd, loading }) {
  const [form, setForm] = useState(draft ? { ...draft, cat: draft.cat || cats[0] } : p ? { ...p, addQty: '', removeQty: '' } : { name:'', sku:'', cat:cats[0], price:'', cost:'', addQty:1, sizes:[], supplier:'', supSku:'', costBreak:null })
  const [sz, setSz] = useState('')
  const selSizes = form.sizes || []

  useEffect(() => {
    const cb = form.costBreak
    if (cb) {
      const n = x => Number(x)||0
      let diamonds = []
      const hasValid = Array.isArray(cb.diamonds) && cb.diamonds.length > 0 && cb.diamonds.some(d => n(d.qty) > 0 || n(d.price) > 0)
      if (hasValid) {
        diamonds = cb.diamonds
      } else if (cb.diamondQty) {
        diamonds = [{ qty: cb.diamondQty, price: cb.diamondPrice }]
      }
      const dQty = diamonds.reduce((a, d) => a + n(d.qty), 0)
      const dCost = diamonds.reduce((a, d) => a + n(d.qty) * n(d.price), 0)
      const total = n(cb.body) + dCost + dQty * n(cb.setting) + n(cb.polish) + n(cb.shipping) + n(cb.cert)
      if (total > 0 && total !== Number(form.cost||0)) {
        setForm(prev => ({ ...prev, cost: total }))
      }
    }
  }, [form.costBreak])

  useEffect(() => {
    if (!isAdd) return
    try {
      const { img, img2, ...draftData } = form
      localStorage.setItem('product_draft', JSON.stringify(draftData))
    } catch {}
  }, [form])

  const handleImageChange = (e, key) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 1000
        let { width, height } = img
        if (width <= MAX_DIM && height <= MAX_DIM && file.size <= MAX_IMAGE_SIZE) {
          setForm(prev => ({ ...prev, [key]: ev.target.result }))
          return
        }
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setForm(prev => ({ ...prev, [key]: dataUrl }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const [customSuppliers, setCustomSuppliers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('custom_suppliers')) || [] } catch { return [] }
  })
  const defaultSuppliers = ['Kanya', 'Ploy Ganet', 'หล่อเอง']
  const allSuppliers = useMemo(() => {
    const list = [...defaultSuppliers]
    customSuppliers.forEach(s => { if (!list.includes(s)) list.push(s) })
    return list
  }, [customSuppliers])
  const addCustomSupplier = (val) => {
    const v = val.trim()
    if (!v || defaultSuppliers.includes(v) || customSuppliers.includes(v)) return
    const next = [...customSuppliers, v]
    setCustomSuppliers(next)
    try { localStorage.setItem('custom_suppliers', JSON.stringify(next)) } catch {}
  }

  const toggleSize = s => {
    const arr = selSizes.includes(s) ? selSizes.filter(x=>x!==s) : [...selSizes, s]
    setForm({ ...form, sizes: arr })
  }
  const addCustomSize = () => {
    const v = sz.trim()
    if (!v) return
    if (selSizes.includes(v)) return
    setForm({ ...form, sizes: [...selSizes, v] })
    setSz('')
  }
  const removeSize = v => setForm({ ...form, sizes: selSizes.filter(x=>x!==v) })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">{isAdd ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">ชื่อสินค้า</label><input className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="text-xs text-gray-500">รหัสสินค้า</label><input className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} /></div>
          </div>
          <div><label className="text-xs text-gray-500">หมวดหมู่</label>
            <select className="w-full border rounded-md px-2 py-1.5 text-xs mt-1 bg-white" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">ราคาขาย (฿) *</label><input type="number" min="0" className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
            <div><label className="text-xs text-gray-500">ราคาทุน (฿)</label><input type="number" min="0" className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div>
          </div>
          {isAdd ? (
            <div>
              <label className="text-xs text-gray-500">จำนวนที่จะเอาเข้าคลังสินค้า *</label>
              <input type="number" min="1" className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" placeholder="1" value={form.addQty} onChange={e=>setForm({...form,addQty:Math.max(1,Number(e.target.value)||1)})} />
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-500">ปรับจำนวนสต็อก</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <label className="text-[10px] text-green-600">เพิ่ม (ชิ้น)</label>
                  <input type="number" min="0" className="w-full border border-green-200 rounded-md px-2 py-1.5 text-xs mt-0.5" placeholder="0" value={form.addQty} onChange={e=>setForm({...form,addQty:e.target.value===''?'':Math.max(0,Number(e.target.value)||0)})} />
                </div>
                <div>
                  <label className="text-[10px] text-red-500">ลด (ชิ้น)</label>
                  <input type="number" min="0" className="w-full border border-red-200 rounded-md px-2 py-1.5 text-xs mt-0.5" placeholder="0" value={form.removeQty} onChange={e=>setForm({...form,removeQty:e.target.value===''?'':Math.max(0,Number(e.target.value)||0)})} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">สต็อกปัจจุบัน {Number(form.stock)||0} ชิ้น → หลังปรับ <span className={`font-medium ${Math.max(0,(Number(form.stock)||0)+(Number(form.addQty)||0)-(Number(form.removeQty)||0)) < (Number(form.stock)||0) ? 'text-red-500' : 'text-green-600'}`}>{Math.max(0,(Number(form.stock)||0)+(Number(form.addQty)||0)-(Number(form.removeQty)||0))} ชิ้น</span></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">ซัพพลายเออร์</label>
              <input
                list="supplier-list"
                className="w-full border rounded-md px-2 py-1.5 text-xs mt-1"
                value={form.supplier}
                onChange={e=>setForm({...form,supplier:e.target.value})}
                onBlur={e=>addCustomSupplier(e.target.value)}
              />
              <datalist id="supplier-list">
                {allSuppliers.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div><label className="text-xs text-gray-500">รหัสสินค้าซัพพลายเออร์</label><input className="w-full border rounded-md px-2 py-1.5 text-xs mt-1" value={form.supSku} onChange={e=>setForm({...form,supSku:e.target.value})} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-500">รูปสินค้า</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {isUploadedImage(form.img) ? <img src={form.img} alt="รูปที่ 1" className="w-full h-full object-cover" /> : <span className="text-xl">{form.img || '💎'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <input type="file" accept="image/*" className="w-full border rounded-md px-2 py-1 text-xs" onChange={e=>handleImageChange(e,'img')} />
                  {form.img && isUploadedImage(form.img) && <button type="button" onClick={()=>setForm({...form,img:''})} className="text-[11px] text-red-500 hover:underline mt-0.5">ลบ</button>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {isUploadedImage(form.img2) ? <img src={form.img2} alt="รูปที่ 2" className="w-full h-full object-cover" /> : <span className="text-xl">{form.img2 || '�'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <input type="file" accept="image/*" className="w-full border rounded-md px-2 py-1 text-xs" onChange={e=>handleImageChange(e,'img2')} />
                  {form.img2 && isUploadedImage(form.img2) && <button type="button" onClick={()=>setForm({...form,img2:''})} className="text-[11px] text-red-500 hover:underline mt-0.5">ลบ</button>}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">ไซส์</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {psizes.map(s => (
                <button key={s} type="button" onClick={()=>toggleSize(s)}
                  className={`px-2 py-0.5 rounded text-[11px] border ${selSizes.includes(s) ? 'bg-indigo-50 text-indigo-600 border-indigo-200 font-medium' : 'bg-white text-gray-600 border-gray-200'}`}>{s}</button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input className="flex-1 border rounded-md px-2 py-1 text-xs" placeholder="เพิ่มไซส์เอง..." value={sz} onChange={e=>setSz(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomSize()} />
              <button type="button" onClick={addCustomSize} className="px-3 py-1 text-xs border rounded-md hover:bg-gray-50">+ เพิ่ม</button>
            </div>
            {selSizes.filter(s=>!psizes.includes(s)).length>0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selSizes.filter(s=>!psizes.includes(s)).map(s=>(
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700">
                    {s} <button onClick={()=>removeSize(s)} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <CostCalc value={form.costBreak} onChange={v=>setForm({...form,costBreak:v})} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs border rounded-md hover:bg-gray-50">ยกเลิก</button>
          <button disabled={loading} onClick={()=>onSave(form)} className="px-4 py-2 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50">{loading ? 'กำลังบันทึก...' : (isAdd ? 'เพิ่มสินค้า' : 'บันทึก')}</button>
        </div>
      </div>
    </div>
  )
}

function ProductViewModal({ p, onClose }) {
  const [zoomImg, setZoomImg] = useState(null)
  if (!p) return null
  const images = [p.img, p.img2].filter(img => img && img !== '💎' && isUploadedImage(img))
  const st = getStockStatus(p)
  const stText = st==='inactive'?'หมด':st==='low'?'ใกล้หมด':'มี'
  return (
    <>
    {zoomImg && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setZoomImg(null)}>
        <img src={zoomImg} alt="zoom" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        <button onClick={() => setZoomImg(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-1 hover:bg-black/70"><X size={20}/></button>
      </div>
    )}
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{p.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button>
        </div>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center cursor-zoom-in" onClick={e=>{e.stopPropagation();setZoomImg(img)}}>
                <img src={img} alt={p.name + ' ' + (i+1)} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center mb-4">
            <span className="text-4xl">{p.img||'💎'}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">รหัสสินค้า</div><div className="font-mono font-medium">{p.sku}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">หมวดหมู่</div><div className="font-medium">{p.cat}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">สถานะ</div><div className={`font-medium ${st==='inactive'?'text-red-600':st==='low'?'text-amber-600':'text-green-600'}`}>{stText}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ราคาทุน</div><div className="font-medium">฿{(p.cost||0).toLocaleString()}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ราคาขาย</div><div className="font-medium text-indigo-600">฿{p.price.toLocaleString()}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">สต็อก</div><div className="font-medium">{p.stock} ชิ้น</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ขายแล้ว</div><div className="font-medium">{p.sold||0} ชิ้น</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">ซัพพลายเออร์</div><div className="font-medium">{p.supplier||'—'}</div></div>
          <div className="bg-gray-50 rounded-md p-2"><div className="text-[10px] text-gray-400">รหัสซัพพลายเออร์</div><div className="font-medium">{p.supSku||'—'}</div></div>
          <div className="bg-gray-50 rounded-md p-2 col-span-2"><div className="text-[10px] text-gray-400">ไซส์</div><div className="font-medium">{(p.sizes||[]).join(', ')||'—'}</div></div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs border rounded-md hover:bg-gray-50">ปิด</button>
        </div>
      </div>
    </div>
    </>
  )
}

export default function Products({ prods, setProds, cats, psizes, api }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [stFilter, setStFilter] = useState('')
  const [advOpen, setAdvOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minStock, setMinStock] = useState('')
  const [maxStock, setMaxStock] = useState('')
  const [supFilter, setSupFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hideInactive, setHideInactive] = useState(true)

  const [draft, setDraft] = useState(null)
  useEffect(() => {
    if (modal) return
    try {
      const saved = localStorage.getItem('product_draft')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name || parsed.sku || parsed.price || parsed.cost) setDraft(parsed)
        else setDraft(null)
      } else {
        setDraft(null)
      }
    } catch {}
  }, [modal])
  const clearDraft = () => { localStorage.removeItem('product_draft'); setDraft(null) }

  const suppliers = useMemo(() => [...new Set(prods.map(p => p.supplier).filter(Boolean))], [prods])

  const filtered = useMemo(() => prods.filter(p => {
    if (hideInactive && getStockStatus(p) === 'inactive') return false
    if (search) {
      const q = search.toLowerCase()
      const match = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      if (!match) return false
    }
    if (catFilter && p.cat !== catFilter) return false
    if (stFilter && getStockStatus(p) !== stFilter) return false
    if (minPrice !== '' && p.price < Number(minPrice)) return false
    if (maxPrice !== '' && p.price > Number(maxPrice)) return false
    if (minStock !== '' && p.stock < Number(minStock)) return false
    if (maxStock !== '' && p.stock > Number(maxStock)) return false
    if (supFilter && p.supplier !== supFilter) return false
    return true
  }), [prods, search, catFilter, stFilter, minPrice, maxPrice, minStock, maxStock, supFilter, hideInactive])

  const doAdd = async d => {
    if (!d.name || !d.sku) return alert('กรุณากรอกชื่อและรหัสสินค้า')
    const price = Number(d.price) || 0
    const cost = Number(d.cost) || 0
    const qty = Math.max(1, Number(d.addQty)||1)
    if (price < 0) return alert('ราคาขายต้องไม่ติดลบ')
    if (cost < 0) return alert('ราคาทุนต้องไม่ติดลบ')
    if (qty < 0) return alert('จำนวนต้องไม่ติดลบ')

    const existing = prods.find(p=>p.sku===d.sku)
    if (existing) {
      const ok = window.confirm(`รหัสสินค้า "${d.sku}" มีอยู่แล้ว (${existing.name})\nต้องการเพิ่มสต็อก ${qty} ชิ้น ให้กับสินค้านี้หรือไม่?\n\nกด ยกเลิก เพื่อแก้ไขข้อมูล`)
      if (!ok) return
    }

    setLoading(true)
    try {
      if (existing) {
        const stock = (Number(existing.stock)||0) + qty
        const updated = { ...existing, ...d, price, cost, stock, status:getStockStatus({ stock }), img:d.img||existing.img||'💎', img2:d.img2||existing.img2||'', costBreak: d.costBreak||existing.costBreak||null }
        await api.updateProduct(existing.id, updated)
        setProds(prev => prev.map(p => p.id===existing.id ? updated : p))
        clearDraft()
        setModal(null)
        return
      }
      const stock = qty
      const item = { name: d.name, sku: d.sku, cat: d.cat, price, cost, stock, sold: 0, status: getStockStatus({ stock }), sizes: d.sizes||[], supplier: d.supplier||'', supSku: d.supSku||'', img: d.img||'💎', img2: d.img2||'', costBreak: d.costBreak||null }
      const created = await api.createProduct(item)
      setProds(prev => [...prev, created])
      clearDraft()
      setModal(null)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถบันทึกสินค้าได้'))
    } finally {
      setLoading(false)
    }
  }

  const doEdit = async (idx, d) => {
    if (!d.name || !d.sku) return alert('กรุณากรอกชื่อและรหัสสินค้า')
    const price = Number(d.price) || 0
    const cost = Number(d.cost) || 0
    if (price < 0) return alert('ราคาขายต้องไม่ติดลบ')
    if (cost < 0) return alert('ราคาทุนต้องไม่ติดลบ')
    if (prods.find((p,i)=>p.sku===d.sku && i!==idx)) return alert('รหัสสินค้าซ้ำ')

    setLoading(true)
    try {
      const target = prods[idx]
      const addQty = Math.max(0, Number(d.addQty)||0)
      const removeQty = Math.max(0, Number(d.removeQty)||0)
      const newStock = Math.max(0, (Number(target.stock)||0) + addQty - removeQty)
      const updated = { ...target, ...d, price, cost, stock: newStock, status:getStockStatus({ stock: newStock }), img2:d.img2||target.img2||'', costBreak: d.costBreak||target.costBreak }
      await api.updateProduct(target.id, updated)
      setProds(prev => prev.map((p,i) => i===idx ? updated : p))
      setModal(null)
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถบันทึกสินค้าได้'))
    } finally {
      setLoading(false)
    }
  }

  const doDel = async idx => {
    if (!confirm('ลบสินค้านี้?')) return
    setLoading(true)
    try {
      const target = prods[idx]
      await api.deleteProduct(target.id)
      setProds(prev => prev.filter((_,i) => i!==idx))
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + (e.message || 'ไม่สามารถลบสินค้าได้'))
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = p => {
    const status = getStockStatus(p)
    if (status==='inactive') return <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-600 border border-red-100">หมด</span>
    if (status==='low') return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600 border border-amber-100">ใกล้หมด</span>
    return <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-100">มี</span>
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  async function loadThaiFont(doc) {
    const fontNames = ['tahoma.ttf', 'leelawad.ttf', 'segoeui.ttf']
    for (const name of fontNames) {
      try {
        const res = await fetch(`/api/font/${name}`)
        if (!res.ok) continue
        const buffer = await res.arrayBuffer()
        const base64 = arrayBufferToBase64(buffer)
        doc.addFileToVFS(name, base64)
        doc.addFont(name, 'thaifont', 'normal')
        doc.setFont('thaifont')
        return true
      } catch (e) {
        console.log('Font load error:', e)
      }
    }
    return false
  }

  const exportPDF = async (rows) => {
    const today = new Date().toLocaleDateString('th-TH')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const hasThaiFont = await loadThaiFont(doc)
    const fontName = hasThaiFont ? 'thaifont' : 'helvetica'

    doc.setFontSize(16)
    doc.setFont(fontName)
    doc.text('รายงานสินค้า', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`วันที่: ${today} · จำนวน ${rows.length} รายการ`, 14, 28)
    doc.setTextColor(0, 0, 0)

    const imgMap = {}
    const body = rows.map((p, i) => {
      const st = getStockStatus(p)
      const stText = st === 'inactive' ? 'หมด' : st === 'low' ? 'ใกล้หมด' : 'มี'
      if (isUploadedImage(p.img)) imgMap[i] = p.img
      return [
        i + 1,
        '',
        p.name || '',
        p.sku || '',
        p.cat || '',
        '฿' + (p.cost || 0).toLocaleString(),
        '฿' + (p.price || 0).toLocaleString(),
        String(p.stock || 0),
        (p.sizes || []).join(', ') || '—',
        stText
      ]
    })

    autoTable(doc, {
      startY: 35,
      head: [['#', 'รูป', 'ชื่อสินค้า', 'รหัส', 'หมวดหมู่', 'ราคาทุน', 'ราคาขาย', 'สต็อก', 'ไซส์', 'สถานะ']],
      body,
      styles: { font: fontName, fontSize: 9, cellPadding: 2, valign: 'middle', minCellHeight: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'normal', font: fontName },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32, minCellHeight: 32 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center' },
        9: { halign: 'center' }
      },
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      didDrawCell: (data) => {
        if (data.column.index === 1 && data.section === 'body') {
          const imgSrc = imgMap[data.row.index]
          if (imgSrc) {
            const fmt = imgSrc.includes('image/png') ? 'PNG' : 'JPEG'
            const pad = 1.5
            const x = data.cell.x + pad
            const y = data.cell.y + pad
            const w = data.cell.width - pad * 2
            const h = data.cell.height - pad * 2
            try {
              doc.addImage(imgSrc, fmt, x, y, w, h, undefined, 'FAST')
            } catch {
              // ignore image errors
            }
          }
        }
      }
    })

    doc.save('products_' + new Date().toISOString().slice(0, 10) + '.pdf')
  }

  return (
    <div>
      {draft && !modal && (
        <div className="mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <span className="text-xs text-amber-800">มีข้อมูลสินค้าที่กรอกค้างไว้{draft.name ? ` "${draft.name}"` : ''} — ต้องการกรอกต่อหรือไม่?</span>
          <div className="flex gap-2 shrink-0 ml-3">
            <button onClick={()=>setModal({type:'add',draft})} className="px-2.5 py-1 text-xs bg-amber-500 text-white rounded-md hover:bg-amber-600">กรอกต่อ</button>
            <button onClick={clearDraft} className="px-2.5 py-1 text-xs border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100">ล้างข้อมูล</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold">สินค้าทั้งหมด <span className="text-gray-400 font-normal">({prods.length} รายการ)</span></span>
          <div className="flex gap-2">
            <button onClick={()=>exportPDF(filtered)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-md hover:bg-gray-50"><FileDown size={14}/> Export PDF</button>
            <button disabled={loading} onClick={()=>setModal({type:'add'})} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 disabled:opacity-50"><Plus size={14}/> เพิ่มสินค้า</button>
          </div>
        </div>
        <div className="flex gap-2 items-center px-4 py-2 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full border rounded-md pl-7 pr-2 py-1.5 text-xs" placeholder="ค้นหาชื่อ / รหัส..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="border rounded-md px-2 py-1.5 text-xs bg-white" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
            <option value="">ทุกหมวดหมู่</option>{cats.map(c=><option key={c}>{c}</option>)}
          </select>
          <select className="border rounded-md px-2 py-1.5 text-xs bg-white" value={stFilter} onChange={e=>{ setStFilter(e.target.value); if (e.target.value==='inactive') setHideInactive(false) }}>
            <option value="">ทุกสถานะ</option><option value="active">มี</option><option value="low">ใกล้หมด</option><option value="inactive">หมด</option>
          </select>
          <button onClick={()=>setAdvOpen(!advOpen)} className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-md ${advOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'hover:bg-gray-50'}`}>
            <SlidersHorizontal size={12}/> ค้นหาขั้นสูง
          </button>
          <button onClick={()=>setHideInactive(!hideInactive)} className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-md ${hideInactive ? 'bg-red-50 text-red-600 border-red-200' : 'hover:bg-gray-50'}`}>
            <Package size={12}/> {hideInactive ? 'ซ่อนสินค้าหมด' : 'แสดงสินค้าหมด'}
          </button>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} รายการ</span>
        </div>
        {advOpen && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-[10px] text-gray-500">ราคาขายขั้นต่ำ</label>
                <input type="number" min="0" className="w-full border rounded-md px-2 py-1 text-xs" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="฿" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">ราคาขายขั้นสูง</label>
                <input type="number" min="0" className="w-full border rounded-md px-2 py-1 text-xs" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="฿" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">สต็อกขั้นต่ำ</label>
                <input type="number" min="0" className="w-full border rounded-md px-2 py-1 text-xs" value={minStock} onChange={e=>setMinStock(e.target.value)} placeholder="ชิ้น" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">สต็อกขั้นสูง</label>
                <input type="number" min="0" className="w-full border rounded-md px-2 py-1 text-xs" value={maxStock} onChange={e=>setMaxStock(e.target.value)} placeholder="ชิ้น" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">ซัพพลายเออร์</label>
                <select className="w-full border rounded-md px-2 py-1 text-xs bg-white" value={supFilter} onChange={e=>setSupFilter(e.target.value)}>
                  <option value="">ทุกราย</option>
                  {suppliers.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={()=>{setMinPrice('');setMaxPrice('');setMinStock('');setMaxStock('');setSupFilter('');setSearch('');setCatFilter('');setStFilter('')}} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500">
                <X size={10}/> ล้างตัวกรอง
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 text-[11px]">
              <tr><th className="px-3 py-2 text-left">สินค้า</th><th className="px-3 py-2 text-left">รหัสสินค้า</th><th className="px-3 py-2 text-left">หมวดหมู่</th><th className="px-3 py-2 text-right">ราคาทุน (฿)</th><th className="px-3 py-2 text-right">ราคาขาย (฿)</th><th className="px-3 py-2 text-left">สต็อก</th><th className="px-3 py-2 text-left">ไซส์</th><th className="px-3 py-2 text-left">สถานะ</th><th className="px-3 py-2 text-left">จัดการ</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">ไม่พบสินค้า</td></tr>}
              {filtered.map((p,i) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2">
                    <button onClick={()=>setModal({type:'view', data: p})} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer">
                      <div className="w-9 h-9 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {isUploadedImage(p.img) ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-lg">{p.img||'💎'}</span>}
                      </div>
                      <div><div className="font-medium hover:text-indigo-600">{p.name}</div></div>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-mono">{p.sku}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{p.cat}</span></td>
                  <td className="px-3 py-2 text-right font-medium">฿{(p.cost||0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-medium text-indigo-600">฿{p.price.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div>{p.stock} <span className="text-gray-400">ชิ้น</span></div>
                    <div className="w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: Math.min(100, Math.round((Number(p.stock)||0)/8*100))+'%', background: getStockStatus(p)==='inactive'?'#dc2626':getStockStatus(p)==='low'?'#d97706':'#16a34a' }} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {p.sizes?.length ? <div className="flex flex-wrap gap-1">{p.sizes.map(s=><span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 font-medium">{s}</span>)}</div> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2">{statusBadge(p)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={()=>setModal({type:'view', data: p})} className="p-1 border rounded hover:bg-gray-50 text-gray-500" title="ดูรายละเอียด"><Eye size={12}/></button>
                      <button onClick={()=>setModal({type:'edit', idx: prods.indexOf(p), data: p })} className="p-1 border rounded hover:bg-gray-50"><Pencil size={12}/></button>
                      <button onClick={()=>doDel(prods.indexOf(p))} className="p-1 border rounded hover:bg-red-50 text-red-500"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal?.type==='add' && <ProductModal isAdd draft={modal.draft} cats={cats} psizes={psizes} onSave={doAdd} onClose={()=>setModal(null)} loading={loading} />}
      {modal?.type==='edit' && <ProductModal p={modal.data} cats={cats} psizes={psizes} onSave={d=>doEdit(modal.idx,d)} onClose={()=>setModal(null)} loading={loading} />}
      {modal?.type==='view' && <ProductViewModal p={modal.data} onClose={()=>setModal(null)} />}
    </div>
  )
}
