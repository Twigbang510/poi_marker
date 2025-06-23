import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function DebugMap() {
  const [mapStatus, setMapStatus] = useState<string>("Initializing...");
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    const initMap = () => {
      try {
        setMapStatus("Creating map container...");
        
        // Create a test container
        const testContainer = document.createElement("div");
        testContainer.id = "debug-map";
        testContainer.style.width = "100%";
        testContainer.style.height = "400px";
        testContainer.style.border = "2px solid red";
        
        // Add to body temporarily
        document.body.appendChild(testContainer);
        
        setMapStatus("Initializing Leaflet map...");
        
        const newMap = L.map("debug-map").setView([16.099636, 108.277578], 12);
        
        setMapStatus("Adding tile layer...");
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(newMap);
        
        setMap(newMap);
        setMapStatus("Map initialized successfully!");
        
        // Cleanup after 5 seconds
        setTimeout(() => {
          if (newMap) {
            newMap.remove();
          }
          if (testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
          }
          setMapStatus("Map cleaned up");
        }, 5000);
        
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initMap();
  }, []);

  return (
    <div className="p-4 bg-white border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Map Debug</h2>
      <div className="mb-4">
        <p><strong>Status:</strong> {mapStatus}</p>
        <p><strong>Map instance:</strong> {map ? "Created" : "Not created"}</p>
        <p><strong>Leaflet version:</strong> {L.version}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Browser Info:</h3>
        <p>User Agent: {navigator.userAgent}</p>
        <p>Geolocation supported: {navigator.geolocation ? "Yes" : "No"}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Container Info:</h3>
        <p>Admin map container: {document.getElementById("admin-map") ? "Found" : "Not found"}</p>
        <p>User map container: {document.getElementById("user-map") ? "Found" : "Not found"}</p>
      </div>
    </div>
  );
} 