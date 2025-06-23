import { MapPin, Navigation } from "lucide-react";
import { PoiDrawer } from "./PoiDrawer";
import { Vertex } from "./types";
import { Button } from "@/components/ui/button";

interface MapControlProps {
  onAddPoi: () => void;
  vertices: Vertex[];
  onRemovePoi: (id: string) => void;
  onClearAll: () => void;
  onSendPois: () => Promise<void>;
  isSending: boolean;
  onFocusLocation: () => void;
}

export function MapControl({
  onAddPoi,
  vertices,
  onRemovePoi,
  onClearAll,
  onSendPois,
  isSending,
  onFocusLocation,
}: MapControlProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 100,
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          display: "flex",
          gap: 8,
        }}
      >
        <Button
          onClick={onAddPoi}
          variant="secondary"
          className="flex items-center gap-1"
        >
          <MapPin size={16} /> Thêm POI
        </Button>

        <Button
          onClick={onFocusLocation}
          variant="default"
          className="flex items-center gap-1"
        >
          <Navigation size={16} /> Vị trí của tôi
        </Button>

        <PoiDrawer
          vertices={vertices}
          onRemovePoi={onRemovePoi}
          onClearAll={onClearAll}
          onSendPois={onSendPois}
        />
      </div>
    </div>
  );
}

