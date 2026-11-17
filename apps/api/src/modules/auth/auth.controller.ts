import {Inject} from '@nestjs/common';
import {Controller,Post,Get,Body,Req,Res} from '@nestjs/common';
import {Request,Response} from 'express';
import {Auth} from './auth';
@Controller('auth')
export class AuthController{
 constructor(@Inject(Auth) private readonly auth:Auth){}
 @Post('register') register(@Body() body:any,@Res({passthrough:true}) res:Response){return this.auth.register(body,res);}
 @Post('login') login(@Body() body:any,@Res({passthrough:true}) res:Response){return this.auth.login(body,res);}
 @Get('me') me(@Req() req:Request){return this.auth.viewer(req);}
 @Post('logout') logout(@Req() req:Request,@Res({passthrough:true}) res:Response){return this.auth.logout(req,res);}
}
