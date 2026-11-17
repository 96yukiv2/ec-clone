import {Controller,Get,Inject,ServiceUnavailableException} from '@nestjs/common';
import {Db} from './db';
@Controller('health')
export class HealthController{
 constructor(@Inject(Db) private readonly db:Db){}
 @Get()
 async check(){
  try{await this.db.query('SELECT 1');return {status:'ok',database:'ok'};}
  catch{throw new ServiceUnavailableException('データベース接続不可');}
 }
}
