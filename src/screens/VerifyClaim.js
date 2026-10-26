// VerifyClaim (design/portal/BrVerify): the counter QR, students who scanned it, and manual verify.
import React, { useState, useContext, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import QRCode from "qrcode";
import Ico from "../portal/Ico";
import { Button, IconButton, Field, Input, Select, Tabs, Modal, EmptyState, Pill, Spinner, toast } from "../portal/kit";
import "./styles/BrandPortal.css";

const VerifyClaim = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('students');
  const [showStudentAlert, setShowStudentAlert] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  
  // QR Code states
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [brandOffers, setBrandOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Scanned Students List
  const [scannedStudentsList, setScannedStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  
  // Track processed student IDs
  const [processedStudentIds, setProcessedStudentIds] = useState([]);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastProcessedStudentId, setLastProcessedStudentId] = useState(null);

  const universities = [
    "Aga Khan Higher Secondary School", "Aga Khan University", "Air University",
    "Allama Iqbal Open University", "Alpha College", "Aror University of Art, Architecture, Design & Heritage",
    "Bahria University Islamabad", "Bahria University Karachi", "Baqai Medical University",
    "Beaconhouse", "Cedar College", "City School", "COMMECS College", "COMSATS University Islamabad",
    "COMSATS University Lahore Campus", "COMSATS University Sahiwal Campus", "COMSATS University Vehari Campus",
    "Dawood University of Engineering & Technology Karachi", "DHA Suffa University", "Dow International Medical College",
    "Faisalabad Medical University", "FAST-NUCES Karachi", "FAST-NUCES Lahore", "Fatima Jinnah Medical University",
    "FMH College of Medicine & Dentistry", "Foundation University Medical College", "Gambat Institute of Medical Sciences (GIMS)",
    "Gilgit Medical College", "Government College University Faisalabad", "Government College University Lahore",
    "Greenwich University", "Habib University Karachi", "Hamdard University Karachi", "Ilma University Karachi",
    "Indus Medical College", "Indus University", "Indus Valley School of Art and Architecture (IVS)",
    "Institute of Business Administration (IBA Karachi)", "Institute of Business Management (IoBM)",
    "International Islamic University Islamabad", "Iqra University", "Islamabad Medical & Dental College",
    "Isra Medical College", "Isra University", "Jhalawan Medical College", "Jinnah Medical & Dental College",
    "Jinnah Sindh Medical University", "Jinnah University for Women", "Karakoram International University",
    "Karachi Institute of Economics and Technology (KIET)", "Karachi Institute of Medical Sciences",
    "Karachi Medical & Dental College", "Karachi School of Business and Leadership (KSBL)", "KASBIT",
    "Khawaja Muhammad Safdar Medical College", "Khyber Medical College", "Khyber Medical University",
    "King Edward Medical University", "Lahore Medical & Dental College", "Lahore University of Management Sciences (LUMS)",
    "Liaquat College of Medicine & Dentistry", "Liaquat University of Medical & Health Sciences",
    "Loralai Medical College", "Lyceum", "Makran Medical College", "Mehran University of Engineering & Technology (MUET)",
    "Meritorious College", "Mohtarma Benazir Bhutto Shaheed Medical College", "Muhammad Ali Jinnah University",
    "National Defence University", "National Textile University", "National University of Medical Sciences (NUMS)",
    "National University of Modern Languages (NUML)", "National University of Sciences & Technology (NUST)",
    "NCR-CET College", "NED University of Engineering & Technology", "Newports Institute of Communications and Economics",
    "Nixor College", "Pakistan Institute of Engineering & Applied Sciences (PIEAS)", "Pakistan Institute of Medical Sciences (PIMS)",
    "Peoples University of Medical & Health Sciences", "Pir Mehr Ali Shah Arid Agriculture University", "Punjab Medical College",
    "Quaid-e-Awam University of Engineering, Science & Technology (QUEST)", "Quaid-e-Azam Medical College", "Quaid-e-Azam University",
    "Rawalpindi Medical University", "Riphah International University", "Salim Habib University", "Salim Sohail University",
    "Sceptre College", "Shah Abdul Latif University", "Shaheed Benazir Bhutto University Nawabshah",
    "Shaheed Mohtarma Benazir Bhutto Medical University Larkana", "Sindh Madressatul Islam University",
    "Sir Syed University of Engineering & Technology", "Southshore School", "Sukkur IBA University", "SZABIST",
    "Tabani's School & College", "The Islamia University of Bahawalpur", "Titan College", "United Medical and Dental College (UMDC)",
    "University of Agriculture Faisalabad", "University of Azad Jammu & Kashmir", "University of Balochistan",
    "University of Central Punjab", "University of Chakwal", "University of Engineering & Technology Lahore",
    "University of Engineering & Technology Peshawar", "University of Gujrat", "University of Karachi",
    "University of Lahore", "University of Management & Technology", "University of Okara", "University of Peshawar",
    "University of Sahiwal", "University of Sindh Jamshoro", "University of South Asia", "University of the Punjab",
    "Women University Multan", "Ziauddin Medical College", "Ziauddin University", "Ziauddin University Sukkur"
  ];

  const [inputs, setInputs] = useState({
    name: "",
    rollNo: "",
    university: ""
  });

  const [result, setResult] = useState(null);
  const [bill, setBill] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredUniversities, setFilteredUniversities] = useState(universities);
  const dropdownRef = useRef(null);

  const isBrand = user?.role === 'brand';

  const resetAllStates = () => {
    setResult(null);
    setBill("");
    setPaymentInfo(null);
    setInputs({ name: "", rollNo: "", university: "" });
    setSearchQuery("");
    setScannedStudent(null);
    setShowStudentAlert(false);
    setAlertMessage('');
    setSelectedStudent(null);
    setShowPaymentModal(false);
    setRedemptionSuccess(false);
    setIsProcessingScan(false);
  };

  useEffect(() => {
    if (isBrand) {
      loadBrandOffers();
      loadScannedStudents();
      loadPaymentHistory();
    }
  }, [user, isBrand]);

  useEffect(() => {
    if (isBrand && !processingPayment && !isProcessingScan) {
      const interval = setInterval(() => {
        checkForScannedStudents();
        loadScannedStudents();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isBrand, processingPayment, isProcessingScan]);

  const loadScannedStudents = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/pending-scans",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const pendingScans = res.data.filter(scan => 
        scan.status === 'pending' && 
        !processedStudentIds.includes(scan.studentId)
      );
      
      const uniqueStudents = [];
      const seenIds = new Set();
      
      pendingScans.forEach(scan => {
        if (!seenIds.has(scan.studentId)) {
          seenIds.add(scan.studentId);
          uniqueStudents.push({
            _id: scan.studentId,
            name: scan.name || 'Student',
            rollNo: scan.rollNo || 'N/A',
            universityName: scan.universityName || scan.university || 'University',
            offerTitle: scan.offerTitle || 'Offer',
            discountPercentage: scan.discountPercentage || 0,
            scannedAt: scan.scannedAt,
            status: scan.status,
            offerId: scan.offerId || '' // Make sure offerId is included
          });
        }
      });
      
      setScannedStudentsList(uniqueStudents);
    } catch (err) {
      console.error("Error loading scanned students:", err);
      setScannedStudentsList([]);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/savings-report",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentHistory(res.data || []);
    } catch (err) {
      console.error("Error loading payment history:", err);
    }
  };

  const checkForScannedStudents = async () => {
    if (processingPayment || isProcessingScan || paymentInfo) return;
    
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/pending-scans",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.length > 0 && !result) {
        const pendingScans = res.data.filter(scan => 
          scan.status === 'pending' && 
          !processedStudentIds.includes(scan.studentId) &&
          scan.studentId !== lastProcessedStudentId
        );
        
        if (pendingScans.length > 0) {
          const studentData = pendingScans[0];
          let universityName = studentData.universityName || studentData.university || 'University';
          
          const cleanStudent = {
            studentId: studentData.studentId || '',
            name: studentData.name || 'Student',
            rollNo: studentData.rollNo || 'N/A',
            university: universityName,
            universityName: universityName,
            offerId: studentData.offerId || '', // Include offerId
            offerTitle: studentData.offerTitle || 'Offer',
            discountPercentage: studentData.discountPercentage || 0,
            scannedAt: studentData.scannedAt || new Date().toISOString()
          };
          
          setScannedStudent(cleanStudent);
          setAlertMessage(`Student ${cleanStudent.name} scanned from QR!`);
          setShowStudentAlert(true);
          
          setInputs({
            name: cleanStudent.name,
            rollNo: cleanStudent.rollNo,
            university: cleanStudent.universityName
          });
          
          await autoVerifyStudent(cleanStudent);
        }
      }
    } catch (err) {
      console.error("Error checking for scanned students:", err);
    }
  };

  const autoVerifyStudent = async (studentData) => {
    if (loading || isProcessingScan) return;
    
    setIsProcessingScan(true);
    setLoading(true);
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/claimed-users",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const found = res.data.find(u =>
        u.name?.toLowerCase().trim() === (studentData.name || "").toLowerCase().trim() &&
        u.rollNo?.toLowerCase().trim() === (studentData.rollNo || "").toLowerCase().trim()
      );

      if (found) {
        // Merge the found data with the scanned data to preserve offerId
        const mergedResult = {
          ...found,
          offerId: studentData.offerId || found.offerId || '' // Preserve offerId from scan
        };
        setResult(mergedResult);
        setBill("");
        setPaymentInfo(null);
        setAlertMessage(`✅ Student ${found.name} verified successfully!`);
        setShowStudentAlert(true);
        setTimeout(() => setShowStudentAlert(false), 3000);
      } else {
        setResult("not_found");
        setAlertMessage(`❌ Student ${studentData.name} has no active claim!`);
        setShowStudentAlert(true);
        setTimeout(() => setShowStudentAlert(false), 3000);
      }
    } catch (err) {
      console.error("Error auto-verifying student:", err);
      setAlertMessage("❌ Error verifying student. Please try again.");
      setShowStudentAlert(true);
    } finally {
      setLoading(false);
      setIsProcessingScan(false);
    }
  };

  const loadBrandOffers = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/my-offers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBrandOffers(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedOffer(res.data[0]);
        const offer = res.data[0];
        setIsOnlineOnly(offer.isOnline && !offer.isInStore);
        if (offer.isOnline && !offer.isInStore) {
          generatePromoCode();
        }
      }
    } catch (err) {
      console.error("Error loading brand offers:", err);
    }
  };

  const generateQRCode = async () => {
    if (!selectedOffer) {
      toast("Please select an offer first");
      return;
    }

    try {
      const qrPayload = {
        type: 'offer',
        offerId: selectedOffer._id,
        brandId: user?._id,
        brandName: user?.brandName || user?.name || 'Brand',
        offerTitle: selectedOffer.title || 'Offer',
        discount: selectedOffer.discountPercentage || 0,
        timestamp: new Date().toISOString(),
        isOnline: selectedOffer.isOnline || false,
        isInStore: selectedOffer.isInStore || false,
        promoCode: promoCode || null
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrImage(qrDataUrl);
      setQrData(qrPayload);
      setShowQrModal(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
      toast("Failed to generate QR code");
    }
  };

  const generatePromoCode = () => {
    const prefix = ((user?.brandName || user?.name) || 'BRAND').substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}${random}`;
    setPromoCode(code);
    return code;
  };

  const handleOfferSelect = (offer) => {
    setSelectedOffer(offer);
    setIsOnlineOnly(offer.isOnline && !offer.isInStore);
    if (offer.isOnline && !offer.isInStore) {
      generatePromoCode();
    } else {
      setPromoCode('');
    }
  };

  const copyPromoCode = () => {
    if (promoCode) {
      navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    if (qrImage) {
      const link = document.createElement('a');
      link.download = `qr-${selectedOffer?.title || 'offer'}.png`;
      link.href = qrImage;
      link.click();
    }
  };

  const shareQR = async () => {
    if (qrImage) {
      try {
        const response = await fetch(qrImage);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: 'Student Discount QR Code',
            text: `Scan this QR code to get ${selectedOffer?.discountPercentage || 0}% off at ${user?.brandName || user?.name || 'Brand'}`,
            files: [file]
          });
        } else {
          await navigator.clipboard.writeText(qrImage);
          toast('QR code copied to clipboard!');
        }
      } catch (err) {
        console.error("Share error:", err);
      }
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUniversities(universities);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = universities.filter(uni => 
        uni.toLowerCase().includes(query)
      );
      setFilteredUniversities(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const verify = async () => {
    if (!inputs.name || !inputs.rollNo || !inputs.university) {
      return toast("Please fill in all student details");
    }

    setLoading(true);
    setResult(null);
    setPaymentInfo(null);
    setBill("");

    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/claimed-users",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const found = res.data.find(u =>
        u.name?.toLowerCase().trim() === inputs.name.toLowerCase().trim() &&
        u.rollNo?.toLowerCase().trim() === inputs.rollNo.toLowerCase().trim() &&
        u.universityName?.toLowerCase().trim() === inputs.university.toLowerCase().trim()
      );

      setTimeout(() => {
        setResult(found || "not_found");
        if (found) {
          setBill("");
          setPaymentInfo(null);
          setSelectedStudent(found);
          setShowPaymentModal(true);
        }
      }, 500);

    } catch (err) {
      toast("Error connecting to server");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const calculatePayment = () => {
    if (!result || result === "not_found") {
      return toast("Please verify a student first");
    }
    
    if (!bill || bill <= 0) {
      return toast("Please enter a valid bill amount greater than 0");
    }

    const billAmount = Number(bill);
    const discount = (billAmount * (result.discountPercentage || 0)) / 100;

    setPaymentInfo({
      total: billAmount - discount,
      saved: discount
    });
  };

  const handleProcessPayment = async () => {
    // Get the offerId from result or scannedStudent
    const offerId = result?.offerId || scannedStudent?.offerId || selectedStudent?.offerId;
    const userId = result?._id || scannedStudent?.studentId || selectedStudent?._id;
    
    // Validate required fields
    if (!offerId) {
      toast("Missing offer ID. Please re-scan the student.");
      return;
    }
    
    if (!userId) {
      toast("Missing student ID. Please re-scan the student.");
      return;
    }
    
    if (!result || result === "not_found") {
      toast("Please verify student first");
      return;
    }
    
    if (!paymentInfo) {
      toast("Please calculate payment first");
      return;
    }

    if (!bill || bill <= 0) {
      toast("Please enter a valid bill amount");
      return;
    }

    setProcessingPayment(true);
    try {
      await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/offers/redeem-payment",
        {
          offerId: offerId,
          userId: userId,
          billAmount: Number(bill),
          savedAmount: Number(paymentInfo.saved)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark the scan as processed
      const studentId = userId;
      if (studentId) {
        setProcessedStudentIds(prev => [...prev, studentId]);
        setLastProcessedStudentId(studentId);
        
        try {
          await axios.post(
            "https://the-deft-crew-production.up.railway.app/api/offers/scan-processed",
            { studentId: studentId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error("Error marking scan as processed:", err);
        }
      }

      setRedemptionSuccess(true);
      toast(`✅ Success! Transaction has been recorded.\n\nOriginal: Rs. ${Number(bill).toLocaleString()}\nDiscount: Rs. ${paymentInfo.saved.toLocaleString()}\nFinal: Rs. ${paymentInfo.total.toLocaleString()}`);

      resetAllStates();
      await loadScannedStudents();
      await loadPaymentHistory();

    } catch (err) {
      console.error("Payment error:", err);
      toast(err.response?.data?.message || "Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleStudentSelect = (student) => {
    if (processingPayment || isProcessingScan) return;
    
    setSelectedStudent(student);
    // Ensure offerId is preserved when setting result
    const studentResult = {
      ...student,
      offerId: student.offerId || ''
    };
    setResult(studentResult);
    setInputs({
      name: student.name || '',
      rollNo: student.rollNo || '',
      university: student.universityName || ''
    });
    setBill("");
    setPaymentInfo(null);
    setShowPaymentModal(true);
  };

  const handleUniversitySelect = (university) => {
    setInputs({ ...inputs, university });
    setSearchQuery(university);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchQuery(inputs.university || "");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredUniversities(universities);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'verify') {
      resetAllStates();
    }
  };

  const offerWhere = (o) => (o?.isOnline && o?.isInStore ? "online and in-store" : o?.isOnline ? "online only" : o?.isInStore ? "in-store only" : "standard");
  const initial = (n) => String(n?.charAt(0) || "S");

  // bill, discount and what the student pays; same numbers as before
  const renderBreakdown = (pct, onComplete, label) => (
    <div className="bv-sum">
      <div className="bv-sum-head">
        <span>Payment Summary</span>
        {scannedStudent && <Pill tone="green">Auto-verified</Pill>}
      </div>
      <div className="bv-row"><span>Original Amount:</span><span>₨ {Number(bill).toLocaleString()}</span></div>
      <div className="bv-row off"><span>Student Discount ({String(pct || 0)}%):</span><span>- ₨ {paymentInfo.saved.toLocaleString()}</span></div>
      <div className="bv-row total"><span>Final Amount:</span><span>₨ {paymentInfo.total.toLocaleString()}</span></div>
      {redemptionSuccess && <div className="k-note ok">Payment processed successfully!</div>}
      <Button block icon="check" onClick={onComplete} loading={processingPayment} disabled={processingPayment}>
        {processingPayment ? "Processing..." : label}
      </Button>
    </div>
  );

  const renderBill = (id) => (
    <>
      <Field label="Bill Amount (PKR)" htmlFor={id}>
        <Input id={id} type="number" placeholder="Enter bill amount" value={bill} onChange={e => setBill(e.target.value)} />
      </Field>
      <Button variant="secondary" block icon="coin" onClick={calculatePayment}>Calculate Discount</Button>
    </>
  );

  const renderStudentHead = (s, extra) => (
    <div className="bv-student">
      <div className="bv-avatar">{initial(s.name)}</div>
      <div className="bv-student-text">
        <b>{String(s.name || 'Student')}</b>
        <span>{String(s.universityName || 'University')} · roll no {String(s.rollNo || 'N/A')}</span>
        {extra}
      </div>
    </div>
  );

  return (
    <div className="tdcp k-page" data-screen="brand-verify">
      {showStudentAlert && !isProcessingScan && !paymentInfo && (
        <div className="bv-alert" role="status">
          <div className="bv-alert-ico">{loading ? <Spinner size="sm" /> : <Ico kind="user" tone="plain" size={20} />}</div>
          <div className="bv-alert-text">
            <b>{loading ? 'Verifying...' : result && result !== "not_found" ? 'Verified!' : 'Student Scanned!'}</b>
            <span>
              {scannedStudent && scannedStudent.name ? (
                <><strong>{String(scannedStudent.name)}</strong> from {String(scannedStudent.universityName || 'University')}</>
              ) : (
                String(alertMessage || 'Processing scan...')
              )}
            </span>
            <span className="k-muted">
              {loading ? 'Please wait while we verify...' :
               result && result !== "not_found" ? 'Enter bill amount and calculate discount' :
               'Please try again'}
            </span>
          </div>
          {!loading && result && result !== "not_found" && <Pill tone="green" dot>Verified</Pill>}
          {!loading && result === "not_found" && <Pill tone="red" dot>Not Found</Pill>}
        </div>
      )}

      <div className="k-head">
        <div className="br-title">
          <Ico kind="qr" tone="green" size={56} />
          <div>
            <h1>verify student<span className="dot" aria-hidden="true">.</span></h1>
            <p>the student scans your counter QR in the tdc app. their claim shows up here to complete.</p>
          </div>
        </div>
        <div className="k-actions">
          <Link className="k-btn secondary" to="/BrandVerifyScreen"><Ico kind="ticket" tone="plain" size={18} />verify a promo code</Link>
        </div>
      </div>

      {isBrand && (
        <Tabs
          label="verify sections"
          value={activeTab}
          onChange={handleTabChange}
          tabs={[
            { id: "students", label: "Verified Students", icon: "users", count: scannedStudentsList.length },
            { id: "qr-generator", label: "QR Generator", icon: "qr" },
            { id: "verify", label: "Verify Student", icon: "grad" },
          ]}
        />
      )}

      {activeTab === 'students' && isBrand && (
        scannedStudentsList.length === 0 ? (
          <div className="k-card">
            <EmptyState
              icon="qr"
              tone="green"
              title="No students have scanned the QR code yet."
              text="When a student scans your QR code, they will appear here for verification."
            />
          </div>
        ) : (
          <div className="k-grid">
            {scannedStudentsList.map((student, index) => (
              <article key={student._id || index} className="k-card bv-card">
                <div className="bv-card-top">
                  {renderStudentHead(student)}
                  <Pill tone="yellow">{String(student.discountPercentage || 0)}%</Pill>
                </div>
                <div className="bb-chips">
                  <Pill tone="green" dot>Scanned</Pill>
                  <span className="bb-chip">{String(student.offerTitle || 'Offer')}</span>
                </div>
                {student.scannedAt && (
                  <p className="bb-line"><Ico kind="clock" tone="plain" size={15} />Scanned at: {new Date(student.scannedAt).toLocaleTimeString()}</p>
                )}
                <Button
                  block
                  icon="receipt"
                  onClick={() => handleStudentSelect(student)}
                  disabled={processingPayment || isProcessingScan}
                >
                  Process Payment
                </Button>
              </article>
            ))}
          </div>
        )
      )}

      {activeTab === 'qr-generator' && isBrand ? (
        <section className="k-card bv-qr">
          <h2 className="br-h2">your counter QR</h2>
          {!brandOffers || brandOffers.length === 0 ? (
            <EmptyState icon="tag" tone="red" title="No offers found." text="Create an offer first to generate QR codes." />
          ) : (
            <>
              <Field label="Select Offer" htmlFor="bv-offer">
                <Select
                  id="bv-offer"
                  value={selectedOffer?._id || ''}
                  onChange={(e) => {
                    const offer = brandOffers.find(o => o._id === e.target.value);
                    if (offer) handleOfferSelect(offer);
                  }}
                >
                  {brandOffers.map(offer => (
                    <option key={offer._id} value={offer._id}>
                      {offer.title || 'Untitled'} · {offer.discountPercentage || 0}% off
                      {offer.isOnline && offer.isInStore ? ' (online and in-store)' :
                       offer.isOnline ? ' (online only)' :
                       offer.isInStore ? ' (in-store only)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              {selectedOffer && (
                <div className="bb-chips">
                  <Pill tone="yellow">{String(selectedOffer.discountPercentage || 0)}% off</Pill>
                  <span className="bb-chip">{String(selectedOffer.title || 'Untitled')}</span>
                  {(selectedOffer.isOnline || selectedOffer.isInStore) && <span className="bb-chip">{offerWhere(selectedOffer)}</span>}
                </div>
              )}

              {isOnlineOnly && selectedOffer && (
                <div className="bv-promo">
                  <div className="bv-promo-head">
                    <b>Promo Code</b>
                    <span className="k-muted">Valid for online purchases</span>
                  </div>
                  <div className="bv-promo-row">
                    <span className="bv-code">{String(promoCode)}</span>
                    <IconButton icon={copied ? "check" : "copy"} label="Copy promo code" onClick={copyPromoCode} />
                    <IconButton icon="refresh" label="Generate new promo code" onClick={generatePromoCode} />
                  </div>
                  <p className="k-hint">This promo code will be embedded in the QR code for online verification</p>
                </div>
              )}

              <div className="k-row">
                <Button icon="qr" onClick={generateQRCode}>Generate QR Code</Button>
                {qrImage && !showQrModal && (
                  <Button variant="secondary" icon="eye" onClick={() => setShowQrModal(true)}>View Full</Button>
                )}
              </div>

              {qrImage && !showQrModal && (
                <img src={qrImage} alt="QR Preview" className="bv-qr-small" />
              )}
              <p className="k-hint">brand-only code. only tdc verified users can claim with it.</p>
            </>
          )}
        </section>
      ) : null}

      <Modal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        icon="qr"
        tone="green"
        title="QR Code"
        sub={String(user?.brandName || user?.name || 'Brand')}
        footer={<>
          <Button variant="secondary" icon="download" onClick={downloadQR}>Download</Button>
          <Button variant="secondary" icon="share" onClick={shareQR}>Share</Button>
          <Button icon="copy" onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
            toast('QR data copied to clipboard!');
          }}>Copy Data</Button>
        </>}
      >
        <div className="bv-qr-full">
          {qrImage && <img src={qrImage} alt="QR Code" />}
          <b>{String(selectedOffer?.title || 'Offer')}</b>
          <Pill tone="yellow">{String(selectedOffer?.discountPercentage || 0)}% off</Pill>
          {isOnlineOnly && promoCode && (
            <span>Promo Code: <strong>{String(promoCode)}</strong></span>
          )}
          <span className="k-muted">
            {selectedOffer?.isOnline && selectedOffer?.isInStore ? 'Online & In-Store' :
             selectedOffer?.isOnline ? 'Online Only' :
             selectedOffer?.isInStore ? 'In-Store Only' : 'Standard'}
          </span>
        </div>
      </Modal>

      {activeTab === 'verify' && (
        <div className="bv-grid">
          <section className="k-card bv-pane">
            <h2 className="br-h2">Verify Student Details</h2>
            <Field label="Full Name" htmlFor="bv-name">
              <Input
                id="bv-name"
                placeholder="Enter student's full name"
                value={inputs.name}
                onChange={e => setInputs({ ...inputs, name: e.target.value })}
              />
            </Field>
            <Field label="Roll Number / ID" htmlFor="bv-roll">
              <Input
                id="bv-roll"
                placeholder="Enter roll number"
                value={inputs.rollNo}
                onChange={e => setInputs({ ...inputs, rollNo: e.target.value })}
              />
            </Field>
            <Field label="University" htmlFor="bv-uni">
              <div className="k-dd" ref={dropdownRef}>
                <div className="bv-uni" onClick={toggleDropdown}>
                  <input
                    id="bv-uni"
                    className="k-input"
                    placeholder="Search or select university..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      if (e.target.value === "") {
                        setInputs({ ...inputs, university: "" });
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="bv-uni-clear"
                      aria-label="clear university"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearch();
                        setInputs({ ...inputs, university: "" });
                      }}
                    >
                      <Ico kind="close" tone="plain" size={14} />
                    </button>
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="k-dd-pop">
                    <div className="k-dd-list" role="listbox">
                      {filteredUniversities.length > 0 ? (
                        <>
                          <div className="k-dd-empty">
                            {filteredUniversities.length} {filteredUniversities.length === 1 ? 'university' : 'universities'} found
                          </div>
                          {filteredUniversities.map((uni, index) => (
                            <div
                              key={index}
                              role="option"
                              aria-selected={inputs.university === uni}
                              className="k-dd-opt"
                              onClick={() => handleUniversitySelect(uni)}
                            >
                              <span>{String(uni)}</span>
                              {inputs.university === uni && <Ico kind="check" tone="plain" size={15} />}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="k-dd-empty">
                          <b>No universities found</b><br />Try adjusting your search
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <Button
              block
              iconRight="chevronRight"
              onClick={verify}
              loading={loading}
              disabled={loading || processingPayment || isProcessingScan}
            >
              {loading ? "Verifying..." : "Verify Identity"}
            </Button>

            {result === "not_found" && (
              <div className="k-note bad">
                <strong>No active claim found</strong><br />
                This student hasn't claimed any active offer.
              </div>
            )}
          </section>

          <section className="k-card bv-pane">
            <h2 className="br-h2">Verified Redemption</h2>

            {(!result || result === "not_found") && !processingPayment && !isProcessingScan && (
              <EmptyState
                icon="search"
                tone="sand"
                title="Verify a student first"
                text="Enter student details and click verify to process payment"
                action={scannedStudent && scannedStudent.name && !result ? (
                  <div className="k-note ok">Student automatically verified from QR scan!</div>
                ) : null}
              />
            )}

            {processingPayment && (
              <EmptyState icon="receipt" tone="green" title="Processing Payment..." text="Please wait while we complete the transaction" action={<Spinner />} />
            )}

            {isProcessingScan && (
              <EmptyState icon="qr" tone="green" title="Processing Scan..." text="Please wait while we verify the student" action={<Spinner />} />
            )}

            {result && result !== "not_found" && !processingPayment && (
              <>
                <div className="bb-chips">
                  <Pill tone="green" dot>Verified Student</Pill>
                  {scannedStudent && <Pill tone="sky">Scanned</Pill>}
                </div>
                {renderStudentHead(result, scannedStudent && scannedStudent.scannedAt && (
                  <span className="k-muted">Verified from QR scan at {new Date(scannedStudent.scannedAt).toLocaleTimeString()}</span>
                ))}
                <div className="bb-chips">
                  <Pill tone="yellow">{String(result.discountPercentage || 0)}% off</Pill>
                  <span className="bb-chip">on {String(result.offerTitle || 'Offer')}</span>
                </div>
                {renderBill("bv-bill")}
                {paymentInfo && renderBreakdown(result.discountPercentage, handleProcessPayment, "Complete Transaction")}
              </>
            )}
          </section>
        </div>
      )}

      <Modal
        open={showPaymentModal && !!selectedStudent}
        onClose={() => setShowPaymentModal(false)}
        icon="receipt"
        tone="green"
        title="Process Payment"
        sub="new claim. enter the bill to apply the tdc discount."
      >
        {selectedStudent && (
          <div className="bo-form">
            {renderStudentHead(selectedStudent, selectedStudent.scannedAt && (
              <span className="k-muted">Scanned: {new Date(selectedStudent.scannedAt).toLocaleTimeString()}</span>
            ))}
            <div className="bb-chips">
              <Pill tone="yellow">{String(selectedStudent.discountPercentage || 0)}% off</Pill>
              <span className="bb-chip">on {String(selectedStudent.offerTitle || 'Offer')}</span>
            </div>
            {renderBill("bv-modal-bill")}
            {paymentInfo && renderBreakdown(selectedStudent.discountPercentage, handleProcessPayment, "Complete Redemption")}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VerifyClaim;
