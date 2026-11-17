import {readFileSync,existsSync} from 'node:fs';
const root='apps/api/src/modules/';
const controllers=[
 'auth/auth.controller.ts','catalog/products.ts','catalog/discovery.ts',
 'checkout/orders.ts','checkout/guest.ts','customer/customer.ts',
 'admin/admin.ts','admin/jobs.ts'
];
const services=[
 'auth/auth.ts','catalog/products.service.ts','catalog/discovery.service.ts',
 'checkout/orders.service.ts','checkout/guest.service.ts',
 'customer/customer.service.ts','admin/admin.service.ts','admin/jobs.service.ts'
];
let failures=0;
function check(file,predicate,message){
 const path=root+file;
 if(!existsSync(path)){console.error('不足:',path);failures++;return;}
 const text=readFileSync(path,'utf8');
 if(!predicate(text)){console.error('アーキテクチャ違反:',path,message);failures++;}
}
for(const file of controllers)check(file,text=>!/\b(?:SELECT|INSERT INTO|DELETE FROM)\b/i.test(text)&&!text.includes('this.db.'),'ControllerにSQLまたはDBアクセスが含まれています');
for(const file of services)check(file,text=>!text.includes('this.db.')&&!/from ['"][^'"]*common\/db['"]/.test(text),'Serviceから直接Dbを使用しています');
if(failures)process.exit(1);
console.log('アーキテクチャチェック成功：Controller / Service / Repositoryの依存境界');
