import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/components/admin/AdminDashboard";
import SocketTest from "@/components/SocketTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="h-screen bg-gray-50">
      <Tabs defaultValue="dashboard" className="h-full">
        <div className="border-b bg-white px-4">
          <TabsList className="h-12">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="socket-test">Socket Test</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="dashboard" className="h-full mt-0">
          <AdminDashboard />
        </TabsContent>
        
        <TabsContent value="socket-test" className="h-full mt-0 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Socket Connection Test
              </h1>
              <p className="text-gray-600">
                Test WebSocket connection for real-time location tracking
              </p>
            </div>
            <SocketTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 