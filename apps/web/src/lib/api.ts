export const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export const yen=(n:number)=>'¥'+Number(n).toLocaleString('ja-JP');
export async function request<T=any>(path:string,init:RequestInit={}):Promise<T>{
 const response=await fetch(API+path,{...init,credentials:'include',headers:{'Content-Type':'application/json',...init.headers}});
 if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||'HTTP '+response.status);}
 return response.json();
}
