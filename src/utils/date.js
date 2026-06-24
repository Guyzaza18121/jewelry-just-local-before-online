const FISCAL_MONTHS = [9, 10, 11, 0, 1, 2, 3, 4] // ต.ค. พ.ย. ธ.ค. ม.ค. ก.พ. มี.ค. เม.ย. พ.ค.

export function fmtThaiDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return 'วันนี้ ' + time
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' + time
}

export function isSaleToday(sale) {
  const d = new Date(sale.createdAt || sale.date)
  if (isNaN(d)) return false
  return d.toDateString() === new Date().toDateString()
}

export function getFiscalMonthIndex(date) {
  return FISCAL_MONTHS.indexOf(date.getMonth())
}

export function getSaleMonthIndex(sale) {
  const d = new Date(sale.createdAt || sale.date)
  if (isNaN(d)) return -1
  return getFiscalMonthIndex(d)
}

export function isCurrentFiscalYear(date) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const d = new Date(date)
  const m = d.getMonth()
  const y = d.getFullYear()

  // Fiscal year: Oct (prev year or current year) -> May (current year or next year)
  let fiscalStartYear
  if (currentMonth >= 9) {
    fiscalStartYear = currentYear
  } else {
    fiscalStartYear = currentYear - 1
  }

  if (m >= 9) {
    return y === fiscalStartYear
  } else {
    return y === fiscalStartYear + 1
  }
}
