import 'reflect-metadata';
import {Module,NestModule,MiddlewareConsumer,Global} from '@nestjs/common';
import {Db} from './common/db';
import {CacheService} from './common/cache';
import {Auth} from './modules/auth/auth';
import {AuthController} from './modules/auth/auth.controller';
import {AuthRepository} from './modules/auth/auth.repository';
import {ProductsController} from './modules/catalog/products';
import {ProductsService} from './modules/catalog/products.service';
import {CatalogRepository} from './modules/catalog/catalog.repository';
import {OrdersController} from './modules/checkout/orders';
import {OrdersService} from './modules/checkout/orders.service';
import {OrdersRepository} from './modules/checkout/orders.repository';
import {CustomerController} from './modules/customer/customer';
import {CustomerService} from './modules/customer/customer.service';
import {CustomerRepository} from './modules/customer/customer.repository';
import {AdminController} from './modules/admin/admin';
import {AdminService} from './modules/admin/admin.service';
import {AdminRepository} from './modules/admin/admin.repository';
import {DiscoveryController} from './modules/catalog/discovery';
import {DiscoveryService} from './modules/catalog/discovery.service';
import {DiscoveryRepository} from './modules/catalog/discovery.repository';
import {MediaController,AdminUploadGuard} from './modules/admin/media';
import {JobsController} from './modules/admin/jobs';
import {JobsService} from './modules/admin/jobs.service';
import {JobsRepository} from './modules/admin/jobs.repository';
import {GuestController} from './modules/checkout/guest';
import {GuestService} from './modules/checkout/guest.service';
import {GuestRepository} from './modules/checkout/guest.repository';
import {SecurityMiddleware} from './common/security';
@Global()
@Module({providers:[Db,CacheService],exports:[Db,CacheService]})
class InfrastructureModule{}
@Global()
@Module({imports:[InfrastructureModule],providers:[Auth,AuthRepository],controllers:[AuthController],exports:[Auth]})
class AuthModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[ProductsService,CatalogRepository,DiscoveryService,DiscoveryRepository],controllers:[ProductsController,DiscoveryController]})
class CatalogModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[OrdersService,OrdersRepository,GuestService,GuestRepository],controllers:[OrdersController,GuestController]})
class CheckoutModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[CustomerService,CustomerRepository],controllers:[CustomerController]})
class CustomerModule{}
@Module({imports:[InfrastructureModule,AuthModule],providers:[AdminUploadGuard,AdminService,AdminRepository,JobsService,JobsRepository],controllers:[AdminController,MediaController,JobsController]})
class AdminModule{}
@Module({imports:[InfrastructureModule,AuthModule,CatalogModule,CheckoutModule,CustomerModule,AdminModule]})
export class AppModule implements NestModule{configure(consumer:MiddlewareConsumer){consumer.apply(SecurityMiddleware).forRoutes('*');}}
