import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isUploadedImage, getStockStatus } from '../utils/product.js'

async function printCost(prod, printer, items) {
  try {
    const res = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prod, printer, items })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'print failed')
    if (data.printed) {
      alert('สั่งพิมพ์เรียบร้อย')
    } else if (data.pdf) {
      const byteCharacters = atob(data.pdf)
      const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i))
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename || `cost_${prod.sku}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    alert('พิมพ์ไม่สำเร็จ: ' + err.message)
  }
}

export default function Reports({ prods, hist }) {
  const [tab, setTab] = useState('sales')
  const [printerModal, setPrinterModal] = useState(false)
  const [printers, setPrinters] = useState([])
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [pendingProd, setPendingProd] = useState(null)
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [srchName, setSrchName] = useState('')
  const [srchSku, setSrchSku] = useState('')
  const [printItems, setPrintItems] = useState([{ size: '', qty: 1 }])
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const monthlySales = useMemo(() => {
    const arr = new Array(12).fill(0)
    hist.forEach(s => {
      const d = new Date(s.createdAt || s.date)
      if (isNaN(d)) return
      if (d.getFullYear() !== new Date().getFullYear()) return
      arr[d.getMonth()] += s.total
    })
    return arr
  }, [hist])
  const monthlyOrders = useMemo(() => {
    const arr = new Array(12).fill(0)
    hist.forEach(s => {
      const d = new Date(s.createdAt || s.date)
      if (isNaN(d)) return
      if (d.getFullYear() !== new Date().getFullYear()) return
      arr[d.getMonth()] += 1
    })
    return arr
  }, [hist])
  const monthlyProfit = useMemo(() => {
    const arr = new Array(12).fill(0)
    hist.forEach(s => {
      const d = new Date(s.createdAt || s.date)
      if (isNaN(d)) return
      if (d.getFullYear() !== new Date().getFullYear()) return
      arr[d.getMonth()] += (s.profit || 0)
    })
    return arr
  }, [hist])

  const totalRev = monthlySales.reduce((a,b)=>a+b,0)
  const totalOrd = monthlyOrders.reduce((a,b)=>a+b,0)
  const totalProfit = monthlyProfit.reduce((a,b)=>a+b,0)
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{id:'sales',l:'ยอดขาย'},{id:'cost',l:'พิมพ์ต้นทุน'},{id:'catalog',l:'แคตตาล็อก'}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-1.5 text-xs rounded-md border ${tab===t.id?'bg-indigo-50 text-indigo-600 border-indigo-200 font-medium':'bg-white text-gray-600 border-gray-200'}`}>{t.l}</button>
        ))}
      </div>

      {tab==='sales' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-semibold mb-3">ยอดขายรายเดือน</div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="px-3 py-2 text-left">เดือน</th><th className="px-3 py-2 text-right">ยอดขาย</th><th className="px-3 py-2 text-right">บิล</th><th className="px-3 py-2 text-right">กำไร</th></tr></thead>
            <tbody>
              {months.map((m,i) => (
                <tr key={m} className="border-t border-gray-50"><td className="px-3 py-2">{m}</td><td className="px-3 py-2 text-right font-medium">฿{monthlySales[i].toLocaleString()}</td><td className="px-3 py-2 text-right">{monthlyOrders[i]}</td><td className="px-3 py-2 text-right font-medium text-green-600">฿{monthlyProfit[i].toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-xs text-gray-500">รวมยอดขาย: <span className="font-bold text-indigo-600">฿{totalRev.toLocaleString()}</span> · รวมบิล: {totalOrd} · รวมกำไร: <span className="font-bold text-green-600">฿{totalProfit.toLocaleString()}</span></div>
        </div>
      )}

      {tab==='catalog' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">รายการสินค้า (ลูกค้า)</div>
            <button
              onClick={() => exportCustomerPDF(prods.filter(p => p.status !== 'inactive'))}
              className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
            >
              Export PDF
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {prods.filter(p => p.status !== 'inactive').map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {isUploadedImage(p.img) ? (
                    <img src={p.img} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-lg">{p.img || '💎'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-gray-400">{p.sku} · {p.cat || '-'}</div>
                </div>
              </div>
            ))}
            {prods.filter(p => p.status !== 'inactive').length === 0 && (
              <div className="text-xs text-gray-400">ไม่มีสินค้า</div>
            )}
          </div>
        </div>
      )}

      {tab==='cost' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-semibold mb-3">พิมพ์ต้นทุน</div>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 border rounded-md px-2 py-1.5 text-xs" placeholder="ค้นหาชื่อสินค้า..." value={srchName} onChange={e=>setSrchName(e.target.value)} />
            <input className="flex-1 border rounded-md px-2 py-1.5 text-xs" placeholder="ค้นหารหัสสินค้า..." value={srchSku} onChange={e=>setSrchSku(e.target.value)} />
          </div>
          <div className="space-y-2">
            {prods.filter(p=>p.costBreak).filter(p => {
              const nameMatch = !srchName || p.name.toLowerCase().includes(srchName.toLowerCase())
              const skuMatch = !srchSku || p.sku.toLowerCase().includes(srchSku.toLowerCase())
              return nameMatch && skuMatch
            }).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="text-xs">{p.name}({p.sku})</div>
                <button onClick={()=>openPrinterModal(p)} className="px-3 py-1 text-[11px] bg-green-500 text-white rounded-md hover:bg-green-600">Print</button>
              </div>
            ))}
            {prods.filter(p=>p.costBreak).filter(p => {
              const nameMatch = !srchName || p.name.toLowerCase().includes(srchName.toLowerCase())
              const skuMatch = !srchSku || p.sku.toLowerCase().includes(srchSku.toLowerCase())
              return nameMatch && skuMatch
            }).length===0 && <div className="text-xs text-gray-400">ยังไม่มีสินค้าที่บันทึกต้นทุน</div>}
          </div>
        </div>
      )}

      {printerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={()=>setPrinterModal(false)}>
          <div className="bg-white rounded-lg p-5 w-80 shadow-lg" onClick={e=>e.stopPropagation()}>
            <div className="text-sm font-semibold mb-1">เลือกเครื่องปริ้น</div>
            <div className="text-xs text-gray-500 mb-3">{pendingProd?.name}({pendingProd?.sku})</div>
            {loadingPrinters ? (
              <div className="text-xs text-gray-500 py-3">กำลังโหลดรายชื่อเครื่องปริ้น...</div>
            ) : (
              <select
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs mb-3"
                value={selectedPrinter}
                onChange={e=>setSelectedPrinter(e.target.value)}
              >
                {printers.length === 0 ? (
                  <option value="">ไม่มีเครื่องปริ้น (ดาวน์โหลด PDF)</option>
                ) : (
                  <>
                    <option value="">-- เลือกเครื่องปริ้น --</option>
                    {printers.map(pr => (
                      <option key={pr.name} value={pr.name}>{pr.name}{pr.isDefault ? ' (default)' : ''}</option>
                    ))}
                  </>
                )}
              </select>
            )}
            {pendingProd?.sizes?.length > 0 && (
              <div className="mb-3">
                <label className="text-[11px] text-gray-500 block mb-1">เลือกไซส์ / จำนวน</label>
                <div className="space-y-2">
                  {printItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs" value={item.size} onChange={e=>{ const next=[...printItems]; next[idx]={...next[idx],size:e.target.value}; setPrintItems(next) }}>
                        <option value="">-- ไม่มีไซส์ --</option>
                        {pendingProd.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" min="1" className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-center" value={item.qty} onChange={e=>{ const v=e.target.value; const n=Number(v); const next=[...printItems]; next[idx]={...next[idx],qty:v===''?'':(!isNaN(n)&&n>=0?n:1)}; setPrintItems(next) }} />
                      {printItems.length > 1 && (
                        <button onClick={()=>setPrintItems(printItems.filter((_,i)=>i!==idx))} className="text-red-400 hover:text-red-600 text-xs px-1">×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setPrintItems([...printItems,{size:'',qty:1}])} className="mt-2 text-[11px] text-green-600 hover:text-green-700 border border-green-200 rounded-md px-2 py-1">+ เพิ่มไซส์</button>
              </div>
            )}
            {!pendingProd?.sizes?.length && (
              <div className="mb-3">
                <label className="text-[11px] text-gray-500 block mb-1">จำนวนที่จะพิมพ์</label>
                <input type="number" min="1" className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs" value={printItems[0]?.qty||1} onChange={e=>{ const v=e.target.value; const n=Number(v); setPrintItems([{size:'',qty:v===''?'':(!isNaN(n)&&n>=0?n:1)}]) }} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setPrinterModal(false)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">ยกเลิก</button>
              <button
                onClick={()=>{ if(pendingProd){ const items = printItems.map(it=>({ size: it.size||'', qty: Math.max(1, Number(it.qty)||1) })).filter(it=>it.qty>0); if(!items.length) return; printCost(pendingProd, selectedPrinter, items); setPrinterModal(false) } }}
                disabled={loadingPrinters}
                className={`px-3 py-1.5 text-xs rounded-md ${!loadingPrinters ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {printers.length === 0 && !selectedPrinter ? 'ดาวน์โหลด PDF' : 'พิมพ์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

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

async function exportCustomerPDF(rows) {
  const today = new Date().toLocaleDateString('th-TH')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const hasThaiFont = await loadThaiFont(doc)
  const fontName = hasThaiFont ? 'thaifont' : 'helvetica'

  doc.setFontSize(16)
  doc.setFont(fontName)
  doc.text('รายการสินค้า', 14, 20)
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
      '฿' + (p.price || 0).toLocaleString(),
      (p.sizes || []).join(', ') || '—',
      stText
    ]
  })

  autoTable(doc, {
    startY: 35,
    head: [['#', 'รูป', 'ชื่อสินค้า', 'รหัส', 'หมวดหมู่', 'ราคาขาย', 'ไซส์', 'สถานะ']],
    body,
    styles: { font: fontName, fontSize: 9, cellPadding: 2, valign: 'middle', minCellHeight: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'normal', font: fontName },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, minCellHeight: 32 },
      5: { halign: 'center' },
      7: { halign: 'center' }
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

  doc.save('catalog_' + new Date().toISOString().slice(0, 10) + '.pdf')
}

async function openPrinterModal(prod) {
    setPendingProd(prod)
    setSelectedPrinter('')
    setPrintItems([{ size: '', qty: 1 }])
    setPrinterModal(true)
    setLoadingPrinters(true)
    try {
      const res = await fetch('/api/printers')
      const data = await res.json()
      if (data.printers) {
        setPrinters(data.printers)
        const def = data.printers.find(p=>p.isDefault)
        if (def) setSelectedPrinter(def.name)
      }
    } catch {
      setPrinters([])
    }
    setLoadingPrinters(false)
  }
}
