import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  MapPin,
  Navigation,
  AlertTriangle,
  AlertCircle,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  Map as MapIcon,
  Layers
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import HeatmapLayer from "../components/HeatmapLayer";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom pointers for source and destination
const startIcon = L.divIcon({
  className: "custom-start-pin",
  iconAnchor: [15, 30],
  html: `<div style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 3px solid white; transform: rotate(-45deg); box-shadow: 2px 2px 4px rgba(0,0,0,0.3);"></div>`
});

const endIcon = L.divIcon({
  className: "custom-end-pin",
  iconAnchor: [15, 30],
  html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 3px solid white; transform: rotate(-45deg); box-shadow: 2px 2px 4px rgba(0,0,0,0.3);"></div>`
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// ── Types ────────────────────────────────────────────────────────────────────
interface Suggestion { address: string; lat: number; lng: number; }

interface RouteStats {
  distance: number;
  duration: number;
  safety_score: number;
  risk_level: string;
  time_efficiency: number;
  high_risk_zones: number;
  normalized_risk: number;
  is_safe_route?: boolean;
}

interface RouteFeature {
  type: string;
  properties: RouteStats;
  geometry: { type: string; coordinates: [number, number][] };
}

interface CompareResult { safe: RouteFeature; fastest: RouteFeature; mode: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDist = (m: number) => `${(m / 1000).toFixed(1)} km`;
const formatETA  = (s: number) => {
  const mins = Math.round(s / 60);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins} min`;
};
const riskColor = (lvl: string) =>
  lvl === "Low" ? "text-green-600" : lvl === "Medium" ? "text-yellow-600" : "text-red-600";
const scoreBg = (score: number) =>
  score > 80 ? "rgba(34,197,94,0.1)" : score > 60 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)";
const scoreBorder = (score: number) =>
  score > 80 ? "rgba(34,197,94,0.3)" : score > 60 ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)";
const scoreHex = (score: number) =>
  score > 80 ? "#16a34a" : score > 60 ? "#ca8a04" : "#dc2626";

// ── Map auto-bounds component ─────────────────────────────────────────────────
function MapBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    }
  }, [map, coords]);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
const SafeRouteTab: React.FC = () => {
  const [startPos,  setStartPos]  = useState<[number, number] | null>(null);
  const [endPos,    setEndPos]    = useState<[number, number] | null>(null);
  const [startText, setStartText] = useState("");
  const [endText,   setEndText]   = useState("");

  const [startSugg, setStartSugg] = useState<Suggestion[]>([]);
  const [endSugg,   setEndSugg]   = useState<Suggestion[]>([]);
  const [showSS,    setShowSS]    = useState(false);
  const [showES,    setShowES]    = useState(false);

  // We enforce walking mode strictly per user request
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [crimePoints,   setCrimePoints]   = useState<[number, number, number][]>([]);

  const startRef = useRef<HTMLDivElement>(null);
  const endRef   = useRef<HTMLDivElement>(null);

  // Click outside dropdowns
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) setShowSS(false);
      if (endRef.current   && !endRef.current.contains(e.target as Node))   setShowES(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Load base crime heatmap
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/safe-route/crime-predictions`)
      .then(r => r.json())
      .then(d => setCrimePoints(d))
      .catch(() => {});
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    const t = setTimeout(async () => {
      if (startText.length > 2 && showSS) {
        const r = await fetch(`${API_BASE_URL}/api/safe-route/autocomplete?q=${encodeURIComponent(startText)}`).catch(() => null);
        if (r?.ok) setStartSugg(await r.json()); else setStartSugg([]);
      } else setStartSugg([]);
    }, 300);
    return () => clearTimeout(t);
  }, [startText, showSS]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (endText.length > 2 && showES) {
        const r = await fetch(`${API_BASE_URL}/api/safe-route/autocomplete?q=${encodeURIComponent(endText)}`).catch(() => null);
        if (r?.ok) setEndSugg(await r.json()); else setEndSugg([]);
      } else setEndSugg([]);
    }, 300);
    return () => clearTimeout(t);
  }, [endText, showES]);

  const selectStart = (s: Suggestion) => { setStartText(s.address.split(",")[0]); setStartPos([s.lat, s.lng]); setShowSS(false); };
  const selectEnd   = (s: Suggestion) => { setEndText(s.address.split(",")[0]);   setEndPos([s.lat, s.lng]);   setShowES(false); };

  const geocode = async (q: string) => {
    const r = await fetch(`${API_BASE_URL}/api/safe-route/geocode?q=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error(`Could not find: ${q}`);
    return r.json() as Promise<{ lat: number; lng: number }>;
  };

  const findRoute = async () => {
    if (!startText || !endText) { setError("Enter both locations."); return; }
    setLoading(true); setError(null); setCompareResult(null);

    try {
      let sLat = startPos?.[0], sLng = startPos?.[1];
      let eLat = endPos?.[0],   eLng = endPos?.[1];

      if (!startPos) { const g = await geocode(startText); sLat = g.lat; sLng = g.lng; setStartPos([g.lat, g.lng]); }
      if (!endPos)   { const g = await geocode(endText);   eLat = g.lat; eLng = g.lng; setEndPos([g.lat, g.lng]); }

      if (!sLat || !sLng || !eLat || !eLng) throw new Error("Could not resolve coordinates.");

      const bbox = `${Math.min(sLat, eLat) - 0.05},${Math.min(sLng, eLng) - 0.05},${Math.max(sLat, eLat) + 0.05},${Math.max(sLng, eLng) + 0.05}`;
      const [compareRes, crimeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/safe-route/compare?start_lat=${sLat}&start_lng=${sLng}&end_lat=${eLat}&end_lng=${eLng}&mode=walking`),
        fetch(`${API_BASE_URL}/api/safe-route/crime-predictions?bbox=${bbox}`),
      ]);

      if (!compareRes.ok) throw new Error("Route calculation failed. Please retry.");
      const data: CompareResult = await compareRes.json();
      if ((data as any).error) throw new Error((data as any).error);
      setCompareResult(data);

      if (crimeRes.ok) setCrimePoints(await crimeRes.json());
    } catch (e: any) {
      setError(e.message || "Error calculating route");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setStartPos([lat, lng]);
        try {
          const r = await fetch(`${API_BASE_URL}/api/safe-route/reverse-geocode?lat=${lat}&lng=${lng}`);
          const d = await r.json();
          setStartText(d.address?.split(",")[0] || "My Location");
        } catch { setStartText("My Location"); }
        setLoading(false);
      },
      () => { setError("Unable to get location."); setLoading(false); }
    );
  };

  const safeData = compareResult?.safe;
  const safeCoords: [number, number][] = safeData
    ? safeData.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[600px] w-full max-w-7xl mx-auto overflow-hidden">
      
      {/* ── Control Panel ── */}
      <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col bg-white border rounded-lg shadow-sm h-[500px] lg:h-full relative">
        <div className="p-4 lg:p-5 overflow-y-auto w-full h-full flex flex-col gap-5 pb-8 min-h-0">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 mb-1 text-gray-900">
            <Shield className="w-6 h-6 text-blue-600" /> Safe Route
          </h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Find the safest pedestrian path avoiding known crime hotspots.
          </p>
        </div>

        {/* Location inputs */}
        <div className="space-y-4">
          <div className="relative" ref={startRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Start Location</label>
            <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
              <span className="p-3 bg-gray-50 border-r text-gray-400"><MapPin size={18} /></span>
              <div className="flex-1 flex">
                <input
                  className="w-full p-3 pr-10 outline-none bg-transparent font-medium text-gray-800"
                  value={startText}
                  onChange={e => { setStartText(e.target.value); setStartPos(null); setShowSS(true); }}
                  onFocus={() => setShowSS(true)}
                  placeholder="Enter starting point..."
                />
                <button onClick={handleCurrentLocation} title="Use my location"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <Navigation size={18} />
                </button>
              </div>
            </div>
            {showSS && startSugg.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {startSugg.map((s, i) => (
                  <li key={i} onClick={() => selectStart(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex gap-2 text-gray-700">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative" ref={endRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Destination</label>
            <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
              <span className="p-3 bg-gray-50 border-r text-gray-400"><MapPin size={18} /></span>
              <input
                className="w-full p-3 outline-none bg-transparent font-medium text-gray-800"
                value={endText}
                onChange={e => { setEndText(e.target.value); setEndPos(null); setShowES(true); }}
                onFocus={() => setShowES(true)}
                placeholder="Enter destination..."
              />
            </div>
            {showES && endSugg.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {endSugg.map((s, i) => (
                  <li key={i} onClick={() => selectEnd(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex gap-2 text-gray-700">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Walk mode indicator */}
        <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg flex items-center gap-3">
          <Footprints size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">Safe Route is strictly optimized for pedestrian walking speeds.</p>
        </div>

        <button
          onClick={findRoute}
          disabled={loading || !startText || !endText}
          className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> Calculating Route...</>
          ) : (
            <>Find Safe Walking Route</>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium flex gap-2 items-start">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Route Statistics Card ── */}
        {safeData && !loading && (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mt-2">
            <div className="bg-gray-50 border-b p-3 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-600" /> Route Suggestion
              </span>
            </div>

            <div className="p-4 space-y-4">
              
              {/* Highlighted Prominent Safety Index */}
              <div 
                className="rounded-xl p-5 border flex items-center justify-between"
                style={{ backgroundColor: scoreBg(safeData.properties.safety_score), borderColor: scoreBorder(safeData.properties.safety_score) }}
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1" style={{ color: scoreHex(safeData.properties.safety_score) }}>
                    Safety Index
                  </div>
                  <div className={`text-base font-bold flex items-center gap-1.5 ${riskColor(safeData.properties.risk_level)}`}>
                    {safeData.properties.risk_level === "Low" ? <Shield size={18} /> : <AlertTriangle size={18} />}
                    {safeData.properties.risk_level} Risk Area
                  </div>
                </div>
                <div className="text-right flex items-baseline gap-1 bg-white p-3 rounded-xl shadow-sm border border-black/5" style={{ color: scoreHex(safeData.properties.safety_score) }}>
                  <span className="text-4xl font-black">
                    {safeData.properties.safety_score}
                  </span>
                  <span className="text-sm font-bold opacity-60">/100</span>
                </div>
              </div>

              {/* Driving ETA / Dist */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col items-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Footprints size={12}/> Walking Time</div>
                  <div className="text-xl font-black text-gray-900 flex items-center gap-1.5">
                    {formatETA(safeData.properties.duration)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col items-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Distance</div>
                  <div className="text-xl font-black text-gray-900 flex items-center gap-1.5">
                    {formatDist(safeData.properties.distance)}
                  </div>
                </div>
              </div>

              {safeData.properties.high_risk_zones > 0 && (
                <div className="flex items-start gap-2 text-sm text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> 
                  Passes through {safeData.properties.high_risk_zones} high-risk zone{safeData.properties.high_risk_zones > 1 ? "s" : ""}. Proceed with appropriate caution.
                </div>
              )}
              {safeData.properties.high_risk_zones === 0 && (
                <div className="flex items-start gap-2 text-sm text-green-700 font-medium bg-green-50 p-2.5 rounded-lg border border-green-100">
                  <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" /> 
                  This route strictly avoids all major known high-risk crime zones.
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Map Area ── */}
      <div className="w-full lg:flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm relative z-0 flex flex-col bg-gray-50">
        
        {/* Map Type Toggle */}
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
          <button 
            onClick={() => setMapType("standard")}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${mapType === "standard" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <MapIcon size={14} /> Map
          </button>
          <div className="w-px bg-gray-200"></div>
          <button 
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${mapType === "satellite" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Layers size={14} /> Satellite
          </button>
        </div>

        <MapContainer center={[22.5726, 88.3639]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          {mapType === "standard" ? (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          {crimePoints.length > 0 && <HeatmapLayer points={crimePoints} />}

          {safeCoords.length > 0 && (
            <Polyline positions={safeCoords}
              color={mapType === "satellite" ? "#10b981" : "#22c55e"} // slightly brighter green on sat view
              weight={6}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {startPos && <Marker position={startPos} icon={startIcon} />}
          {endPos   && <Marker position={endPos} icon={endIcon} />}
          {safeCoords.length > 0 && <MapBounds coords={safeCoords} />}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 font-semibold text-blue-700">
              <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              Calculating Safe Route...
            </div>
          </div>
        )}

        {/* Legend */}
        <div className={`absolute bottom-4 left-4 p-3.5 rounded-lg shadow-md border z-[1000] text-sm pointer-events-none ${
          mapType === "satellite" ? "bg-black/70 backdrop-blur-md border-white/20 text-white" : "bg-white/95 backdrop-blur-sm border-gray-200 text-gray-800"
        }`}>
          <h4 className={`font-bold mb-2 text-[10px] uppercase tracking-wider border-b pb-1.5 ${mapType === "satellite" ? "text-gray-300 border-white/20" : "text-gray-500 border-gray-200"}`}>
            Map Legend
          </h4>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-4 h-1.5 rounded-full bg-green-500 shadow-sm" />
            <span className="font-bold text-xs">Safe Walking Route</span>
          </div>
          <div className={`space-y-1.5 text-xs font-medium ${mapType === "satellite" ? "text-gray-200" : "text-gray-600"}`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" /> High Crime Density
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" /> Medium Density
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-300 shadow-[0_0_2px_rgba(255,255,255,0.5)]" /> Low Density / Safe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRouteTab;
