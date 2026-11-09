// Run the site on your own computer the same way Vercel runs it: the pages plus the two API files.
// Run from the project folder: node tools/dev-server.js . 3000
// With a database: DATABASE_URL=postgres://... node tools/dev-server.js . 3000  (without one, it runs in 'this browser only' mode)
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.argv[2],PORT=+process.argv[3]||3000;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'};
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x');
 if(u.pathname.startsWith('/api/')){const f=path.join(ROOT,'api',u.pathname.slice(5).replace(/\/$/,'')+'.js');if(!fs.existsSync(f)){res.statusCode=404;return res.end('nf')}
  try{return await require(f)(req,res)}catch(e){console.error(e);res.statusCode=500;return res.end('err')}}
 let p=path.join(ROOT,decodeURIComponent(u.pathname));if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 if(!fs.existsSync(p)){if(fs.existsSync(p+'.html'))p=p+'.html';else if(fs.existsSync(path.join(p,'index.html')))p=path.join(p,'index.html');else{res.statusCode=404;return res.end('404')}}
 res.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res)}).listen(PORT,()=>console.log('up',PORT));
