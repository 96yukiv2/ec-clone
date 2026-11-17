import {Injectable,OnModuleDestroy} from '@nestjs/common';
import Redis from 'ioredis';
@Injectable()
export class CacheService implements OnModuleDestroy{
 private readonly client=new Redis(process.env.REDIS_URL||'redis://localhost:6379',{lazyConnect:true,maxRetriesPerRequest:1});
 private async ready(){if(this.client.status==='wait')await this.client.connect();}
 async get<T>(key:string):Promise<T|null>{
  try{await this.ready();const content=await this.client.get(key);return content?JSON.parse(content):null;}catch{return null;}
 }
 async put(key:string,value:unknown,seconds=60){
  try{await this.ready();await this.client.set(key,JSON.stringify(value),'EX',seconds);}catch{}
 }
 async invalidate(prefix:string){
  try{
   await this.ready();let cursor='0';
   do{
    const [next,keys]=await this.client.scan(cursor,'MATCH',prefix+'*','COUNT',50);
    if(keys.length)await this.client.del(...keys);
    cursor=next;
   }while(cursor!=='0');
  }catch{}
 }
 async onModuleDestroy(){this.client.disconnect();}
}
