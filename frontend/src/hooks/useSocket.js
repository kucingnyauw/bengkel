// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
};