const api='http://localhost:4000';
const web='http://localhost:3000';
function assert(value,message){if(!value)throw new Error(message);}
async function call(path,method='GET',body,session){
 const res=await fetch(api+path,{method,headers:{...(body?{'content-type':'application/json'}:{}),...(session?{cookie:session}:{})},body:body?JSON.stringify(body):undefined});
 const result=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(method+' '+path+' => '+res.status+': '+JSON.stringify(result));
 return {result,res};
}
const webResponse=await fetch(web);
assert(webResponse.ok,'Next.jsトップページが正常応答していません');
const listed=await call('/products');
assert(listed.result.items?.length>0,'シード商品がありません');
const product=listed.result.items[0];
const email='smoke-'+Date.now()+'@example.test';
const register=await call('/auth/register','POST',{name:'スモークテスト',email,password:'local-test-password-123456'});
const session=register.res.headers.get('set-cookie')?.split(';')[0];
assert(session?.startsWith('session='),'認証Cookieがありません');
await call('/cart/'+product.id,'PUT',{quantity:1},session);
const key='smoke-'+Date.now();
const order=(await call('/orders','POST',{idempotencyKey:key},session)).result;
assert(order.id>0 && order.status==='pending_payment','注文作成失敗');
const retry=(await call('/orders','POST',{idempotencyKey:key},session)).result;
assert(retry.id===order.id,'冪等性の検証失敗');
const paid=(await call('/orders/'+order.id+'/pay','POST',{succeed:true},session)).result;
assert(paid.status==='paid','Mock決済失敗');
const detail=(await call('/orders/'+order.id,'GET',undefined,session)).result;
assert(detail.items?.length===1,'注文明細がありません');
console.log('Dockerスモークテスト成功：商品取得・会員登録・カート・注文・冪等性・Mock決済');
