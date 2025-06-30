import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock } from "lucide-react";
import { useLocationStore, UserLocation } from "@/store/useLocationStore";
import { getSocket, disconnectSocket } from "@/lib/socket";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const DEFAULT_LOCATION: [number, number] = [16.099636, 108.277578]; // Đà Nẵng
const DEFAULT_ZOOM = 12;
const FOCUS_ZOOM = 17;

export default function AdminDashboard() {
  const { users, setUsers } = useLocationStore();
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map
  useEffect(() => {
    const initMap = () => {
      const mapContainer = document.getElementById("admin-map");
      if (!mapContainer || mapInitialized) return;
      try {
        const newMap = L.map("admin-map").setView(DEFAULT_LOCATION, DEFAULT_ZOOM);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(newMap);
        setMap(newMap);
        setMapInitialized(true);
        setTimeout(() => {
          newMap.invalidateSize();
        }, 100);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    initMap();
    if (!mapInitialized) {
      const timer = setTimeout(initMap, 100);
      return () => clearTimeout(timer);
    }
    return () => {
      if (map) map.remove();
    };
    // eslint-disable-next-line
  }, [mapInitialized]);

  // Update map markers
  const updateMapMarkers = (userList: UserLocation[]) => {
    if (!map || !mapInitialized) return;
    try {
      markers.forEach(marker => {
        if (marker && map) {
          marker.remove();
        }
      });
      const newMarkers: L.Marker[] = [];
      userList.forEach(user => {
        const userIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }">
              ${user.name.charAt(0).toUpperCase()}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([user.latitude, user.longitude], { icon: userIcon })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${user.name}</h3>
              <p class="text-sm text-gray-600">Location: ${user.latitude.toFixed(6)}, ${user.longitude.toFixed(6)}</p>
              <p class="text-sm text-gray-600">Updated: ${user.lastUpdate.toLocaleTimeString()}</p>
              <p class="text-sm text-gray-600">Status: ${user.isOnline ? 'Online' : 'Offline'}</p>
              <p class="text-sm text-gray-600">Accuracy: ${user.accuracy}m</p>
            </div>
          `);
        marker.addTo(map);
        newMarkers.push(marker);
      });
      setMarkers(newMarkers);
    } catch (error) {
      console.error("Error updating map markers:", error);
    }
  };

  // Update markers when users change
  useEffect(() => {
    if (mapInitialized && map) {
      updateMapMarkers(users);
    }
  }, [users, mapInitialized, map]);

  // Focus map to user location when click
  const focusUser = (user: UserLocation) => {
    if (map && mapInitialized) {
      map.setView([user.latitude, user.longitude], FOCUS_ZOOM, { animate: true });
      // Find corresponding marker and open popup
      const marker = markers.find(m => {
        const latlng = m.getLatLng();
        return (
          Math.abs(latlng.lat - user.latitude) < 1e-6 &&
          Math.abs(latlng.lng - user.longitude) < 1e-6
        );
      });
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  useEffect(() => {
    const socket = getSocket();
    console.log("🔵 Admin socket connecting...");
    console.log("🔵 Admin socket connected:", socket.connected);
    console.log("🔵 Admin socket ID:", socket.id);

    // Listen for location updates
    const handleLocationUpdate = (data: any) => {
      console.log("🔴 Admin received location data:", data);
      console.log("🔴 Current users count:", useLocationStore.getState().users.length);
      
      // Get current users from store
      const currentUsers = useLocationStore.getState().users;
      const userIndex = currentUsers.findIndex((u) => u.id === data.id);
      
      let updatedUsers;
      if (userIndex !== -1) {
        // Update existing user
        updatedUsers = [...currentUsers];
        updatedUsers[userIndex] = { 
          ...updatedUsers[userIndex], 
          ...data, 
          lastUpdate: new Date(data.lastUpdate || new Date()) 
        };
        console.log("🔄 Updated existing user:", data.name);
      } else {
        // Add new user
        updatedUsers = [...currentUsers, { 
          ...data, 
          lastUpdate: new Date(data.lastUpdate || new Date()) 
        }];
        console.log("➕ Added new user:", data.name);
      }
      
      setUsers(updatedUsers);
      console.log("✅ Users state updated, new count:", updatedUsers.length);
    };

    // Listen to ALL possible event names for compatibility
    socket.on("location:broadcast", handleLocationUpdate);
    socket.on("location:update", handleLocationUpdate);
    socket.on("locationUpdate", handleLocationUpdate);
    socket.on("user:location", handleLocationUpdate);

    return () => {
      socket.off("location:broadcast", handleLocationUpdate);
      socket.off("location:update", handleLocationUpdate);
      socket.off("locationUpdate", handleLocationUpdate);
      socket.off("user:location", handleLocationUpdate);
      disconnectSocket();
    };
  }, [setUsers]);

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full h-full flex flex-col">
        <div className="flex flex-col gap-4 lg:flex-row h-full flex-1">
          {/* User List */}
          <div className="space-y-6 flex flex-col justify-center lg:w-1/3 h-full">
            <Card className="flex-1 min-h-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User List
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto h-[80%]">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition"
                      onClick={() => focusUser(user)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <Badge variant={user.isOnline ? "default" : "secondary"}>
                          {user.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span title="Latitude, Longitude">{
                          typeof user.latitude === 'number' && typeof user.longitude === 'number'
                            ? `${user.latitude.toFixed(6)}, ${user.longitude.toFixed(6)}`
                            : '--'
                        }</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(user.lastUpdate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {users.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {users.filter(u => u.isOnline).length}
                    </div>
                    <div className="text-sm text-gray-600">Online</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {users.filter(u => !u.isOnline).length}
                    </div>
                    <div className="text-sm text-gray-600">Offline</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Map */} 
          <div className="w-full h-full lg:w-2/3 flex flex-col">
            <Card className="flex-1 h-full min-h-0 flex flex-col">
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 h-full">
                <div id="admin-map" className="h-[90%] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 