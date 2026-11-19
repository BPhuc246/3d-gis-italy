import type { RegionDestination } from "./api";
import type { BuildingInput } from "./buildingGeometry";

// Tham số trang trí riêng của mesh Pantheon (không phải dữ liệu nghiệp vụ)
const DECOR: Record<string, Pick<BuildingInput, "porticoWidthM" | "porticoDepthM" | "porticoCenterNorthM">> = {
  pantheon: { porticoWidthM: 35.7, porticoDepthM: 27.8, porticoCenterNorthM: 35.6 },
};

export type AlignedPlace = {
  slug: string;
  longitude: number;
  latitude: number;
  heightM: number | null;
  input: BuildingInput | null;
};

// Khối dựng từ building của API. Tọa độ trong DB đã là tâm công trình đã căn chỉnh.
export function alignLandmark(place: RegionDestination): AlignedPlace {
  const b = place.building;
  const input: BuildingInput | null =
    b && b.footprintLengthM && b.footprintWidthM && b.heightM
      ? {
          slug: place.slug,
          longitude: place.longitude,
          latitude: place.latitude,
          headingDeg: b.headingDeg ?? 0,
          footprintLengthM: b.footprintLengthM,
          footprintWidthM: b.footprintWidthM,
          heightM: b.heightM,
          ...DECOR[place.slug],
        }
      : null;

  return {
    slug: place.slug,
    longitude: place.longitude,
    latitude: place.latitude,
    heightM: b?.heightM ?? null,
    input,
  };
}
