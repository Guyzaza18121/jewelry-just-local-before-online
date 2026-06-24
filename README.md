# Jewelry Admin

ระบบจัดการร้านเครื่องประดับ (Jewelry Shop Management System) — แอปพลิเคชันแบบ Full-Stack สำหรับจัดการสินค้า ขาย สต็อก และรายงานยอดขาย รองรับการพิมพ์ใบต้นทุนสินค้า (Cost Sheet) เป็น PDF พร้อมเชื่อมต่อเครื่องพิมพ์ภายในเครื่องได้โดยตรง

---

## ฟีเจอร์หลัก

| โมดูล | รายละเอียด |
|--------|-----------|
| **แดชบอร์ด** | สรุปยอดขายวันนี้ ยอดรวม กำไร และกราฟแสดงแนวโน้ม |
| **สินค้า** | เพิ่ม แก้ไข ลบ จัดการหมวดหมู่ ไซส์ รูปภาพ ต้นทุน และสต็อก |
| **ขาย (POS)** | ขายสินค้าพร้อมเลือกไซส์ คำนวณกำไรอัตโนมัติ หักสต็อกทันที |
| **ประวัติ** | ดูประวัติการขายทั้งหมด ค้นหา ลบบิล ดูรายละเอียด |
| **รายงาน** | รายงานสรุปยอดขาย กำไร สินค้าขายดี แยกตามช่วงเวลา |
| **ตั้งค่า** | ล้างข้อมูลทั้งหมด (Dev) และ Restore จากไฟล์สำรอง |
| **แจ้งเตือน** | แจ้งเตือนสต็อกใกล้หมด / หมด บน Navbar |
| **พิมพ์ต้นทุน** | สร้าง PDF ต้นทุนสินค้า (ตัวเรือน เพชร ค่าฝัง ชุบ ส่ง ใบเซอร์) พิมพ์ผ่านเครื่องพิมพ์จริง |

---

## เทคโนโลยี

### Frontend
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) + react-chartjs-2
- [Lucide React](https://lucide.dev/) (ไอคอน)
- [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable (สร้าง PDF รายงาน)

### Backend
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- [pdf-lib](https://pdf-lib.js.org/) + [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) (สร้าง PDF ต้นทุนแบบไทย)
- [pdf-to-printer](https://github.com/artiebits/pdf-to-printer) (สั่งพิมพ์ผ่านเครื่องพิมพ์ Windows)
- [xlsx](https://sheetjs.com/) (นำเข้า/ส่งออก Excel)

---

## โครงสร้างโปรเจกต์

```
jewelry-admin/
├── src/                          # Frontend (React)
│   ├── components/                # หน้าต่างๆ
│   │   ├── Dashboard.jsx        # แดชบอร์ดสรุปยอด
│   │   ├── Products.jsx         # จัดการสินค้า
│   │   ├── Sell.jsx             # หน้าขาย
│   │   ├── History.jsx          # ประวัติการขาย
│   │   ├── Reports.jsx          # รายงาน + กราฟ
│   │   └── Settings.jsx         # ตั้งค่า + สำรองข้อมูล
│   ├── utils/                   # Helper functions
│   ├── api.js                   # ฟังก์ชันเรียก API
│   ├── App.jsx                  # Layout หลัก + Navbar + Routing
│   └── main.jsx                 # Entry point
├── server/                       # Backend (Express)
│   ├── models/                  # Mongoose Schemas
│   │   ├── Product.js           # สินค้า
│   │   ├── Sale.js              # การขาย
│   │   └── PurchaseOrder.js     # ใบสั่งซื้อ
│   ├── routes/                  # API Routes
│   │   ├── products.js          # CRUD สินค้า
│   │   ├── sales.js           # การขาย + ประวัติ
│   │   ├── purchaseOrders.js  # ใบสั่งซื้อ
│   │   └── backup.js          # สำรอง / กู้คืนข้อมูล
│   ├── server.js                # Express Server + PDF Print + Font Serve
│   └── clear-db.js              # สคริปต์ล้างฐานข้อมูล
├── dist/                         # Build output (Vite)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                  # ตัวอย่าง Environment Variables
└── README.md
```

---

## การติดตั้ง

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/Guyzaza18121/jewelry-just-local-before-online.git
cd jewelry-just-local-before-online
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment

สร้างไฟล์ `.env` จากตัวอย่าง:

```bash
cp .env.example .env
```

แก้ไข `.env`:

```env
# MongoDB Connection (Local หรือ Atlas)
MONGO_URI=mongodb://localhost:27017/jewelry-admin
# หรือ MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/jewelry-admin?retryWrites=true&w=majority

# Port ของ Backend
PORT=5000
```

### 4. รันแอปพลิเคชัน

**แบบ Dev (Frontend + Backend พร้อมกัน):**

```bash
npm run dev:full
```

**แยกรันเอง:**

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

**Build + Serve (Production):**

```bash
npm run build:serve
```

---

## การใช้งานหลัง Build

```bash
npm run build
npm start
```

เซิร์ฟเวอร์จะ serve ไฟล์ `dist/` ที่ build แล้ว และเปิดที่ `http://localhost:5000`

---

## หมายเหตุเฉพาะทาง

### พิมพ์ต้นทุนสินค้า (Cost Sheet)
- ระบบใช้ `pdf-lib` + `pdf-to-printer` สร้างและสั่งพิมพ์ PDF ต้นทุนสินค้า
- รองรับฟอนต์ไทยจาก `C:\Windows\Fonts\` (Leelawadee, Tahoma, UPC, Segoe UI)
- หากไม่มีเครื่องพิมพ์ ระบบจะส่ง PDF เป็น Base64 ให้ดาวน์โหลดแทน

### หมวดหมู่สินค้า & ไซส์
- หมวดหมู่: เพชรร่วง, แหวน, จี้, ต่างหู, กำไล
- ไซส์: 47–62 (หน่วยมม. สำหรับแหวน)

---

## License

MIT License — สร้างโดย [Guyzaza18121](https://github.com/Guyzaza18121)