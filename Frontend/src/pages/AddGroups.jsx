import React,{ useState, useCallback, useRef,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AddGroups.module.css';
import styles1 from "../styles/Members.module.css";
import api from '../api/api.js';

const Icon = ({ name, className = '' }) => {
  const icons = {
    chevronRight: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>,
    exclamation: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
    check: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>,
    pencil: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>,
    camera: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    eye: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
    undo: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
    times: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
    userPlus: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>,
    mapPin: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    usersSmall: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>,
    info: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>,
    chevronDown: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
    tint: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/></svg>,
    water: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>,
    road: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7"/></svg>,
    lightbulb: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    trash: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
    shield: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    leaf: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
    ellipsis: <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg>,
    usersPreview: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>,
    commentDots: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
    clipboard: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
    userShieldPreview: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    phone: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
    warning: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
    userTie: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  };
  return icons[name] || null;
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, id }) => (
  <label className={styles['agf-toggle']} htmlFor={id}>
    <input id={id} type="checkbox" className={styles['agf-sr-only']} checked={checked} onChange={onChange} />
    <span className={styles['agf-toggle-slider']} aria-hidden="true" />
  </label>
);

// ─── Category Card ───────────────────────────────────────────────────────────
const CategoryCard = ({ icon, label, iconClass, selected }) => (
  <div
    className={`${styles['agf-category']} ${selected ? styles['is-selected'] : ''}`}
  >
    <div className={styles['agf-category-check']}><Icon name="check" className={styles['agf-icon-sm']} /></div>
    <div className={`${styles['agf-category-icon']} ${styles[iconClass] || ''}`}>{icon}</div>
    <p className={styles['agf-category-name']}>{label}</p>
  </div>
);

// ─── DEFAULT CONFIG ─────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  pageTitle: 'Add New Group',
  pageSubtitle: 'Create a new community group and manage complaints effectively.',
  breadcrumbs: [
    { label: 'Add New Group', href: null, isActive: true },
  ],
  categories: [
    { id: 'water', label: 'Water Supply', icon: 'tint', iconClass: 'agf-cat-blue' },
    { id: 'drainage', label: 'Drainage', icon: 'water', iconClass: 'agf-cat-green' },
    { id: 'roads', label: 'Roads', icon: 'road', iconClass: 'agf-cat-gray' },
    { id: 'streetlights', label: 'Street Lights', icon: 'lightbulb', iconClass: 'agf-cat-yellow' },
    { id: 'garbage', label: 'Garbage', icon: 'trash', iconClass: 'agf-cat-green' },
    { id: 'safety', label: 'Public Safety', icon: 'shield', iconClass: 'agf-cat-red' },
    { id: 'environment', label: 'Environment', icon: 'leaf', iconClass: 'agf-cat-green' },
    { id: 'others', label: 'Others', icon: 'ellipsis', iconClass: 'agf-cat-gray' },
  ],
  defaultFormData: {
    groupName: '', wardNumber: '', area: '', town: '', district: '', state: 'Tamil Nadu', pincode: '',
    description: '', councillorName: '', councillorContact: '', emergencyContact: '',
    maxMembers: '500', allowJoinWithoutApproval: true, enableDiscussions: true,
    visibility: 'public', rules: '',
  },
  defaultRules: `1. Be respectful and polite to all members.\n2. No hate speech, spam or misinformation.\n3. Use the group only for public issues and community welfare.\n4. Legal actions will be taken for rule violations.`,
  previewCover: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
function AddGroups() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ...DEFAULT_CONFIG.defaultFormData,
    rules: DEFAULT_CONFIG.defaultRules,
  });

  const DISTRICTS =[
  "Select District",
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
  "Other District"
  ];

  const categories= DEFAULT_CONFIG.categories.map(c => ({ ...c, selected: true }))
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // ─── TOAST STATE ─────────────────────────────────────────────────────────────
const [toast, setToast] = useState({ show: false, message: 'Created SuccessFully', type: 'success' }); // type: 'success' | 'error'

const showToast = useCallback((message, type = 'success') => {
  setToast({ show: true, message, type });
}, []);

