import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import {
  addTask,
  updateTaskInStore,
  removeTask,
} from "../store/slices/tasksSlice";
import { tokenStorage } from "../api/axios";
import type { WSMessage, Task } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export const useWebSocket = (projectId: number | null) => {
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!projectId) return;

    const tokens = tokenStorage.getTokens();
    if (!tokens?.access) {
      console.error("No access token available");
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_URL}/projects/${projectId}/?token=${tokens.access}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case "task_created":
            dispatch(addTask(message.data as Task));
            break;
          case "task_updated":
            dispatch(updateTaskInStore(message.data as Task));
            break;
          case "task_deleted":
            dispatch(removeTask((message.data as Task).id));
            break;
          case "comment_created":
            console.log("💬 Новый комментарий:", message.data);
            break;
          default:
            console.warn("⚠️ Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("🔌 WebSocket disconnected:", event.code, event.reason);

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          10000,
        );

        console.log(
          `🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error("❌ Max reconnection attempts reached");
      }
    };

    wsRef.current = ws;
  }, [projectId, dispatch]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect,
    disconnect,
  };
};
