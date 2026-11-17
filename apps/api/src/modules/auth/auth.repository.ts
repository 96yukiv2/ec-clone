import {Injectable} from '@nestjs/common';
import {Db} from '../../common/db';
export type Viewer={id:number;email:string;name:string;role:string};
export type UserWithPassword=Viewer&{password_hash:string};
@Injectable()
export class AuthRepository{
 constructor(private readonly db:Db){}
 async findSession(hash:string):Promise<Viewer|null>{
  const r=await this.db.query<Viewer>('SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hash]);
  return r.rows[0]||null;
 }
 async createSession(userId:number,hash:string){
  await this.db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+ interval '7 days')",[hash,userId]);
 }
 async revokeSession(hash:string){await this.db.query('DELETE FROM sessions WHERE token_hash=$1',[hash]);}
 async findByEmail(email:string):Promise<UserWithPassword|null>{
  const r=await this.db.query<UserWithPassword>('SELECT id,email,name,role,password_hash FROM users WHERE email=$1',[email]);
  return r.rows[0]||null;
 }
 async create(email:string,name:string,passwordHash:string):Promise<Viewer>{
  const r=await this.db.query<Viewer>('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role',[email,name,passwordHash]);
  return r.rows[0];
 }
}
