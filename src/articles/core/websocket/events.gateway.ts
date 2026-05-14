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

    @SubscribeMessage('subscribe-article')
    handleSubscribeArticle(client: Socket, articleId: string) {
        client.join(`article:${articleId}`);

        this.logger.log(`Клиент ${client.id} подписался на статью ${articleId}`);
        client.emit('subscribe-article', {
            event: 'subscribed',
            topic: articleId,
            clientId: client.id
        });
    }

    @SubscribeMessage('unsubscribe-article')
    handleUnsubscribeArticle(client: Socket, articleId: string) {
        client.leave(`article:${articleId}`);
        this.logger.log(`Клиент ${client.id} отписался от на статьи ${articleId}`);
        client.emit('unsubscribe-article', {
            event: 'unsubscribe',
            topic: articleId,
            clientId: client.id
        });
    }

    @SubscribeMessage('subscribe-all')
    handleSubscribeAll(client: Socket) {
        client.join('all-events');
        this.logger.log(`Клиент ${client.id} подписался на все события`);
        client.emit('subscribe-all', {
            event: 'subscribed',
            clientId: client.id
        });
    }

    sendToTopic(topic: string, event: string, data: any) {
        this.server.to(topic).emit(event, data);
    }
}