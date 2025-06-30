import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Edit2, Locate } from "lucide-react";
import { toast } from "sonner";
import { useLocationStore } from "@/store/useLocationStore";
import { getSocket } from "@/lib/socket";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import useMapStore from "@/store/useMapStore";
import { findCurrentPOIs } from "@/lib/geo";
import { usePoiQuery } from "@/hooks/api-hooks/use-poi";
import useGlobalStore from "@/store/useGlobalStore";

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

export default function UserLocationTracker() {
  const { updateUserLocation } = useLocationStore();
  const { currentPOIs, setUserLocation, setCurrentPOIs } = useMapStore();
  const { selectedLanguageCode } = useGlobalStore();
  
  // Get POI data for real-time discovery
  const { data: poiData } = usePoiQuery(selectedLanguageCode, "");
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
      console.log("🔍 Looking for user-map container:", mapContainer);
      
      if (!mapContainer) {
        console.log("❌ Map container not found, retrying...");
        setTimeout(initMap, 200);
        return;
      }
      
      if (mapInitialized) {
        console.log("✅ Map already initialized");
        return;
      }

      console.log("📏 Container dimensions:", {
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        clientWidth: mapContainer.clientWidth,
        clientHeight: mapContainer.clientHeight
      });

      if (mapContainer.offsetHeight < 100 || mapContainer.offsetWidth < 100) {
        console.log("⏳ Container not ready, retrying...", {
          height: mapContainer.offsetHeight,
          width: mapContainer.offsetWidth
        });
        setTimeout(initMap, 200);
        return;
      }

      try {
        console.log("🗺️ Initializing user map...");
        const newMap = L.map("user-map").setView(DEFAULT_LOCATION, DEFAULT_ZOOM);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(newMap);
        console.log("✅ User map initialized with OpenStreetMap tiles");
        console.log("📍 Map instance created:", newMap);
        setMap(newMap);
        setMapInitialized(true);
        console.log("🎯 Map state updated successfully");
        
        setTimeout(() => {
          newMap.invalidateSize();
          console.log("🔄 Map size invalidated");
        }, 300);
      } catch (error) {
        console.error("❌ Error initializing map:", error);
        // Retry after a delay
        setTimeout(initMap, 500);
      }
    };

    setTimeout(initMap, 100);

    return () => {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.log("Map cleanup: already removed");
        }
      }
    };
  }, [mapInitialized, isNameModalOpen]);


  // Real-time location tracking + POI discovery + Socket broadcasting
  useEffect(() => {
    if (!navigator.geolocation || isNameModalOpen || !userName) return;

    let watchId: number | null = null;
    const socket = getSocket();

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };

          // Update current location state
          setCurrentLocation(locationData);
          setLastUpdate(new Date());

          // Update MapStore location for POI discovery
          const newLocation = {
            lat: locationData.latitude,
            lng: locationData.longitude,
          };
          setUserLocation(newLocation);

          // Update current POIs whenever location changes
          if (poiData) {
            const currentPOIs = findCurrentPOIs(
              newLocation.lat,
              newLocation.lng,
              poiData,
            );
            setCurrentPOIs(currentPOIs);
          }
          if (userName.trim()) {
            const locationUpdate = {
              id: userId,
              name: userName,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              accuracy: locationData.accuracy,
              lastUpdate: new Date(),
              isOnline: true,
            };
            
            console.log("🟢 User emitting location:", locationUpdate);
            console.log("🟢 Socket connected:", socket.connected);
            console.log("🟢 Socket ID:", socket.id);
            socket.emit("location:update", locationUpdate);
            
            // Also try alternative event names for server compatibility
            socket.emit("location:broadcast", locationUpdate);
            socket.emit("user:location", locationUpdate);
          }

          // Update map marker if map is ready
          console.log("📍 Location received - checking if can update marker:", { 
            mapInitialized, 
            hasMap: !!map,
            location: `${locationData.latitude}, ${locationData.longitude}` 
          });
          
          if (mapInitialized && map) {
            console.log("✅ Calling updateMapMarker with location data");
            updateMapMarker(locationData);
          } else {
            console.log("❌ Cannot update marker - map not ready");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error(`Location error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    };

    startWatching();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isNameModalOpen, poiData, mapInitialized, map, userName, userId]);

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

  // Hàm lấy vị trí hiện tại (1 lần) + Real-time POI discovery
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
          
          // Update MapStore location for POI discovery
          const newLocation = {
            lat: locationData.latitude,
            lng: locationData.longitude,
          };
          setUserLocation(newLocation);
          
          // Update current POIs whenever location changes
          if (poiData) {
            const currentPOIs = findCurrentPOIs(
              newLocation.lat,
              newLocation.lng,
              poiData,
            );
            setCurrentPOIs(currentPOIs);
          }
          
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

  // Update map marker - Fixed duplicate issue  
  const updateMapMarker = (location: LocationData, zoom?: number) => {
    console.log("🔄 updateMapMarker called:", { 
      hasMap: !!map, 
      mapInitialized, 
      location: `${location.latitude}, ${location.longitude}` 
    });
    
    if (!map || !mapInitialized) {
      console.log("❌ Cannot update marker - map not ready:", { 
        hasMap: !!map, 
        mapInitialized 
      });
      return;
    }
    
    try {
      // 🔧 IMPROVED: Remove existing user marker
      if (userMarker) {
        try {
          if (map.hasLayer(userMarker)) {
            map.removeLayer(userMarker);
          }
        } catch (e) {
          console.log("Marker already removed");
        }
        setUserMarker(null);
      }
      
      // Remove any stray user markers (cleanup safety net)
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && layer.options?.icon?.options?.className === "user-marker") {
          try {
            map.removeLayer(layer);
            console.log("🧹 Cleaned up stray user marker");
          } catch (e) {
            console.log("Stray marker already removed");
          }
        }
      });
      
      const firstChar = userName.trim() ? userName.trim().charAt(0).toUpperCase() : '?';
      const userIcon = L.divIcon({
        className: "user-marker", // This helps identify user markers
        html: `
          <div class="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg">
            ${firstChar}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      
      const newMarker = L.marker([location.latitude, location.longitude], { 
        icon: userIcon
      }).bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${userName}</h3>
            <p class="text-sm text-gray-600">Current Location</p>
            <p class="text-sm text-gray-600">Accuracy: ${location.accuracy.toFixed(1)}m</p>
            <p class="text-sm text-gray-500">Updated: ${new Date().toLocaleTimeString()}</p>
          </div>
        `);
      
      newMarker.addTo(map);
      setUserMarker(newMarker);
      
      // Only center on first load or when requested
      if (zoom !== undefined) {
        map.setView([location.latitude, location.longitude], zoom);
      }
      
      console.log("✅ User marker updated successfully at:", location.latitude, location.longitude);
    } catch (error) {
      console.error("❌ Error updating map marker:", error);
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



  // Cleanup ONLY on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting - cleanup all resources");
      
      // Clean up geolocation watching
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log("✅ Geolocation watch cleared");
      }
      
      // Update user status to offline
      updateUserLocation(userId, {
        isOnline: false,
        lastUpdate: new Date(),
      });
      console.log("✅ User status set to offline");
    };
  }, []);

  // Separate cleanup for map instance on unmount
  useEffect(() => {
    return () => {
      console.log("🗺️ Cleaning up map instance on unmount");
      if (map) {
        try {
          // Clean up user marker first
          if (userMarker && map.hasLayer(userMarker)) {
            map.removeLayer(userMarker);
          }
          // Then remove map
          map.remove();
          console.log("✅ Map instance cleaned up");
        } catch (e) {
          console.log("Map cleanup: already removed");
        }
      }
    };
  }, []); // Empty deps - only run on unmount

  // Debug: Track map state changes
  useEffect(() => {
    console.log("Map state changed:", { 
      hasMap: !!map, 
      mapInitialized,
      mapInstance: map ? "Present" : "Missing" 
    });
  }, [map, mapInitialized]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    return `${Math.floor(minutes / 60)} hours ago`;
  };

  // 🔄 Heartbeat backup 
  useEffect(() => {
    if (!userName || !currentLocation) return;
    
    let heartbeatInterval: NodeJS.Timeout | null = null;
    const socket = getSocket();

    heartbeatInterval = setInterval(() => {
      if (currentLocation && userName.trim()) {
        const heartbeatData = {
          id: userId,
          name: userName,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          lastUpdate: new Date(),
          isOnline: true,
        };
        
        console.log("💓 Heartbeat ping:", heartbeatData);
        socket.emit("location:update", heartbeatData);
        socket.emit("location:broadcast", heartbeatData);
        socket.emit("user:location", heartbeatData);
      }
    }, 10000); // 10 seconds heartbeat

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
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

  // 📱 Mobile-friendly offline detection
  useEffect(() => {
    const sendOfflineStatus = () => {
      if (currentLocation && userName.trim()) {
        const socket = getSocket();
        const offlineData = {
          id: userId,
          name: userName,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          lastUpdate: new Date(),
          isOnline: false,
        };
        
        console.log("🔴 User going offline:", offlineData);
        socket.emit("location:update", offlineData);
      }
    };

    // Desktop: beforeunload 
    const handleBeforeUnload = () => {
      sendOfflineStatus();
    };

    // 📱 Mobile: visibilitychange (more reliable)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendOfflineStatus();
      }
    };

    // 📱 Mobile: pagehide (iOS Safari)
    const handlePageHide = () => {
      sendOfflineStatus();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
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
                
                {/* Real-time tracking indicator */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Live Tracking</span>
                </div>
              </CardContent>
            </Card>
            
            {/* POI Discovery */}
            {currentPOIs && currentPOIs.length > 0 && (
              <Card className="w-full">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Nearby POIs</h3>
                    <span className="text-sm text-gray-500">({currentPOIs.length})</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {currentPOIs.slice(0, 3).map((poi, index) => (
                      <div key={poi.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                                                 <div className="flex-1 min-w-0">
                           <p className="font-medium text-sm truncate">{poi.localizedData.name}</p>
                           <p className="text-xs text-gray-500 truncate">{poi.localizedData.description.text}</p>
                         </div>
                        <div className="text-xs text-gray-400">
                          ~{Math.round(poi.distance || 0)}m
                        </div>
                      </div>
                    ))}
                    {currentPOIs.length > 3 && (
                      <div className="text-center text-sm text-gray-500 py-1">
                        +{currentPOIs.length - 3} more nearby...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {/* Map Fullscreen */}
        <div className="w-full flex-grow flex flex-col px-2 pb-2" style={{ minHeight: '400px', height: 'calc(100vh - 200px)' }}>
          {!isNameModalOpen && (
            <Card className="flex flex-col h-full w-full">
              <CardContent className="flex-1 p-0 h-full min-h-[400px]">
                <div 
                  id="user-map" 
                  className="rounded-lg w-full h-full"
                  style={{ 
                    minHeight: '400px', 
                    height: '100%', 
                    width: '100%',
                    backgroundColor: '#f3f4f6'
                  }} 
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
} 