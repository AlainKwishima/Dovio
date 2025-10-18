// @ts-nocheck
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  WebSocketMessage,
  TypingIndicator,
} from '@/types/api';
import { ErrorHandler, withLoadingState, handleApiError } from '../utils/errorHandler';
import { API_CONFIG } from '../config/api';

interface MessagingState {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  
  // WebSocket connection
  isConnected: boolean;
  connectionError: string | null;
  
  // Loading states
  isLoadingConversations: boolean;
  isLoadingMessages: Record<string, boolean>;
  isSendingMessage: Record<string, boolean>;
  
  // Typing indicators
  typingUsers: Record<string, string[]>; // conversationId -> array of user IDs typing
  
  // Error handling
  messagingError: string | null;
  
  // Conversation operations
  createConversation: (conversationData: CreateConversationRequest) => Promise<ConversationResponse | null>;
  getConversations: () => Promise<void>;
  setActiveConversation: (conversation: ConversationResponse | null) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  
  // Message operations
  getMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (conversationId: string, messageData: SendMessageRequest) => Promise<MessageResponse | null>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  
  // Typing indicators
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  
  // WebSocket operations
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  
  // Utility
  refreshConversations: () => Promise<void>;
  clearError: () => void;
}

export const [MessagingProvider, useMessaging] = createContextHook<MessagingState>(() => {
  // Conversation and message state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  
  // Loading states
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<Record<string, boolean>>({});
  const [isSendingMessage, setIsSendingMessage] = useState<Record<string, boolean>>({});
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutRef = useRef<Record<string, number>>({});
  
  // Error handling
  const [messagingError, setMessagingError] = useState<string | null>(null);
  
  // Initialize messaging on mount
  useEffect(() => {
    const initializeMessaging = async () => {
      await getConversations();
      connectWebSocket();
    };
    
    initializeMessaging();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);
  
  // WebSocket operations
  const connectWebSocket = useCallback(() => {
    try {
      const token = ''; // Get from auth context or storage
      const wsUrl = `${API_CONFIG.WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection failed');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionError('Failed to establish connection');
    }
  }, []);
  
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    setIsConnected(false);
  }, []);
  
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_message':
        if (message.data) {
          const newMessage = message.data as Message;
          setMessages(prev => ({
            ...prev,
            [newMessage.conversationId]: [
              ...(prev[newMessage.conversationId] || []),
              newMessage
            ]
          }));
          
          // Update unread count if not in active conversation
          if (activeConversation?.id !== newMessage.conversationId) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.conversationId]: (prev[newMessage.conversationId] || 0) + 1
            }));
          }
          
          // Update conversation's last message
          setConversations(prev => prev.map(conv => 
            conv.id === newMessage.conversationId 
              ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.createdAt }
              : conv
          ));
        }
        break;
        
      case 'message_read':
        if (message.data?.conversationId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.data.conversationId]: 0
          }));
        }
        break;
        
      case 'typing_start':
        if (message.data?.conversationId && message.data?.userId) {
          const { conversationId, userId } = message.data;
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), userId].filter((id, index, arr) => arr.indexOf(id) === index)
          }));
          
          // Clear existing timeout for this user
          const timeoutKey = `${conversationId}_${userId}`;
          if (typingTimeoutRef.current[timeoutKey]) {
            clearTimeout(typingTimeoutRef.current[timeoutKey]);
          }
          
          // Set timeout to remove typing indicator
          typingTimeoutRef.current[timeoutKey] = setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
            }));
            delete typingTimeoutRef.current[timeoutKey];
          }, 3000);
        }
        break;
        
      case 'typing_stop':
        if (message.data?.conversationId && message.data?.userId) {
          const { conversationId, userId } = message.data;
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
          }));
          
          // Clear timeout
          const timeoutKey = `${conversationId}_${userId}`;
          if (typingTimeoutRef.current[timeoutKey]) {
            clearTimeout(typingTimeoutRef.current[timeoutKey]);
            delete typingTimeoutRef.current[timeoutKey];
          }
        }
        break;
        
      case 'conversation_updated':
        if (message.data) {
          const updatedConversation = message.data as ConversationResponse;
          setConversations(prev => prev.map(conv => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          ));
        }
        break;
        
      case 'pong':
        // Heartbeat response - connection is alive
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  }, [activeConversation]);
  
  // Conversation operations
  const createConversation = useCallback(async (conversationData: CreateConversationRequest): Promise<Conversation | null> => {
    return withLoadingState(async () => {
      const response = await api.createConversation(conversationData);
      if (response?.data) {
        setConversations(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    }, setIsLoadingConversations, setMessagingError);
  }, []);
  
  const getConversations = useCallback(async (): Promise<void> => {
    await withLoadingState(async () => {
      const response = await api.getConversations();
      if (response?.data) {
        setConversations(response.data);
        
        // Initialize unread counts
        const counts: Record<string, number> = {};
        response.data.forEach(conv => {
          counts[conv.id] = conv.unreadCount || 0;
        });
        setUnreadCounts(counts);
      }
    }, setIsLoadingConversations, setMessagingError);
  }, []);
  
  const setActiveConversation = useCallback((conversation: Conversation | null) => {
    setActiveConversationState(conversation);
    
    // Load messages for the conversation if not already loaded
    if (conversation && !messages[conversation.id]) {
      getMessages(conversation.id);
    }
    
    // Mark messages as read
    if (conversation) {
      markMessagesAsRead(conversation.id);
    }
  }, [messages]);
  
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    return withLoadingState(async () => {
      const success = await api.deleteConversation(conversationId);
      if (success) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        setMessages(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
        
        if (activeConversation?.id === conversationId) {
          setActiveConversationState(null);
        }
        return true;
      }
      return false;
    }, setIsLoadingConversations, setMessagingError);
  }, [activeConversation]);
  
  // Message operations
  const getMessages = useCallback(async (conversationId: string, page: number = 1): Promise<void> => {
    setIsLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const response = await api.getMessages(conversationId, { page, limit: 50 });
      if (response?.data) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: page === 1 ? response.data : [...(prev[conversationId] || []), ...response.data]
        }));
      }
    } catch (error) {
      handleApiError(error, setMessagingError);
    } finally {
      setIsLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);
  
  const sendMessage = useCallback(async (conversationId: string, messageData: SendMessageRequest): Promise<Message | null> => {
    setIsSendingMessage(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      const response = await api.sendMessage(conversationId, messageData);
      if (response?.data) {
        // Don't add to local state here - WebSocket will handle it
        return response.data;
      }
      return null;
    } catch (error) {
      handleApiError(error, setMessagingError);
      return null;
    } finally {
      setIsSendingMessage(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);
  
  const markMessagesAsRead = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await api.markMessagesAsRead(conversationId);
      setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
    } catch (error) {
      handleApiError(error, setMessagingError);
    }
  }, []);
  
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const success = await api.deleteMessage(messageId);
      if (success) {
        // Remove message from all conversations
        setMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(conversationId => {
            updated[conversationId] = updated[conversationId].filter(msg => msg.id !== messageId);
          });
          return updated;
        });
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setMessagingError);
      return false;
    }
  }, []);
  
  const editMessage = useCallback(async (messageId: string, content: string): Promise<boolean> => {
    try {
      const response = await api.editMessage(messageId, { content });
      if (response?.data) {
        // Update message in all conversations
        setMessages(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(conversationId => {
            updated[conversationId] = updated[conversationId].map(msg => 
              msg.id === messageId ? response.data : msg
            );
          });
          return updated;
        });
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(error, setMessagingError);
      return false;
    }
  }, []);
  
  // Typing indicators
  const startTyping = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        data: { conversationId }
      }));
    }
  }, []);
  
  const stopTyping = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing_stop',
        data: { conversationId }
      }));
    }
  }, []);
  
  // Utility functions
  const refreshConversations = useCallback(async (): Promise<void> => {
    await getConversations();
  }, [getConversations]);
  
  const clearError = useCallback(() => {
    setMessagingError(null);
    setConnectionError(null);
  }, []);
  
  return useMemo(
    () => ({
      // Conversations
      conversations,
      activeConversation,
      messages,
      unreadCounts,
      
      // WebSocket connection
      isConnected,
      connectionError,
      
      // Loading states
      isLoadingConversations,
      isLoadingMessages,
      isSendingMessage,
      
      // Typing indicators
      typingUsers,
      
      // Error handling
      messagingError,
      
      // Conversation operations
      createConversation,
      getConversations,
      setActiveConversation,
      deleteConversation,
      
      // Message operations
      getMessages,
      sendMessage,
      markMessagesAsRead,
      deleteMessage,
      editMessage,
      
      // Typing indicators
      startTyping,
      stopTyping,
      
      // WebSocket operations
      connectWebSocket,
      disconnectWebSocket,
      
      // Utility
      refreshConversations,
      clearError,
    }),
    [
      conversations,
      activeConversation,
      messages,
      unreadCounts,
      isConnected,
      connectionError,
      isLoadingConversations,
      isLoadingMessages,
      isSendingMessage,
      typingUsers,
      messagingError,
      createConversation,
      getConversations,
      setActiveConversation,
      deleteConversation,
      getMessages,
      sendMessage,
      markMessagesAsRead,
      deleteMessage,
      editMessage,
      startTyping,
      stopTyping,
      connectWebSocket,
      disconnectWebSocket,
      refreshConversations,
      clearError,
    ]
  );
});