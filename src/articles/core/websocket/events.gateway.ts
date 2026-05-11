import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Клиент подключился: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Клиент отключился: ${client.id}`);
    }

    // Клиент может подписаться на события статьи
    @SubscribeMessage('subscribe-article')
    handleSubscribeArticle(client: Socket, articleId: string) {
        client.join(`article:${articleId}`);
        this.logger.log(`Клиент ${client.id} подписался на статью ${articleId}`);
    }

    // Клиент может подписаться на все события
    @SubscribeMessage('subscribe-all')
    handleSubscribeAll(client: Socket) {
        client.join('all-events');
        this.logger.log(`Клиент ${client.id} подписался на все события`);
    }
}