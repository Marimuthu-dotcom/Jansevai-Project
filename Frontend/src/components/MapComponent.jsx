import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ latitude, longitude, locationName }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) 
        return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);

      // Add marker
      markerRef.current = L.marker([latitude, longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(locationName || 'Complaint Location')
        .openPopup();
    } 
    else {
      // Update existing map position
      mapInstanceRef.current.setView([latitude, longitude], 15);
      
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        markerRef.current.bindPopup(locationName || 'Complaint Location');
      } else {
        markerRef.current = L.marker([latitude, longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup(locationName || 'Complaint Location')
          .openPopup();
      }
    }

    // Disable dragging to prevent changing location
    mapInstanceRef.current.dragging.disable();
    mapInstanceRef.current.touchZoom.disable();
    mapInstanceRef.current.doubleClickZoom.disable();
    mapInstanceRef.current.scrollWheelZoom.enable(); // Allow scrolling
    mapInstanceRef.current.zoomControl.enable();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, locationName]);

  // Check if coordinates are valid
  if (!latitude || !longitude) 
  {
    return (
      <div style={{
        width: '100%',
        height: '250px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '10px',
        marginBottom: '20px',
        color: '#666'
      }}>
        <p>📍 Location coordinates not available</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '260px', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden' }}>
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%' }}
      />
      {/* Optional: Add a subtle hint */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '15px',
        fontSize: '11px',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        Scroll to zoom • Location locked
      </div>
    </div>
  );
};

export default MapComponent;