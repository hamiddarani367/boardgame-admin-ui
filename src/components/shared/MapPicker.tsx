"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// تنظیم آیکون پیش‌فرض با فایل محلی
const defaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  iconRetinaUrl: "/images/marker-icon-2x.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange?: (value: { lat: number; lng: number }) => void;
  height?: string;
}

function LocationMarker({
  value,
  onChange,
}: {
  value?: { lat: number; lng: number } | null;
  onChange?: (value: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onChange?.({ lat, lng });
    },
  });

  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

export function MapPicker({
  value,
  onChange,
  height = "300px",
}: MapPickerProps) {
  const defaultCenter: [number, number] = value
    ? [value.lat, value.lng]
    : [35.7219, 51.3347];

  return (
    <div
      style={{ height, zIndex: 0 }}
      className="rounded-md overflow-hidden border border-input"
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}