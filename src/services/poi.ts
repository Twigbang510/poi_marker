import { SERVER_URL } from "@/config/app";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface PoiRequest {
  name: string;
  position: {
    lat: number;
    lng: number;
  };
}

export interface PoiResponse {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  localizedData?: {
    name: string;
    description: {
      text: string;
      audio: string;
    };
  };
}

export const useCreatePois = () => {
  return useMutation({
    mutationFn: async (pois: PoiRequest[]) => {
      const response = await axios.post(
        `${SERVER_URL}/api/pois/basic`,
        pois
      );
      return response.data;
    },
  });
};
export const useDeletePois = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`${SERVER_URL}/api/pois/${id}`);
      return response.data;
    },
  });
};
export const useGetPois = () => {
  return useQuery({
    queryKey: ["pois"],
    queryFn: async () => {
      const response = await axios.get<PoiResponse[]>(
        `${SERVER_URL}/api/pois`,
        {
          params: {
            lang: "vi-south"
          },
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      return response.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0,
    staleTime: 0
  });
}; 