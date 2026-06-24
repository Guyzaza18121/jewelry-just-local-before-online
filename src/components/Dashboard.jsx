import { useMemo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { isUploadedImage } from '../utils/product'
import { isSaleToday, fmtThaiDate } from '../utils/date'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function Dashboard({ prods, hist }) {
  const todaySales = hist.filter(isSaleToday)
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0)
  const todayProfit = todaySales.reduce((a, s) => a + (s.profit || 0), 0)
  const totalStock = prods.reduce((a, p) => a + (p.stock || 0), 0)

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

  const topProducts = useMemo(() => [...prods].sort((a,b) => (b.sold||0) - (a.sold||0)).slice(0,5), [prods])
  const recentSales = useMemo(() => [...hist].slice(0,5), [hist])

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">บิล</div>
          <div className="text-xl font-bold">{todaySales.length}</div>
          <div className="text-xs text-gray-400 mt-1">รายการ</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">ยอดขาย</div>
          <div className="text-xl font-bold text-green-600">฿{todayTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">วันนี้</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">กำไร</div>
          <div className="text-xl font-bold text-indigo-600">฿{todayProfit.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">วันนี้</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">จำนวนสต็อกในคลัง</div>
          <div className="text-xl font-bold text-amber-500">{totalStock} ชิ้น</div>
          <div className="text-xs text-gray-400 mt-1">ทั้งหมด</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2">ยอดขายรายเดือน</div>
          <div className="h-40">
            <Bar data={{ labels: months, datasets: [{ data: monthlySales, backgroundColor: '#6366f1', borderRadius: 4 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } }, y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, color: '#9ca3af', callback: v => '฿'+(v/1000)+'K' } } } }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2">จำนวนบิลรายเดือน</div>
          <div className="h-40">
            <Line data={{ labels: months, datasets: [{ data: monthlyOrders, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,.08)', fill: true, tension: .4, pointRadius: 3, borderWidth: 2 }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#9ca3af' } }, y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, color: '#9ca3af' } } } }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2">สินค้าขายดี</div>
          {topProducts.length===0 && <div className="text-xs text-gray-400 py-6 text-center">ยังไม่มีข้อมูล</div>}
          {topProducts.map((p,i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-5 h-5 rounded-full bg-gray-100 text-[10px] flex items-center justify-center font-medium">{i+1}</div>
              <div className="w-8 h-8 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {isUploadedImage(p.img) ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-lg">{p.img||'💎'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-gray-400">{p.sold||0} ชิ้น</div>
              </div>
              <div className="text-xs text-gray-500">฿{((p.sold||0)*p.price).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold mb-2">การขายล่าสุด</div>
          {recentSales.length===0 && <div className="text-xs text-gray-400 py-6 text-center">ยังไม่มีข้อมูล</div>}
          {recentSales.map(s => (
            <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{s.id}</span>
                <span className="text-gray-400">{fmtThaiDate(s.createdAt || s.date)}</span>
              </div>
              <div className="text-[11px] text-gray-500 truncate">{s.items.map(it => it.name).join(', ')}</div>
              <div className="text-xs font-semibold text-right">฿{s.total.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
