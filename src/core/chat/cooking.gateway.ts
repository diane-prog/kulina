import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { AiService } from '../ai/ai.service';
import { RecipesService } from '../recipes/recipes.service';
import { SessionsService } from '../sessions/sessions.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@WebSocketGateway({ namespace: '/cooking', cors: { origin: true } })
export class CookingGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly timers = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly configService: ConfigService,
        private readonly sessionsService: SessionsService,
        private readonly recipesService: RecipesService,
        private readonly aiService: AiService,
    ) {}

    /**
     * Authenticates a socket connection with a JWT.
     *
     * @param client - Connected socket
     */
    handleConnection(client: Socket): void {
        const rawToken =
            client.handshake.auth?.token ??
            client.handshake.headers.authorization ??
            client.handshake.query.token;
        const token =
            typeof rawToken === 'string' ? rawToken.replace('Bearer ', '') : '';

        try {
            const payload = jwt.verify(
                token,
                this.configService.getOrThrow<string>('auth.jwtSecret'),
            ) as { id: string };
            client.data.user = { id: payload.id };
        } catch {
            client.emit('chat:error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    /**
     * Handles a socket disconnection.
     *
     * @param client - Disconnected socket
     */
    handleDisconnect(client: Socket): void {
        client.disconnect();
    }

    /**
     * Joins a session room and returns the current session state.
     *
     * @param client - Connected socket
     * @param body - Session payload
     * @returns The session state
     */
    @SubscribeMessage('session:join')
    async joinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { sessionId: string },
    ) {
        const session = await this.sessionsService.findOne(
            body.sessionId,
            client.data.user.id,
        );
        client.join(`session:${body.sessionId}`);

        return { event: 'session:state', data: session };
    }

    /**
     * Moves to the next step of a session.
     *
     * @param client - Connected socket
     * @param body - Session payload
     * @returns The updated session state
     */
    @SubscribeMessage('step:next')
    async nextStep(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { sessionId: string },
    ) {
        const session = await this.sessionsService.nextStep(
            body.sessionId,
            client.data.user.id,
        );
        this.emitSessionState(body.sessionId, session);

        return { event: 'session:state', data: session };
    }

    /**
     * Sets the current step of a session.
     *
     * @param client - Connected socket
     * @param body - Session and position payload
     * @returns The updated session state
     */
    @SubscribeMessage('step:set')
    async setStep(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { sessionId: string; position: number },
    ) {
        const session = await this.sessionsService.updateStep(
            body.sessionId,
            client.data.user.id,
            { position: body.position },
        );
        this.emitSessionState(body.sessionId, session);

        return { event: 'session:state', data: session };
    }

    /**
     * Marks the step timer as started.
     *
     * @param client - Connected socket
     * @param body - Session and position payload
     * @returns The updated session state
     */
    @SubscribeMessage('timer:start')
    async startTimer(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { sessionId: string; position: number },
    ) {
        const session = await this.sessionsService.updateStep(
            body.sessionId,
            client.data.user.id,
            { position: body.position },
        );
        const recipe = await this.recipesService.findOne(
            session.recipe.id,
            true,
        );
        const step = recipe.steps.find(
            (item: any) => item.position === body.position,
        );
        const idealSeconds = step?.idealSeconds ?? 0;

        const previousTimer = this.timers.get(body.sessionId);
        if (previousTimer) {
            clearTimeout(previousTimer);
        }

        if (idealSeconds > 0) {
            const timer = setTimeout(() => {
                this.server.to(`session:${body.sessionId}`).emit('timer:done', {
                    sessionId: body.sessionId,
                    position: body.position,
                    idealSeconds,
                });
                this.timers.delete(body.sessionId);
            }, idealSeconds * 1000);
            this.timers.set(body.sessionId, timer);
        }

        this.emitSessionState(body.sessionId, session);

        return { event: 'session:state', data: session };
    }

    /**
     * Pauses the server-side timer notification.
     *
     * @param body - Session payload
     * @returns A timer paused acknowledgement
     */
    @SubscribeMessage('timer:pause')
    pauseTimer(@MessageBody() body: { sessionId: string }) {
        const timer = this.timers.get(body.sessionId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(body.sessionId);
        }

        return { event: 'timer:paused', data: { paused: true } };
    }

    /**
     * Handles a chat message and emits the assistant answer.
     *
     * @param client - Connected socket
     * @param body - Chat payload
     * @returns The assistant answer
     */
    @SubscribeMessage('chat:message')
    async chat(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: ChatMessageDto,
    ) {
        try {
            const result = await this.aiService.chatStream(
                body.sessionId,
                client.data.user.id,
                body.text,
                (chunk) => {
                    this.server
                        .to(`session:${body.sessionId}`)
                        .emit('chat:chunk', { text: chunk });
                },
            );
            this.server
                .to(`session:${body.sessionId}`)
                .emit('chat:done', result);
            this.server.to(`session:${body.sessionId}`).emit('quota:update', {
                chat: result.remainingQuota,
            });

            return { event: 'chat:done', data: result };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AI error';
            client.emit('chat:error', { message });

            return { event: 'chat:error', data: { message } };
        }
    }

    /**
     * Runs a premium photo check.
     *
     * @param client - Connected socket
     * @param body - Photo payload
     * @returns The photo check result
     */
    @SubscribeMessage('photo:check')
    async photoCheck(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { sessionId: string; publicId: string },
    ) {
        try {
            const result = await this.aiService.photoCheck(
                body.sessionId,
                client.data.user.id,
                body.publicId,
            );
            this.server
                .to(`session:${body.sessionId}`)
                .emit('chat:done', result);
            this.server.to(`session:${body.sessionId}`).emit('quota:update', {
                photo: result.remainingQuota,
            });

            return { event: 'chat:done', data: result };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Photo check error';
            client.emit('chat:error', { message });

            return { event: 'chat:error', data: { message } };
        }
    }

    /**
     * Emits the session state to the session room.
     *
     * @param sessionId - Session identifier
     * @param session - Session state
     */
    private emitSessionState(sessionId: string, session: unknown): void {
        this.server.to(`session:${sessionId}`).emit('session:state', session);
    }
}
