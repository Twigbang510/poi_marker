import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PoiToAdd } from "./types";

interface PoiModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  poiToAdd: PoiToAdd | null;
  newPoiName: string;
  setNewPoiName: (name: string) => void;
  onConfirm: () => void;
}

export function PoiModal({
  isOpen,
  onOpenChange,
  poiToAdd,
  newPoiName,
  setNewPoiName,
  onConfirm,
}: PoiModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100]">
        <DialogHeader>
          <DialogTitle>Thêm điểm quan tâm mới</DialogTitle>
          <DialogDescription>Nhập tên cho vị trí này</DialogDescription>
        </DialogHeader>

        {poiToAdd && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium">ID</label>
                <Input value={poiToAdd.id} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input value={poiToAdd.lat.toFixed(6)} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input value={poiToAdd.lng.toFixed(6)} disabled />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Tên POI</label>
              <Input
                value={newPoiName}
                onChange={(e) => setNewPoiName(e.target.value)}
                placeholder="Nhập tên POI"
                autoFocus
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onConfirm}>Thêm POI</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 