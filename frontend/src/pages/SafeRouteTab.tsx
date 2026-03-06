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
  CheckCircle2,
  Crosshair,
  ShieldCheck,
  Activity
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import HeatmapLayer from "../components/HeatmapLayer";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

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
  lvl === "Low" ? "text-emerald-500" : lvl === "Medium" ? "text-amber-500" : "text-rose-500";
const scoreBg = (score: number) =>
  score > 80 ? "rgba(16,185,129,0.15)" : score > 60 ? "rgba(245,158,11,0.15)" : "rgba(244,63,94,0.15)";
const scoreBorder = (score: number) =>
  score > 80 ? "rgba(16,185,129,0.4)" : score > 60 ? "rgba(245,158,11,0.4)" : "rgba(244,63,94,0.4)";
const scoreHex = (score: number) =>
  score > 80 ? "#10b981" : score > 60 ? "#f59e0b" : "#f43f5e";

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

  const [mode,    setMode]    = useState<"car"|"bike"|"cycling"|"walking">("car");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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
        fetch(`${API_BASE_URL}/api/safe-route/compare?start_lat=${sLat}&start_lng=${sLng}&end_lat=${eLat}&end_lng=${eLng}&mode=${mode}`),
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

  const modeBtn = (m: typeof mode, icon: React.ReactNode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl flex flex-col items-center gap-1.5 transition-all duration-300 ${
        mode === m 
          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400 ring-offset-2" 
          : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[700px]">
      
      {/* ── AI Dashboard Control Panel ── */}
      <div className="w-full lg:w-[400px] flex flex-col gap-5 overflow-y-auto pr-2 pb-4">
        
        {/* Header styling */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full blur-[50px] opacity-20 -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-blue-400" /> 
              Sahayta AI
            </h2>
            <p className="text-blue-200/80 text-sm font-medium leading-relaxed">
              Real-time predictive safety routing powered by live crime data analysis.
            </p>
          </div>
        </div>

        {/* Search Inputs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div className="relative" ref={startRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 flex items-center gap-1.5">
              <Crosshair size={12} className="text-blue-500" /> Origin
            </label>
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
              <input
                className="w-full p-3.5 pl-4 outline-none bg-transparent font-semibold text-gray-800"
                value={startText}
                onChange={e => { setStartText(e.target.value); setStartPos(null); setShowSS(true); }}
                onFocus={() => setShowSS(true)}
                placeholder="Where are you starting?"
              />
              <button onClick={handleCurrentLocation} title="Use my location"
                className="px-4 text-blue-600 hover:bg-blue-100/50 transition-colors flex items-center justify-center">
                <Navigation size={18} />
              </button>
            </div>
            {showSS && startSugg.length > 0 && (
              <ul className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-auto">
                {startSugg.map((s, i) => (
                  <li key={i} onClick={() => selectStart(s)}
                    className="p-3.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex gap-3 font-medium text-gray-700 transition-colors">
                    <MapPin size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-center -my-3 relative z-10 pointer-events-none">
            <div className="bg-white p-1 rounded-full border border-gray-100 shadow-sm text-gray-300">
              <AlertCircle size={14} />
            </div>
          </div>

          <div className="relative" ref={endRef}>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 flex items-center gap-1.5">
              <MapPin size={12} className="text-rose-500" /> Destination
            </label>
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-400 transition-all">
              <input
                className="w-full p-3.5 pl-4 outline-none bg-transparent font-semibold text-gray-800"
                value={endText}
                onChange={e => { setEndText(e.target.value); setEndPos(null); setShowES(true); }}
                onFocus={() => setShowES(true)}
                placeholder="Where to?"
              />
            </div>
            {showES && endSugg.length > 0 && (
              <ul className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-auto">
                {endSugg.map((s, i) => (
                  <li key={i} onClick={() => selectEnd(s)}
                    className="p-3.5 hover:bg-rose-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex gap-3 font-medium text-gray-700 transition-colors">
                    <MapPin size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Transport Modes */}
        <div className="flex gap-2 w-full">
          {modeBtn("car",     <Car size={20} />,      "Car")}
          {modeBtn("bike",    <Bike size={20} />,     "Bike")}
          {modeBtn("cycling", <Bike size={20} />,     "Cycle")}
          {modeBtn("walking", <Footprints size={20}/>, "Walk")}
        </div>

        <button
          onClick={findRoute}
          disabled={loading || !startText || !endText}
          className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {loading ? (
            <span className="relative z-10 flex items-center gap-3">
              <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> 
              Computing Safety Matrix...
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" /> Generate Safe Route
            </span>
          )}
        </button>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-semibold flex items-start gap-3 shadow-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Beautiful AI Results Card ── */}
        {safeData && !loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 border-b border-gray-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ShieldCheck className="text-emerald-500" size={18} /> Optimized Safe Route
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                AI Verified
              </span>
            </div>

            <div className="p-5">
              {/* Core metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Time</div>
                  <div className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                    {formatETA(safeData.properties.duration)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Distance</div>
                  <div className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                    {formatDist(safeData.properties.distance)}
                  </div>
                </div>
              </div>

              {/* Safety Score Highlight */}
              <div 
                className="rounded-xl p-5 border relative overflow-hidden mb-4"
                style={{ 
                  backgroundColor: scoreBg(safeData.properties.safety_score), 
                  borderColor: scoreBorder(safeData.properties.safety_score) 
                }}
              >
                <Activity size={100} className="absolute -right-6 -bottom-6 opacity-[0.05]" style={{ color: scoreHex(safeData.properties.safety_score) }} />
                
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-1" style={{ color: scoreHex(safeData.properties.safety_score) }}>Security Rating</div>
                    <div className={`text-lg font-black flex items-center gap-1.5 ${riskColor(safeData.properties.risk_level)}`}>
                      {safeData.properties.risk_level === "Low" ? <Shield size={18} /> : <AlertTriangle size={18} />}
                      {safeData.properties.risk_level} Risk Route
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black tracking-tighter" style={{ color: scoreHex(safeData.properties.safety_score) }}>
                      {safeData.properties.safety_score}
                      <span className="text-lg opacity-50 font-bold ml-0.5">/100</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings List */}
              {safeData.properties.high_risk_zones > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-rose-100 p-2 rounded-lg text-rose-600 mt-0.5"><AlertTriangle size={16} /></div>
                  <div>
                    <h5 className="text-sm font-bold text-rose-800 mb-0.5">High-Risk Zones Detected</h5>
                    <p className="text-xs text-rose-600/80 font-medium leading-relaxed">
                      AI has routed you through {safeData.properties.high_risk_zones} high-risk varified crime zone(s). Proceed with caution and avoid unlit areas.
                    </p>
                  </div>
                </div>
              )}
              
              {safeData.properties.high_risk_zones === 0 && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mt-0.5"><ShieldCheck size={16} /></div>
                  <div>
                    <h5 className="text-sm font-bold text-emerald-800 mb-0.5">Clear Path Forward</h5>
                    <p className="text-xs text-emerald-600/80 font-medium leading-relaxed">
                      This route uniquely avoids all known major crime hotspots reported in real-time.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ── Map area ── */}
      <div className="w-full lg:flex-1 border-2 border-slate-100 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/5 relative z-0 flex flex-col">
        <MapContainer center={[22.5726, 88.3639]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {crimePoints.length > 0 && <HeatmapLayer points={crimePoints} />}

          {/* Render ONLY the safe route polyline */}
          {safeCoords.length > 0 && (
            <Polyline positions={safeCoords}
              color="#22c55e"
              weight={7}
              opacity={0.9}
              lineCap="round"
              lineJoin="round"
              className="drop-shadow-md"
            />
          )}

          {startPos && <Marker position={startPos} />}
          {endPos   && <Marker position={endPos}   />}
          {safeCoords.length > 0 && <MapBounds coords={safeCoords} />}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/20 backdrop-blur-[2px]">
            <div className="bg-gray-900/90 text-white px-8 py-5 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
              <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <div className="text-center">
                <div className="font-black tracking-wide">Processing Spatial Data</div>
                <div className="text-xs text-gray-400 font-medium mt-1">Cross-referencing crime logs...</div>
              </div>
            </div>
          </div>
        )}

        {/* Sleek Legend */}
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-gray-100 z-[1000] text-sm pointer-events-none">
          <h4 className="font-black mb-3 text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">Map Legend</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="font-bold text-gray-700">AI Safe Route</span>
          </div>
          <div className="space-y-2 mt-3 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> High Crime Density
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> Medium Density
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" /> Low / Safe Area
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRouteTab;
