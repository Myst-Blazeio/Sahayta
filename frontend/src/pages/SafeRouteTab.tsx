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

// ── Route stats mini-card ────────────────────────────────────────────────────
function RouteCard({
  label, color, stats, active, onClick,
}: {
  label: string; color: string; stats: RouteStats; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
        active ? `border-${color}-500 shadow-md bg-${color === "green" ? "green" : "blue"}-50/50` : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      style={{ borderColor: active ? (color === "green" ? "#22c55e" : "#3b82f6") : undefined }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color === "green" ? "#22c55e" : "#3b82f6" }}
        >
          {label}
        </span>
        {active && <CheckCircle2 size={16} style={{ color: color === "green" ? "#22c55e" : "#3b82f6" }} />}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">ETA</div>
          <div className="text-lg font-black text-gray-900 flex items-center gap-1">
            <Clock size={14} className="text-blue-500 flex-shrink-0" />
            {formatETA(stats.duration)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Distance</div>
          <div className="text-lg font-black text-gray-900 flex items-center gap-1">
            <Navigation size={14} className="text-indigo-400 flex-shrink-0" />
            {formatDist(stats.distance)}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-3 flex items-center justify-between"
        style={{ backgroundColor: scoreBg(stats.safety_score), border: `1px solid ${scoreBorder(stats.safety_score)}` }}
      >
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Risk</div>
          <div className={`text-sm font-black flex items-center gap-1 ${riskColor(stats.risk_level)}`}>
            {stats.risk_level === "Low" ? <Shield size={14} /> : <AlertTriangle size={14} />}
            {stats.risk_level}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Safety</div>
          <span className="text-2xl font-black" style={{ color: scoreHex(stats.safety_score) }}>
            {stats.safety_score}
            <span className="text-xs text-gray-400 font-bold">/100</span>
          </span>
        </div>
      </div>

      {stats.high_risk_zones > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-bold">
          <AlertTriangle size={11} /> {stats.high_risk_zones} high-risk zone{stats.high_risk_zones > 1 ? "s" : ""} crossed
        </div>
      )}
    </button>
  );
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
  const [activeRoute,   setActiveRoute]   = useState<"safe"|"fastest">("safe");
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

      // Fetch crime heatmap for this bbox concurrently with route
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

  // Route display data
  const activeData = compareResult
    ? (activeRoute === "safe" ? compareResult.safe : compareResult.fastest)
    : null;

  const safeCoords: [number, number][] = compareResult
    ? compareResult.safe.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : [];
  const fastCoords: [number, number][] = compareResult
    ? compareResult.fastest.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    : [];
  const displayCoords = activeRoute === "safe" ? safeCoords : fastCoords;

  const modeBtn = (m: typeof mode, icon: React.ReactNode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`flex-1 py-2 text-xs font-bold rounded-md flex flex-col items-center gap-1 transition-all ${mode === m ? "bg-white text-blue-600 shadow" : "text-gray-500 hover:bg-white/50"}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* ── Control panel ── */}
      <div className="w-full lg:w-1/3 bg-card border rounded-lg shadow-sm p-4 flex flex-col gap-4 official-card overflow-y-auto">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 mb-1 text-primary">
            <Shield className="w-6 h-6 text-blue-600" /> Safe Route AI
          </h2>
          <p className="text-sm text-muted-foreground">Dual-path analysis against live crime hotspots.</p>
        </div>

        {/* Location inputs */}
        <div className="space-y-3">
          {/* Start */}
          <div className="relative" ref={startRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Start</label>
            <div className="flex border rounded-lg overflow-hidden bg-background shadow-inner relative">
              <span className="p-3 bg-gray-50 border-r text-green-600"><MapPin size={18} /></span>
              <div className="flex-1 flex">
                <input
                  className="w-full p-3 pr-10 outline-none bg-transparent font-medium"
                  value={startText}
                  onChange={e => { setStartText(e.target.value); setStartPos(null); setShowSS(true); }}
                  onFocus={() => setShowSS(true)}
                  placeholder="Search starting point..."
                />
                <button onClick={handleCurrentLocation} title="Use my location"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                  <Navigation size={18} />
                </button>
              </div>
            </div>
            {showSS && startSugg.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {startSugg.map((s, i) => (
                  <li key={i} onClick={() => selectStart(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex gap-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* End */}
          <div className="relative" ref={endRef}>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Destination</label>
            <div className="flex border rounded-lg overflow-hidden bg-background shadow-inner">
              <span className="p-3 bg-gray-50 border-r text-red-600"><MapPin size={18} /></span>
              <input
                className="w-full p-3 outline-none bg-transparent font-medium"
                value={endText}
                onChange={e => { setEndText(e.target.value); setEndPos(null); setShowES(true); }}
                onFocus={() => setShowES(true)}
                placeholder="Search destination..."
              />
            </div>
            {showES && endSugg.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto">
                {endSugg.map((s, i) => (
                  <li key={i} onClick={() => selectEnd(s)}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex gap-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Transport mode */}
        <div className="bg-gray-100 p-1 border rounded-lg inline-flex w-full gap-0.5">
          {modeBtn("car",     <Car size={16} />,      "Car")}
          {modeBtn("bike",    <Bike size={16} />,     "Bike")}
          {modeBtn("cycling", <Bike size={16} />,     "Cycle")}
          {modeBtn("walking", <Footprints size={16}/>, "Walk")}
        </div>

        <button
          onClick={findRoute}
          disabled={loading || !startText || !endText}
          className="w-full py-3.5 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Analyzing Route...</>
            : "Compare Routes"}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Dual route comparison cards ── */}
        {compareResult && !loading && (
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 border-b pb-2">
              Route Comparison — {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </div>
            <div className="flex gap-2">
              <RouteCard
                label="Safest"
                color="green"
                stats={compareResult.safe.properties}
                active={activeRoute === "safe"}
                onClick={() => setActiveRoute("safe")}
              />
              <RouteCard
                label="Fastest"
                color="blue"
                stats={compareResult.fastest.properties}
                active={activeRoute === "fastest"}
                onClick={() => setActiveRoute("fastest")}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center">Click a card to highlight that route on the map</p>
          </div>
        )}

        {/* Active route full stats */}
        {activeData && !loading && (
          <div className="border border-gray-100 rounded-xl bg-white shadow-sm p-4 animate-in fade-in duration-300">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              {activeRoute === "safe" ? "🟢 Safest Route — Details" : "🔵 Fastest Route — Details"}
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1 text-gray-600 font-semibold"><Zap size={14} className="text-yellow-500"/> Time Efficiency</span>
              <span className="font-black">{activeData.properties.time_efficiency}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1 font-semibold ${activeData.properties.high_risk_zones > 0 ? "text-red-500" : "text-green-600"}`}>
                <AlertTriangle size={14}/> High-Risk Zones
              </span>
              <span className={`font-black text-sm ${activeData.properties.high_risk_zones > 0 ? "text-red-600" : "text-green-600"}`}>
                {activeData.properties.high_risk_zones} zones
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Map area ── */}
      <div className="w-full lg:w-2/3 border rounded-xl overflow-hidden shadow-sm relative z-0 flex flex-col">
        <MapContainer center={[22.5726, 88.3639]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {crimePoints.length > 0 && <HeatmapLayer points={crimePoints} />}

          {/* Both polylines always visible; active one is thicker */}
          {safeCoords.length > 0 && (
            <Polyline positions={safeCoords}
              color="#22c55e"
              weight={activeRoute === "safe" ? 7 : 4}
              opacity={activeRoute === "safe" ? 0.9 : 0.45}
              dashArray={activeRoute === "safe" ? undefined : "8 6"}
            />
          )}
          {fastCoords.length > 0 && (
            <Polyline positions={fastCoords}
              color="#3b82f6"
              weight={activeRoute === "fastest" ? 7 : 4}
              opacity={activeRoute === "fastest" ? 0.9 : 0.45}
              dashArray={activeRoute === "fastest" ? undefined : "8 6"}
            />
          )}

          {startPos && <Marker position={startPos} />}
          {endPos   && <Marker position={endPos}   />}
          {displayCoords.length > 0 && <MapBounds coords={displayCoords} />}
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-blue-600 animate-pulse">
              <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              Calculating Routes...
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 z-[1000] text-sm pointer-events-none">
          <h4 className="font-black mb-3 text-[10px] uppercase tracking-widest text-gray-500 border-b pb-2">Route Legend</h4>
          <div className="flex items-center gap-3 mb-2 font-medium">
            <div className="w-5 h-1.5 rounded-full bg-green-500" />
            <span className={activeRoute === "safe" ? "font-black text-green-600" : "text-gray-600"}>Safest Route</span>
          </div>
          <div className="flex items-center gap-3 mb-3 font-medium">
            <div className="w-5 h-1.5 rounded-full bg-blue-500" />
            <span className={activeRoute === "fastest" ? "font-black text-blue-600" : "text-gray-600"}>Fastest Route</span>
          </div>
          <div className="border-t pt-2 space-y-1.5 text-gray-600">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.6)]" /> High Risk</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.6)]" /> Medium Risk</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" /> Low Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRouteTab;
