import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    //namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    // Хранилище клиентов: clientId -> WebSocket
    private clients = new Map<string, WebSocket>();

    // Хранилище подписок: clientId -> Set<topic>
    private clientSubscriptions = new Map<string, Set<string>>();

    handleConnection(@ConnectedSocket() client: WebSocket) {
        const clientId = this.generateClientId();
        this.clients.set(clientId, client);
        this.clientSubscriptions.set(clientId, new Set());
        this.logger.log(`Клиент подключился: ${clientId}`);
    }

    handleDisconnect(@ConnectedSocket() client: WebSocket) {
        const clientId = this.getClientId(client);
        if (clientId) {
            this.clients.delete(clientId);
            this.clientSubscriptions.delete(clientId);
            this.logger.log(`Клиент отключился: ${clientId}`);
        }
    }

    @SubscribeMessage('subscribe-article')
    handleSubscribeArticle(@ConnectedSocket() client: WebSocket, @MessageBody() articleId: string) {
        const clientId = this.getClientId(client);
        if (!clientId) return;

        const subscriptions = this.clientSubscriptions.get(clientId);
        if (subscriptions) {
            subscriptions.add(`article:${articleId}`);
        }
        this.logger.log(`Клиент ${clientId} подписался на статью ${articleId}`);
        client.send(JSON.stringify({
            event: 'subscribed',
            topic: articleId,
            clientId
        }));
    }

    @SubscribeMessage('unsubscribe-article')
    handleUnsubscribeArticle(@ConnectedSocket() client: WebSocket, @MessageBody() articleId: string) {
        const clientId = this.getClientId(client);
        if (!clientId) return;

        const subscriptions = this.clientSubscriptions.get(clientId);
        if (subscriptions) {
            subscriptions.delete(`article:${articleId}`);
        }
        this.logger.log(`Клиент ${clientId} отписался от статьи ${articleId}`);
        client.send(JSON.stringify({
            event: 'unsubscribed',
            topic: articleId,
            clientId
        }));
    }

    @SubscribeMessage('subscribe-all')
    handleSubscribeAll(@ConnectedSocket() client: WebSocket) {
        const clientId = this.getClientId(client);
        if (!clientId) return;

        const subscriptions = this.clientSubscriptions.get(clientId);
        if (subscriptions) {
            subscriptions.add('all-events');
        }
        this.logger.log(`Клиент ${clientId} подписался на все события`);
    }

    // Метод для отправки события конкретному клиенту
    sendToClient(clientId: string, event: string, data: any) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({ event, ...data }));
        }
    }

    // Метод для отправки события всем клиентам в подписке
    sendToTopic(topic: string, event: string, data: any) {
        for (const [clientId, subscriptions] of this.clientSubscriptions.entries()) {
            if (subscriptions.has(topic) || subscriptions.has('all-events')) {
                this.sendToClient(clientId, event, data);
            }
        }
    }

    private generateClientId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    private getClientId(client: WebSocket): string | null {
        for (const [clientId, ws] of this.clients.entries()) {
            if (ws === client) return clientId;
        }
        return null;
    }
}