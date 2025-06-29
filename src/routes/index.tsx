import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Location Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share real-time location and track users easily
          </p>
        </div>


        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* User Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col justify-center items-center">
              <p className="text-gray-600">
                Enter your name and start sharing your location in real-time
              </p>
              <ul className="text-sm text-gray-500 space-y-2 text-left">
                <li>• Track GPS location accurately</li>
                <li>• Automatic location update</li>
                <li>• Display on map</li>
                <li>• Check connection status</li>
              </ul>
              <Link to="/user">
                <Button className="w-full" size="lg">
                  Start tracking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col justify-center items-center flex-1">
              <p className="text-gray-600">
                View all users and their locations on the map
              </p>
              <ul className="text-sm text-gray-500 space-y-2 text-left">
                <li>• User list</li>
                <li>• Real-time location</li>
                <li>• Interactive map</li>
                <li>• Status statistics</li>
              </ul>
              <Link to="/admin">
                <Button className="w-full" size="lg" variant="outline">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>Choose your role to start</p>
        </div>
      </div>
    </div>
  );
} 