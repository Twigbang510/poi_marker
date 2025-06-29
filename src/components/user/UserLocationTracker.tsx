import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Edit2, Locate } from "lucide-react";
import { toast } from "sonner";
import { useLocationStore } from "@/store/useLocationStore";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

const DEFAULT_LOCATION: [number, number] = [16.099636, 108.277578];
const DEFAULT_ZOOM = 15;
const TRACKING_ZOOM = 17;
const MAPBOX_TILE_URL =
  `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;
const MAPBOX_ATTRIBUTION =
  '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAPBOX_ID = "mapbox/streets-v11";

export default function UserLocationTracker() {
  const { updateUserLocation } = useLocationStore();
  const [userName, setUserName] = useState("");
  const [isNameModalOpen, setIsNameModalOpen] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [watchId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [mapInitialized, setMapInitialized] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        setLastUpdate(new Date());
        if (mapInitialized && map) {
          updateMapMarker(location, DEFAULT_ZOOM);
        }
      } catch (error) {
        toast.error("Cannot get current location. Please allow access to location!");
      }
    };
    getInitialLocation();
    // eslint-disable-next-line
  }, [mapInitialized]);

  // Khởi tạo map
  useEffect(() => {
    if (isNameModalOpen) return; 

    const initMap = () => {
      const mapContainer = document.getElementById("user-map");
      if (!mapContainer || mapInitialized) return;

      if (mapContainer.offsetHeight < 100) {
        setTimeout(initMap, 100);
        return;
      }

      try {
        const newMap = L.map("user-map").setView(DEFAULT_LOCATION, DEFAULT_ZOOM);
        L.tileLayer(MAPBOX_TILE_URL, {
          attribution: MAPBOX_ATTRIBUTION,
          tileSize: 512,
          zoomOffset: -1,
          id: MAPBOX_ID,
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

    return () => {
      if (map) map.remove();
    };
  }, [mapInitialized, isNameModalOpen]);


  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Reconnected");
    };
    const handleOffline = () => {
      toast.error("Disconnected");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hàm lấy vị trí hiện tại (1 lần)
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser does not support geolocation"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          resolve(locationData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  };

  // Update map marker
  const updateMapMarker = (location: LocationData, zoom?: number) => {
    if (!map || !mapInitialized) return;
    try {
      if (userMarker) {
        userMarker.remove();
      }
      // Lấy chữ cái đầu tiên của tên, fallback là '?'
      const firstChar = userName.trim() ? userName.trim().charAt(0).toUpperCase() : '?';
      const userIcon = L.divIcon({
        className: "user-marker",
        html: `
          <div class="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg">
            ${firstChar}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const marker = L.marker([location.latitude, location.longitude], { icon: userIcon })
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${userName}</h3>
            <p class="text-sm text-gray-600">Current Location</p>
            <p class="text-sm text-gray-600">Accuracy: ${location.accuracy.toFixed(1)}m</p>
          </div>
        `);
      marker.addTo(map);
      setUserMarker(marker);
      // Center map on user location
      map.setView([location.latitude, location.longitude], zoom || DEFAULT_ZOOM);
    } catch (error) {
      console.error("Error updating map marker:", error);
    }
  };

  // Show name modal on mount
  useEffect(() => {
    setIsNameModalOpen(true);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isNameModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNameModalOpen]);

  // Handle name submit
  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsNameModalOpen(false);

    if (currentLocation) {
      const socket = getSocket();
      socket.emit("location:update", {
        id: userId,
        name: userName,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        lastUpdate: new Date(),
        isOnline: true,
      });
    }
  };

  // Handle name change (inline edit)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
    if (currentLocation) {
      const socket = getSocket();
      socket.emit("location:update", {
        id: userId,
        name: e.target.value,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        lastUpdate: new Date(),
        isOnline: true,
      });
    }
  };



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      updateUserLocation(userId, {
        isOnline: false,
        lastUpdate: new Date(),
      });
    };
    // eslint-disable-next-line
  }, [watchId, userId, updateUserLocation]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    return `${Math.floor(minutes / 60)} hours ago`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const socket = getSocket();

    if (userName && currentLocation) {
      // Gửi vị trí lần đầu
      socket.emit("location:update", {
        id: userId,
        name: userName,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        lastUpdate: new Date(),
        isOnline: true,
      });

      // Gửi vị trí mỗi 3s
      interval = setInterval(() => {
        if (currentLocation) {
          socket.emit("location:update", {
            id: userId,
            name: userName,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
            lastUpdate: new Date(),
            isOnline: true,
          });
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      disconnectSocket();
    };
  }, [userName, userId, currentLocation]);

  // Thêm hàm focus về marker của bản thân
  const focusOnMe = () => {
    if (map && currentLocation) {
      map.setView([currentLocation.latitude, currentLocation.longitude], TRACKING_ZOOM, { animate: true });
      if (userMarker) {
        userMarker.openPopup();
      }
    }
  };

  // Thêm effect gửi offline khi tắt tab/app (có thể bật lại cho mobile)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentLocation) {
        const socket = getSocket();
        socket.emit("location:update", {
          id: userId,
          name: userName,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          lastUpdate: new Date(),
          isOnline: false,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, userName, currentLocation]);

  // Responsive layout: info card on top, map full width/height below
  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center gap-4">
        {/* Name Modal */}
        {isNameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <form
              onSubmit={handleNameSubmit}
              className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-sm flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold text-center">Enter your name</h2>
              <Input
                ref={nameInputRef}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="text-lg"
                autoFocus
              />
              <Button type="submit" className="w-full text-lg" disabled={!userName.trim()}>Continue</Button>
            </form>
          </div>
        )}
        {/* Info Card */}
        {!isNameModalOpen && (
          <div className="w-full max-w-xl px-2 pt-4 flex flex-col gap-4">
            <Card className="w-full">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4 text-center">
                <div className="w-full flex justify-center">
                  {isEditingName ? (
                    <form
                      onSubmit={() => setIsEditingName(false)}
                      className="flex items-center gap-2 transition-all duration-300 w-full"
                    >
                      <Input
                        value={userName}
                        onChange={handleNameChange}
                        onBlur={() => setIsEditingName(false)}
                        className="text-lg font-bold text-center transition-all duration-300 truncate"
                        autoFocus
                        maxLength={32}
                        style={{ minWidth: 0 }}
                      />
                      <Button type="submit" size="icon" variant="ghost" className="p-1">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <span
                      className="text-lg font-bold flex items-center gap-1 transition-all duration-300 truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
                      title={userName}
                      style={{ minWidth: 0 }}
                    >
                      {userName}
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="ml-1 text-gray-500 hover:text-blue-600 transition-colors duration-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : "--"}</span>
                  {map && currentLocation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="ml-2"
                          onClick={focusOnMe}
                          type="button"
                        >
                          <Locate className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Center on Me</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{lastUpdate ? `Updated: ${formatTimeAgo(lastUpdate)}` : "--"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Map Fullscreen */}
        <div className="w-full flex-grow flex flex-col px-2 pb-2" style={{ maxHeight: 'calc(100vh - 150px)', height: '100%' }}>
          {!isNameModalOpen && (
            <Card className="flex flex-col flex-1 h-full">
              <CardContent className="flex-1 h-full p-0 flex flex-col">
                <div id="user-map" style={{ height: "100%", minHeight: 300, width: "100%", flex: 1 }} className="rounded-lg" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 