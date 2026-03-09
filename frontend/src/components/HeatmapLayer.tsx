import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

const HeatmapLayer = ({ points }: HeatmapLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // @ts-expect-error (leaflet.heat adds L.heatLayer)
    const heatLayer = L.heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 15,
      gradient: { 0.4: "blue", 0.7: "coral", 1.0: "red" },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
