import 'reflect-metadata';
import {Module} from '@nestjs/common';
import {Db} from './db';
import {Auth,AuthController} from './auth';
import {ProductsController} from './products';
import {OrdersController} from './orders';
import {CustomerController} from './customer';
@Module({providers:[Db,Auth],controllers:[AuthController,ProductsController,OrdersController,CustomerController]})
export class AppModule {}
