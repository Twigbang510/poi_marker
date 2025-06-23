import { create } from "zustand";

export interface UserLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  lastUpdate: Date;
  isOnline: boolean;
}

interface LocationStore {
  users: UserLocation[];
  addUser: (user: UserLocation) => void;
  updateUserLocation: (id: string, location: Partial<UserLocation>) => void;
  removeUser: (id: string) => void;
  setUsers: (users: UserLocation[]) => void;
  getUserById: (id: string) => UserLocation | undefined;
  getOnlineUsers: () => UserLocation[];
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  users: [],
  
  addUser: (user) => {
    set((state) => ({
      users: [...state.users.filter(u => u.id !== user.id), user]
    }));
  },
  
  updateUserLocation: (id, location) => {
    set((state) => ({
      users: state.users.map(user => 
        user.id === id 
          ? { ...user, ...location, lastUpdate: new Date() }
          : user
      )
    }));
  },
  
  removeUser: (id) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== id)
    }));
  },
  
  setUsers: (users) => {
    set({ users });
  },
  
  getUserById: (id) => {
    return get().users.find(user => user.id === id);
  },
  
  getOnlineUsers: () => {
    return get().users.filter(user => user.isOnline);
  },
})); 