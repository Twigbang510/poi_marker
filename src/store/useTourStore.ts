import { dataPOI, weightTwoPOI } from '@/constants/dummy'
import { EXPLORE_WAY } from '@/constants/tour'
import { EdgeWeightedGraph } from '@/services/graph'
import { PoiApiTour } from '@/types/poi.type'
import {create} from 'zustand'

type State = {
  graph: EdgeWeightedGraph
  typeTour: EXPLORE_WAY,
  isStartTour: boolean
  currentVisitPoint: PoiApiTour | null

}
type Action = {
  setTypeTour: (value: State["typeTour"]) => void
  setStartTour: (value:State["isStartTour"])=>void
  setCurrentVisitPoint: (value:State["currentVisitPoint"]) => void
}


const useTourStore = create<State & Action>((set) => ({
  currentVisitPoint: null,
  graph: new EdgeWeightedGraph(weightTwoPOI,dataPOI),
  typeTour: EXPLORE_WAY.FREE,
  isStartTour: false,
  setTypeTour: (value) => set(() => ({ typeTour: value })),
  setStartTour: (value) => set(() => ({ isStartTour: value })),
  setCurrentVisitPoint: (value) => set(()=>({currentVisitPoint:value}))
}));

export default useTourStore
