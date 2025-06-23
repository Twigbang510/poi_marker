import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, X } from "lucide-react";
import { Vertex } from "./types";
import { useState } from "react";

interface PoiDrawerProps {
  vertices: Vertex[];
  onRemovePoi: (id: string) => void;
  onClearAll: () => void;
  onSendPois: () => Promise<void>;
}

export function PoiDrawer({
  vertices,
  onRemovePoi,
  onClearAll,
  onSendPois,
}: PoiDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          <List size={16} /> Danh sách POI
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[100] max-h-screen">
        <DrawerHeader className="flex justify-between items-center">
          <DrawerTitle>Danh sách các điểm quan tâm</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X size={20} />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {vertices.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Chưa có POI nào. Hãy thêm POI tại vị trí hiện tại của bạn.
          </div>
        ) : (
          <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {vertices.map((poi) => (
              <Card key={poi.id} className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {poi.name} <Badge variant="secondary">{poi.id}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Lat: {poi.lat.toFixed(6)} • Lng: {poi.lng.toFixed(6)}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemovePoi(poi.id)}
                >
                  <X size={16} />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <DrawerFooter>
          <Button variant="outline" onClick={onClearAll}>
            Xóa tất cả POI
          </Button>
          <Button onClick={onSendPois}>Gửi POI lên server</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

