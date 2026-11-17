import {Inject} from '@nestjs/common';
import {Injectable,BadRequestException} from '@nestjs/common';
import {Request} from 'express';
import {Auth} from '../auth/auth';
import {CustomerRepository} from './customer.repository';
import {int,str} from '../../common/validation';
@Injectable()
export class CustomerService{
 constructor(@Inject(Auth) private readonly auth:Auth,@Inject(CustomerRepository) private readonly repository:CustomerRepository){}
 async favorites(req:Request){return this.repository.favorites((await this.auth.required(req)).id);}
 async add(req:Request,id:string){await this.repository.addFavorite((await this.auth.required(req)).id,int(id,1));return {ok:true};}
 async remove(req:Request,id:string){await this.repository.removeFavorite((await this.auth.required(req)).id,int(id,1));return {ok:true};}
 async history(req:Request){return this.repository.history((await this.auth.required(req)).id);}
 async addresses(req:Request){return this.repository.addresses((await this.auth.required(req)).id);}
 async address(req:Request,body:any){
  const user=await this.auth.required(req);
  const values=['postalCode','region','city','line1'].map(name=>str(body?.[name],1,200));
  values.push(str(body?.line2||'',0,200));
  return this.repository.insertAddress(user.id,values);
 }
 async deleteAddress(req:Request,id:string){await this.repository.deleteAddress((await this.auth.required(req)).id,int(id,1));return {ok:true};}
}