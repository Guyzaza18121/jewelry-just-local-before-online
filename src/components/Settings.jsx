import { useState } from 'react'
import { Download, Upload, Database, AlertTriangle } from 'lucide-react'

export default function Settings({ api, setProds, setHist }) {
  const [loading, setLoading] = useState(false)
  const [importPreview, setImportPreview] = useState(null)

  const doExport = async () => {
    setLoading(true)
    try {
      const data = await api.exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_jewelry_${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('สำรองไม่สำเร็จ: ' + (e.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const products = data.products || []
        const sales = data.sales || []
        const purchaseOrders = data.purchaseOrders || []
        setImportPreview({ products, sales, purchaseOrders })
      } catch {
        alert('ไฟล์ไม่ถูกต้อง')
      }
    }
    reader.readAsText(file)
  }

  const doRestore = async () => {
    if (!importPreview) return
    if (!confirm('นำเข้าข้อมูลจะอัปเดตหรือเพิ่มรายการที่มีอยู่แล้ว\nต้องการดำเนินการต่อหรือไม่?')) return
    setLoading(true)
    try {
      const res = await api.restoreBackup(importPreview)
      alert(`นำเข้าสำเร็จ: สินค้า ${res.results.products} รายการ, การขาย ${res.results.sales} รายการ, ใบสั่งซื้อ ${res.results.purchaseOrders} รายการ`)
      setImportPreview(null)
      // Refresh data
      const [products, sales] = await Promise.all([api.getProducts(), api.getSales()])
      setProds(products)
      setHist(sales)
    } catch (e) {
      alert('นำเข้าไม่สำเร็จ: ' + (e.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Database size={16} className="text-indigo-500"/> สำรองข้อมูล</div>
        <p className="text-xs text-gray-500 mb-3">ดาวน์โหลดข้อมูลทั้งหมด (สินค้า, การขาย, ใบสั่งซื้อ) เป็นไฟล์ JSON</p>
        <button disabled={loading} onClick={doExport} className="flex items-center gap-1 px-4 py-2 bg-indigo-500 text-white text-xs rounded-md hover:bg-indigo-600 disabled:opacity-50">
          <Download size={14}/> ดาวน์โหลดสำรอง
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Upload size={16} className="text-green-500"/> นำเข้าข้อมูล</div>
        <p className="text-xs text-gray-500 mb-3">เลือกไฟล์ JSON ที่สำรองไว้เพื่อนำเข้ากลับเข้าระบบ</p>
        <input type="file" accept=".json" onChange={handleFile} className="text-xs" />

        {importPreview && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-medium mb-2">ตรวจสอบข้อมูลก่อนนำเข้า</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <div className="text-lg font-bold text-indigo-600">{importPreview.products.length}</div>
                <div className="text-[10px] text-gray-500">สินค้า</div>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <div className="text-lg font-bold text-green-600">{importPreview.sales.length}</div>
                <div className="text-[10px] text-gray-500">การขาย</div>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <div className="text-lg font-bold text-amber-600">{importPreview.purchaseOrders.length}</div>
                <div className="text-[10px] text-gray-500">ใบสั่งซื้อ</div>
              </div>
            </div>
            <div className="flex items-start gap-1 mt-3 text-[11px] text-amber-600">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>รายการที่มีรหัสซ้ำจะถูกอัปเดต รายการใหม่จะถูกเพิ่ม</span>
            </div>
            <button disabled={loading} onClick={doRestore} className="w-full mt-3 py-2 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 disabled:opacity-50">
              {loading ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้า'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
