import { films } from "../src/catalog.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {"Cache-Control": "no-store", "Content-Type":"application/json; charset=utf-8"}
});
const error = (message, status) => json({error: message}, status);
function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export async function clipsApi(request, store, adminKey, nextId = () => crypto.randomUUID()) {
  try {
    if (request.method === "GET") {
      const rows = await store.list();
      const added = rows.map(row => ({...row, thai: row.title, provider: new URL(row.url).hostname}));
      return json([...added, ...films]);
    }
    if (request.method !== "POST") return error("ไม่รองรับคำขอนี้", 405);
    if (!adminKey || request.headers.get("Authorization") !== "Bearer " + adminKey)
      return error("รหัสผู้ดูแลไม่ถูกต้อง", 403);
    if (!request.headers.get("Content-Type")?.startsWith("application/json"))
      return error("ต้องส่งข้อมูล JSON", 415);
    const text = await request.text();
    if (text.length > 16000) return error("ข้อมูลยาวเกินไป", 413);
    let body;
    try { body = JSON.parse(text); } catch { return error("ข้อมูล JSON ไม่ถูกต้อง", 400); }
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const genre = typeof body?.genre === "string" ? body.genre.trim() : "";
    const url = httpsUrl(body?.url), image = httpsUrl(body?.image);
    if (!title || title.length > 160 || !url || !image || genre.length > 60 || !["", "th", "en"].includes(body.sub))
      return error("ตรวจชื่อเรื่อง แนวเรื่อง และ URL แบบ https ของคลิปกับภาพปก", 400);
    const record = {slug: nextId(), title, url, image, genre: genre || "ทั่วไป", sub: body.sub};
    if (films.some(f => f.url === url) || !await store.add(record))
      return error("ลิงก์คลิปนี้มีในสารบัญแล้ว", 409);
    return json({slug: record.slug}, 201);
  } catch {
    return error("ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองอีกครั้ง", 503);
  }
}

