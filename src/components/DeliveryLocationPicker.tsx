// Source: Google Maps Platform Code Assist
import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, CheckCircle2 } from 'lucide-react';

interface DeliveryLocationPickerProps {
  coordinates: { lat: number; lng: number };
  onChangeCoordinates: (coords: { lat: number; lng: number }) => void;
  addressText: string;
  onChangeAddressText: (addr: string) => void;
}

const DEFAULT_JAKARTA = { lat: -6.2087634, lng: 106.845599 };

export const DeliveryLocationPicker: React.FC<DeliveryLocationPickerProps> = ({
  coordinates,
  onChangeCoordinates,
  addressText,
  onChangeAddressText,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(coordinates || DEFAULT_JAKARTA);

  useEffect(() => {
    if (coordinates && (coordinates.lat !== mapCenter.lat || coordinates.lng !== mapCenter.lng)) {
      setMapCenter(coordinates);
    }
  }, [coordinates]);

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail && e.detail.latLng) {
      const newCoords = {
        lat: Number(e.detail.latLng.lat.toFixed(6)),
        lng: Number(e.detail.latLng.lng.toFixed(6)),
      };
      onChangeCoordinates(newCoords);
      setMapCenter(newCoords);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung deteksi lokasi otomatis.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        onChangeCoordinates(coords);
        setMapCenter(coords);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
      <div>
        <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alamat Lengkap Pengiriman *</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-normal">Wajib diisi</span>
        </label>
        <textarea
          required
          rows={2}
          value={addressText}
          onChange={(e) => onChangeAddressText(e.target.value)}
          placeholder="Nama jalan, RT/RW, nomor rumah/kantor, patokan (misal: samping masjid)..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Google Maps Pinpoint Header & Action */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>Titik Lokasi Google Maps:</span>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Gunakan GPS perangkat Anda"
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Mencari...' : 'Gunakan GPS'}</span>
        </button>
      </div>

      {/* Interactive Google Map */}
      <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-900 shadow-inner">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              center={mapCenter}
              defaultCenter={mapCenter}
              defaultZoom={15}
              zoom={15}
              onCenterChanged={(e) => {
                if (e.detail?.center) {
                  setMapCenter(e.detail.center);
                }
              }}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              onClick={handleMapClick}
              gestureHandling="cooperative"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              <AdvancedMarker position={coordinates} />
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500 text-xs">
            <MapPin className="w-6 h-6 text-slate-600 mb-1" />
            <span>Memuat Google Maps...</span>
          </div>
        )}

        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1 truncate font-mono">
            <span className="text-emerald-400 font-bold">📍 Pin:</span>
            <span className="truncate">{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 shrink-0 ml-2"
          >
            <span>Preview</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
        <span>Klik atau ketuk peta di atas untuk menggeser pin lokasi pengantaran yang paling akurat untuk kurir.</span>
      </div>
    </div>
  );
};
