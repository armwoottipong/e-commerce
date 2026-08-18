# ADR 0001: โครงสร้าง MVP

## ตัดสินใจ

ใช้ Next.js แบบ full-stack modular monolith เป็นแกนหลักของโปรเจกต์

stack หลัก:

- TypeScript
- Next.js App Router
- PostgreSQL
- Prisma
- Tailwind CSS
- Docker Compose
- mock payment

ระบบลูกค้า ผู้ขาย และแอดมิน อยู่ใน app เดียวก่อน เพื่อให้ MVP เดินเร็วและดูแลไม่ยาก

## เหตุผล

โปรเจกต์นี้ยังอยู่ช่วงพิสูจน์ flow ของ fashion marketplace ไทย สิ่งที่ต้องรู้ให้เร็วคือ:

- ลูกค้า browse, add cart, checkout ได้ไหม
- marketplace รองรับหลาย seller ใน order เดียวได้ไหม
- seller สมัคร ส่งสินค้า และรออนุมัติได้ไหม
- admin ตรวจ seller/product ได้ไหม
- stock reservation กับ mock payment ทำงานพอใกล้ของจริงไหม

ถ้าแยก microservices ตั้งแต่แรก จะมี overhead สูงเกินสำหรับ MVP เช่น deploy หลาย service, auth ข้าม service, network contract, logging และ tracing ที่ซับซ้อนขึ้น

## ผลที่ได้

- ทำงานไวขึ้น เพราะ frontend, backend, API, server action อยู่ที่เดียว
- setup ง่ายขึ้น ใช้ Docker ยก `web` + `postgres`
- schema และ business logic ยังเห็นภาพรวมชัด
- เหมาะกับทีมเล็กและการทดลอง flow
- ถ้าระบบโตจริง ค่อยแยกบางส่วนออกไปภายหลัง เช่น payment, fulfillment, notification หรือ search

## ข้อแลกเปลี่ยน

- ต้องรักษาขอบเขตโค้ดให้ดี ไม่ยัด logic ทุกอย่างมั่วในไฟล์เดียว
- server action/API ต้องตรวจ role และ ownership ให้ครบ
- ถ้า traffic สูงมากหรือ integration เยอะขึ้น อาจต้องแยก backend service ในอนาคต

## สถานะ

ยอมรับสำหรับ MVP ตอนนี้
