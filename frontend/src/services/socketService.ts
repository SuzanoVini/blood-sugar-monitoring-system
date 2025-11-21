// frontend/src/services/socketService.ts
// Author: Gemini
// Purpose: Manages the client-side WebSocket connection and real-time event handling.

import { io, Socket } from 'socket.io-client';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  patientId?: number;
  specialistId?: number;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  private token: string | null = null;

  /**
   * Initializes and connects to the Socket.IO server.
   * @param userId The ID of the current authenticated user.
   * @param token The JWT token for authentication.
   */
  public connect(userId: number, token: string): void {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected.');
      return;
    }

    this.userId = userId;
    this.token = token;

    // Connect to the backend Socket.IO server
    // Note: The backend server.js needs to be updated to initialize socketManager.
    this.socket = io('http://localhost:5000', { // Assuming backend runs on port 5000
      extraHeaders: {
        Authorization: `Bearer ${this.token}` // Send JWT for authentication if backend handles it this way
      }
    });

    this.socket.on('connect', () => {
      console.log(`Connected to Socket.IO server with socket ID: ${this.socket?.id}`);
      // Register the user with the backend socketManager
      this.socket?.emit('register', this.userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server.');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });

    // Handle generic 'notification' events
    this.socket.on('notification', (data: NotificationData) => {
      console.log('Received real-time notification:', data);
      // Here you might want to dispatch a global event or update a store
      // For now, we'll just log and rely on components listening.
      this.notifyListeners(data);
    });
  }

  /**
   * Disconnects from the Socket.IO server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.token = null;
    }
  }

  /**
   * Subscribes a listener to incoming notifications.
   * @param listener A callback function that receives NotificationData.
   */
  public onNotification(listener: (data: NotificationData) => void): void {
    if (this.socket) {
      this.socket.on('notification', listener);
    }
  }

  /**
   * Removes a notification listener.
   * @param listener The callback function to remove.
   */
  public offNotification(listener: (data: NotificationData) => void): void {
    if (this.socket) {
      this.socket.off('notification', listener);
    }
  }

  public onNewAlert(listener: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('new_alert', listener);
    }
  }

  /**
   * Removes a new alert listener.
   * @param listener The callback function to remove.
   */
  public offNewAlert(listener: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.off('new_alert', listener);
    }
  }

  // Internal method to notify all subscribed listeners
  private notifyListeners(data: NotificationData): void {
    // This is a simple implementation. For a more robust solution,
    // consider using an EventEmitter pattern within this class or a global state manager.
    // For now, listeners are registered via onNotification directly on the socket.
    // The socket.on('notification', ...) above already notifies.
  }

  // Optionally, you might want a way to emit events from the frontend
  public emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }
}

// Export a singleton instance of the service
const socketService = new SocketService();
export default socketService;
