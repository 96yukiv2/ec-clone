export const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export const yen=(n:number)=>'¥'+Number(n).toLocaleString('ja-JP');
export class ApiError extends Error{
 constructor(public readonly status:number,message:string,public readonly path:string){super(message);this.name='ApiError';}
}
export async function request<T=any>(path:string,init:RequestInit={}):Promise<T>{
 const response=await fetch(API+path,{...init,credentials:'include',headers:{'Content-Type':'application/json',...init.headers}});
 if(!response.ok){
  const body=await response.json().catch(()=>({}));
  const raw=body?.message;
  const message=Array.isArray(raw)?raw.join(' / '):typeof raw==='string'?raw:'HTTP '+response.status;
  throw new ApiError(response.status,message,path);
 }
 return response.json();
}
