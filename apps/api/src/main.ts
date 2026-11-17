import {NestFactory} from '@nestjs/core';
import cookieParser from 'cookie-parser';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import {AppModule} from './app';
async function bootstrap(){
 const app=await NestFactory.create(AppModule);
 app.use(cookieParser());
 app.enableCors({origin:'http://localhost:3000',credentials:true});
 SwaggerModule.setup('docs',app,SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('EC Clone API').setVersion('0.1').build()));
 await app.listen(Number(process.env.PORT||4000),'0.0.0.0');
}
bootstrap();
