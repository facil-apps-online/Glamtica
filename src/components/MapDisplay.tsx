import React from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

interface MapDisplayProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '300px',
  borderRadius: '0.5rem',
};

// Ubicación por defecto (centro de Sudamérica) si no hay coordenadas
const defaultCenter = {
  lat: -20.0,
  lng: -60.0,
};

export function MapDisplay({ latitude, longitude }: MapDisplayProps) {
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter;
  const zoom = latitude && longitude ? 15 : 2; // Zoom más cercano si hay un marcador

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      options={{
        streetViewControl: false, // Ocultar Street View
        mapTypeControl: false,    // Ocultar selector de tipo de mapa
        fullscreenControl: false, // Ocultar botón de pantalla completa
      }}
    >
      {latitude && longitude && (
        <MarkerF
          position={{ lat: latitude, lng: longitude }}
        />
      )}
    </GoogleMap>
  );
}
