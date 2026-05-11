import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });

    const config = new DocumentBuilder()
        .setTitle('Blog API')
        .setDescription('API документация')
        .setVersion('1.0')
        //.addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.useWebSocketAdapter(new WsAdapter(app));
    await app.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
        console.log('Swagger docs available at http://localhost:3000/api/docs');
    });
}
bootstrap();