// Auto-hide after 2 seconds
useEffect(() => {
  if (toast.show) 
  {
    const timer = setTimeout(() => 
    {
      setToast(prev => ({ ...prev, show: false }));
    }, 2000);
    
    return () => clearTimeout(timer);
  }
},[toast.show]);

  const handleLogoClick = () => {
    logoInputRef.current.click(); // hidden input trigger
  };

  // Logo file select handler
  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) 
      return;

    // Size check — 2MB
    if (file.size > 2 * 1024 * 1024) 
    {
      alert("Logo must be less than 2MB!");
      return;
    }

    setLogoFile(file);

    // Preview create — FileReader use பண்றோம்
    const reader = new FileReader();
    console.log(reader)
    reader.onloadend = () => 
    {
      setLogoPreview(reader.result); // base64 URL
    };

    reader.readAsDataURL(file);
  };

  // Cover click handler
  const handleCoverClick = () => {
    coverInputRef.current.click();
  };

  // Cover file select handler
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) 
      return;

    // Size check — 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Cover image must be less than 5MB!");
      return;
    }

    setCoverFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = useCallback((field) => (e) => 
  {
    console.log("Field Name:",field ,"Field Value:",e.target.value);
    setFormData(p => 
      ({ ...p, [field]: e.target.value })
    );
    if (errors[field]) 
      setErrors(p => { 
        const n = { ...p }; 
        delete n[field]; 
        return n; 
  });
  }, [errors]);

  const handleToggle = useCallback((field) => () => {
    setFormData(p => ({ ...p, [field]: !p[field] }));
  }, []);


  const validate = () => {
    const newErrors = {};

    ['groupName','wardNumber','town','district','state','pincode','description','councillorName','councillorContact','emergencyContact','maxMembers']
      .forEach(f => 
        { 
          if(!formData[f]?.trim()) 
            newErrors[f] = 'Required'; 
        });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) 
      return;
    setIsSubmitting(true);
    
    try {
      // 1. FormData object create pannrom
      const formDataObj = new FormData();

      // 2. Text fields ellam append pannrom
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });
      
      // 3. Categories-a append pannrom (JSON string-a convert panni)
      const selectedCategoryIds = categories.filter(c => c.selected).map(c => c.id);
      formDataObj.append('categories', JSON.stringify(selectedCategoryIds));
      
      // 4. Files append pannrom (irundha mattum)
      if (logoFile) {
        formDataObj.append('logo', logoFile);
      }
      if (coverFile) {
        formDataObj.append('cover', coverFile);
      }
      
      const plainObject = {};

      formDataObj.forEach((value, key) => {
        if(plainObject[key]) 
        {
          if(!Array.isArray(plainObject[key])) 
          {
            plainObject[key] = [plainObject[key]];
          }
          plainObject[key].push(value);
        } 
        else 
        {
          plainObject[key] = value;
        }
      });
      
      const response = await api.post("/api/auth/creategroup",formDataObj);
      const data = response.data;

    // Check backend success flag
    if (!data.success) {
      throw new Error(data.message || "Failed to create group");
    }

    console.log("✅ Success:", data);

    showToast(data.message || "Group created successfully!","success");

    handleReset();
      
    } 
    catch (err) {
      const message =
      err.response?.data?.message ||   // Backend error message
      err.message ||                    // Axios/frontend message
      "Something went wrong";
    console.error("❌ Error:", err.response?.data || err);
    showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(
    { ...DEFAULT_CONFIG.defaultFormData, rules: DEFAULT_CONFIG.defaultRules });
    setErrors({});
    setLogoPreview(null);
    setLogoFile(null);
    setCoverPreview(null);
    setCoverFile(null);
  };

  const handleCancel = () => {
    navigate('/members');
  };

  const selectedCats = categories.filter(c => c.selected);
  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.groupName || 'G')}&background=ef4444&color=fff&size=128`;
  const coverUrl = DEFAULT_CONFIG.previewCover;

  return (
    <div className={styles1.memberContainer}>
    <div className={styles1.mainContainer}>
      <div className={styles['agf-container']}>
        {/* ─── TOAST NOTIFICATION ─── */}
        <div
          className={`${styles['agf-toast']} ${toast.show ? styles['agf-toast--visible'] : ''} ${styles[`agf-toast--${toast.type}`]}`}
          role="alert"
        >
          <span className={styles['agf-toast-icon']}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className={styles['agf-toast-message']}>{toast.message}</span>
        </div>
        {/* ─── FORM AREA ─── */}
        <div className={styles['agf-form-area']}>
          {/* Breadcrumb */}
          <nav className={styles['agf-breadcrumb']} aria-label="Breadcrumb">
            {DEFAULT_CONFIG.breadcrumbs.map((c, i, arr) => (
              <React.Fragment key={i}>
                {c.href ? <a href={c.href}>{c.label}</a> : <span className={styles['agf-breadcrumb-current']}>{c.label}</span>}
                {i < arr.length - 1 && <Icon name="chevronRight" className={styles['agf-breadcrumb-sep']} />}
              </React.Fragment>
            ))}
          </nav>

          <div className={styles['agf-page-header']}>
            <h1 className={styles['agf-page-title']}>{DEFAULT_CONFIG.pageTitle}</h1>
            <p className={styles['agf-page-subtitle']}>{DEFAULT_CONFIG.pageSubtitle}</p>
          </div>

          <form className={styles['agf-card']} onSubmit={handleSubmit} noValidate>
            {/* Group Info */}
            <section>
              <div className={styles['agf-section-header']}>
                <Icon name="exclamation" className={styles['agf-section-icon']} />
                <h2 className={styles['agf-section-title']}>Group Information</h2>
              </div>
              <div className={styles['agf-grid-3']}>
                {[
                  { label: 'Group Name', field: 'groupName', required: true },
                  { label: 'Ward Number', field: 'wardNumber', required: true },
                  { label: 'Area / Locality', field: 'area', required: false },
                  { label: 'Town / City', field: 'town', required: true },
                  { label: 'District', field: 'district', required: true, isSelect: true, options:DISTRICTS },
                  { label: 'State', field: 'state', required: true, disabled:true},
                  { label: 'Pincode', field: 'pincode', required: true },
                ].map(inp => (
                  <div key={inp.field} className={`${styles['agf-field']} ${inp.field === 'description' ? styles['agf-col-span-2'] : ''}`}>
                    <label className={`${styles['agf-label']} ${inp.required ? styles['agf-label-required'] : ''}`}>{inp.label}</label>
                    {inp.isSelect ? (
                      <div className={styles['agf-select-wrap']}>
                        <select className={styles['agf-select']} value={formData[inp.field]} onChange={handleChange(inp.field)}>
                          {inp.options.map((opt, j) => 
                          <option key={j} value={j === 0 ? '' : opt.toLowerCase().replace(/\s+/g,'-')}>{opt}</option>)
                          
                          }
                        </select>
                      </div>
                    ) : (
                      <input type="text" className={styles['agf-input']} disabled={inp.disabled} value={formData[inp.field]} onChange={handleChange(inp.field)} placeholder={`Enter ${inp.label.toLowerCase()}`} />
                    )
                    }
                    {errors[inp.field] && <span className={styles['agf-error']}>{errors[inp.field]}</span>}
                  </div>
                ))}
                
                <div className={`${styles['agf-field']} ${styles['agf-col-span-2']}`}>
                  <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>Group Description</label>
                  <textarea rows={3} className={styles['agf-textarea']} value={formData.description} onChange={handleChange('description')} placeholder="Describe the purpose of this group..." />
                  <p className={styles['agf-char-count']}>{formData.description.length}/300</p>
                </div>
              </div>
            </section>

            <hr className={styles['agf-divider']} />

            {/* Categories */}
            <section>
              <div className={styles['agf-section-header']}>
                <Icon name="exclamation" className={styles['agf-section-icon']} />
                <h2 className={styles['agf-section-title']}>Complaint Categories Covered <span style={{color:'var(--agf-primary)'}}>*</span></h2>
              </div>
              <div className={styles['agf-categories']}>
                {categories.map(cat => (
                  <CategoryCard key={cat.id} {...cat} icon={<Icon name={cat.icon} className={styles['agf-icon']} />} selected={cat.selected} />
                ))}
              </div>
              {errors.categories && <p className={styles['agf-error']} style={{marginTop:8}}>{errors.categories}</p>}
            </section>

            <hr className={styles['agf-divider']} />

            {/* Visibility & Media */}
            <section className={styles['agf-grid-3']}>
              <div>
                <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>Group Visibility</label>
                <div className={styles['agf-radio-group']}>
                  {['public','private'].map(v => (
                    <label key={v} className={styles['agf-radio-label']}>
                      <input type="radio" name="visibility" value={v} checked={formData.visibility===v} onChange={()=>setFormData( p=> ({...p,visibility:v}))} className={styles['agf-radio-input']} />
                      <div>
                        <p className={styles['agf-radio-title']}>{v}</p>
                        <p className={styles['agf-radio-desc']}>{v==='public'?'Anyone can view and join this group':'Only invited members can join this group'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>Group Logo</label>
                 <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  onChange={handleLogoChange}
                />
                <div className={styles['agf-upload']} 
                onClick={handleLogoClick}
                style={{ cursor: "pointer"}}>
                  <div className={styles['agf-upload-preview']}>
                    {logoPreview ? (
                    // Preview image show
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                    />
                  ) : (
                    // Placeholder — no image selected
                    <img src={logoUrl} alt="Logo" />
                  )}
                  </div>
                  <p className={styles['agf-upload-text']}>{logoPreview ? logoFile?.name : "Click to upload logo"}</p>
                  <p className={styles['agf-upload-hint']}>PNG, JPG (Max. 2MB)</p>
                   {logoPreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // div click thadukka
                      setLogoPreview(null);
                      setLogoFile(null);
                      logoInputRef.current.value = ""; // input reset
                    }}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      background: "rgba(0,0,0,0.5)",
                      color: "white", border: "none",
                      borderRadius: "50%", width: 20, height: 20,
                      cursor: "pointer", fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                )}
                </div>
                {/* Logo-ல remove button */}

              </div>

              <div>
                <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>Group Cover Image</label>
                 <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  onChange={handleCoverChange}
                />
                <div className={styles['agf-upload']}
                 onClick={handleCoverClick}
                 style={{ cursor: "pointer" }}>
                  <div className={`${styles['agf-upload-preview']} ${styles['agf-upload-preview-cover']}`}>
                    {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    // Placeholder
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      {coverUrl}
                    </div>
                  )}</div>
                  <p className={styles['agf-upload-text']}>{coverPreview ? coverFile?.name : "Click to upload cover image"}</p>
                  <p className={styles['agf-upload-hint']}>PNG, JPG (Max. 5MB)</p>
                  <div className={styles['agf-upload-camera']}><Icon name="camera" className={styles['agf-icon-sm']} /></div>
                  {coverPreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // div click thadukka
                      setCoverPreview(null);
                      setCoverFile(null);
                      coverInputRef.current.value = ""; // input reset
                    }}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      background: "rgba(0,0,0,0.5)",
                      color: "white", border: "none",
                      borderRadius: "50%", width: 20, height: 20,
                      cursor: "pointer", fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                )}
                </div>
              </div>
            </section>

            <hr className={styles['agf-divider']} />

            {/* Contact */}
            <section>
              <div className={styles['agf-section-header']}>
                <Icon name="userTie" className={styles['agf-section-icon']} />
                <h2 className={styles['agf-section-title']}>Contact & Administration Details</h2>
              </div>
              <div className={styles['agf-grid-3']}>
                {[
                  { label: 'Councillor Name', field: 'councillorName', required: true },
                  { label: 'Councillor Contact', field: 'councillorContact', required: true, type: 'tel' },
                  { label: 'Emergency Contact', field: 'emergencyContact', required: true, type: 'tel' },
                  { label: 'Maximum Members', field: 'maxMembers', required: true, type: 'number' },
                ].map(inp => (
                  <div key={inp.field} className={styles['agf-field']}>
                    <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>{inp.label}</label>
                    <input type={inp.type||'text'} className={styles['agf-input']} value={formData[inp.field]} onChange={handleChange(inp.field)} placeholder={`Enter ${inp.label.toLowerCase()}`} />
                    {inp.field==='maxMembers' && <p className={styles['agf-hint']}>Maximum number of members allowed</p>}
                    {errors[inp.field] && <span className={styles['agf-error']}>{errors[inp.field]}</span>}
                  </div>
                ))}
                <div>
                  <div className={styles['agf-toggle-wrap']}>
                    <label className={styles['agf-toggle-label']}>Allow Join Without Approval</label>
                    <ToggleSwitch id="join" checked={formData.allowJoinWithoutApproval} onChange={handleToggle('allowJoinWithoutApproval')} />
                  </div>
                  <p className={styles['agf-toggle-desc']}>Anyone can join without admin approval</p>
                </div>
                <div>
                  <div className={styles['agf-toggle-wrap']}>
                    <label className={styles['agf-toggle-label']}>Enable Complaint Discussions</label>
                    <ToggleSwitch id="disc" checked={formData.enableDiscussions} onChange={handleToggle('enableDiscussions')} />
                  </div>
                  <p className={styles['agf-toggle-desc']}>Members can discuss complaints</p>
                </div>
              </div>
            </section>

            <hr className={styles['agf-divider']} />

            {/* Rules */}
            <section>
              <label className={`${styles['agf-label']} ${styles['agf-label-required']}`}>Rules & Guidelines</label>
              <textarea rows={4} className={styles['agf-textarea']} value={formData.rules} onChange={handleChange('rules')} placeholder="Enter group rules and guidelines..." />
              <p className={styles['agf-char-count']}>{formData.rules.length}/500</p>
            </section>

            {/* Actions */}
            <div className={styles['agf-actions']}>
              <button type="submit" className={`${styles['agf-btn']} ${styles['agf-btn--primary']}`} disabled={isSubmitting}>
                <Icon name="userPlus" className={styles['agf-icon-sm']} />
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
              <button type="button" className={`${styles['agf-btn']} ${styles['agf-btn-secondary']}`} onClick={handleReset}>
                <Icon name="undo" className={styles['agf-icon-sm']} /> Reset Form
              </button>
              <button type="button" className={`${styles['agf-btn']} ${styles['agf-btn-danger']}`} onClick={handleCancel}>
                <Icon name="times" className={styles['agf-icon-sm']} /> Cancel
              </button>
            </div>
          </form>
        </div>

        {/* ─── PREVIEW PANEL ─── */}
        <aside className={styles['agf-preview-area']}>
          <div className={styles['agf-preview-sticky']}>
            <div className={styles['agf-preview-header']}>
              <Icon name="eye" className={styles['agf-icon']} />
              <h2>Group Preview</h2>
            </div>
            <p className={styles['agf-preview-hint']}>This is how your group will appear to others.</p>

            <div className={styles['agf-preview-card']}>
              <div className={styles['agf-preview-cover']}>
                <span className={styles.svg}>
                {coverPreview ? 
                (<img src={coverPreview} alt="Show the cover Image"/>)
                :
                (coverUrl)
                }</span>
                <button className={styles['agf-preview-edit']}><Icon name="pencil" className={styles['agf-icon-sm']} /> Edit</button>
              </div>
              <div className={styles['agf-preview-body']}>
                <div className={styles['agf-preview-logo-wrap']}>
                  <div className={styles['agf-preview-logo']}>
                  {logoPreview ? 
                (<img src={logoPreview} alt="Show the Logo Image"/>)
                :
                (<img src={logoUrl} alt="Logo" />)
                }
                  </div>
                  <div className={styles['agf-preview-status']} />
                </div>
                <h3 className={styles['agf-preview-name']}>{formData.groupName || 'Group Name'}</h3>
                <span className={styles['agf-preview-badge']}>{formData.visibility==='public'?'Public Group':'Private Group'}</span>

                <div className={styles['agf-preview-tags']}>
                  {formData.wardNumber && <span className={styles['agf-preview-tag']}><Icon name="mapPin" />{formData.wardNumber}th Ward</span>}
                  {formData.district && <span className={styles['agf-preview-tag']}><Icon name="mapPin" />{formData.district} District</span>}
                  {formData.state && <span className={styles['agf-preview-tag']}><Icon name="usersSmall" />{formData.state}</span>}
                </div>

                <p className={styles['agf-preview-desc']}>{formData.description || 'Group description will appear here...'}</p>

                <div className={styles['agf-preview-stats']}>
                  {[
                    { icon: <Icon name="usersPreview" />, label: 'Members', value: 0, color: '#ef4444' },
                    { icon: <Icon name="commentDots" />, label: 'Discussions', value: 0, color: '#3b82f6' },
                    { icon: <Icon name="clipboard" />, label: 'Complaints', value: 0, color: '#22c55e' },
                    { icon: <Icon name="userShieldPreview" />, label: 'Admin', sub: 'You', color: '#d97706' },
                  ].map((s,i) => (
                    <div key={i} className={styles['agf-preview-stat']}>
                      <div className={styles['agf-preview-stat-icon']} style={{backgroundColor:s.color+'15',color:s.color}}>{s.icon}</div>
                      {'value' in s && <div className={styles['agf-preview-stat-value']}>{s.value}</div>}
                      <div className={styles['agf-preview-stat-label']}>{s.label}</div>
                      {s.sub && <div className={styles['agf-preview-stat-label']} style={{fontWeight:600,color:'var(--agf-text-primary)'}}>{s.sub}</div>}
                    </div>
                  ))}
                </div>

                <div className={styles['agf-preview-cats']}>
                  <p className={styles['agf-preview-cats-title']}>Categories Covered</p>
                  <div className={styles['agf-preview-cat-list']}>
                    {selectedCats.length > 0 ? selectedCats.map(cat => (
                      <span key={cat.id} className={styles['agf-preview-cat-tag']} style={{
                        backgroundColor: cat.iconClass.includes('blue')?'#eff6ff':cat.iconClass.includes('green')?'#f0fdf4':cat.iconClass.includes('yellow')?'#fefce8':cat.iconClass.includes('red')?'#fef2f2':'#f3f4f6',
                        color: cat.iconClass.includes('blue')?'#2563eb':cat.iconClass.includes('green')?'#16a34a':cat.iconClass.includes('yellow')?'#ca8a04':cat.iconClass.includes('red')?'#dc2626':'#4b5563'
                      }}>{cat.label}</span>
                    )) : <span className={styles['agf-preview-cat-tag']} style={{backgroundColor:'#f3f4f6',color:'#9ca3af'}}>No categories selected</span>}
                  </div>
                </div>

                <div className={styles['agf-preview-info']}>
                  {[
                    { icon: 'userTie', label: 'Councillor', value: formData.councillorName || '-' },
                    { icon: 'phone', label: 'Councillor Contact', value: formData.councillorContact || '-' },
                    { icon: 'warning', label: 'Emergency Contact', value: formData.emergencyContact || '-' },
                    { icon: 'usersSmall', label: 'Max Members', value: `${formData.maxMembers || 0} Members` },
                    { icon: 'eye', label: 'Visibility', value: formData.visibility==='public'?'Public Group':'Private Group', isBadge: true },
                  ].map((item,i) => (
                    <div key={i} className={styles['agf-preview-info-row']}>
                      <div className={styles['agf-preview-info-label']}><Icon name={item.icon} />{item.label}</div>
                      {item.isBadge ? <span className={styles['agf-preview-badge']}>{item.value}</span> : <span className={styles['agf-preview-info-value']}>{item.value}</span>}
                    </div>
                  ))}
                </div>

                <div className={styles['agf-preview-alert']}>
                  <Icon name="info" />
                  <p>You can edit all the details before creating the group.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    </div>
  );
}

export default AddGroups;