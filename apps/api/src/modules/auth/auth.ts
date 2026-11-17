import {Inject} from '@nestjs/common';
import {UnauthorizedException,BadRequestException,Injectable} from '@nestjs/common';
import {Request,Response} from 'express';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {AuthRepository,Viewer} from './auth.repository';
export type {Viewer} from './auth.repository';
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
function hashPassword(password:string){
 const salt=randomBytes(16).toString('hex');
 return salt+':'+scryptSync(password,salt,64).toString('hex');
}
function matches(password:string,hash:string){
 const [salt,hex]=hash.split(':');
 if(!salt||!/^[a-f0-9]{128}$/i.test(hex||''))return false;
 return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hex,'hex'));
}
@Injectable()
export class Auth{
 constructor(@Inject(AuthRepository) private readonly repository:AuthRepository){}
 async viewer(req:Request):Promise<Viewer|null>{
  const token=req.cookies?.session;
  if(typeof token!=='string'||token.length<16)return null;
  return this.repository.findSession(digest(token));
 }
 async required(req:Request,admin=false){
  const user=await this.viewer(req);
  if(!user||(admin&&user.role!=='admin'))throw new UnauthorizedException();
  return user;
 }
 private async issue(userId:number,res:Response){
  const token=randomBytes(32).toString('hex');
  await this.repository.createSession(userId,digest(token));
  res.cookie('session',token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:7*86400_000});
 }
 async register(payload:any,res:Response){
  const email=String(payload?.email||'').trim().toLowerCase(),name=String(payload?.name||'').trim(),password=String(payload?.password||'');
  if(!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email)||name.length<1||name.length>150||password.length<10||password.length>200)throw new BadRequestException('有効なメール・名前・10文字以上のパスワードを入力してください');
  try{
   const user=await this.repository.create(email,name,hashPassword(password));
   await this.issue(user.id,res);
   return user;
  }catch(error:any){if(error?.code==='23505')throw new BadRequestException('メールアドレスは登録済みです');throw error;}
 }
 async login(payload:any,res:Response){
  const email=String(payload?.email||'').trim().toLowerCase(),password=String(payload?.password||'');
  const user=await this.repository.findByEmail(email);
  if(!user||!matches(password,user.password_hash))throw new UnauthorizedException('メールアドレスまたはパスワードが違います');
  await this.issue(user.id,res);
  return {id:user.id,email:user.email,name:user.name,role:user.role};
 }
 async logout(req:Request,res:Response){
  const token=req.cookies?.session;
  if(typeof token==='string')await this.repository.revokeSession(digest(token));
  res.clearCookie('session',{path:'/'});
  return {ok:true};
 }
}
