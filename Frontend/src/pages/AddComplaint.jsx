import { useState, useRef, useCallback, useContext, useEffect } from "react";
import styles from "../styles/AddComplaint.module.css";
import { AuthContext } from "../context/CreateContext";
import api from "../api/api.js";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── FIXED: Marker icons using CDN URLs (no require() needed) ──
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

export function getOrdinal(num) {
  const mod10 = num % 10; 
  const mod100 = num % 100; 

  if (mod10 === 1 && mod100 !== 11) 
    return `${num}st`;
  if (mod10 === 2 && mod100 !== 12) 
    return `${num}nd`;
  if (mod10 === 3 && mod100 !== 13) 
    return `${num}rd`;

  return `${num}th`;
}

const WARD = [
  ...Array.from({ length: 1326 }, (_, i) => getOrdinal(i + 1))
];

function AddComplaint() {
  const [form, setForm] = useState({
    category: "",
    title: "",
    wardNo:"",
    location: "",
    description: "",
  });
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const fileInputRef = useRef(null);

  // ── Map related states ──
  const [showMap, setShowMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 0, lng: 0 });
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapInitializedRef = useRef(false); // Prevent multiple initializations

  /* ── helpers ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > MAX_CHARS)
       return;
    setForm((f) => ({ ...f, [name]: value }));
    if(name==="category" || name==="wardNo")
      showToast(value);
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

    showToast("Getting your location...", "success");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Store coordinates for the map
        setMapCoordinates({ lat: latitude, lng: longitude });
        setShowMap(true); // This triggers the map to show

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

        } 
        catch {
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
    console.log("useEffect triggered: showMap =", showMap, "mapInitialized =", mapInitializedRef.current,"mapContainer =", mapContainerRef.current);
    if (showMap && mapContainerRef.current && !mapInitializedRef.current) {
      
      const timer = setTimeout(() => {
        try {
          if (!mapContainerRef.current) 
            return;
          
          // Initialize the map
          const map = L.map(mapContainerRef.current, {
            center: [mapCoordinates.lat, mapCoordinates.lng],
            zoom: 16,
            zoomControl: true,
          });

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Add a marker at the location
          L.marker([mapCoordinates.lat, mapCoordinates.lng])
            .addTo(map)
            .bindPopup(`📍 ${form.location.split(",").slice(0, 2).join(",")}`)
            .openPopup();

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
  }, [showMap, mapCoordinates, showToast]);

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
      mapInitializedRef.current = false;
      console.log("Submitted Data:", uploadComplaint.data.message);
    } 
    catch (error) 
    {
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

          {/* ── Location with Map ── */}
          <div className={styles.fieldGroup}>
            <label className={`${styles.label} ${styles.required}`}>Location</label>
            <div className={styles.locationWrapper}>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter location"
                className={styles.input}
              />
              <button
                type="button"
                className={styles.useLocationBtn}
                onClick={handleUseLocation}
              >
                📍 Use Current Location
              </button>
            </div>

            {/* ── Map Container (Only shows when showMap is true) ── */}
            {showMap && (
              <div className={styles.mapContainer}>
                <div className={styles.mapHeader}>
                  <span className={styles.mapTitle}>📍 Your Location on Map</span>
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
                    Lat: {mapCoordinates.lat.toFixed(6)}, Lng: {mapCoordinates.lng.toFixed(6)}
                  </span>
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