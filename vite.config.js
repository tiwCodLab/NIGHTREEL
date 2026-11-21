import { defineConfig, loadEnv } from "vite";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { clipsApi } from "./server/api.js";

const directory = ".nightreel";
const file = directory + "/clips.json";
const localStore = {
  list() {
    return existsSync(file) ? JSON.parse(readFileSync(file,"utf8")) : [];
  },
  add(record) {
    const rows = this.list();
    if (rows.some(row => row.url === record.url)) return false;
    mkdirSync(directory,{recursive:true});
    writeFileSync(file + ".tmp", JSON.stringify([record, ...rows]));
    renameSync(file + ".tmp",file);
    return true;
  }
};

export default defineConfig(({mode}) => {
  const key = loadEnv(mode, process.cwd(), "NIGHTREEL_").NIGHTREEL_ADMIN_KEY;
  function attach(server) {
    server.middlewares.use(async (req,res,next) => {
      if (req.url?.split("?")[0] !== "/api/clips") return next();
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32000) { res.writeHead(413); res.end(); return; }
          chunks.push(chunk);
        }
        const request = new Request("http://localhost/api/clips",{
          method:req.method, headers:req.headers, body:chunks.length ? Buffer.concat(chunks) : undefined
        });
        const result = await clipsApi(request,localStore,key,randomUUID);
        res.writeHead(result.status,Object.fromEntries(result.headers));
        res.end(await result.text());
      } catch { res.writeHead(500); res.end(); }
    });
  }
  return {server:{fs:{deny:[".env",".env.*","*.{crt,pem}","**/.git/**","**/.nightreel/**"]}},
    plugins:[{name:"nightreel-local-api",configureServer:attach,configurePreviewServer:attach}]};
});
