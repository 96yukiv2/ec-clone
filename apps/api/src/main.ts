import {NestFactory} from '@nestjs/core';
import cookieParser from 'cookie-parser';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import express from 'express';
import {join} from 'node:path';
import {AppModule} from './app';
async function bootstrap(){
 const app=await NestFactory.create(AppModule,{bodyParser:true});
 app.use(cookieParser());
 app.use('/uploads',express.static(process.env.UPLOAD_DIR||join(process.cwd(),'uploads'),{index:false,maxAge:'1h'}));
 app.enableCors({origin:'http://localhost:3000',credentials:true});
 SwaggerModule.setup('docs',app,SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('EC Clone API').setVersion('0.2').build()));
 await app.listen(Number(process.env.PORT||4000),'0.0.0.0');
}
bootstrap();
