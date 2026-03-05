import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Clock,
  MapPin,
  Navigation,
  AlertTriangle,
  AlertCircle,
  Zap,
  Car,
  Bike,
  Footprints,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import HeatmapLayer from "../components/HeatmapLayer";

// Fix generic leaflet icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface Suggestion {
  address: string;
  lat: number;
  lng: number;
}

interface RouteStats {
  distance: number;
  duration: number;
  safety_score: number;
  risk_level: string;
  time_efficiency: number;
  high_risk_zones: number;
  normalized_risk: number;
}

// Map Auto-Updater Component
function MapUpdater({ startPos, endPos, routeCoords }: { 
  startPos: [number, number] | null; 
  endPos: [number, number] | null; 
  routeCoords: [number, number][] 
}) {
  const map = useMap();

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startPos && endPos) {
      const bounds = L.latLngBounds([startPos, endPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startPos) {
      map.setView(startPos, 14);
    }
  }, [map, startPos, endPos, routeCoords]);

  return null;
}

const SafeRouteTab: React.FC = () => {
  // Default to Kolkata center
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [endPos, setEndPos] = useState<[number, number] | null>(null);

  // Start and End input text fields
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);
  const [showStartSugg, setShowStartSugg] = useState(false);
  const [showEndSugg, setShowEndSugg] = useState(false);

  const [routeType, setRouteType] = useState<"safe" | "fast">("safe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transportMode, setTransportMode] = useState<
    "car" | "bike" | "cycling" | "walking"
  >("car");

  // Results
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [crimePoints, setCrimePoints] = useState<[number, number, number][]>([]);

  // Click outside handler logic
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(event.target as Node))
        setShowStartSugg(false);
      if (endRef.current && !endRef.current.contains(event.target as Node))
        setShowEndSugg(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial base crime points to show a default Heatmap if no route generated yet
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/safe-route/crime-predictions`)
      .then(res => res.json())
      .then(data => setCrimePoints(data))
      .catch(err => console.error("Initial heatmap load failed", err));
  }, []);

  // Debounced Autocomplete for Start
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (startText.length > 2 && showStartSugg) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/safe-route/autocomplete?q=${encodeURIComponent(startText)}`,
          );
          if (res.ok) setStartSuggestions(await res.json());
        } catch {
          setStartSuggestions([]);
        }
      } else {
        setStartSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [startText, showStartSugg]);

  // Debounced Autocomplete for End
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (endText.length > 2 && showEndSugg) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/safe-route/autocomplete?q=${encodeURIComponent(endText)}`,
          );
          if (res.ok) setEndSuggestions(await res.json());
        } catch {
          setEndSuggestions([]);
        }
      } else {
        setEndSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [endText, showEndSugg]);

  const selectStart = (s: Suggestion) => {
    setStartText(s.address.split(",")[0]); // Shorten display
    setStartPos([s.lat, s.lng]);
    setShowStartSugg(false);
  };

  const selectEnd = (s: Suggestion) => {
    setEndText(s.address.split(",")[0]); // Shorten display
    setEndPos([s.lat, s.lng]);
    setShowEndSugg(false);
  };

  const findRoute = async () => {
    if (!startText || !endText) {
      setError("Please enter both start and destination locations.");
      return;
    }

    setLoading(true);
    setError(null);
    setStats(null);
    setRouteCoords([]);

    try {
      let finalStartLat = startPos?.[0];
      let finalStartLng = startPos?.[1];

      // Geocode Start if not selected from suggestions
      if (!startPos) {
        const startRes = await fetch(
          `${API_BASE_URL}/api/safe-route/geocode?q=${encodeURIComponent(startText)}`,
        );
        if (!startRes.ok)
          throw new Error(`Could not find location: ${startText}`);
        const startData = await startRes.json();
        finalStartLat = startData.lat;
        finalStartLng = startData.lng;
        setStartPos([startData.lat, startData.lng]);
      }

      let finalEndLat = endPos?.[0];
      let finalEndLng = endPos?.[1];

      // Geocode End if not selected from suggestions
      if (!endPos) {
        const endRes = await fetch(
          `${API_BASE_URL}/api/safe-route/geocode?q=${encodeURIComponent(endText)}`,
        );
        if (!endRes.ok) throw new Error(`Could not find location: ${endText}`);
        const endData = await endRes.json();
        finalEndLat = endData.lat;
        finalEndLng = endData.lng;
        setEndPos([endData.lat, endData.lng]);
      }

      if (!finalStartLat || !finalStartLng || !finalEndLat || !finalEndLng) {
        throw new Error("Unable to resolve coordinates for directions.");
      }

      // Calculate Box for Crime Predictions
      const minLat = Math.min(finalStartLat, finalEndLat) - 0.05;
      const maxLat = Math.max(finalStartLat, finalEndLat) + 0.05;
      const minLng = Math.min(finalStartLng, finalEndLng) - 0.05;
      const maxLng = Math.max(finalStartLng, finalEndLng) + 0.05;
      const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;

      // Fetch Crime Data for Heatmap early
      try {
        const crimeRes = await fetch(`${API_BASE_URL}/api/safe-route/crime-predictions?bbox=${bbox}`);
        if (crimeRes.ok) {
           const cData = await crimeRes.json();
           setCrimePoints(cData);
        }
      } catch (e) { console.error("Could not load heatmap", e); }


      // Fetch dynamic stats and route geometry from backend
      const url = `${API_BASE_URL}/api/safe-route/?start_lat=${finalStartLat}&start_lng=${finalStartLng}&end_lat=${finalEndLat}&end_lng=${finalEndLng}&type=${routeType}&mode=${transportMode}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch route details");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStats(data.properties);

      // Extract coordinates from LineString. 
      // OSRM returns [lng, lat], Leaflet needs [lat, lng]
      if (data.geometry && data.geometry.coordinates) {
        const coords = data.geometry.coordinates.map((p: any) => [p[1], p[0]] as [number, number]);
        setRouteCoords(coords);
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error calculating route");
    } finally {
      setLoading(false);
    }
  };

  // Format helpers
  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(1)} km`;
  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return mins > 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins} min`;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStartPos([latitude, longitude]);

        try {
          // Reverse geocode to get a readable address
          const res = await fetch(
            `${API_BASE_URL}/api/safe-route/reverse-geocode?lat=${latitude}&lng=${longitude}`,
          );
          if (res.ok) {
            const data = await res.json();
            setStartText(data.address.split(",")[0] || "My Location");
          } else {
            setStartText("My Location");
          }
        } catch (e) {
          setStartText("My Location");
        }
        setLoading(false);
      },
      () => {
        setError("Unable to retrieve your location. Please check permissions.");
        setLoading(false);
      },
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Control Panel */}
      <div className="w-full lg:w-1/3 bg-card border rounded-lg shadow-sm p-4 flex flex-col gap-5 official-card overflow-y-auto">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 mb-1 text-primary">
            <Shield className="w-6 h-6 text-blue-600" />
            Safe Route AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Dynamic pathfinding bypassing active crime hotspots.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="relative" ref={startRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">
              Start Location
            </label>
            <div className="flex border rounded-lg overflow-hidden bg-background shadow-inner relative">
              <span className="p-3 bg-gray-50 border-r text-green-600">
                <MapPin size={18} />
              </span>
              <div className="flex-1 flex">
                <input
                  type="text"
                  className="w-full p-3 pr-10 outline-none bg-transparent font-medium"
                  value={startText}
                  onChange={(e) => {
                    setStartText(e.target.value);
                    setStartPos(null);
                    setShowStartSugg(true);
                  }}
                  onFocus={() => setShowStartSugg(true)}
                  placeholder="Search starting point..."
                />
                <button
                  onClick={handleGetCurrentLocation}
                  title="Use Current Location"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Navigation size={18} />
                </button>
              </div>
            </div>
            {showStartSugg && startSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {startSuggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => selectStart(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex items-center gap-2"
                  >
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative" ref={endRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">
              Destination
            </label>
            <div className="flex border rounded-lg overflow-hidden bg-background shadow-inner">
              <span className="p-3 bg-gray-50 border-r text-red-600">
                <MapPin size={18} />
              </span>
              <input
                type="text"
                className="w-full p-3 outline-none bg-transparent font-medium"
                value={endText}
                onChange={(e) => {
                  setEndText(e.target.value);
                  setEndPos(null);
                  setShowEndSugg(true);
                }}
                onFocus={() => setShowEndSugg(true)}
                placeholder="Search destination..."
              />
            </div>
            {showEndSugg && endSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {endSuggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => selectEnd(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex items-center gap-2"
                  >
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="bg-gray-100 p-1 border rounded-lg inline-flex w-full">
            <button
              onClick={() => setRouteType("safe")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${routeType === "safe" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Shield size={16} /> Safest Route
            </button>
            <button
              onClick={() => setRouteType("fast")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${routeType === "fast" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Zap size={16} /> Fastest Route
            </button>
          </div>

          {/* Transport Mode Toggles */}
          <div className="bg-gray-100 p-1 border rounded-lg inline-flex w-full">
            <button
              onClick={() => setTransportMode("car")}
              className={`flex-1 overflow-hidden py-2 text-xs font-bold rounded-md flex flex-col items-center justify-center gap-1 transition-all ${transportMode === "car" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Car size={16} /> Car
            </button>
            <button
              onClick={() => setTransportMode("bike")}
              className={`flex-1 py-2 text-xs overflow-hidden font-bold rounded-md flex flex-col items-center justify-center gap-1 transition-all ${transportMode === "bike" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Bike size={16} /> Bike
            </button>
            <button
              onClick={() => setTransportMode("cycling")}
              className={`flex-1 py-2 text-xs overflow-hidden font-bold rounded-md flex flex-col items-center justify-center gap-1 transition-all ${transportMode === "cycling" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Bike size={16} /> Cycle
            </button>
            <button
              onClick={() => setTransportMode("walking")}
              className={`flex-1 py-2 text-xs overflow-hidden font-bold rounded-md flex flex-col items-center justify-center gap-1 transition-all ${transportMode === "walking" ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
            >
              <Footprints size={16} /> Walk
            </button>
          </div>
        </div>

        <button
          onClick={findRoute}
          disabled={loading || !startText || !endText}
          className="w-full py-3.5 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              Analyzing Route...
            </>
          ) : (
            "Generate Dynamic Route"
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Panel */}
        {stats && !loading && (
          <div className="flex-1 mt-2 border border-gray-100 rounded-xl bg-white shadow-sm p-5 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-2 gap-4 mb-5 border-b pb-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                  ETA
                </span>
                <span className="text-2xl font-black flex items-center gap-1.5 text-gray-900">
                  <Clock size={20} className="text-blue-500" />{" "}
                  {formatDuration(stats.duration)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                  Distance
                </span>
                <span className="text-2xl font-black flex items-center gap-1.5 text-gray-900">
                  <Navigation size={20} className="text-indigo-400" />{" "}
                  {formatDistance(stats.distance)}
                </span>
              </div>
            </div>

            {/* Efficiency Stat */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <Zap size={16} className="text-yellow-500" /> Time Efficiency
              </div>
              <div className="font-bold text-sm">{stats.time_efficiency}%</div>
            </div>

            {/* Number of Risks */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <AlertTriangle
                  size={16}
                  className={
                    stats.high_risk_zones > 0
                      ? "text-red-500"
                      : "text-green-500"
                  }
                />
                High-Risk Crossings
              </div>
              <div
                className={`font-bold text-sm ${stats.high_risk_zones > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {stats.high_risk_zones} zones
              </div>
            </div>

            <div
              className="p-4 rounded-xl flex items-center justify-between"
              style={{
                backgroundColor:
                  stats.safety_score > 80
                    ? "rgba(34, 197, 94, 0.1)"
                    : stats.safety_score > 60
                      ? "rgba(234, 179, 8, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${stats.safety_score > 80 ? "rgba(34, 197, 94, 0.3)" : stats.safety_score > 60 ? "rgba(234, 179, 8, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Exposure Level
                </span>
                <span
                  className={`font-black uppercase tracking-wide flex items-center gap-1.5 ${stats.risk_level === "Low" ? "text-green-600" : stats.risk_level === "Medium" ? "text-yellow-600" : "text-red-600"}`}
                >
                  {stats.risk_level === "Low" ? (
                    <Shield size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                  {stats.risk_level}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Safety Index
                </span>
                <span
                  className="text-4xl font-black tracking-tighter"
                  style={{
                    color:
                      stats.safety_score > 80
                        ? "#16a34a"
                        : stats.safety_score > 60
                          ? "#ca8a04"
                          : "#dc2626",
                  }}
                >
                  {stats.safety_score}
                  <span className="text-sm font-bold text-gray-400">/100</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="w-full lg:w-2/3 border rounded-xl overflow-hidden shadow-sm relative z-0 bg-gray-50 flex flex-col">
        <MapContainer 
          center={[22.5726, 88.3639]} 
          zoom={13} 
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {crimePoints.length > 0 && <HeatmapLayer points={crimePoints} />}
          {startPos && <Marker position={startPos} />}
          {endPos && <Marker position={endPos} />}
          {routeCoords.length > 0 && (
             <Polyline 
               positions={routeCoords} 
               color={routeType === "safe" ? "#22c55e" : "#3b82f6"} 
               weight={6} 
               opacity={0.8} 
             />
          )}
          <MapUpdater startPos={startPos} endPos={endPos} routeCoords={routeCoords} />
        </MapContainer>

        {/* Loading overlay over map */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-blue-600 animate-pulse">
              <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></span>
              Rebuilding Prediction Map...
            </div>
          </div>
        )}

        {/* LegendOverlay */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 z-[1000] text-sm pointer-events-none transition-all">
          <h4 className="font-black mb-3 text-[10px] uppercase tracking-widest text-gray-500 border-b pb-2">
            Dynamic Threat Radar
          </h4>

          {stats?.high_risk_zones !== undefined &&
            stats.high_risk_zones > 3 && (
              <div className="mb-3 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1 animate-pulse">
                <AlertTriangle size={12} /> Extreme Risk Alert
              </div>
            )}

          <div className="flex items-center gap-3 mb-2 font-medium">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
            <span
              className={
                stats?.risk_level === "High"
                  ? "font-bold text-red-600"
                  : "text-gray-600"
              }
            >
              High Risk
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2 font-medium">
            <div className="w-3 h-3 rounded-full bg-[#ff7f50] shadow-[0_0_8px_rgba(255,127,80,0.5)]"></div>
            <span
              className={
                stats?.risk_level === "Medium"
                  ? "font-bold text-orange-600"
                  : "text-gray-600"
              }
            >
              Medium Risk
            </span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
            <span
              className={
                stats?.risk_level === "Low"
                  ? "font-bold text-blue-600"
                  : "text-gray-600"
              }
            >
              Low Risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRouteTab;
