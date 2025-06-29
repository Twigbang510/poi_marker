import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Send } from "lucide-react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

export default function SocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [messages, setMessages] = useState<Array<{type: 'sent' | 'received', data: any, timestamp: Date}>>([]);
  const [testMessage, setTestMessage] = useState("");
  const [userId] = useState(() => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 
    (import.meta.env.MODE === "production" 
      ? "https://poi-marker-socket.onrender.com" 
      : "http://localhost:3001");

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      toast.success("Socket connected!");
      addMessage('received', { event: 'connected', socketId: socket.id }, new Date());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus("Disconnected");
      toast.error("Socket disconnected!");
      addMessage('received', { event: 'disconnected' }, new Date());
    };

    const handleConnectError = (error: any) => {
      setConnectionStatus(`Connection Error: ${error.message || 'Unknown error'}`);
      toast.error("Connection failed!");
      addMessage('received', { event: 'connect_error', error: error.message }, new Date());
    };

    const handleLocationBroadcast = (data: any) => {
      addMessage('received', { event: 'location:broadcast', data }, new Date());
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('location:broadcast', handleLocationBroadcast);

    // Check initial connection status
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('location:broadcast', handleLocationBroadcast);
    };
  }, []);

  const addMessage = (type: 'sent' | 'received', data: any, timestamp: Date) => {
    setMessages(prev => [...prev.slice(-19), { type, data, timestamp }]);
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) return;
    
    const socket = getSocket();
    const message = {
      id: userId,
      name: "Test User",
      message: testMessage,
      timestamp: new Date()
    };

    socket.emit('test:message', message);
    addMessage('sent', { event: 'test:message', data: message }, new Date());
    setTestMessage("");
    toast.info("Test message sent");
  };

  const sendLocationUpdate = () => {
    const socket = getSocket();
    const locationData = {
      id: userId,
      name: "Test User",
      latitude: 16.099636 + (Math.random() - 0.5) * 0.01,
      longitude: 108.277578 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 50) + 5,
      lastUpdate: new Date(),
      isOnline: true
    };

    socket.emit('location:update', locationData);
    addMessage('sent', { event: 'location:update', data: locationData }, new Date());
    toast.info("Location update sent");
  };

  const reconnect = () => {
    disconnectSocket();
    setTimeout(() => {
      getSocket();
      setConnectionStatus("Reconnecting...");
    }, 1000);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            Socket Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {connectionStatus}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Environment:</span>
              <Badge variant="secondary">
                {import.meta.env.MODE}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Server:</span>
              <Badge variant="outline">
                {socketUrl}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={reconnect} variant="outline" size="sm">
              Reconnect
            </Button>
            <Button onClick={sendLocationUpdate} disabled={!isConnected} size="sm">
              Send Test Location
            </Button>
            <Button onClick={clearMessages} variant="ghost" size="sm">
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
            />
            <Button onClick={sendTestMessage} disabled={!isConnected || !testMessage.trim()}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            WebSocket Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Connect to see activity...</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`text-xs p-2 rounded ${
                      msg.type === 'sent' 
                        ? 'bg-blue-100 border-l-2 border-blue-500' 
                        : 'bg-green-100 border-l-2 border-green-500'
                    }`}
                  >
                    <div className="font-mono text-gray-600">
                      {msg.timestamp.toLocaleTimeString()} - {msg.type.toUpperCase()}
                    </div>
                    <div className="font-mono text-sm">
                      {JSON.stringify(msg.data, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 