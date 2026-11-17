import 'reflect-metadata';
import {Module} from '@nestjs/common';
import {Db} from './db';
import {Auth,AuthController} from './auth';
import {ProductsController} from './products';
import {OrdersController} from './orders';
import {CustomerController} from './customer';
import {AdminController} from './admin';
@Module({providers:[Db,Auth],controllers:[AuthController,ProductsController,OrdersController,CustomerController,AdminController]})
export class AppModule {}
