import {Injectable,BadRequestException} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from '../auth/auth';
import {CatalogRepository} from './catalog.repository';
import {int,str} from '../../common/validation';
@Injectable()
export class ProductsService{
 constructor(private readonly repository:CatalogRepository,private readonly auth:Auth){}
 list(q:Record<string,unknown>){return this.repository.search(q||{});}
 suggest(q:string){return q?.trim()?this.repository.suggest(q):Promise.resolve([]);}
 categories(){return this.repository.categories();}
 reviews(id:string){return this.repository.reviews(int(id,1));}
 related(id:string){return this.repository.related(int(id,1));}
 async detail(id:string,req:Request){
  const pid=int(id,1),product=await this.repository.detail(pid);
  if(!product)throw new BadRequestException('商品が見つかりません');
  const user=await this.auth.viewer(req);
  if(user)await this.repository.recordView(user.id,pid);
  return product;
 }
 async review(id:string,req:Request,body:any){
  const user=await this.auth.required(req),pid=int(id,1),rating=int(body?.rating,1,5),comment=str(body?.body,3,1000);
  if(!await this.repository.hasPurchased(user.id,pid))throw new BadRequestException('購入済みユーザーのみレビューできます');
  await this.repository.saveReview(user.id,pid,rating,comment);
  return {ok:true};
 }
 async helpful(id:string,req:Request){
  const user=await this.auth.required(req);
  await this.repository.helpful(user.id,int(id,1));
  return {ok:true};
 }
}
