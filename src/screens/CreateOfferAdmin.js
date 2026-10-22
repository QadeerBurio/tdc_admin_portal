// src/screens/CreateOfferAdmin.js
// Create offer (design/portal/AdCreateOffer): a home slider image or an exclusive offer, with a phone preview.
import React, { useState, useRef, useEffect } from "react";
import Ico from "../portal/Ico";
import { PageHeader, Button, Field, Input, Textarea, Segmented, Card, Progress, IconButton, toast } from "../portal/kit";
import "./styles/CreateOfferAdmin.css";

export default function CreateOfferAdmin() {
  const [view, setView] = useState("slider");
  const [data, setData] = useState({
    title: "",
    description: "",
    image: null,
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setData({ ...data, image: file, previewUrl: localUrl });
    }
  };

  const clearForm = () => {
    setData({ title: "", description: "", image: null, previewUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePublish = async () => {
    if (!data.image) return toast("Please select an image first!");

    const token = localStorage.getItem('token');
    if (!token) {
      toast("You must be logged in as admin!");
      return;
    }

    const formData = new FormData();
    formData.append("type", view);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("image", data.image);

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await fetch("https://the-deft-crew-production.up.railway.app/api/admin/add",
         {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);
      
      const result = await response.json();
      console.log("Server response:", result);

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        clearForm();
        setTimeout(() => setUploadProgress(0), 500);
      } else {
        const errorMsg = result.errors ? result.errors.join(', ') : result.message || "Unknown error";
        toast(`Server Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast("Failed to connect to server. Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const localUrl = URL.createObjectURL(file);
      setData({ ...data, image: file, previewUrl: localUrl });
    }
  };

  return (
    <div className="tdcp k-page co" data-screen="create-offer">
      <PageHeader title="create offer" sub="add a home slider image or an exclusive offer to the app." />

      <Segmented
        label="what to add"
        value={view}
        onChange={(v) => { setView(v); clearForm(); }}
        options={[
          { value: "slider", label: isMobile ? "Slider" : "Home Slider" },
          { value: "offer", label: isMobile ? "Offer" : "Exclusive Offer" },
        ]}
      />

      <div className="co-grid">
        <Card
          title={view === "slider" ? (isMobile ? "Upload Slider" : "Upload Slider Image") : (isMobile ? "Create Offer" : "Create Exclusive Offer")}
          icon={view === "slider" ? "image" : "gift"}
          tone="yellow"
        >
          <div className="co-form">
            <Field label={<>{view === "slider" ? "Slider Caption" : "Offer Title"} <span className="k-muted">(Optional)</span></>} htmlFor="co-title">
              <Input
                id="co-title"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder={view === "slider" ? "e.g., Summer Sale 2024" : "e.g., 50% Off on All Items"}
              />
            </Field>

            <Field label={<>Banner Image <span className="k-error">*</span></>}>
              <div
                className={`k-drop${dragActive ? " over" : ""}`}
                role="button"
                tabIndex={0}
                data-kit="upload"
                onClick={() => fileInputRef.current.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current.click(); } }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {data.previewUrl ? (
                  <span className="k-row" style={{ justifyContent: "center" }}>
                    <Ico kind="checkCircle" tone="green" size={36} />
                    <b>Image loaded</b>
                    <IconButton icon="close" label="remove image" size="sm" onClick={(e) => { e.stopPropagation(); clearForm(); }} />
                  </span>
                ) : (
                  <>
                    <Ico kind="upload" tone="sand" size={40} />
                    <span><b>{isMobile ? "Tap to upload" : "Click or drag to upload"}</b></span>
                    <span className="k-hint">PNG, JPG up to 5MB</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: "none" }} />
              </div>
            </Field>

            {view === "offer" && (
              <Field label="Description" htmlFor="co-desc">
                <Textarea
                  id="co-desc"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Enter offer details, terms, and conditions..."
                  rows={isMobile ? 3 : 4}
                />
              </Field>
            )}

            {loading && uploadProgress > 0 && <Progress value={uploadProgress} label={`${uploadProgress}% Uploading...`} />}

            <Button block size="lg" onClick={handlePublish} loading={loading} iconRight={loading ? undefined : "chevronRight"}>
              {loading ? "Publishing..." : view === "slider" ? "Add to Slider" : "Publish Offer"}
            </Button>

            {success && (
              <div className="k-note ok k-row" role="status">
                <Ico kind="checkCircle" tone="plain" size={18} />
                <span>{view === "slider" ? "Slider image" : "Offer"} published successfully!</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Live Preview" icon="eye" tone="purple">
          <div className="co-phone" data-preview="phone">
            <div className="co-phone-bar"><span>9:41</span><Ico kind="bell" tone="plain" size={12} /></div>
            <div className="co-app-card">
              {data.previewUrl ? (
                <img src={data.previewUrl} alt="preview" />
              ) : (
                <span className="co-app-ph"><Ico kind="image" tone="plain" size={32} /><span>No image</span></span>
              )}
              <div className={view === "offer" ? "co-overlay offer" : "co-overlay"}>
                <p className="co-app-title">{data.title || (view === "slider" ? "Summer Collection" : "Special Offer")}</p>
                {view === "offer" && <p className="co-app-desc">{data.description || "Tap to view details and claim discount"}</p>}
                {view === "slider" && <span className="co-dots"><i className="on" /><i /><i /></span>}
              </div>
            </div>
            <span className="co-home" />
          </div>
          <p className="k-hint" style={{ textAlign: "center", margin: "12px 0 0" }}>
            {view === "slider"
              ? "Slider images appear in carousel on home screen"
              : "Offer appears on the exclusive deals section"}
          </p>
        </Card>
      </div>
    </div>
  );
}
