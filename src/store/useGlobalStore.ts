import { create } from "zustand";
import { AVAILABLE_LANGUAGE } from "@/constants/languages";

interface GlobalState {
  selectedLanguageCode: string;
  inputSearch: string
}

export interface GlobalStore extends GlobalState {
  setSelectedLanguageCode: (code: string) => void;
  setInputSearch: (value: string) => void
}

const initialState: Pick<GlobalStore, keyof GlobalState> = {
  selectedLanguageCode: AVAILABLE_LANGUAGE[1].code,
  inputSearch: ""
};

const useGlobalStore = create<GlobalStore>((set) => ({
  ...initialState,
  setSelectedLanguageCode: (code) => {
    set(() => ({ selectedLanguageCode: code }));
  },
  setInputSearch: (value) => set(()=>({inputSearch: value}))
}));

export default useGlobalStore;
