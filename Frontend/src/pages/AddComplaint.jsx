import { useState, useRef, useCallback ,useContext} from "react";
import styles from "../styles/AddComplaint.module.css";
import { AuthContext } from "../context/CreateContext";
import axios from "axios";

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

function AddComplaint() {
  const [form, setForm] = useState({
    category: "",
    title: "",
    location: "",
    description: "",
  });
  const [images, setImages] = useState([]);   // { file, preview }
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "", show: false });
  const fileInputRef = useRef(null);
  const { token } = useContext(AuthContext);
  const api = import.meta.env.VITE_API_URL;

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
    if(name==="category")
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

  const handleUseLocation = () => {
  if (!navigator.geolocation)
    return showToast("Geolocation not supported.", "error");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();

        const suburb  = data.address.suburb
                     || data.address.village
                     || data.address.town
                     || data.address.neighbourhood
                     || "";
        const district = data.address.county
                      || data.address.state_district
                      || "";
        const state   = data.address.state || "";

        const locationStr = [suburb, district, state]
          .filter(Boolean)
          .join(", ");

        setForm((f) => ({ ...f, location: locationStr }));
        showToast("Location detected!");

      } catch {
        showToast("Could not fetch address.", "error");
      }
    },
    () => showToast("Could not detect location.", "error")
  );
};

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!form.category) 
      return showToast("Please select a category.", "error");
    if (!form.title.trim())
       return showToast("Please enter a title.", "error");
    if (!form.location.trim())
       return showToast("Please enter a location.", "error");
    if (!form.description.trim())
       return showToast("Please add a description.", "error");

    const formData = new FormData();

    formData.append(
      "category",
      form.category
    );

    formData.append(
      "title",
      form.title
    );

    formData.append(
      "location",
      form.location
    );

    formData.append(
      "description",
      form.description
    );

    if (images.length > 0) {
      formData.append("image", images[0].file);
    }

    setSubmitting(true);
    // Simulate API call
    const uploadComplaint = await axios.post( `${api}/api/auth/addComplaint`,formData,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
    setSubmitting(false);
    showToast("Complaint submitted successfully! ✓");
    setForm({ category: "", title: "", location: "", description: "" });
    setImages([]);

    console.log("Submitted Data:", uploadComplaint.data.message);
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
            <label className={styles.label}>Category</label>
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

          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter complaint title"
              className={styles.input}
            />
          </div>

          {/* Location */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Location</label>
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
                Use Current Location
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
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
            <label className={styles.uploadLabel}>Upload Images</label>
            <div
              className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ""}`}
              onDragOver={(e) =>
              { e.preventDefault(); 
                setDragOver(true); }}
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
