import { clipsApi } from "./api.js";

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api/clips") {
      return clipsApi(request, {
        async list() {
          const rows = await env.DB.prepare("SELECT * FROM clips ORDER BY rowid DESC").all();
          return rows.results;
        },
        async add(r) {
          const result = await env.DB.prepare("INSERT INTO clips (slug,title,url,image,genre,sub) VALUES (?,?,?,?,?,?) ON CONFLICT(url) DO NOTHING")
            .bind(r.slug,r.title,r.url,r.image,r.genre,r.sub).run();
          return result.meta.changes === 1;
        }
      }, env.NIGHTREEL_ADMIN_KEY);
    }
    const file = Object.hasOwn(SITE_FILES, path) && SITE_FILES[path];
    if (!file) return new Response("Not found", {status:404});
    return new Response(file.body, {headers: {"Content-Type":file.type, "X-Content-Type-Options":"nosniff"}});
  }
};
