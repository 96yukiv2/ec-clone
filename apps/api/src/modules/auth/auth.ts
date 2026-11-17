import { Controller, Post, Get, Body, Req, Res, UnauthorizedException, BadRequestException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { Db } from '../../common/db';
export type Viewer = { id: number; email: string; name: string; role: string };
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password,salt,64).toString('hex');
}
function verifyPassword(password: string, value: string) {
  const [salt, hex] = value.split(':');
  if (!salt || !hex || hex.length !== 128) return false;
  return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hex,'hex'));
}
@Injectable()
export class Auth {
  constructor(private readonly db: Db) {}
  async viewer(req: Request): Promise<Viewer | null> {
    const token = req.cookies?.session;
    if (!token || typeof token !== 'string') return null;
    const r = await this.db.query<Viewer>(
      'SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',
      [digest(token)]
    );
    return r.rows[0] || null;
  }
  async required(req: Request, admin = false) {
    const user = await this.viewer(req);
    if (!user || (admin && user.role !== 'admin')) throw new UnauthorizedException();
    return user;
  }
  async issue(userId: number, res: Response) {
    const token = randomBytes(32).toString('hex');
    await this.db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+ interval '7 days')",[digest(token),userId]);
    res.cookie('session',token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:7*86400_000});
  }
}
@Controller('auth')
export class AuthController {
  constructor(private readonly db: Db, private readonly auth: Auth) {}
  @Post('register')
  async register(@Body() b: any, @Res({passthrough:true}) res: Response) {
    const email = String(b?.email||'').trim().toLowerCase();
    const name = String(b?.name||'').trim();
    const password = String(b?.password||'');
    if (!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(email)||name.length<1||password.length<10) throw new BadRequestException('Valid email, name and password of 10+ chars required');
    try {
      const r=await this.db.query<Viewer>('INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role',[email,name,hashPassword(password)]);
      await this.auth.issue(r.rows[0].id,res); return r.rows[0];
    } catch(e:any) { if(e.code==='23505') throw new BadRequestException('Email already registered'); throw e; }
  }
  @Post('login')
  async login(@Body() b:any,@Res({passthrough:true}) res:Response) {
    const r=await this.db.query<Viewer & { password_hash:string }>('SELECT id,email,name,role,password_hash FROM users WHERE email=$1',[String(b?.email||'').toLowerCase()]);
    const u=r.rows[0];
    if(!u || !verifyPassword(String(b?.password||''),u.password_hash)) throw new UnauthorizedException('Invalid credentials');
    await this.auth.issue(u.id,res); return {id:u.id,email:u.email,name:u.name,role:u.role};
  }
  @Get('me') async me(@Req() req:Request) { return this.auth.viewer(req); }
  @Post('logout') async logout(@Req() req:Request,@Res({passthrough:true}) res:Response) {
    if(req.cookies?.session) await this.db.query('DELETE FROM sessions WHERE token_hash=$1',[digest(req.cookies.session)]);
    res.clearCookie('session',{path:'/'}); return {ok:true};
  }
}
