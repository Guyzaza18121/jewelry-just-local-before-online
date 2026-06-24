import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import pdfToPrinter from 'pdf-to-printer'
const { print, getPrinters } = pdfToPrinter
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'fs'
import os from 'os'
import productRoutes from './routes/products.js'
import saleRoutes from './routes/sales.js'
import backupRoutes from './routes/backup.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewelry-admin'

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/backup', backupRoutes)

// List printers
app.get('/api/printers', async (req, res) => {
  try {
    const printers = await getPrinters()
    res.json({ printers })
  } catch (err) {
    console.log('Get printers error (no printers available):', err.message || err)
    res.json({ printers: [] })
  }
})

// Print cost
app.post('/api/print', async (req, res) => {
  try {
    let { prod, printer, qty = 1, selectedSize = '', items } = req.body
    if (!prod || !prod.costBreak) return res.status(400).json({ error: 'missing data' })

    const printItems = Array.isArray(items) && items.length > 0
      ? items.map(it => ({ size: it.size || '', qty: Math.max(1, Number(it.qty) || 1) }))
      : [{ size: selectedSize || '', qty: Math.max(1, Number(qty) || 1) }]

    const cb = prod.costBreak
    const body = Number(cb.body) || 0
    const polish = Number(cb.polish) || 0
    const shipping = Number(cb.shipping) || 0
    const cert = Number(cb.cert) || 0
    const settingPerPiece = Number(cb.setting) || 0

    let diamonds = []
    let totalDiamondQty = 0
    let diamondTotal = 0
    let totalCarat = 0

    const hasValidDiamonds = Array.isArray(cb.diamonds) && cb.diamonds.length > 0 && cb.diamonds.some(d => Number(d.qty) > 0 || Number(d.price) > 0)
    if (hasValidDiamonds) {
      diamonds = cb.diamonds.map(d => ({
        qty: Number(d.qty) || 0,
        carat: Number(d.caratPerPiece) || 0,
        price: Number(d.price) || 0,
        size: d.size || ''
      })).filter(d => d.qty > 0 || d.price > 0)
      totalDiamondQty = diamonds.reduce((a, d) => a + d.qty, 0)
      diamondTotal = diamonds.reduce((a, d) => a + d.qty * d.price, 0)
      totalCarat = diamonds.reduce((a, d) => a + d.qty * d.carat, 0)
    } else if (cb.diamondQty) {
      const qty = Number(cb.diamondQty) || 0
      const price = Number(cb.diamondPrice) || 0
      const carat = Number(cb.caratPerPiece) || 0
      diamonds = [{ qty, carat, price, size: cb.diamondSize || '' }]
      totalDiamondQty = qty
      diamondTotal = qty * price
      totalCarat = qty * carat
    }

    const settingTotal = totalDiamondQty * settingPerPiece
    const total = body + diamondTotal + settingTotal + polish + shipping + cert

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    const pageW = 8 * 28.35
    let pageH = 10 * 28.35
    const lineH = diamonds.length > 4 ? 10 : diamonds.length > 2 ? 12 : 16
    let headerY = 80

    let font
    const fontPaths = [
      'C:\\Windows\\Fonts\\leelawad.ttf',
      'C:\\Windows\\Fonts\\tahoma.ttf',
      'C:\\Windows\\Fonts\\upcfl.ttf',
      'C:\\Windows\\Fonts\\segoeui.ttf',
    ]
    for (const fp of fontPaths) {
      const ok = existsSync(fp)
      console.log('Font check:', fp, ok ? 'EXISTS' : 'MISSING')
      if (ok) {
        try {
          font = await pdfDoc.embedFont(new Uint8Array(readFileSync(fp)))
          console.log('Font loaded OK:', fp)
          break
        } catch (e) {
          console.log('Font load FAILED:', fp, e.message)
        }
      }
    }
    if (!font) return res.status(500).json({ error: 'ไม่พบฟอนต์ไทยในระบบ' })

    let embeddedImg = null
    let embImgWidth = 0
    let embImgHeight = 0
    const IMG_MAX = 80
    if (prod.img && typeof prod.img === 'string' && prod.img.startsWith('data:image')) {
      try {
        const match = prod.img.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/)
        if (match) {
          const imgType = match[1].toLowerCase()
          const imgBytes = Buffer.from(match[2], 'base64')
          if (imgType === 'png') {
            embeddedImg = await pdfDoc.embedPng(imgBytes)
          } else if (imgType === 'jpeg' || imgType === 'jpg') {
            embeddedImg = await pdfDoc.embedJpg(imgBytes)
          }
          if (embeddedImg) {
            const { width: iw, height: ih } = embeddedImg.scale(1)
            const scale = IMG_MAX / Math.max(iw, ih)
            embImgWidth = iw * scale
            embImgHeight = ih * scale
            const imgBlockH = IMG_MAX + 15
            pageH += imgBlockH
            headerY += imgBlockH
          }
        }
      } catch (e) {
        console.log('Product image embed error:', e.message)
        embeddedImg = null
      }
    }

    for (const item of printItems) {
      const selectedSize = item.size
      const copies = item.qty
      for (let copy = 0; copy < copies; copy++) {
        const page = pdfDoc.addPage([pageW, pageH])
        let y = pageH - headerY
        const left = 20
        const right = pageW - 20
        const mid = pageW / 2

        const drawText = (text, x, yVal, opts = {}) => {
          const s = opts.size || 12
          page.drawText(text, { x, y: yVal, font, size: s, color: rgb(0,0,0) })
        }

        const drawLine = (yVal) => {
          page.drawLine({ start: { x: left, y: yVal }, end: { x: right, y: yVal }, thickness: 0.5, color: rgb(0,0,0) })
        }

        if (embeddedImg) {
          const imgX = mid - embImgWidth / 2
          const imgY = pageH - 5 - embImgHeight
          page.drawImage(embeddedImg, { x: imgX, y: imgY, width: embImgWidth, height: embImgHeight })
        }

        const displayName = selectedSize ? `${prod.name} (${prod.sku}) ไซส์: ${selectedSize}` : `${prod.name} (${prod.sku})`
        const nameW = font.widthOfTextAtSize(displayName, 14)
        drawText(displayName, mid - nameW / 2, y, { size: 14 })
        y -= diamonds.length > 2 ? 16 : 20
        drawText('(บาท)', right - 36, y, { size: 9 })
        y -= diamonds.length > 2 ? 14 : 18

        const colV1 = mid
        const colV2 = mid + 25
        const colV3 = right - 10

        const drawRow = (label, v1, v2, v3, subline) => {
          drawText(label, left, y)
          if (v1) {
            const w = font.widthOfTextAtSize(v1, 9)
            drawText(v1, colV1 - w, y, { size: 9 })
          }
          if (v2) drawText(v2, colV2, y, { size: 9 })
          if (v3) {
            const w = font.widthOfTextAtSize(v3, 12)
            drawText(v3, colV3 - w, y)
          }
          y -= lineH
          if (subline) {
            drawText(subline, left + 12, y, { size: 9 })
            y -= 12
          }
        }

        drawRow('ตัวเรือน', '', '', body.toLocaleString())
        diamonds.forEach((d, i) => {
          drawRow(
            'ค่าเพชร',
            d.price.toLocaleString(),
            `x ${d.qty}`,
            (d.qty * d.price).toLocaleString()
          )
        })
        drawRow('ค่าฝัง', settingPerPiece.toLocaleString(), `x ${totalDiamondQty}`, settingTotal.toLocaleString())
        drawRow('ค่าชุบ', '', '', polish.toLocaleString())
        drawRow('ค่าส่ง+กล่อง', '', '', shipping.toLocaleString())
        drawRow('ค่าใบเซอร์', '', '', cert.toLocaleString())

        y -= 2
        drawLine(y)
        y -= lineH
        drawText('รวมทุน', left, y, { size: 13 })
        const totalW = font.widthOfTextAtSize(total.toLocaleString(), 13)
        drawText(total.toLocaleString(), colV3 - totalW, y, { size: 13 })
        y -= 18

        const info = `เพชรรวม: ${totalDiamondQty} เม็ด · ${totalCarat.toFixed(3)} กะรัต`
        drawText(info, left, y, { size: 9 })
        y -= 14

        const diamondSizes = diamonds.map(d => d.size).filter(Boolean)
        if (diamondSizes.length > 0) {
          let sizeText
          if (diamondSizes.length === 1) {
            sizeText = `ขนาดเพชร: ${diamondSizes[0]} mm`
          } else {
            const last = diamondSizes.pop()
            sizeText = `ขนาดเพชร: ${diamondSizes.join(', ')} และ ${last} mm`
          }
          drawText(sizeText, left, y, { size: 9 })
        }
      }
    }

    const pdfBytes = await pdfDoc.save()
    const tmpFile = join(os.tmpdir(), `cost_${prod.sku}_${Date.now()}.pdf`)
    writeFileSync(tmpFile, pdfBytes)

    let printed = false
    const printOptions = printer ? { printer } : undefined
    try {
      await print(tmpFile, printOptions)
      printed = true
    } catch (printErr) {
      console.log('Print skipped (no printer or error):', printErr.message || printErr)
    }

    if (printed) {
      res.json({ success: true, printed: true })
    } else {
      const base64 = Buffer.from(pdfBytes).toString('base64')
      res.json({ success: true, printed: false, pdf: base64, filename: `cost_${prod.sku}.pdf` })
    }

    try { unlinkSync(tmpFile) } catch {}
  } catch (err) {
    console.error('Print route error:', err)
    res.status(500).json({ error: err.message || 'print failed' })
  }
})

// Serve Thai font files from Windows Fonts folder
app.get('/api/font/:name', (req, res) => {
  try {
    const fontName = req.params.name.replace(/[^a-zA-Z0-9._-]/g, '')
    const fontPath = join('C:\\Windows\\Fonts', fontName)
    if (!existsSync(fontPath)) return res.status(404).json({ error: 'font not found' })
    const fontData = readFileSync(fontPath)
    res.setHeader('Content-Type', 'font/ttf')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(fontData)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

// Serve built frontend
app.use(express.static(join(__dirname, '../dist')))
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
