import 'reflect-metadata';
import {Module,NestModule,MiddlewareConsumer,Global} from '@nestjs/common';
import {Db} from './db';
import {CacheService} from './cache';
import {Auth,AuthController} from './auth';
import {ProductsController} from './products';
import {OrdersController} from './orders';
import {OrdersService} from './orders.service';
import {CustomerController} from './customer';
import {AdminController} from './admin';
import {DiscoveryController} from './discovery';
import {MediaController,AdminUploadGuard} from './media';
import {JobsController} from './jobs';
import {GuestController} from './guest';
import {SecurityMiddleware} from './security';
@Global()
@Module({providers:[Db,CacheService],exports:[Db,CacheService]})
class InfrastructureModule{}
@Global()
@Module({imports:[InfrastructureModule],providers:[Auth],controllers:[AuthController],exports:[Auth]})
class AuthModule{}
@Module({imports:[InfrastructureModule,AuthModule],controllers:[ProductsController,DiscoveryController]})
class CatalogModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[OrdersService],controllers:[OrdersController,GuestController]})
class CheckoutModule{}
@Module({imports:[InfrastructureModule,AuthModule],controllers:[CustomerController]})
class CustomerModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[AdminUploadGuard],controllers:[AdminController,MediaController,JobsController]})
class AdminModule{}
@Module({imports:[InfrastructureModule,AuthModule,CatalogModule,CheckoutModule,CustomerModule,AdminModule]})
export class AppModule implements NestModule{configure(consumer:MiddlewareConsumer){consumer.apply(SecurityMiddleware).forRoutes('*');}}
