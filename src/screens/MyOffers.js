// src/screens/MyOffers.js
// Discounts (design/portal/BrDiscounts): the brand's offers, edit, and image download.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Spinner, Field, Input, Textarea, Select, Checkbox, SearchInput, Segmented, StatCard, Modal, EmptyState, Pill, toast } from "../portal/kit";
import "./styles/BrandPortal.css";

const BASE_URL = "https://the-deft-crew-production.up.railway.app";
const API_URL = `${BASE_URL}/api/offers`;
const CLOUDINARY_NAME = "decaxpera";

// tdc tile behind every offer image; shows when there is no image or it fails to load
const OfferImage = ({ src, alt }) => (
  <div className="bo-img">
    <span className="bo-img-tile"><Ico kind="image" tone="plain" size={28} /><span>tdc.</span></span>
    {src && <img src={src} alt={alt} onError={(e) => { e.target.style.display = "none"; }} />}
  </div>
);

const where = (o) => (o.isInStore && o.isOnline ? "in-store and online" : o.isInStore ? "in-store" : o.isOnline ? "online" : "");

export default function MyOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [discountError, setDiscountError] = useState("");
  const [downloading, setDownloading] = useState(null);

  // Discount options for dropdown
  const discountOptions = [15, 20, 25, 30, 35, 40, 45, 50, 60];

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/my-offers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setOffers(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
    if (imagePath.includes("TDC_") || imagePath.includes("/")) {
      return `https://res.cloudinary.com/${CLOUDINARY_NAME}/image/upload/${imagePath}`;
    }
    return `${BASE_URL}/uploads/offers/${imagePath}`;
  };

  const downloadImage = async (offerId, imageUrl, title) => {
    setDownloading(offerId);
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Create filename from offer title
      const sanitizedTitle = title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'offer';
      link.download = `${sanitizedTitle}_${offerId}.jpg`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (error) {
      console.error("Download failed:", error);
      toast("Failed to download image. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const openEditModal = (offer) => {
    setCurrentOffer({ ...offer, isOnline: offer.isOnline || false, isInStore: offer.isInStore || false });
    setPreview(getImageUrl(offer.image));
    setIsEditing(true);
    setDiscountError("");
  };

  const validateDiscount = (value) => {
    const num = parseInt(value);
    if (!value || value === "") { setDiscountError("Please select a discount percentage"); return false; }
    if (isNaN(num)) { setDiscountError("Please select a valid discount"); return false; }
    if (num < 15) { setDiscountError("Discount must be at least 15%"); return false; }
    if (num > 60) { setDiscountError("Discount cannot exceed 60%"); return false; }
    setDiscountError("");
    return true;
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setCurrentOffer({ ...currentOffer, discountPercentage: value });
    if (value && value !== "") validateDiscount(value);
    else setDiscountError("Please select a discount percentage");
  };

  const handleUpdate = async () => {
    const discountValue = currentOffer.discountPercentage;
    if (!discountValue || discountValue === "") {
      toast("Please select a discount percentage");
      return;
    }
    const isValid = validateDiscount(discountValue);
    if (!isValid) {
      toast("Please select a valid discount percentage (15% - 60%)");
      return;
    }

    const formData = new FormData();
    Object.keys(currentOffer).forEach((key) => {
      const forbiddenKeys = ["image", "brand", "claimedBy", "redemptions", "__v", "createdAt", "updatedAt"];
      if (!forbiddenKeys.includes(key) && currentOffer[key] !== undefined && currentOffer[key] !== null) {
        if (key === "isOnline" || key === "isInStore") {
          formData.append(key, currentOffer[key] ? "true" : "false");
        } else {
          formData.append(key, currentOffer[key]);
        }
      }
    });
    if (imageFile) formData.append("image", imageFile);

    setUpdating(true);
    try {
      await axios.put(`${API_URL}/${currentOffer._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      toast("✅ Campaign Updated Successfully!");
      setIsEditing(false);
      setImageFile(null);
      fetchOffers();
    } catch (err) {
      console.error("Update failed", err);
      toast(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateOffer = () => navigate("/create-offer");

  const filteredAndSortedOffers = () => {
    let filtered = offers;
    if (searchTerm) {
      filtered = filtered.filter(offer => 
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus === "active") {
      filtered = filtered.filter(offer => offer.status !== "expired");
    } else if (filterStatus === "expired") {
      filtered = filtered.filter(offer => offer.status === "expired");
    }
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => (b.claimedBy?.length || 0) - (a.claimedBy?.length || 0));
    } else if (sortBy === "discount") {
      filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    }
    return filtered;
  };

  const displayedOffers = filteredAndSortedOffers();

  if (loading) {
    return <div className="tdcp k-page"><PageLoading label="Loading your campaigns..." /></div>;
  }

  const live = offers.filter((o) => o.status !== "expired");
  const totalClaims = offers.reduce((n, o) => n + (o.claimedBy?.length || 0), 0);
  const totalViews = offers.reduce((n, o) => n + (o.views || 0), 0);
  const avg = offers.length ? Math.round(offers.reduce((n, o) => n + Number(o.discountPercentage || 0), 0) / offers.length) : 0;

  return (
    <div className="tdcp k-page" data-screen="brand-discounts">
      <PageHeader
        title="discounts"
        sub="what tdc verified users see when they open your brand."
        actions={<Button icon="plus" onClick={handleCreateOffer}>new discount</Button>}
      />

      <div className="k-stats">
        <StatCard label="live discounts" value={live.length} icon="tag" tone="red" />
        <StatCard label="average discount" value={`${avg}%`} icon="coin" tone="orange" />
        <StatCard label="claims" value={totalClaims.toLocaleString()} icon="users" tone="blue" />
        <StatCard label="conversion" value={totalViews > 0 ? `${Math.round((totalClaims / totalViews) * 100)}%` : "–"} sub={totalViews > 0 ? `of ${totalViews.toLocaleString()} views` : "no views counted yet"} icon="chart" tone="green" />
      </div>

      <div className="k-toolbar">
        <Segmented
          label="filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[{ value: "all", label: "all" }, { value: "active", label: "active" }, { value: "expired", label: "expired" }]}
        />
        <SearchInput className="k-grow" placeholder="Search campaigns..." aria-label="search discounts" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <Select aria-label="sort" style={{ width: "auto" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">most recent</option>
          <option value="popular">most popular</option>
          <option value="discount">highest discount</option>
        </Select>
      </div>

      {displayedOffers.length > 0 ? (
        <div className="k-grid">
          {displayedOffers.map((offer) => {
            const expired = offer.status === "expired";
            return (
              <article key={offer._id} className="k-card bo-card">
                <div className="bo-media">
                  <OfferImage src={getImageUrl(offer.image)} alt={offer.title || "Offer"} />
                  <span className="bo-pct"><Pill tone="yellow">{offer.discountPercentage}% off</Pill></span>
                  <span className="bo-status"><Pill tone={expired ? "sand" : "green"}>{expired ? "expired" : "active"}</Pill></span>
                </div>
                <div className="bo-body">
                  <h2>{offer.title}</h2>
                  <p className="k-hint">{[offer.category, where(offer), offer.location].filter(Boolean).join(" · ")}</p>
                  {offer.description && <p className="bo-desc">{offer.description.substring(0, 80)}{offer.description.length > 80 ? "..." : ""}</p>}
                  <div className="bo-counts">
                    <span><b>{offer.claimedBy?.length || 0}</b> claims</span>
                    <span><b>{offer.views || 0}</b> views</span>
                    <span className="k-muted">{new Date(offer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="bo-actions">
                  <Button variant="secondary" icon="edit" onClick={() => openEditModal(offer)} style={{ flex: 1 }}>edit</Button>
                  <button
                    type="button"
                    className="k-icon-btn"
                    onClick={() => downloadImage(offer._id, getImageUrl(offer.image), offer.title)}
                    disabled={downloading === offer._id || !offer.image}
                    aria-label="download image"
                    title="download image"
                  >
                    {downloading === offer._id ? <Spinner size="sm" /> : <Ico kind="download" tone="plain" size={18} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="k-card">
          <EmptyState
            icon="tag"
            tone="red"
            title={offers.length ? "no discounts match" : "Launch Your First Campaign"}
            text={offers.length ? "try another filter or search." : "Create an offer and start connecting with customers today"}
            action={offers.length ? null : <Button icon="plus" onClick={handleCreateOffer}>new discount</Button>}
          />
        </div>
      )}

      {/* edit discount */}
      <Modal
        open={isEditing && !!currentOffer}
        onClose={() => setIsEditing(false)}
        size="lg"
        icon="edit"
        tone="yellow"
        title="Edit Campaign"
        sub="Update your offer details"
        footer={<>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleUpdate} loading={updating} disabled={updating || !!discountError}>Update Campaign</Button>
        </>}
      >
        {currentOffer && (
          <div className="bo-form">
            <div className="bo-two">
              <Field label="Campaign Title" htmlFor="bo-title">
                <Input id="bo-title" value={currentOffer.title} onChange={(e) => setCurrentOffer({...currentOffer, title: e.target.value})} placeholder="Enter title" />
              </Field>
              <Field label="Discount" htmlFor="bo-pct" error={discountError}>
                <Select id="bo-pct" invalid={!!discountError} value={currentOffer.discountPercentage || ""} onChange={handleDiscountChange}>
                  <option value="">Select discount</option>
                  {discountOptions.map((value) => (
                    <option key={value} value={value}>{value}%</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Description" htmlFor="bo-desc">
              <Textarea id="bo-desc" value={currentOffer.description} onChange={(e) => setCurrentOffer({...currentOffer, description: e.target.value})} rows={2} placeholder="Describe your offer..." />
            </Field>
            <Field label="Redeem Instructions" htmlFor="bo-redeem">
              <Textarea id="bo-redeem" value={currentOffer.redeemInstructions || ""} onChange={(e) => setCurrentOffer({...currentOffer, redeemInstructions: e.target.value})} rows={3} placeholder="How to redeem..." />
            </Field>
            <div className="bo-two">
              <Field label="Location" htmlFor="bo-loc">
                <Input id="bo-loc" value={currentOffer.location || ""} onChange={(e) => setCurrentOffer({...currentOffer, location: e.target.value})} placeholder="Store location" />
              </Field>
              <Field label="Availability">
                <div className="k-row">
                  <Checkbox checked={currentOffer.isOnline || false} onChange={(e) => setCurrentOffer({...currentOffer, isOnline: e.target.checked})} label="online" />
                  <Checkbox checked={currentOffer.isInStore || false} onChange={(e) => setCurrentOffer({...currentOffer, isInStore: e.target.checked})} label="in-store" />
                </div>
              </Field>
            </div>
            <Field label="Banner Image">
              <div className="bo-banner">
                <OfferImage src={preview} alt="Preview" />
                <label className="k-btn secondary sm bo-change">
                  <Ico kind="upload" tone="plain" size={16} />
                  <span>Change Image</span>
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    if (e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
