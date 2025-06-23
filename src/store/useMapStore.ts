import { create } from "zustand";
import { Map, LatLngLiteral } from "leaflet";
import { PoiApiItem } from "@/types/poi.type";

interface MapState {
  map: Map | null;
  userLocation: LatLngLiteral | null;
  error: string | null;
  currentSelectedPOIId: string | null;
  currentPOIs: (PoiApiItem & { distance: number })[] | [];
}

export interface MapStore extends MapState {
  setMap: (map: Map | null) => void;
  setUserLocation: (args: LatLngLiteral) => void;
  setError: (error: string | null) => void;
  setCurrentSelectedPOI: (poi: string | null) => void;
  setCurrentPOIs: (pois: (PoiApiItem & { distance: number })[] | []) => void;
}

const initialState: Pick<MapStore, keyof MapState> = {
  map: null,
  userLocation: null,
  error: null,
  currentSelectedPOIId: null,
  currentPOIs: [],
};

const useMapStore = create<MapStore>((set) => ({
  ...initialState,
  setMap: (map) => {
    set(() => ({ map }));
  },
  setUserLocation: (userLocation) => {
    set(() => ({ userLocation }));
  },
  setError: (error) => {
    set(() => ({ error }));
  },
  setCurrentSelectedPOI: (currentSelectedPOIId) => {
    set(() => ({ currentSelectedPOIId }));
  },
  setCurrentPOIs: (currentPOIs) => {
    set(() => ({ currentPOIs }));
  },
}));

export default useMapStore;
