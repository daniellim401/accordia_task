import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { X, Send, PhoneOff, Minimize2, Maximize2 } from "lucide-react";
import axios from "axios";

const ChatInterface = ({ chatId, onClose }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [typing, setTyping] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatId && socket) {
      socket.emit("joinChat", chatId);
      fetchMessages();

      socket.on("newMessage", handleNewMessage);
      socket.on("chatEnded", handleChatEnded);
      socket.on("userTyping", handleUserTyping);
      socket.on("chatAccepted", handleChatAccepted);

      return () => {
        socket.emit("leaveChat", chatId);
        socket.off("newMessage", handleNewMessage);
        socket.off("chatEnded", handleChatEnded);
        socket.off("userTyping", handleUserTyping);
        socket.off("chatAccepted", handleChatAccepted);
      };
    }
  }, [chatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/${chatId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
        setChatInfo(response.data.chat);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleChatEnded = (data) => {
    setChatInfo((prev) => ({ ...prev, status: "ended" }));
    const systemMessage = {
      _id: `system_${Date.now()}`,
      content: data.message,
      senderType: "system",
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  const handleChatAccepted = (data) => {
    setChatInfo((prev) => ({ ...prev, status: "active" }));
    const systemMessage = {
      _id: `system_${Date.now()}`,
      content: data.message,
      senderType: "system",
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  const handleUserTyping = (data) => {
    if (data.userName !== user.username) {
      if (data.isTyping) {
        setTyping(`${data.userName} is typing...`);
      } else {
        setTyping("");
      }
    }
  };

  const sendMessage = () => {
    if (
      newMessage.trim() &&
      socket &&
      chatInfo?.status !== "ended" &&
      user.role !== "admin"
    ) {
      socket.emit("sendMessage", {
        chatId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      socket.emit("stopTyping", { chatId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    if (user.role === "admin") return;

    setNewMessage(e.target.value);

    if (socket) {
      socket.emit("typing", { chatId });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { chatId });
      }, 1000);
    }
  };

  const endChat = () => {
    if (socket) {
      socket.emit("endChat", chatId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "ended":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
              chatInfo?.status
            )} flex-shrink-0`}
          ></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">
              {chatInfo?.subject || "Chat"}
            </h3>
            <div className="text-xs text-blue-100 capitalize">
              {chatInfo?.status}
              {user.role === "user" && chatInfo?.agent && (
                <span> • Agent: {chatInfo.agent.username}</span>
              )}
              {user.role === "agent" && chatInfo?.customer && (
                <span> • Customer: {chatInfo.customer.username}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-blue-600 rounded-md transition-colors"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>

          {chatInfo?.status === "active" && user.role !== "admin" && (
            <button
              onClick={endChat}
              className="p-1.5 hover:bg-red-600 rounded-md transition-colors"
              title="End Chat"
            >
              <PhoneOff size={16} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-blue-600 rounded-md transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.senderType === "system"
                      ? "justify-center"
                      : message.senderName === user.username
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.senderType === "system" ? (
                    <div className="text-center text-gray-500 text-xs italic bg-gray-200 px-3 py-1 rounded-full">
                      {message.content}
                    </div>
                  ) : (
                    <div className="max-w-[75%] group">
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          message.senderName === user.username
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        <div className="break-words">{message.content}</div>
                      </div>
                      <div
                        className={`text-xs text-gray-400 mt-1 px-1 ${
                          message.senderName === user.username
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {message.senderName !== user.username && (
                          <span className="font-medium">
                            {message.senderName} •{" "}
                          </span>
                        )}
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600 italic">
                  <div className="flex items-center space-x-1">
                    <span>{typing}</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compact Input Area - Only show for non-admin users */}
          {user.role !== "admin" && chatInfo?.status !== "ended" ? (
            <div className="border-t border-gray-200 bg-white p-3">
              {chatInfo?.status === "pending" && user.role === "user" && (
                <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  Waiting for an agent to join...
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={
                    chatInfo?.status === "pending" && user.role === "user"
                  }
                  autoComplete="off"
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !newMessage.trim() ||
                    (chatInfo?.status === "pending" && user.role === "user")
                  }
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : user.role !== "admin" && chatInfo?.status === "ended" ? (
            <div className="border-t border-gray-200 bg-gray-50 p-3">
              <div className="text-center text-sm text-gray-500">
                This chat has ended
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            Chat minimized • {messages.length} messages
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
