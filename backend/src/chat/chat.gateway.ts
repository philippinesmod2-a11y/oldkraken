import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    // minimal logging — no spam
  }

  handleDisconnect(client: Socket) {
    // minimal logging — no spam
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { visitorId: string; visitorName?: string; visitorEmail?: string; role?: string },
  ) {
    if (data.role === 'admin') {
      client.join('admin-room');
      const sessions = await this.chatService.getAllSessions();
      const unread = await this.chatService.getUnreadCount();
      client.emit('sessions', { sessions, unread });
      return;
    }

    const session = await this.chatService.getOrCreateSession(
      data.visitorId,
      data.visitorName,
      data.visitorEmail,
    );
    client.join(`session-${session.id}`);
    client.emit('session', session);

    this.server.to('admin-room').emit('session-updated', {
      session: { ...session, messages: session.messages?.slice(-1) },
    });
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string; sender: 'visitor' | 'admin' },
  ) {
    if (!data.message?.trim()) return;

    const msg = await this.chatService.addMessage(data.sessionId, data.sender, data.message.trim());

    this.server.to(`session-${data.sessionId}`).emit('new-message', msg);
    this.server.to('admin-room').emit('new-message', msg);

    if (data.sender === 'visitor') {
      const unread = await this.chatService.getUnreadCount();
      this.server.to('admin-room').emit('unread-count', unread);
    }
  }

  @SubscribeMessage('admin-reply')
  async handleAdminReply(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    if (!data.message?.trim()) return;

    const msg = await this.chatService.addMessage(data.sessionId, 'admin', data.message.trim());

    this.server.to(`session-${data.sessionId}`).emit('new-message', msg);
    this.server.to('admin-room').emit('new-message', msg);
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    await this.chatService.markSessionRead(data.sessionId);
    const unread = await this.chatService.getUnreadCount();
    this.server.to('admin-room').emit('unread-count', unread);
  }

  @SubscribeMessage('load-messages')
  async handleLoadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const messages = await this.chatService.getSessionMessages(data.sessionId);
    client.emit('messages', { sessionId: data.sessionId, messages });
  }

  @SubscribeMessage('close-session')
  async handleCloseSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    await this.chatService.closeSession(data.sessionId);
    this.server.to(`session-${data.sessionId}`).emit('session-closed', { sessionId: data.sessionId });
    const sessions = await this.chatService.getAllSessions();
    this.server.to('admin-room').emit('sessions', { sessions, unread: await this.chatService.getUnreadCount() });
  }

  @SubscribeMessage('delete-session')
  async handleDeleteSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    await this.chatService.deleteSession(data.sessionId);
    const sessions = await this.chatService.getAllSessions();
    this.server.to('admin-room').emit('sessions', { sessions, unread: await this.chatService.getUnreadCount() });
  }

  @SubscribeMessage('get-sessions')
  async handleGetSessions(@ConnectedSocket() client: Socket) {
    const sessions = await this.chatService.getAllSessions();
    const unread = await this.chatService.getUnreadCount();
    client.emit('sessions', { sessions, unread });
  }
}
