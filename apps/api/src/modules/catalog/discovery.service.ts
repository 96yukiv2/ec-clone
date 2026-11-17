import {Injectable} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from '../auth/auth';
import {CacheService} from '../../common/cache';
import {int} from '../../common/validation';
import {DiscoveryRepository} from './discovery.repository';
@Injectable()
export class DiscoveryService{
 constructor(private readonly repository:DiscoveryRepository,private readonly cache:CacheService,private readonly auth:Auth){}
 private async cached<T>(key:string,load:()=>Promise<T>):Promise<T>{
  const hit=await this.cache.get<T>(key);
  if(hit!==null)return hit;
  const data=await load();await this.cache.put(key,data,60);return data;
 }
 trending(){return this.cached('discover:trending',()=>this.repository.trending());}
 async recent(req:Request){const user=await this.auth.viewer(req);return user?this.repository.recent(user.id):[];}
 async recommendations(req:Request){
  const user=await this.auth.viewer(req);if(!user)return this.trending();
  const result=await this.repository.recommendations(user.id);
  return result.length?result:this.trending();
 }
 facets(query:string){const term=String(query||'').slice(0,80);return this.cached('facets:'+term,()=>this.repository.facets(term));}
 variants(id:string){return this.repository.variants(int(id,1));}
}