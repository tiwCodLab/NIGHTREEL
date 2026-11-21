import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Admin } from "./Admin.jsx";
import { providers } from "./catalog.js";
import "./style.css";

function loadSaved(films) {
  try {
    const items = JSON.parse(localStorage.getItem("nightreel-list"));
    return Array.isArray(items) ? films.map(f => f.slug).filter(slug => items.includes(slug)) : [];
  } catch { return []; }
}

function sourceFor(film) {
  return Object.hasOwn(providers, film.provider) ? providers[film.provider] : {ink:"#705463", terms:"เปิดดูที่เว็บต้นทาง"};
}
function WatchLink({ film }) {
  return <a className="action" href={film.url} target="_blank" rel="noopener noreferrer">เปิดที่ {film.provider}</a>;
}

function FilmCard({ film, saved, onToggle }) {
  const source = sourceFor(film);
  return <article style={{"--ink": source.ink}}>
    <a className="poster" href={film.url} target="_blank" rel="noopener noreferrer" aria-label={`เปิด ${film.title} ที่ ${film.provider}`}>
      {film.image && <img src={film.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.hidden = true; }}/>}<b>{film.title}</b>
    </a>
    <div className="info">
      <strong>{film.thai}</strong>
      <p>{[film.year, film.genre].filter(Boolean).join(" · ")} · {new URL(film.url).hostname}<br/>{source.terms}<br/>
        {film.sub === "en" && "มีซับอังกฤษ · "}{film.sub === "th" ? "มีซับไทย" : "ซับไทยยังไม่ยืนยัน"}
      </p>
      <div className="actions"><WatchLink film={film}/>
        <button aria-pressed={saved} onClick={onToggle}>{saved ? "✓ บันทึกแล้ว" : "＋ ไว้ดูทีหลัง"}</button>
      </div>
    </div>
  </article>;
}

function FilmDialog({ film, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} onClose={onClose} aria-labelledby="film-title">
    <button id="close" aria-label="ปิด" onClick={() => ref.current.close()}>×</button>
    <div id="body"><small>{new URL(film.url).hostname}</small><h2 id="film-title">{film.title}</h2>
      <p>{film.thai} · {[film.year, film.genre].filter(Boolean).join(" · ")}</p><p>{sourceFor(film).terms}</p>
      <WatchLink film={film}/>{sourceFor(film).contact && <p><a href={sourceFor(film).contact} target="_blank" rel="noreferrer">ติดต่อเว็บต้นทาง</a></p>}
    </div>
  </dialog>;
}

