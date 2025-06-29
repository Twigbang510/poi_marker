import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Send, RefreshCw } from "lucide-react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

export default function SocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  const [messages, setMessages] = useState<Array<{type: 'sent' | 'received', data: any, timestamp: Date}>>([]);
  const [testMessage, setTestMessage] = useState("");
  const [userId] = useState(() => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isConnecting, setIsConnecting] = useState(false);

  const RENDER_SERVER_URL = "https://poi-marker-socket.onrender.com";

  useEffect(() => {
    connectToServer();
    return () => {
      disconnectSocket();
    };
  }, []);

  const connectToServer = () => {
    setIsConnecting(true);
    setConnectionStatus("Connecting...");
    
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      setIsConnecting(false);
      toast.success("Successfully connected to Render server!");
      addMessage('received', { 
        event: 'connected', 
        socketId: socket.id,
        server: RENDER_SERVER_URL,
        environment: import.meta.env.MODE 
      }, new Date());
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      setConnectionStatus(`Disconnected: ${reason}`);
      setIsConnecting(false);
      toast.error("Disconnected from server");
      addMessage('received', { event: 'disconnected', reason }, new Date());
    };

    const handleConnectError = (error: any) => {
      setIsConnected(false);
      setConnectionStatus(`Connection Error: ${error.message || 'Unknown error'}`);
      setIsConnecting(false);
      toast.error("Failed to connect to Render server!");
      addMessage('received', { 
        event: 'connect_error', 
        error: error.message,
        type: error.type,
        server: RENDER_SERVER_URL
      }, new Date());
    };

    const handleLocationBroadcast = (data: any) => {
      addMessage('received', { event: 'location:broadcast', data }, new Date());
    };

    const handleTestMessage = (data: any) => {
      addMessage('received', { event: 'test:message:response', data }, new Date());
    };

    // Remove existing listeners
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('location:broadcast');
    socket.off('test:message:response');

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('location:broadcast', handleLocationBroadcast);
    socket.on('test:message:response', handleTestMessage);

    // Check initial connection status
    if (socket.connected) {
      handleConnect();
    }
  };

  const addMessage = (type: 'sent' | 'received', data: any, timestamp: Date) => {
    setMessages(prev => [...prev.slice(-19), { type, data, timestamp }]);
  };

  const sendTestMessage = () => {
    if (!testMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    const socket = getSocket();
    const message = {
      id: userId,
      name: "Test User (Localhost)",
      message: testMessage,
      timestamp: new Date(),
      from: 'localhost'
    };

    socket.emit('test:message', message);
    addMessage('sent', { event: 'test:message', data: message }, new Date());
    setTestMessage("");
    toast.info("Test message sent to Render server");
  };

  const sendLocationUpdate = () => {
    const socket = getSocket();
    const locationData = {
      id: userId,
      name: "Test User (Localhost)",
      latitude: 16.099636 + (Math.random() - 0.5) * 0.01,
      longitude: 108.277578 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.floor(Math.random() * 50) + 5,
      lastUpdate: new Date(),
      isOnline: true,
      from: 'localhost'
    };

    socket.emit('location:update', locationData);
    addMessage('sent', { event: 'location:update', data: locationData }, new Date());
    toast.info("Location update sent to Render server");
  };

  const reconnect = () => {
    setIsConnecting(true);
    disconnectSocket();
    toast.info("Reconnecting to Render server...");
    setTimeout(() => {
      connectToServer();
    }, 1000);
  };

  const clearMessages = () => {
    setMessages([]);
    toast.info("Messages cleared");
  };

  const testServerHealth = async () => {
    try {
      const response = await fetch(RENDER_SERVER_URL);
      if (response.ok) {
        toast.success("Render server is reachable via HTTP");
        addMessage('received', { 
          event: 'http_health_check', 
          status: 'success',
          server: RENDER_SERVER_URL 
        }, new Date());
      } else {
        toast.error("Render server returned error");
        addMessage('received', { 
          event: 'http_health_check', 
          status: 'error',
          statusCode: response.status 
        }, new Date());
      }
    } catch (error) {
      toast.error("Cannot reach Render server via HTTP");
      addMessage('received', { 
        event: 'http_health_check', 
        status: 'failed',
        error: (error as Error).message 
      }, new Date());
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Socket Connection Test - Localhost to Render
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <div className="flex items-center gap-2">
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                ) : isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={isConnected ? "default" : isConnecting ? "secondary" : "destructive"}>
                  {connectionStatus}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Environment:</span>
              <Badge variant="secondary">
                {import.meta.env.MODE} (localhost)
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Server:</span>
              <Badge variant="outline" className="text-xs">
                Render.com
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">User ID:</span>
              <Badge variant="outline" className="text-xs">
                {userId.slice(-8)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={reconnect} 
              disabled={isConnecting}
              variant="outline" 
              size="sm"
            >
              {isConnecting ? "Reconnecting..." : "Reconnect"}
            </Button>
            <Button 
              onClick={sendLocationUpdate} 
              disabled={!isConnected || isConnecting} 
              size="sm"
            >
              Send Test Location
            </Button>
            <Button 
              onClick={testServerHealth} 
              variant="secondary" 
              size="sm"
            >
              Test HTTP Health
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
            Send Test Message to Render Server
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message for Render server..."
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              disabled={isConnecting}
            />
            <Button 
              onClick={sendTestMessage} 
              disabled={!isConnected || !testMessage.trim() || isConnecting}
            >
              Send to Render
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Server Info */}
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Server URL:</strong><br />
              <code className="text-blue-600">{RENDER_SERVER_URL}</code>
            </div>
            <div>
              <strong>Transport:</strong><br />
              <code>WebSocket + Polling fallback</code>
            </div>
            <div>
              <strong>Client Location:</strong><br />
              <code>localhost:3000 (Development)</code>
            </div>
            <div>
              <strong>Protocol:</strong><br />
              <code>Socket.IO v4.8.1</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            WebSocket Activity Log (Localhost ↔ Render)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto border rounded p-4 bg-gray-50 font-mono text-sm">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages yet. Connect to Render server to see activity...
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded border-l-4 ${
                      msg.type === 'sent' 
                        ? 'bg-blue-50 border-blue-400' 
                        : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-semibold text-xs ${
                        msg.type === 'sent' ? 'text-blue-700' : 'text-green-700'
                      }`}>
                        {msg.type === 'sent' ? '📤 SENT TO RENDER' : '📥 RECEIVED FROM RENDER'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
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