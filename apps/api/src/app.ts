import 'reflect-metadata';
import {Module,NestModule,MiddlewareConsumer,Global} from '@nestjs/common';
import {Db} from './common/db';
import {CacheService} from './common/cache';
import {Auth,AuthController} from './modules/auth/auth';
import {ProductsController} from './modules/catalog/products';
import {ProductsService} from './modules/catalog/products.service';
import {CatalogRepository} from './modules/catalog/catalog.repository';
import {OrdersController} from './modules/checkout/orders';
import {OrdersService} from './modules/checkout/orders.service';
import {CustomerController} from './modules/customer/customer';
import {CustomerService} from './modules/customer/customer.service';
import {AdminController} from './modules/admin/admin';
import {AdminService} from './modules/admin/admin.service';
import {DiscoveryController} from './modules/catalog/discovery';
import {MediaController,AdminUploadGuard} from './modules/admin/media';
import {JobsController} from './modules/admin/jobs';
import {GuestController} from './modules/checkout/guest';
import {SecurityMiddleware} from './common/security';
@Global()
@Module({providers:[Db,CacheService],exports:[Db,CacheService]})
class InfrastructureModule{}
@Global()
@Module({imports:[InfrastructureModule],providers:[Auth],controllers:[AuthController],exports:[Auth]})
class AuthModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[ProductsService,CatalogRepository],controllers:[ProductsController,DiscoveryController]})
class CatalogModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[OrdersService],controllers:[OrdersController,GuestController]})
class CheckoutModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[CustomerService],controllers:[CustomerController]})
class CustomerModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[AdminUploadGuard,AdminService],controllers:[AdminController,MediaController,JobsController]})
class AdminModule{}
@Module({imports:[InfrastructureModule,AuthModule,CatalogModule,CheckoutModule,CustomerModule,AdminModule]})
export class AppModule implements NestModule{configure(consumer:MiddlewareConsumer){consumer.apply(SecurityMiddleware).forRoutes('*');}}