function Catalog({films}) {
  const [saved, setSaved] = useState(() => loadSaved(films));
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("");
  const [genre, setGenre] = useState("");
  const [subs, setSubs] = useState("");
  const [picked, setPicked] = useState(null);
  const visible = films.filter(film => {
    const words = [film.title, film.thai, film.provider, new URL(film.url).hostname].join(" ").toLowerCase();
    return words.includes(query.trim().toLowerCase()) && (!mine || saved.includes(film.slug))
      && (!provider || provider === film.provider) && (!genre || genre === film.genre)
      && (!subs || subs === film.sub);
  });

  function save(next) {
    setSaved(next);
    try { localStorage.setItem("nightreel-list", JSON.stringify(next)); }
    catch { alert("เบราว์เซอร์เก็บรายการได้เฉพาะครั้งนี้"); }
  }
  function toggle(slug) {
    save(saved.includes(slug) ? saved.filter(id => id !== slug) : [...saved, slug]);
  }
  return <section id="catalog">
    <nav><button aria-pressed={!mine} onClick={() => setMine(false)}>ลิงก์ทั้งหมด</button>
      <button aria-pressed={mine} onClick={() => setMine(true)}>บันทึกไว้ {saved.length}</button></nav>
    <div className="tools">
      <input type="search" aria-label="ค้นหาชื่อเรื่องหรือเว็บไซต์" placeholder="ค้นหาชื่อไทย อังกฤษ หรือเว็บไซต์" value={query} onChange={e => setQuery(e.target.value)}/>
      <select aria-label="เว็บไซต์ต้นทาง" value={provider} onChange={e => setProvider(e.target.value)}>
        <option value="">ทุกเว็บไซต์</option>{[...new Set(films.map(f => f.provider))].map(p => <option key={p}>{p}</option>)}
      </select>
      <select aria-label="แนวเรื่อง" value={genre} onChange={e => setGenre(e.target.value)}>
        <option value="">ทุกแนว</option>{[...new Set(films.map(f => f.genre))].map(g => <option key={g}>{g}</option>)}
      </select>
      <select aria-label="คำบรรยาย" value={subs} onChange={e => setSubs(e.target.value)}>
        <option value="">ทุกคำบรรยาย</option><option value="th">มีซับไทย</option><option value="en">มีซับอังกฤษ</option>
      </select>
    </div>
    <div className="heading"><h2 aria-live="polite">{mine ? "บันทึกไว้" : "รายการลิงก์"} · {visible.length}</h2>
      <button disabled={!visible.length} onClick={() => setPicked(visible[Math.floor(Math.random()*visible.length)])}>⚄　สุ่มเรื่อง</button>
    </div>
    {mine && saved.length > 0 && <button id="clear" onClick={() => { if (confirm("ล้างรายการที่บันทึกไว้ทั้งหมดในเบราว์เซอร์นี้?")) save([]); }}>ล้างรายการที่บันทึก</button>}
    <div id="grid">{visible.map(film => <FilmCard key={film.slug} film={film} saved={saved.includes(film.slug)} onToggle={() => toggle(film.slug)}/>)}</div>
    {!visible.length && <p>{mine && !saved.length ? "รายการยังว่าง กด “ไว้ดูทีหลัง” ที่เรื่องที่คุณสนใจ" : "ไม่พบเรื่องที่ตรงกับเงื่อนไข ลองเปลี่ยนตัวกรอง"}</p>}
    {picked && <FilmDialog film={picked} onClose={() => setPicked(null)}/>}
  </section>;
}

function Directory() {
  const [items,setItems] = useState(null);
  const [error,setError] = useState(false);
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch("/api/clips", {signal:controller.signal, cache:"no-store"})
      .then(response => {
        if (!response.ok) throw new Error("load failed");
        return response.json();
      })
      .then(setItems)
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <p role="alert">โหลดสารบัญไม่สำเร็จ <button onClick={() => setAttempt(attempt+1)}>ลองอีกครั้ง</button></p>;
  return items ? <Catalog films={items}/> : <p role="status">กำลังโหลดสารบัญ…</p>;
}

function App() {
  const [adult, setAdult] = useState(() => {
    try { return sessionStorage.getItem("nightreel-adult") === "yes"; }
    catch { return false; }
  });
  function enter() {
    try { sessionStorage.setItem("nightreel-adult", "yes"); } catch {}
    setAdult(true);
  }
  return <>
    <header><div className="brand"><i>◉</i> NIGHTREEL</div><span className="age">18+</span></header>
    <main>
      <section className="hero"><div><small>NIGHTREEL DIRECTORY</small><h1>รอบ<span>ดึก.</span></h1><p>สารบัญลิงก์หนังผู้ใหญ่ดูฟรี เลือกเรื่องแล้วเปิดที่เว็บต้นทาง</p></div>
        <div className="ticket" aria-hidden="true"><div className="stub">NIGHTREEL CINEMA</div><strong>Late<br/><em>Show</em></strong><div className="code"></div><b>FREE ADMISSION　 /　18+</b></div>
      </section>
      {adult ? (location.pathname.replace(/\/$/,"") === "/admin" ? <Admin/> : <Directory/>) : <section id="gate"><h2>ยืนยันอายุก่อนเข้าชม</h2><p>สารบัญนี้สำหรับผู้ที่มีอายุ 18 ปีขึ้นไป</p>
        <button className="accent" onClick={enter}>ฉันอายุ 18 ปีขึ้นไป</button>{" "}
        <button onClick={() => location.replace("about:blank")}>ออกจากเว็บไซต์</button></section>}
    </main><footer><a href="/admin">จัดการคลิป</a> <span>สารบัญลิงก์สำหรับผู้ใหญ่ • 18+</span></footer>
  </>;
}
createRoot(document.getElementById("root")).render(<App/>);

