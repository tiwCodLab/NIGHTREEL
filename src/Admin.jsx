import React, { useState } from "react";

export function Admin() {
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const { key, ...record } = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/clips", {
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer " + key.trim()},
        body:JSON.stringify(record)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.reset();
      setMessage("เพิ่มคลิปแล้ว เปิดสารบัญเพื่อดูรายการใหม่ได้เลย");
    } catch (error) { setMessage(error.message || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { setBusy(false); }
  }
  return <section className="admin"><h2>เพิ่มคลิปในสารบัญ</h2>
    <form onSubmit={submit}>
      <label>ชื่อคลิป<input name="title" maxLength="160" required/></label>
      <label>ลิงก์คลิป<input name="url" type="url" placeholder="https://" required/></label>
      <label>ลิงก์ภาพปก<input name="image" type="url" placeholder="https://" required/></label>
      <label>แนวเรื่อง<input name="genre" maxLength="60" placeholder="ทั่วไป"/></label>
      <label>คำบรรยาย<select name="sub"><option value="">ยังไม่ยืนยัน</option><option value="th">ไทย</option><option value="en">อังกฤษ</option></select></label>
      <label>รหัสผู้ดูแล<input name="key" type="password" autoComplete="current-password" required/></label>
      <button className="accent" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกและแสดงในสารบัญ"}</button>
    </form><p role="status">{message}</p><a href="/">เปิดสารบัญ</a>
  </section>;
}
