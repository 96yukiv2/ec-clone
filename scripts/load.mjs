const base=process.env.LOAD_BASE_URL||'http://localhost:4000';
const requests=Number(process.env.LOAD_REQUESTS||120);
const concurrency=Math.min(25,Number(process.env.LOAD_CONCURRENCY||12));
const times=[];
let next=0,failed=0;
async function worker(){
 while(next<requests){
  next++;
  const start=performance.now();
  try{
   const response=await fetch(base+'/products?search=Book&sort=price_asc');
   if(!response.ok)failed++;
   else await response.json();
  }catch{failed++;}
  times.push(performance.now()-start);
 }
}
await Promise.all(Array.from({length:concurrency},worker));
const sorted=times.sort((a,b)=>a-b);
const p95=sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]||0;
console.log(JSON.stringify({requests,concurrency,failed,p95Milliseconds:Math.round(p95)},null,2));
if(failed>0)process.exitCode=1;
