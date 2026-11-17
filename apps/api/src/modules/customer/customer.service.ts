import {Injectable,BadRequestException} from '@nestjs/common';
import {Request} from 'express';
import {Db} from '../../common/db';
import {Auth} from '../auth/auth';
@Injectable()
export class CustomerService {
 constructor(private db:Db,private auth:Auth){}
 async favorites(req:Request){
  const u=await this.auth.required(req);return (await this.db.query('SELECT p.* FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=$1',[u.id])).rows;
 }
 async add(req:Request,id:string){
  const u=await this.auth.required(req);
  await this.db.query('INSERT INTO favorites(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,Number(id)]);return {ok:true};
 }
 async remove(req:Request,id:string){
  const u=await this.auth.required(req);
  await this.db.query('DELETE FROM favorites WHERE user_id=$1 AND product_id=$2',[u.id,Number(id)]);return {ok:true};
 }
 async history(req:Request){
  const u=await this.auth.required(req);
  return (await this.db.query('SELECT DISTINCT ON (p.id) p.*,h.viewed_at FROM view_history h JOIN products p ON p.id=h.product_id WHERE h.user_id=$1 ORDER BY p.id,h.viewed_at DESC LIMIT 30',[u.id])).rows;
 }
 async addresses(req:Request){
  const u=await this.auth.required(req);return (await this.db.query('SELECT * FROM addresses WHERE user_id=$1',[u.id])).rows;
 }
 async address(req:Request,b:any){
  const u=await this.auth.required(req);
  const parts=['postalCode','region','city','line1','line2'].map(k=>String(b?.[k]||'').trim().slice(0,200));
  if(parts.slice(0,4).some(x=>!x))throw new BadRequestException('Address incomplete');
  return (await this.db.query('INSERT INTO addresses(user_id,postal_code,region,city,line1,line2) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[u.id,...parts])).rows[0];
 }
 async deleteAddress(req:Request,id:string){
  const u=await this.auth.required(req);await this.db.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2',[Number(id),u.id]);return {ok:true};
 }
}
