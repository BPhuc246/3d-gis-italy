import type { BuildingInput } from './buildingGeometry';

// Mesh origins differ from POI/search coordinates. Derived from the OSM snapshot
// in _local/sources; see docs/alignment.md. No database or per-frame adjustment.
export const landmarkPlacements: Record<string, Omit<BuildingInput, 'slug'>> = {
  colosseum: {
    longitude: 12.49235546, latitude: 41.89025632, headingDeg: 19.95,
    footprintLengthM: 189.53, footprintWidthM: 141.53, heightM: 48,
  },
  'arch-of-constantine': {
    longitude: 12.490666775, latitude: 41.889762225, headingDeg: 13.0,
    footprintLengthM: 25.4, footprintWidthM: 6.95, heightM: 21,
  },
  pantheon: {
    longitude: 12.47683457, latitude: 41.89855333, headingDeg: 356.5,
    footprintLengthM: 55.3, footprintWidthM: 55.3, heightM: 43.3,
    porticoWidthM: 35.7, porticoDepthM: 27.8, porticoCenterNorthM: 35.6,
  },
  vittoriano: {
    longitude: 12.48312, latitude: 41.89465, headingDeg: 343.0,
    footprintLengthM: 138.0, footprintWidthM: 170.0, heightM: 81.0,
  },
};

export function alignLandmark<T extends BuildingInput>(place: T): T {
  return { ...place, ...landmarkPlacements[place.slug] };
}
