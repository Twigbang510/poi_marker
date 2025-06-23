import { useState, useEffect, useRef } from "react";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/hooks/useLocation";
import useMapStore from "@/store/useMapStore";
import { MapControl } from "./MapControl";
import { PoiModal } from "./PoiModal";
import { Edge, PoiToAdd, Vertex } from "./types";
import { useCreatePois, useDeletePois, useGetPois } from "@/services/poi";
import { toast } from "sonner";

// Default location (you can adjust these coordinates to your preferred default location)
const DEFAULT_LOCATION: LatLngExpression = [16.099636, 108.277578];
const DEFAULT_ZOOM = 18;

// @ts-expect-error default
delete L.Icon.Default.prototype._getIconUrl;
const pagodaIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/15486/15486868.png",
  iconRetinaUrl: "https://cdn-icons-png.flaticon.com/512/15486/15486868.png",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
  shadowSize: [50, 35],
});

export default function PoiManager() {
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPoiName, setNewPoiName] = useState("");
  const [poiToAdd, setPoiToAdd] = useState<PoiToAdd | null>(null);
  const [isSending, setIsSending] = useState(false);
  // @ts-expect-error default
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isHavePoi, setIsHavePoi] = useState(false)
  const createPoisMutation = useCreatePois();
  const { data: serverPois, isLoading: isLoadingPois } = useGetPois();
  const deletePoisMutation = useDeletePois();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const layersRef = useRef<L.Layer[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
 
  const { userLocation } = useMapStore();
  useLocation();

  // Check location permission
  useEffect(() => {
    if (!navigator.permissions) return;
    
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setHasLocationPermission(result.state === "granted");
      
      result.addEventListener("change", () => {
        setHasLocationPermission(result.state === "granted");
      });
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // Only initialize once

    mapRef.current = L.map("map").setView(DEFAULT_LOCATION, DEFAULT_ZOOM);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    ).addTo(mapRef.current);
  }, []); // Empty dependency array since we only want to initialize once

  // Handle user location updates
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Only set view if there's no existing user marker (meaning this is the first time we got location)
    if (!userMarkerRef.current) {
      mapRef.current.setView(userLocation as LatLngExpression, DEFAULT_ZOOM);
    }

    // Remove existing user marker if it exists
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Add user marker
    const userIcon = L.divIcon({
      className: "",
      html: "<div class='user-marker'></div>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    userMarkerRef.current = L.marker(userLocation, { icon: userIcon });
    userMarkerRef.current.addTo(mapRef.current);
    layersRef.current.push(userMarkerRef.current);
  }, [userLocation]);

  // Load server POIs
  useEffect(() => {
    if (!mapRef.current || !serverPois || isLoadingPois) return;
    setIsHavePoi(serverPois.length > 0)
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add server POIs to map
    const newVertices: Vertex[] = [];
    serverPois.forEach((poi) => {
      const marker = L.marker([poi.position.lat, poi.position.lng], {
        icon: pagodaIcon,
      });

      // Add popup with POI name
      const popupContent = `
        <div class="poi-popup">
          <strong>${poi.localizedData?.name || poi.name}</strong>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);

      // Convert server POI to vertex
      newVertices.push({
        id: poi.id,
        lat: poi.position.lat,
        lng: poi.position.lng,
        name: poi.localizedData?.name || poi.name,
      });
    });
    setVertices(newVertices);
  }, [serverPois, isLoadingPois]);

  const handleAddPOI = () => {
    if (!userLocation?.lng || !userLocation?.lat) {
      toast.error("Please enable location services to add a POI at your location");
      return;
    }

    const newId = `POI-${vertices.length + 1}`;

    setPoiToAdd({
      id: newId,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      name: newId,
    });

    setNewPoiName(newId);
    setIsAddModalOpen(true);
  };

  const confirmAddPOI = () => {
    if (!poiToAdd) return;

    const newVertex: Vertex = {
      ...poiToAdd,
      name: newPoiName || poiToAdd.name,
    };

    const marker = L.marker([newVertex.lat, newVertex.lng], {
      icon: pagodaIcon,
    });

    // Add popup with POI name
    const popupContent = `
      <div class="poi-popup">
        <strong>${newVertex.name}</strong>
      </div>
    `;
    marker.bindPopup(popupContent);

    markersRef.current.push(marker);
    layersRef.current.push(marker);
    marker.addTo(mapRef.current!);

    setVertices((prev) => [...prev, newVertex]);
    setIsAddModalOpen(false);
    setNewPoiName("");
    setPoiToAdd(null);
  };

  const handleSendPOIs = async () => {
    if (vertices.length === 0 && !isHavePoi) {
      toast.error("No POIs to send!");
      return;
    }

    setIsSending(true);
    try {
      const poisToSend = vertices.map((vertex) => ({
        name: vertex.name,
        position: {
          lat: vertex.lat,
          lng: vertex.lng,
        },
      }));

      await createPoisMutation.mutateAsync(poisToSend);
      toast.success("POIs sent successfully!");
      clearAll(); // Clear after successful send
    } catch (error) {
      console.error("Error sending POIs:", error);
      toast.error("Failed to send POIs. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const removePOI = async (id: string) => {
    const poiIndex = vertices.findIndex((poi) => poi.id === id);
    if (poiIndex === -1) return;

    // Remove marker
    const markerToRemove = markersRef.current.splice(poiIndex, 1)[0];
    markerToRemove.remove();

    // Remove any edges connected to this POI
    const newEdges = edges.filter(
      (edge) => edge.from.id !== id && edge.to.id !== id,
    );
    await deletePoisMutation.mutateAsync(id)
    // Update state
    setVertices((prev) => prev.filter((poi) => poi.id !== id));
    setEdges(newEdges);
  };

  const clearAll = () => {
    markersRef.current.forEach((marker) => marker.remove());
    layersRef.current.forEach((layer) => {
      if (layer instanceof L.Polyline) layer.remove();
    });
    markersRef.current = [];
    layersRef.current = [];
    
    setVertices([]);
    setEdges([]);
  };

  const focusOnUserLocation = () => {
    if (!mapRef.current || !userLocation) {
      toast.error("Cannot get your current location!");
      return;
    }
    mapRef.current.setView(userLocation, DEFAULT_ZOOM);
  };

  return (
    <div style={{ position: "relative", width: "100vw" }}>
      <MapControl
        onAddPoi={handleAddPOI}
        vertices={vertices}
        onRemovePoi={removePOI}
        onClearAll={clearAll}
        onSendPois={handleSendPOIs}
        isSending={isSending}
        onFocusLocation={focusOnUserLocation}
      />

      <PoiModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        poiToAdd={poiToAdd}
        newPoiName={newPoiName}
        setNewPoiName={setNewPoiName}
        onConfirm={confirmAddPOI}
      />

      <div
        id="map"
        style={{
          height: "100vh",
          width: "100%",
          position: "relative",
          zIndex: 0,
        }}
      />
    </div>
  );
}
