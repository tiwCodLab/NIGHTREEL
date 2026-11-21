import { readFileSync, readdirSync } from "node:fs";
import { build } from "vite";

const html = {body: readFileSync("dist/index.html","utf8"), type:"text/html; charset=utf-8"};
const files = {"/":html, "/admin":html, "/admin/":html, "/index.html":html};
for (const name of readdirSync("dist/assets")) {
  const type = name.endsWith(".css") ? "text/css" : "application/javascript";
  files["/assets/" + name] = {type, body:readFileSync("dist/assets/" + name,"utf8")};
}
await build({
  configFile:false,
  define:{SITE_FILES:JSON.stringify(files)},
  build:{target:"es2022",outDir:"dist/server",lib:{entry:"server/worker.js",formats:["es"],fileName:()=>"index.js"}}
});
