import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
@Injectable()
export class Db implements OnModuleDestroy {
 readonly pool=new Pool({connectionString:process.env.DATABASE_URL});
 readonly orm=drizzle(this.pool,{schema});
 query<T extends QueryResultRow=QueryResultRow>(sql:string,params:unknown[]=[]){return this.pool.query<T>(sql,params);}
 async transaction<T>(callback:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await this.pool.connect();
  try {await client.query('BEGIN');const result=await callback(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
 }
 async onModuleDestroy(){await this.pool.end();}
}
