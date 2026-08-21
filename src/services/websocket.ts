export interface WebSocketChatMessage {
  id: string;
  senderId: string;
  channelId?: string | null;
  recipientId?: string | null;
  text: string;
  timestamp: string;
}

type MessageCallback = (msg: WebSocketChatMessage) => void;

class ERPWebSocketService {
  private ws: WebSocket | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private isConnecting: boolean = false;
  private reconnectInterval: any = null;

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = window.location.protocol === 'https:' 
      ? 'wss://' + window.location.hostname + ':5000' 
      : 'ws://localhost:5000';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('⚡ [Frontend WebSocket] Connected to ERP Live Chat WebSocket Server');
        this.isConnecting = false;
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_CHAT_MESSAGE' && data.message) {
            this.notifyListeners(data.message);
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('⚡ [Frontend WebSocket] Closed. Attempting reconnect...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection attempt failed. Reconnecting in background...');
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        this.connect();
      }, 5000);
    }
  }

  public sendMessage(payload: { senderId: string; text: string; channelId?: string | null; recipientId?: string | null }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        ...payload
      }));
    } else {
      console.warn('WebSocket not open. Retrying connection...');
      this.connect();
    }
  }

  public onMessage(callback: MessageCallback) {
    this.messageCallbacks.add(callback);
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  private notifyListeners(msg: WebSocketChatMessage) {
    this.messageCallbacks.forEach(cb => cb(msg));
  }
}

export const webSocketService = new ERPWebSocketService();
