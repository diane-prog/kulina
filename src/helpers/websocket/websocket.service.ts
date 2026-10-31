import { Inject, Injectable } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
@WebSocketGateway({ cors: { origin: true } })
export class WebsocketService
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}

    /**
     * Logs a new client connection.
     *
     * @param client - Connected socket
     * @returns The connected socket
     */
    handleConnection(client: Socket): Socket {
        this.logger.info(`Client connected: ${client.id}`);
        return client;
    }

    /**
     * Logs a client disconnection.
     *
     * @param client - Disconnected socket
     * @returns The disconnected socket
     */
    handleDisconnect(client: Socket): Socket {
        this.logger.info(`Client disconnected: ${client.id}`);
        return client.disconnect();
    }

    /**
     * Emits a global event to all connected clients.
     *
     * @param data - Event payload
     * @param eventTitle - Event name
     * @returns The emitted event
     */
    sendData<T>(data: T, eventTitle: string): boolean {
        this.logger.info(`Emitting ${eventTitle}`);
        return this.server.emit(eventTitle, data);
    }

    /**
     * Emits an event to a specific namespace.
     *
     * @param data - Event payload
     * @param eventTitle - Event name
     * @param eventRoute - Namespace path
     * @returns The emitted event
     */
    sendDataToRoom<T>(
        data: T,
        eventTitle: string,
        eventRoute: string,
    ): boolean {
        this.logger.info(`Emitting ${eventTitle} on ${eventRoute}`);
        return this.server.of(eventRoute).emit(eventTitle, data);
    }
}
