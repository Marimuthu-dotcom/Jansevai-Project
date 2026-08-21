import { useState, useRef, useCallback, useContext, useEffect } from "react";
import styles from "../styles/AddComplaint.module.css";
import { AuthContext } from "../context/CreateContext";
import api from "../api/api.js";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── FIXED: Marker icons using CDN URLs ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORIES = [
  "Water Supply",
  "Garbage",
  "Street Lights",
  "Drainage",
  "Roads & Streets",
  "Public Safety",
  "Environment",
  "Others",
];

const MAX_CHARS = 1000;

// ── Helper function moved here for simplicity ──
export function getOrdinal(num) {
  const mod10 = num % 10;
  const mod100 = num % 100;

  if (mod10 === 1 && mod100 !== 11) return `${num}st`;
  if (mod10 === 2 && mod100 !== 12) return `${num}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${num}rd`;

  return `${num}th`;
}

const WARD = [
  ...Array.from({ length: 1326 }, (_, i) => getOrdinal(i + 1))
];

function AddComplaint() {
  const [form, setForm] = useState({
    category: "",
    title: "",
    wardNo: "",
    location: "",
    description: "",
  });
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const fileInputRef = useRef(null);
  const { token } = useContext(AuthContext);

  // ── Map related states ──
  const [showMap, setShowMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 0, lng: 0 });
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapInitializedRef = useRef(false);

  // ── New: Manual location states ──
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [locationSource, setLocationSource] = useState('auto');
  const [searchQuery, setSearchQuery] = useState("");

  /* ── helpers ── */
  const showToast = (msg, type = "success") => 
    {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > MAX_CHARS)
      return;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));

    if (!valid.length)
      return showToast("Only image files are allowed.", "error");

    const mapped = valid.slice(0, 5 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mapped]);
  }, [images]);

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Handle location with map ──
  const handleUseLocation = () => {
    if (!navigator.geolocation)
      return showToast("Geolocation not supported.", "error");

    setLocationSource('auto');
    setIsManualSelection(false);
    showToast("Getting your location...", "success");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Store coordinates for the map
        const posObj = { lat: latitude, lng: longitude };
        setMapCoordinates(posObj);
        setSelectedLocation(posObj);
        setShowMap(true);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();

          const suburb = data.address.suburb
            || data.address.village
            || data.address.town
            || data.address.neighbourhood
            || "";
          const district = data.address.county
            || data.address.state_district
            || "";
          const state = data.address.state || "";

          const locationStr = [suburb, district, state]
            .filter(Boolean)
            .join(", ");

          setForm((f) => ({ ...f, location: locationStr }));
          showToast("📍 Location detected! Map loaded below.", "success");

        } catch {
          showToast("Could not fetch address.", "error");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        showToast("Could not detect location. Please check permissions.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ── New: Handle map click for manual location ──
  const handleMapClick = async (e) => {
  if (!isManualSelection) return;

  const { lat, lng } = e.latlng;

  try {
    // ── FIX 1: Better error handling for API ──
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { 
        headers: { "Accept-Language": "en" },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();

    // ── FIX 2: Get MORE precise address details ──
    const address = data.address || {};
    
    // Try to get the most specific location first
    const houseNumber = address.house_number || "";
    const road = address.road || address.street || "";
    const suburb = address.suburb || address.village || address.town || address.city_district || "";
    const city = address.city || address.town || address.village || "";
    const district = address.county || address.state_district || "";
    const state = address.state || "";
    const postcode = address.postcode || "";

    // ── FIX 3: Build a more precise address string ──
    let locationParts = [];
    
    // Build from most specific to least specific
    if (houseNumber) locationParts.push(houseNumber);
    if (road) locationParts.push(road);
    if (suburb) locationParts.push(suburb);
    if (city) locationParts.push(city);
    if (district) locationParts.push(district);
    if (state) locationParts.push(state);
    
    // Remove duplicates and empty values
    const uniqueParts = [...new Set(locationParts.filter(Boolean))];
    const locationStr = uniqueParts.join(", ");

    // ── FIX 4: Store EXACT coordinates AND address ──
    const posObj = { 
      lat, 
      lng,
      // Store the exact clicked coordinates separately
      exactLat: lat,
      exactLng: lng
    };
    
    setSelectedLocation(posObj);
    setMapCoordinates(posObj);
    setForm((f) => ({ ...f, location: locationStr }));
    
    // ── FIX 5: Update the marker position ──
    if (mapInstanceRef.current) {
      // Remove existing marker
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      
      // Add new marker at exact clicked position
      const newMarker = L.marker([lat, lng], {
        draggable: true,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`📍 ${locationStr || "Selected Location"}`)
        .openPopup();
      
      // Re-attach drag handler
      newMarker.on('dragend', handleMarkerDragEnd);
      
      // Store marker reference
      mapInstanceRef.current.marker = newMarker;
    }
    
    showToast(`📍 Location selected: ${locationStr}`, "success");

  } catch (error) {
    console.error("Map click error:", error);
    
    // ── FIX 6: Fallback - show coordinates even if address fails ──
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      showToast("Address lookup timed out. Using coordinates.", "error");
    } else {
      showToast("Could not fetch address. Please try again.", "error");
    }
    
    // Still set the location with coordinates if address fails
    const posObj = { lat, lng };
    setSelectedLocation(posObj);
    setMapCoordinates(posObj);
    setForm((f) => ({ 
      ...f, 
      location: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` 
    }));
  }
};

// ── NEW: Handle marker drag end ──
const handleMarkerDragEnd = async function() {
  const pos = this.getLatLng();
  const { lat, lng } = pos;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    
    const address = data.address || {};
    const houseNumber = address.house_number || "";
    const road = address.road || address.street || "";
    const suburb = address.suburb || address.village || address.town || "";
    const city = address.city || address.town || "";
    const state = address.state || "";
    
    const locationParts = [houseNumber, road, suburb, city, state].filter(Boolean);
    const locationStr = locationParts.join(", ");

    const posObj = { lat, lng };
    setSelectedLocation(posObj);
    setMapCoordinates(posObj);
    setForm((f) => ({ ...f, location: locationStr }));
    showToast("📍 Location updated from marker!", "success");

  } catch (error) {
    console.error("Drag error:", error);
    showToast("Could not fetch address.", "error");
  }
};
  // ── New: Search for location ──
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) 
      return;

    setLocationSource('search');
    setIsManualSelection(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await res.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const posObj = { lat: parseFloat(lat), lng: parseFloat(lon) };

        setSelectedLocation(posObj);
        setMapCoordinates(posObj);
        setForm((f) => ({ ...f, location: display_name }));
        setShowMap(true);
        showToast("📍 Location found!", "success");
      } else {
        showToast("Location not found. Please try again.", "error");
      }
    } catch (error) {
      console.error("Search error:", error);
      showToast("Error searching location.", "error");
    }
  };

  // ── Toggle map visibility ──
  const toggleMapVisibility = () => {
    setShowMap((prev) => {
      if (prev && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
      return !prev;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Initialize map when showMap becomes true ──
  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapInitializedRef.current) 
    {

      const timer = setTimeout(() => {
        try {
          if (!mapContainerRef.current) 
            return;

          // Initialize the map
          const map = L.map(mapContainerRef.current, {
            center: [mapCoordinates.lat, mapCoordinates.lng],
            zoom: 15,
            zoomControl: true,
          });

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 20,
          }).addTo(map);

          // Add a draggable marker at the location
          const marker = L.marker([mapCoordinates.lat, mapCoordinates.lng], {
            draggable: true, // Allow user to drag the marker
          })
            .addTo(map)
            .bindPopup(`${form.location}`)
            .openPopup();

          // Handle marker drag end
          marker.on('dragend', handleMarkerDragEnd);
          map.marker = marker;

          // Add click handler for manual selection
          map.on('click', handleMapClick);

          mapInstanceRef.current = map;
          mapInitializedRef.current = true;

          // Force a resize after map is fully loaded
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 200);

        } 
        catch (error) 
        {
          console.error('Error initializing map:', error);
          showToast('Error loading map. Please try again.', 'error');
          setShowMap(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Cleanup map on unmount or when showMap becomes false
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [showMap, mapCoordinates, showToast, isManualSelection, handleMapClick]);

  const handleSubmit = async () => {
    if (!form.category)
      return showToast("Please select a category.", "error");
    if (!form.title.trim())
      return showToast("Please enter a title.", "error");
    if (!form.wardNo)
      return showToast("Please select a ward Number.", "error");
    if (!form.location.trim())
      return showToast("Please enter a location.", "error");
    if (!form.description.trim())
      return showToast("Please add a description.", "error");

    const formData = new FormData();

    formData.append("category", form.category);
    formData.append("title", form.title);
    formData.append("wardNo", form.wardNo);
    formData.append("location", form.location);
    formData.append("description", form.description);
    formData.append("latitude", selectedLocation?.lat || null);
    formData.append("longitude", selectedLocation?.lng || null);

    if (images.length > 0) {
      formData.append("image", images[0].file);
    }

    setSubmitting(true);
    try {
      const uploadComplaint = await api.post(`/api/auth/addComplaint`, formData);
      showToast("Complaint submitted successfully! ✓", "success");
      setForm({ category: "", title: "", wardNo: "", location: "", description: "" });
      setImages([]);
      setShowMap(false);
      setSelectedLocation(null);
      setSearchQuery("");
      mapInitializedRef.current = false;
      console.log("Submitted Data:", uploadComplaint.data.message);
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Error submitting complaint. Please try again.", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.mainContainer}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Complaints
      </button>

      {/* Card */}
      <div className={styles.card}>
        <h1 className={styles.cardTitle}>Add New Complaint</h1>
        <p className={styles.cardSubtitle}>Fill the details below to report an issue</p>

        <div className={styles.form}>
          {/* Category */}
          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter complaint title"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Ward No</label>
            <select
              name="wardNo"
              value={form.wardNo}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Select Ward No.</option>
              {WARD.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ── Updated: Location with Manual Selection ── */}
          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Location</label>

            {/* Location Source Selector */}
            <div className={styles.locationSourceSelector}>
              <button
                type="button"
                className={`${styles.sourceBtn} ${locationSource === 'auto' ? styles.active : ''}`}
                onClick={() => {
                  setLocationSource('auto');
                  handleUseLocation();
                }}
              >
                📍 Auto-Detect
              </button>
              <button
                type="button"
                className={`${styles.sourceBtn} ${locationSource === 'manual' ? styles.active : ''}`}
                onClick={() => {
                  setLocationSource('manual');
                  setIsManualSelection(true);
                  setShowMap(true);
                  showToast("Click anywhere on the map to select location", "info");
                }}
              >
                🗺️ Choose on Map
              </button>
              <button
                type="button"
                className={`${styles.sourceBtn} ${locationSource === 'search' ? styles.active : ''}`}
                onClick={() => {
                  setLocationSource('search');
                  setIsManualSelection(true);
                  document.getElementById('searchInput').focus();
                }}
              >
                🔍 Search
              </button>
            </div>

            {/* Location Input and Actions */}
            <div className={styles.locationWrapper}>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter location or use map to select"
                className={styles.input}
              />
              {/* <button
                type="button"
                className={styles.useLocationBtn}
                onClick={handleUseLocation}
              >
                📍 Use Current
              </button> */}
            </div>

            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <input
                id="searchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location (e.g., MG Road, Mumbai)"
                className={styles.searchInput}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
              />
              <button
                type="button"
                className={styles.searchBtn}
                onClick={handleSearchLocation}
              >
                🔍 Search
              </button>
            </div>

            {/* ── Map Container ── */}
            {showMap && (
              <div className={styles.mapContainer}>
                <div className={styles.mapHeader}>
                  <span className={styles.mapTitle}>
                    📍 {isManualSelection ? "Click on Map to Select" : "Your Location"}
                  </span>
                  <button
                    className={styles.hideMapBtn}
                    onClick={toggleMapVisibility}
                  >
                    ✕
                  </button>
                </div>
                <div
                  ref={mapContainerRef}
                  className={styles.mapWrapper}
                  id="map"
                />
                <div className={styles.mapFooter}>
                  <span className={styles.coordinates}>
                    {selectedLocation ? (
                      `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`
                    ) : (
                      "Click on map to select location"
                    )}
                  </span>
                  {isManualSelection && (
                    <span className={styles.manualHint}>🖊️ Manual selection mode</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Description</label>
            <div className={styles.textareaWrapper}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                className={styles.textarea}
                rows={5}
              />
              <span className={styles.charCount}>
                {form.description.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Upload */}
          <div className={styles.fieldGroup}>
            <label className={`${styles.uploadLabel} ${styles.required}`}>Upload Images</label>
            <div
              className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className={styles.uploadText}>
                <span className={styles.uploadTitle}>
                  Drag &amp; drop images here or click to upload
                </span>
                <span className={styles.uploadHint}>
                  PNG, JPG up to 10MB · Max 5 images
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenInput}
              onChange={(e) => addFiles(e.target.files)}
            />

            {images.length > 0 && (
              <div className={styles.previewList}>
                {images.map((img, idx) => (
                  <div key={idx} className={styles.previewItem}>
                    <img src={img.preview} alt={`preview-${idx}`} />
                    <button
                      className={styles.removeImg}
                      onClick={() => removeImage(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`${styles.toast} ${styles[toast.type]} ${toast.show ? styles.show : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}

export default AddComplaint;