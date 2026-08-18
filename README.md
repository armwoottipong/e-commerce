# MAII Market

โปรเจกต์นี้เป็น MVP ของ fashion marketplace สำหรับตลาดไทย ทำไว้เป็นฐานเริ่มต้นให้ลองระบบจริงก่อนค่อยต่อ payment gateway, storage, deployment และงาน production อื่น ๆ

ระบบอยู่ใน Next.js app เดียว มีฝั่งลูกค้า ผู้ขาย และแอดมินครบในโปรเจกต์เดียว

## รันแบบง่ายสุด

ใช้ Docker ยกทั้งเว็บกับฐานข้อมูลขึ้นพร้อมกัน

```bash
docker compose up --build
```

แล้วเปิด

```text
http://localhost:3000
```

ตัว `web` จะรันแบบ production ด้วย `next build` + `next start` เลย เวลาเปิดหน้าเว็บจะไม่หน่วงแบบ `next dev` ใน Docker

## รันแบบ dev

ถ้าจะเขียนโค้ดต่อ แนะนำให้รัน Next.js บนเครื่อง แล้วใช้ Docker แค่ PostgreSQL

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

เปิดเว็บที่

```text
http://localhost:3000
```

## บัญชีทดสอบ

```text
Admin    admin@market.test    password123
Seller   seller@market.test   password123
Customer customer@market.test password123
```

## ระบบตอนนี้ทำอะไรได้บ้าง

- ลูกค้าดูสินค้า เพิ่มลงตะกร้า checkout และจ่าย mock payment ได้
- cart รองรับสินค้าหลายร้านในคำสั่งซื้อเดียว
- ตอน checkout ระบบแยก `SellerOrder` ตามร้าน
- stock ถูก reserve ตอนเริ่ม payment
- mock payment success แล้ว order เป็น `PAID`
- mock payment fail/timeout แล้วคืน stock
- ผู้ขายสมัครเองได้ แต่ต้องรอแอดมิน approve
- ผู้ขายสร้างสินค้า แก้สินค้า ส่งตรวจใหม่ได้
- สินค้าต้องผ่าน admin approve ก่อนขึ้นหน้าร้าน
- ถ้า admin reject สินค้า ผู้ขายเห็นเหตุผลแล้วแก้ส่งใหม่ได้
- แอดมินจัดการ seller, product, category, order, payout tracking ได้
- payout ยังเป็น manual tracking เท่านั้น ยังไม่โอนเงินจริง

## กติกาหลักของ MVP

- Seller ต้อง `APPROVED` ก่อนเริ่มขาย
- Product ต้อง `APPROVED` ก่อนแสดงใน storefront
- Product ที่ถูกแก้จะกลับไป `PENDING_REVIEW`
- Shipping คิด flat rate ร้านละ 50 บาท
- Commission คงที่ 10% จาก seller subtotal ไม่รวม shipping
- Payment เป็น mock ก่อน ยังไม่ต่อ gateway จริง
- Guest checkout ใช้ได้ แต่ seller/admin ต้อง login

## Stack

- TypeScript
- Next.js App Router
- React
- PostgreSQL
- Prisma
- Tailwind CSS
- Zod
- bcryptjs
- Vitest
- Docker Compose

## Docker services

```text
web       Next.js app     http://localhost:3000
postgres  PostgreSQL      localhost:5432
```

ถ้าไม่อยาก seed ข้อมูลทุกครั้งที่ container start ให้ตั้งค่าใน `docker-compose.yml`

```yaml
SEED_DATABASE: "false"
```

## คำสั่งที่ใช้บ่อย

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm db:push
pnpm db:seed
```

## API

ดูรายการ API ได้ที่

```text
GET /api/v1
```

response สำเร็จหน้าตาประมาณนี้

```json
{ "ok": true, "data": {} }
```

error หน้าตาประมาณนี้

```json
{ "ok": false, "error": { "code": "...", "message": "..." } }
```

Public catalog ไม่ต้อง login ส่วน account, seller, admin ใช้ session cookie เดียวกับหน้าเว็บ

## หมายเหตุ

โปรเจกต์นี้ยังเป็น MVP สำหรับทดลอง flow ก่อนใช้งานจริง สิ่งที่ควรทำต่อก่อน production คือ real payment gateway, upload storage, rate limit ที่จริงจังขึ้น, logging/monitoring, migration strategy, backup และ security review
