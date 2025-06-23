import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Howl, Howler } from "howler";

type PlayMode = "auto" | "selection";
type AudioContextType = {
  initAudio: () => void;
  playImmediately: (url: string) => void;
  playSelection: () => void;
  stopAll: () => void;
  currentMode: PlayMode;
  isPlaying: boolean;
  durationAudio: number,
  initAudioSelection: (url: string) => void,
  pauseSelectionAudio: () => void
};

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentMode, setCurrentMode] = useState<PlayMode>("auto");
  const [isPlaying, setIsPlaying] = useState(false);
  const autoSoundRef = useRef<Howl | null>(null);
  const selectionSoundRef = useRef<Howl | null>(null);
  const isInitialized = useRef(true);
  const [durationAudio,setDurationAudio] = useState<number>(0)

  // Initialize audio context on user interaction
  const initAudio = () => {
    if (!isInitialized.current) {
      // iOS workaround: play silent buffer to unlock audio
      // @ts-expect-error  // iOS workaround: create an AudioContext to unlock audio
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, 22050);
      source.connect(ctx.destination);
      source.start(0);
      ctx.close();

      isInitialized.current = true;
    }
  };

  const playImmediately = useCallback((url: string) => {
    if (currentMode !== "auto" || !isInitialized.current) return;

    // Stop any existing audio
    stopAll();

    console.log("Playing audio:", url);

    autoSoundRef.current = new Howl({
      src: [url],
      html5: true,
      onplay: () => setIsPlaying(true),
      onend: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
    });

    autoSoundRef.current.play();
  }, []);

  const initAudioSelection = (url: string) => {
    if (!isInitialized.current) return;

    // Switch to selection mode and stop auto playback
    setCurrentMode("selection");
    stopAll();

    selectionSoundRef.current = new Howl({
      src: [url],
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: ()=>setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        setCurrentMode("auto"); // Return to auto mode after selection
      },
      onstop: () => setIsPlaying(false),
      onload: () => {
        const dur = selectionSoundRef.current?.duration();
        setDurationAudio(dur ?? 0);
      },
    });
  };
  const playSelection = () => {
    if(selectionSoundRef.current)
      selectionSoundRef.current.play();
  }

  const stopAll = () => {
    autoSoundRef.current?.stop();
    selectionSoundRef.current?.stop();
    Howler.stop();
    setIsPlaying(false);
  };
  const pauseSelectionAudio = () => {
    if(selectionSoundRef.current){
      selectionSoundRef.current.pause()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      Howler.unload();
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        initAudio,
        playImmediately,
        playSelection,
        stopAll,
        currentMode,
        isPlaying,
        durationAudio,
        initAudioSelection,
        pauseSelectionAudio
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
