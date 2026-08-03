import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  FaUniversity, 
  FaIdCard, 
  FaSearch, 
  FaCalculator, 
  FaCheckCircle,
  FaShieldAlt,
  FaArrowRight,
  FaEnvelope,
  FaPercent,
  FaUserGraduate,
  FaTimes,
  FaQrcode,
  FaDownload,
  FaShare,
  FaCopy,
  FaEye,
  FaUserCheck,
  FaSpinner,
  FaClock,
  FaUsers,
  FaHistory,
  FaReceipt,
  FaQrcode as FaQrCodeScan
} from "react-icons/fa";
import QRCode from "qrcode";

const VerifyClaim = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('verify');
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
            status: scan.status
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
            offerId: studentData.offerId || '',
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
        setResult(found);
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
      alert("Please select an offer first");
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
      alert("Failed to generate QR code");
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
          alert('QR code copied to clipboard!');
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
      return alert("Please fill in all student details");
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
      alert("Error connecting to server");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const calculatePayment = () => {
    if (!result || result === "not_found") {
      return alert("Please verify a student first");
    }
    
    if (!bill || bill <= 0) {
      return alert("Please enter a valid bill amount greater than 0");
    }

    const billAmount = Number(bill);
    const discount = (billAmount * (result.discountPercentage || 0)) / 100;

    setPaymentInfo({
      total: billAmount - discount,
      saved: discount
    });
  };

  const handleProcessPayment = async () => {
    if (!result || result === "not_found" || !paymentInfo) {
      alert("Please verify student and calculate payment first");
      return;
    }

    if (!bill || bill <= 0) {
      alert("Please enter a valid bill amount");
      return;
    }

    setProcessingPayment(true);
    try {
      await axios.post(
        "https://the-deft-crew-production.up.railway.app/api/offers/redeem-payment",
        {
          offerId: result.offerId,
          userId: result._id,
          billAmount: Number(bill),
          savedAmount: Number(paymentInfo.saved)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const studentId = scannedStudent?.studentId || result._id;
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
      alert(`✅ Success! Transaction has been recorded.\n\nOriginal: Rs. ${Number(bill).toLocaleString()}\nDiscount: Rs. ${paymentInfo.saved.toLocaleString()}\nFinal: Rs. ${paymentInfo.total.toLocaleString()}`);

      resetAllStates();
      await loadScannedStudents();
      await loadPaymentHistory();

    } catch (err) {
      alert(err.response?.data?.message || "Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleStudentSelect = (student) => {
    if (processingPayment || isProcessingScan) return;
    
    setSelectedStudent(student);
    setResult(student);
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

  const renderScannedStudents = () => (
    <div className="students-list-container">
      <div className="students-list-header">
        <FaQrCodeScan className="icon-orange" />
        <h4 className="students-list-title">QR Scanned Students</h4>
        <span className="students-count">{scannedStudentsList.length} students</span>
      </div>

      {scannedStudentsList.length === 0 ? (
        <div className="no-students-message">
          <p>No students have scanned the QR code yet.</p>
          <p className="sub-text">When a student scans your QR code, they will appear here for verification.</p>
        </div>
      ) : (
        <div className="students-grid">
          {scannedStudentsList.map((student, index) => (
            <div
              key={student._id || index}
              className="student-card"
              onClick={() => handleStudentSelect(student)}
            >
              <div className="student-card-header">
                <div className="student-avatar">
                  {String(student.name?.charAt(0) || 'S')}
                </div>
                <div className="student-card-info">
                  <h5 className="student-card-name">{String(student.name || 'Student')}</h5>
                  <p className="student-card-roll">Roll: {String(student.rollNo || 'N/A')}</p>
                </div>
                <div className="student-card-badge">
                  <span className="scan-badge">
                    <FaQrCodeScan size={10} /> Scanned
                  </span>
                  <span className="discount-badge">{String(student.discountPercentage || 0)}%</span>
                </div>
              </div>
              <div className="student-card-footer">
                <span className="student-card-university">
                  <FaUniversity size={12} /> {String(student.universityName || 'University')}
                </span>
                <span className="student-card-offer">{String(student.offerTitle || 'Offer')}</span>
              </div>
              {student.scannedAt && (
                <div className="scanned-timestamp">
                  <FaClock size={10} /> Scanned at: {new Date(student.scannedAt).toLocaleTimeString()}
                </div>
              )}
              <button
                className="process-payment-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudentSelect(student);
                }}
                disabled={processingPayment || isProcessingScan}
              >
                <FaEnvelope /> Process Payment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedStudent) return null;

    return (
      <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
        <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="payment-modal-header">
            <h4 className="payment-modal-title">
              <FaEnvelope className="icon-orange" />
              Process Payment
            </h4>
            <button
              className="payment-modal-close"
              onClick={() => setShowPaymentModal(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="payment-modal-body">
            <div className="payment-student-info">
              <div className="payment-student-avatar">
                {String(selectedStudent.name?.charAt(0) || 'S')}
              </div>
              <div className="payment-student-details">
                <h5 className="payment-student-name">{String(selectedStudent.name || 'Student')}</h5>
                <p className="payment-student-roll">Roll No: {String(selectedStudent.rollNo || 'N/A')}</p>
                <p className="payment-student-uni">
                  <FaUniversity size={12} /> {String(selectedStudent.universityName || 'University')}
                </p>
                {selectedStudent.scannedAt && (
                  <p className="payment-scanned-time">
                    <FaClock size={10} /> Scanned: {new Date(selectedStudent.scannedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="payment-offer-details">
              <div className="payment-offer-badge">
                <FaPercent className="icon-mr" />
                <span className="payment-offer-discount">
                  {String(selectedStudent.discountPercentage || 0)}% OFF
                </span>
                <span className="payment-offer-title">on {String(selectedStudent.offerTitle || 'Offer')}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="input-group">
              <label className="label">Bill Amount (PKR)</label>
              <div className="bill-input-wrapper">
                <span className="currency-symbol">₨</span>
                <input
                  type="number"
                  className="bill-input"
                  placeholder="Enter bill amount"
                  value={bill}
                  onChange={e => setBill(e.target.value)}
                />
              </div>
            </div>

            <button
              className="calc-btn"
              onClick={calculatePayment}
            >
              <FaCalculator className="icon-mr" />
              Calculate Discount
            </button>

            {paymentInfo && (
              <div className="payment-summary">
                <div className="summary-header">
                  <span>Payment Summary</span>
                  {scannedStudent && (
                    <span className="auto-tag">Auto-verified</span>
                  )}
                </div>
                <div className="summary-row">
                  <span>Original Amount:</span>
                  <span>₨ {Number(bill).toLocaleString()}</span>
                </div>
                <div className="summary-row-discount">
                  <span>Student Discount ({String(selectedStudent.discountPercentage || 0)}%):</span>
                  <span className="discount-amount">- ₨ {paymentInfo.saved.toLocaleString()}</span>
                </div>
                <div className="summary-row-total">
                  <span>Final Amount:</span>
                  <span className="total-amount">₨ {paymentInfo.total.toLocaleString()}</span>
                </div>

                {redemptionSuccess && (
                  <div className="success-banner">
                    <FaCheckCircle className="success-icon" />
                    <span>Payment processed successfully!</span>
                  </div>
                )}

                <button
                  className="pay-btn"
                  onClick={handleProcessPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <FaSpinner className="spinner-icon" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="icon-mr" />
                      Complete Redemption
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="verify-wrapper">
      <div className="bg-decoration-1"></div>
      <div className="bg-decoration-2"></div>

      {showStudentAlert && !isProcessingScan && !paymentInfo && (
        <div className="student-alert">
          <div className="student-alert-content">
            <div className="student-alert-icon">
              {loading ? <FaSpinner className="spinner-anim" /> : <FaUserCheck />}
            </div>
            <div className="student-alert-info">
              <h4 className="student-alert-title">
                {loading ? 'Verifying...' : result && result !== "not_found" ? 'Verified!' : 'Student Scanned!'}
              </h4>
              <p className="student-alert-text">
                {scannedStudent && scannedStudent.name ? (
                  <>
                    <strong>{String(scannedStudent.name)}</strong> from {String(scannedStudent.universityName || 'University')}
                  </>
                ) : (
                  String(alertMessage || 'Processing scan...')
                )}
              </p>
              <p className="student-alert-subtext">
                {loading ? 'Please wait while we verify...' : 
                 result && result !== "not_found" ? 'Enter bill amount and calculate discount' :
                 'Please try again'}
              </p>
            </div>
            {!loading && result && result !== "not_found" && (
              <div className="student-alert-status">
                <FaCheckCircle className="status-verified" />
                <span className="status-verified-text">Verified</span>
              </div>
            )}
            {!loading && result === "not_found" && (
              <div className="student-alert-status error">
                <FaTimes className="status-error" />
                <span className="status-error-text">Not Found</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="header-section">
        <div className="header-badge">
          <FaShieldAlt />
          <span>Secure Verification</span>
        </div>
        <h2 className="main-title">Verification Desk</h2>
        <p className="sub-title">Verify student identity and process discounted transactions securely</p>
      </div>

      {isBrand && (
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => handleTabChange('verify')}
          >
            <FaUserGraduate />
            <span>Verify Student</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'qr-generator' ? 'active' : ''}`}
            onClick={() => handleTabChange('qr-generator')}
          >
            <FaQrcode />
            <span>QR Generator</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <FaUsers />
            <span>Scanned Students</span>
          </button>
        </div>
      )}

      {activeTab === 'qr-generator' && isBrand ? (
        <div className="qr-generator-container">
          <div className="qr-header">
            <FaQrcode className="qr-icon" />
            <h3 className="qr-title">QR Code Generator</h3>
            <span className="qr-subtitle">Generate QR codes for student discounts</span>
          </div>

          {!brandOffers || brandOffers.length === 0 ? (
            <div className="no-offers-message">
              <p>No offers found. Create an offer first to generate QR codes.</p>
            </div>
          ) : (
            <>
              <div className="offer-selector">
                <label className="label">Select Offer</label>
                <select
                  className="offer-select"
                  value={selectedOffer?._id || ''}
                  onChange={(e) => {
                    const offer = brandOffers.find(o => o._id === e.target.value);
                    if (offer) handleOfferSelect(offer);
                  }}
                >
                  {brandOffers.map(offer => (
                    <option key={offer._id} value={offer._id}>
                      {offer.title || 'Untitled'} - {offer.discountPercentage || 0}% OFF
                      {offer.isOnline && offer.isInStore ? ' (Online & In-Store)' :
                       offer.isOnline ? ' (Online Only)' :
                       offer.isInStore ? ' (In-Store Only)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOffer && (
                <div className="offer-preview">
                  <div className="offer-preview-content">
                    <span className="offer-preview-label">Selected Offer:</span>
                    <span className="offer-preview-title">{String(selectedOffer.title || 'Untitled')}</span>
                    <span className="offer-preview-discount">
                      {String(selectedOffer.discountPercentage || 0)}% OFF
                    </span>
                  </div>
                  <div className="offer-type-badge">
                    {selectedOffer.isOnline && selectedOffer.isInStore ? (
                      <span className="badge purple">💻 Online & 🏪 In-Store</span>
                    ) : selectedOffer.isOnline ? (
                      <span className="badge blue">💻 Online Only</span>
                    ) : selectedOffer.isInStore ? (
                      <span className="badge green">🏪 In-Store Only</span>
                    ) : null}
                  </div>
                </div>
              )}

              {isOnlineOnly && selectedOffer && (
                <div className="promo-code-section">
                  <div className="promo-code-header">
                    <span className="promo-code-label">🔑 Promo Code</span>
                    <span className="promo-code-hint">Valid for online purchases</span>
                  </div>
                  <div className="promo-code-display">
                    <span className="promo-code-value">{String(promoCode)}</span>
                    <button
                      className="copy-btn"
                      onClick={copyPromoCode}
                      title="Copy promo code"
                    >
                      {copied ? <FaCheckCircle className="copied-icon" /> : <FaCopy />}
                    </button>
                    <button
                      className="refresh-btn"
                      onClick={generatePromoCode}
                      title="Generate new promo code"
                    >
                      🔄
                    </button>
                  </div>
                  <p className="promo-code-note">
                    This promo code will be embedded in the QR code for online verification
                  </p>
                </div>
              )}

              <button
                className="generate-qr-btn"
                onClick={generateQRCode}
              >
                <FaQrcode className="icon-mr" />
                Generate QR Code
              </button>

              {qrImage && !showQrModal && (
                <div className="qr-preview-small">
                  <img src={qrImage} alt="QR Preview" className="qr-preview-image" />
                  <div className="qr-preview-actions">
                    <button onClick={() => setShowQrModal(true)} className="view-qr-btn">
                      <FaEye /> View Full
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'students' && isBrand && renderScannedStudents()}

      {showQrModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h4 className="qr-modal-title">QR Code</h4>
              <button className="qr-modal-close" onClick={() => setShowQrModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="qr-modal-body">
              <div className="qr-modal-image-container">
                {qrImage && (
                  <img src={qrImage} alt="QR Code" className="qr-modal-image" />
                )}
              </div>

              <div className="qr-modal-info">
                <p className="qr-modal-brand">{String(user?.brandName || user?.name || 'Brand')}</p>
                <p className="qr-modal-offer">{String(selectedOffer?.title || 'Offer')}</p>
                <p className="qr-modal-discount">{String(selectedOffer?.discountPercentage || 0)}% OFF</p>
                {isOnlineOnly && promoCode && (
                  <p className="qr-modal-promo">Promo Code: <strong>{String(promoCode)}</strong></p>
                )}
                <p className="qr-modal-type">
                  {selectedOffer?.isOnline && selectedOffer?.isInStore ? 'Online & In-Store' :
                   selectedOffer?.isOnline ? 'Online Only' :
                   selectedOffer?.isInStore ? 'In-Store Only' : 'Standard'}
                </p>
              </div>

              <div className="qr-modal-actions">
                <button className="qr-action-btn" onClick={downloadQR}>
                  <FaDownload /> Download
                </button>
                <button className="qr-action-btn" onClick={shareQR}>
                  <FaShare /> Share
                </button>
                <button className="qr-action-btn green" onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
                  alert('QR data copied to clipboard!');
                }}>
                  <FaCopy /> Copy Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="main-grid">
          {/* Student Details Card */}
          <div className="card animate-card">
            <div className="card-header">
              <FaUserGraduate className="card-header-icon" />
              <h3 className="card-title">Student Details</h3>
            </div>

            <div className="input-group">
              <label className="label">Full Name</label>
              <div className="input-wrapper">
                <FaSearch className="input-icon" />
                <input
                  className="input-field"
                  placeholder="Enter student's full name"
                  value={inputs.name}
                  onChange={e => setInputs({ ...inputs, name: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Roll Number / ID</label>
              <div className="input-wrapper">
                <FaIdCard className="input-icon" />
                <input
                  className="input-field"
                  placeholder="Enter roll number"
                  value={inputs.rollNo}
                  onChange={e => setInputs({ ...inputs, rollNo: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">University</label>
              <div className="custom-select-wrapper" ref={dropdownRef}>
                <div
                  className="custom-select-trigger"
                  onClick={toggleDropdown}
                >
                  <FaUniversity className="input-icon" />
                  <input
                    className="custom-select-input"
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
                      className="clear-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearch();
                        setInputs({ ...inputs, university: "" });
                      }}
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                  <span className="dropdown-arrow">
                    {isDropdownOpen ? '▲' : '▼'}
                  </span>
                </div>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {filteredUniversities.length > 0 ? (
                      <>
                        <div className="results-count">
                          {filteredUniversities.length} {filteredUniversities.length === 1 ? 'university' : 'universities'} found
                        </div>
                        {filteredUniversities.map((uni, index) => (
                          <div
                            key={index}
                            className={`dropdown-item ${inputs.university === uni ? 'selected' : ''}`}
                            onClick={() => handleUniversitySelect(uni)}
                          >
                            <span className="dropdown-item-text">{String(uni)}</span>
                            {inputs.university === uni && (
                              <FaCheckCircle className="dropdown-check" />
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <p className="no-results-text">No universities found</p>
                        <p className="no-results-subtext">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              className="verify-btn"
              onClick={verify}
              disabled={loading || processingPayment || isProcessingScan}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Identity
                  <FaArrowRight className="icon-ml" />
                </>
              )}
            </button>

            {result === "not_found" && (
              <div className="error-state">
                <div className="error-icon">!</div>
                <div>
                  <strong>No active claim found</strong>
                  <p className="error-text">This student hasn't claimed any active offer.</p>
                </div>
              </div>
            )}
          </div>

          {/* Verification Process Card */}
          <div className="card animate-card">
            <div className="card-header">
              <FaEnvelope className="card-header-icon" />
              <h3 className="card-title">Verification Process</h3>
            </div>

            {(!result || result === "not_found") && !processingPayment && !isProcessingScan && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p className="empty-text">Verify a student first</p>
                <p className="empty-subtext">Enter student details and click verify to process payment</p>
                {scannedStudent && scannedStudent.name && !result && (
                  <p className="empty-success">
                    <FaCheckCircle /> Student automatically verified from QR scan!
                  </p>
                )}
              </div>
            )}

            {processingPayment && (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaSpinner className="spinner-anim" />
                </div>
                <p className="empty-text">Processing Payment...</p>
                <p className="empty-subtext">Please wait while we complete the transaction</p>
              </div>
            )}

            {isProcessingScan && (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaSpinner className="spinner-anim" />
                </div>
                <p className="empty-text">Processing Scan...</p>
                <p className="empty-subtext">Please wait while we verify the student</p>
              </div>
            )}

            {result && result !== "not_found" && !processingPayment && (
              <div className="result-container">
                <div className="success-badge">
                  <FaCheckCircle />
                  Verified Student
                  {scannedStudent && (
                    <span className="scanned-badge">
                      <FaQrcode /> Scanned
                    </span>
                  )}
                </div>

                <div className="student-info">
                  <h4 className="student-name">{String(result.name || 'Student')}</h4>
                  <p className="student-roll">Roll No: {String(result.rollNo || 'N/A')}</p>
                  <p className="student-uni">{String(result.universityName || 'University')}</p>
                  {scannedStudent && scannedStudent.scannedAt && (
                    <p className="scanned-time">
                      <FaClock /> Verified from QR scan at {new Date(scannedStudent.scannedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div className="offer-badge">
                  <FaPercent className="offer-icon" />
                  <span className="offer-discount">{String(result.discountPercentage || 0)}% OFF</span>
                  <span className="offer-title">on {String(result.offerTitle || 'Offer')}</span>
                </div>

                <div className="divider" />

                <div className="input-group">
                  <label className="label">Bill Amount (PKR)</label>
                  <div className="bill-input-wrapper">
                    <span className="currency-symbol">₨</span>
                    <input
                      type="number"
                      className="bill-input"
                      placeholder="Enter bill amount"
                      value={bill}
                      onChange={e => setBill(e.target.value)}
                    />
                  </div>
                </div>

                <button className="calc-btn" onClick={calculatePayment}>
                  <FaCalculator className="icon-mr" />
                  Calculate Discount
                </button>

                {paymentInfo && (
                  <div className="payment-summary">
                    <div className="summary-header">
                      <span>Payment Summary</span>
                      {scannedStudent && (
                        <span className="auto-tag">Auto-verified</span>
                      )}
                    </div>
                    <div className="summary-row">
                      <span>Original Amount:</span>
                      <span>₨ {Number(bill).toLocaleString()}</span>
                    </div>
                    <div className="summary-row-discount">
                      <span>Student Discount ({String(result.discountPercentage || 0)}%):</span>
                      <span className="discount-amount">- ₨ {paymentInfo.saved.toLocaleString()}</span>
                    </div>
                    <div className="summary-row-total">
                      <span>Final Amount:</span>
                      <span className="total-amount">₨ {paymentInfo.total.toLocaleString()}</span>
                    </div>

                    <button
                      className="pay-btn"
                      onClick={handleProcessPayment}
                      disabled={processingPayment}
                    >
                      <FaCheckCircle className="icon-mr" />
                      Complete Transaction
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {renderPaymentModal()}

      <style>{`
        /* Base Styles */
        .verify-wrapper {
          padding: 30px 40px;
          min-height: 85vh;
          position: relative;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 32px;
          overflow: hidden;
        }

        .bg-decoration-1 {
          position: absolute;
          top: -100px;
          right: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,150,26,0.08) 0%, rgba(255,150,26,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .bg-decoration-2 {
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(255,150,26,0.05) 0%, rgba(255,150,26,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* Animations */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes qrModalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .animate-card {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .animate-card:first-child { animation-delay: 0.1s; }
        .animate-card:last-child { animation-delay: 0.2s; }

        .spinner-anim {
          animation: pulse 0.8s linear infinite;
        }

        /* Student Alert */
        .student-alert {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          animation: slideInLeft 0.5s ease forwards;
          max-width: 450px;
          width: 100%;
        }

        .student-alert-content {
          background: #fff;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 20px 60px -12px rgba(0,0,0,0.2);
          border: 1px solid #d1fae5;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .student-alert-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #d1fae5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #065f46;
          flex-shrink: 0;
        }

        .student-alert-info {
          flex: 1;
          min-width: 120px;
        }

        .student-alert-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .student-alert-text {
          font-size: 13px;
          color: #475569;
          margin: 4px 0 0 0;
        }

        .student-alert-subtext {
          font-size: 11px;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }

        .student-alert-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .student-alert-status.error {
          color: #dc2626;
        }

        .status-verified {
          color: #10b981;
          font-size: 18px;
        }

        .status-verified-text {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
        }

        .status-error {
          color: #dc2626;
          font-size: 18px;
        }

        .status-error-text {
          font-size: 12px;
          font-weight: 600;
          color: #dc2626;
        }

        /* Header */
        .header-section {
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff7ed;
          padding: 6px 16px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          color: #ff961a;
          margin-bottom: 16px;
        }

        .main-title {
          font-size: 28px;
          color: #1e293b;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .sub-title {
          color: #64748b;
          font-size: 14px;
          margin-top: 8px;
        }

        /* Tabs */
        .tab-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #fff;
          padding: 4px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .tab-btn.active {
          background: #1e293b;
          color: #fff;
          box-shadow: 0 4px 12px rgba(30,41,59,0.15);
        }

        /* Main Grid - Desktop: Row, Mobile: Column */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          position: relative;
          z-index: 1;
        }

        /* Cards */
        .card {
          background: #fff;
          padding: 28px;
          border-radius: 28px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,150,26,0.1);
          transition: box-shadow 0.3s ease;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .card-header-icon {
          font-size: 20px;
          color: #ff961a;
        }

        .card-title {
          font-size: 18px;
          color: #1e293b;
          margin: 0;
          font-weight: 600;
        }

        /* Inputs */
        .input-group {
          margin-bottom: 20px;
        }

        .label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: #ff961a;
          box-shadow: 0 0 0 4px rgba(255,150,26,0.1);
        }

        .input-icon {
          margin-left: 16px;
          color: #94a3b8;
          font-size: 14px;
          flex-shrink: 0;
        }

        .input-field {
          border: none;
          background: transparent;
          padding: 14px 16px;
          width: 100%;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .input-field::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        /* Custom Select */
        .custom-select-wrapper {
          position: relative;
          width: 100%;
        }

        .custom-select-trigger {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          transition: all 0.2s ease;
          cursor: pointer;
          min-height: 52px;
        }

        .custom-select-trigger:focus-within {
          border-color: #ff961a;
          box-shadow: 0 0 0 4px rgba(255,150,26,0.1);
        }

        .custom-select-input {
          border: none;
          background: transparent;
          padding: 14px 12px;
          width: 100%;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          flex: 1;
          min-width: 60px;
        }

        .custom-select-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dropdown-arrow {
          padding: 0 16px;
          color: #94a3b8;
          font-size: 12px;
          flex-shrink: 0;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 60px -12px rgba(0,0,0,0.2);
          border: 1px solid #e2e8f0;
          max-height: 280px;
          overflow-y: auto;
          z-index: 1000;
          animation: dropdownSlide 0.2s ease forwards;
        }

        .results-count {
          padding: 12px 16px 8px;
          font-size: 12px;
          color: #94a3b8;
          border-bottom: 1px solid #f1f5f9;
          font-weight: 500;
        }

        .dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease;
          border-left: 3px solid transparent;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.selected {
          background: #fff7ed;
          border-left-color: #ff961a;
        }

        .dropdown-item-text {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .dropdown-check {
          color: #ff961a;
          font-size: 14px;
          flex-shrink: 0;
        }

        .no-results {
          padding: 40px 20px;
          text-align: center;
        }

        .no-results-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .no-results-text {
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .no-results-subtext {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Buttons */
        .verify-btn {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-top: 8px;
          transition: all 0.3s ease;
        }

        .verify-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(30,41,59,0.2);
        }

        .verify-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: pulse 0.8s linear infinite;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .calc-btn {
          background: #334155;
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 14px;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          margin-top: 16px;
          transition: all 0.3s ease;
        }

        .calc-btn:hover {
          transform: translateY(-2px);
          background: #1e293b;
        }

        .pay-btn {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16,185,129,0.3);
        }

        .pay-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Error State */
        .error-state {
          background: #fef2f2;
          color: #dc2626;
          padding: 14px 16px;
          border-radius: 16px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #fecaca;
          animation: fadeInScale 0.3s ease forwards;
        }

        .error-icon {
          width: 24px;
          height: 24px;
          background: #dc2626;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .error-text {
          margin: 5px 0 0;
          font-size: 12px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .empty-subtext {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 8px;
        }

        .empty-success {
          color: #10b981;
          margin-top: 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Result Container */
        .result-container {
          animation: fadeInScale 0.4s ease forwards;
        }

        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #d1fae5;
          color: #065f46;
          padding: 8px 16px;
          border-radius: 40px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .scanned-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fef3c7;
          color: #92400e;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
        }

        .student-info {
          background: #f8fafc;
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .student-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .student-roll {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 2px 0;
        }

        .student-uni {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .scanned-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .offer-badge {
          background: linear-gradient(135deg, #ff961a 0%, #f3b245 100%);
          color: #fff;
          padding: 10px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .offer-icon {
          font-size: 14px;
        }

        .offer-discount {
          font-weight: 700;
        }

        .offer-title {
          font-size: 12px;
          opacity: 0.9;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, #e2e8f0 0%, #ff961a 50%, #e2e8f0 100%);
          margin: 20px 0;
        }

        /* Bill Input */
        .bill-input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .bill-input-wrapper:focus-within {
          border-color: #ff961a;
          box-shadow: 0 0 0 4px rgba(255,150,26,0.1);
        }

        .currency-symbol {
          padding: 14px 0 14px 16px;
          font-weight: 600;
          color: #ff961a;
          font-size: 16px;
          flex-shrink: 0;
        }

        .bill-input {
          border: none;
          background: transparent;
          padding: 14px 16px;
          width: 100%;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .bill-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        /* Payment Summary */
        .payment-summary {
          margin-top: 20px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          animation: fadeInScale 0.4s ease forwards;
        }

        .summary-header {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .auto-tag {
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          background: #d1fae5;
          padding: 2px 10px;
          border-radius: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
          color: #475569;
          flex-wrap: wrap;
          gap: 4px;
        }

        .summary-row-discount {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
          color: #10b981;
          flex-wrap: wrap;
          gap: 4px;
        }

        .discount-amount {
          color: #10b981;
          font-weight: 500;
        }

        .summary-row-total {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e2e8f0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          flex-wrap: wrap;
          gap: 4px;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 800;
          color: #ff961a;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #d1fae5;
          padding: 12px 16px;
          border-radius: 12px;
          margin-top: 12px;
          color: #065f46;
          font-size: 14px;
          font-weight: 500;
          flex-wrap: wrap;
        }

        .success-icon {
          color: #10b981;
          font-size: 20px;
          flex-shrink: 0;
        }

        /* QR Generator */
        .qr-generator-container {
          background: #fff;
          padding: 28px;
          border-radius: 28px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,150,26,0.1);
          position: relative;
          z-index: 1;
        }

        .qr-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
          flex-wrap: wrap;
        }

        .qr-icon {
          font-size: 24px;
          color: #ff961a;
        }

        .qr-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .qr-subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin-left: auto;
        }

        .no-offers-message {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .offer-selector {
          margin-bottom: 20px;
        }

        .offer-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          background: #f8fafc;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .offer-select:focus {
          border-color: #ff961a;
          outline: none;
        }

        .offer-preview {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .offer-preview-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .offer-preview-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .offer-preview-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .offer-preview-discount {
          font-size: 14px;
          font-weight: 700;
          color: #ff961a;
          background: #fff7ed;
          padding: 2px 10px;
          border-radius: 20px;
        }

        .offer-type-badge {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
        }

        .badge.purple { background: #8b5cf6; }
        .badge.blue { background: #3b82f6; }
        .badge.green { background: #10b981; }

        /* Promo Code */
        .promo-code-section {
          background: #f0f9ff;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid #bae6fd;
        }

        .promo-code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .promo-code-label {
          font-size: 13px;
          font-weight: 600;
          color: #0369a1;
        }

        .promo-code-hint {
          font-size: 11px;
          color: #64748b;
        }

        .promo-code-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #bae6fd;
          flex-wrap: wrap;
        }

        .promo-code-value {
          flex: 1;
          font-size: 18px;
          font-weight: 700;
          color: #0c4a6e;
          font-family: monospace;
          letter-spacing: 2px;
          min-width: 80px;
          word-break: break-all;
        }

        .copy-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 16px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          color: #1e293b;
        }

        .refresh-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 16px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .copied-icon {
          color: #10b981;
        }

        .promo-code-note {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
          font-style: italic;
        }

        .generate-qr-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ff961a 0%, #f3b245 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .generate-qr-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255,150,26,0.3);
        }

        .qr-preview-small {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .qr-preview-image {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }

        .qr-preview-actions {
          display: flex;
          gap: 8px;
        }

        .view-qr-btn {
          padding: 6px 16px;
          background: #1e293b;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* QR Modal */
        .qr-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .qr-modal-content {
          background: #fff;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          animation: qrModalIn 0.3s ease forwards;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
        }

        .qr-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .qr-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .qr-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .qr-modal-close:hover {
          background: #f1f5f9;
        }

        .qr-modal-body {
          padding: 24px;
        }

        .qr-modal-image-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .qr-modal-image {
          width: 280px;
          height: 280px;
          border-radius: 16px;
          border: 3px solid #e2e8f0;
        }

        .qr-modal-info {
          text-align: center;
          margin-bottom: 20px;
        }

        .qr-modal-brand {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .qr-modal-offer {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 4px 0;
        }

        .qr-modal-discount {
          font-size: 24px;
          font-weight: 800;
          color: #ff961a;
          margin: 4px 0;
        }

        .qr-modal-promo {
          font-size: 13px;
          color: #0369a1;
          margin: 4px 0;
          background: #f0f9ff;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
        }

        .qr-modal-type {
          font-size: 12px;
          color: #94a3b8;
          margin: 4px 0;
        }

        .qr-modal-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .qr-action-btn {
          padding: 8px 16px;
          background: #f1f5f9;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .qr-action-btn:hover {
          background: #e2e8f0;
        }

        .qr-action-btn.green {
          background: #10b981;
          color: #fff;
        }

        .qr-action-btn.green:hover {
          background: #059669;
        }

        /* Students List */
        .students-list-container {
          background: #fff;
          padding: 28px;
          border-radius: 28px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,150,26,0.1);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .students-list-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
          flex-wrap: wrap;
        }

        .icon-orange {
          color: #ff961a;
        }

        .students-list-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .students-count {
          margin-left: auto;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .no-students-message {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .no-students-message .sub-text {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 8px;
        }

        .students-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .student-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
          min-width: 0;
        }

        .student-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
          border-color: #ff961a;
        }

        .student-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .student-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff961a 0%, #f3b245 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }

        .student-card-info {
          flex: 1;
          min-width: 80px;
        }

        .student-card-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          word-break: break-word;
        }

        .student-card-roll {
          font-size: 12px;
          color: #94a3b8;
          margin: 2px 0 0 0;
          word-break: break-word;
        }

        .student-card-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          margin-left: auto;
        }

        .scan-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #dbeafe;
          color: #1d4ed8;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }

        .discount-badge {
          background: #ff961a;
          color: #fff;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .student-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
          flex-wrap: wrap;
          gap: 4px;
        }

        .student-card-university {
          display: flex;
          align-items: center;
          gap: 4px;
          word-break: break-word;
        }

        .student-card-offer {
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          color: #475569;
          word-break: break-word;
        }

        .scanned-timestamp {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
        }

        .process-payment-btn {
          width: 100%;
          margin-top: 12px;
          padding: 8px;
          background: #1e293b;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .process-payment-btn:hover:not(:disabled) {
          background: #0f172a;
        }

        .process-payment-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Payment Modal */
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .payment-modal-content {
          background: #fff;
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          animation: qrModalIn 0.3s ease forwards;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
        }

        .payment-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .payment-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .payment-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .payment-modal-close:hover {
          background: #f1f5f9;
        }

        .payment-modal-body {
          padding: 24px;
        }

        .payment-student-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .payment-student-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff961a 0%, #f3b245 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          flex-shrink: 0;
        }

        .payment-student-details {
          flex: 1;
          min-width: 120px;
        }

        .payment-student-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          word-break: break-word;
        }

        .payment-student-roll {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0;
          word-break: break-word;
        }

        .payment-student-uni {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          word-break: break-word;
        }

        .payment-scanned-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .payment-offer-details {
          margin-bottom: 16px;
        }

        .payment-offer-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff7ed;
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid #fed7aa;
          flex-wrap: wrap;
        }

        .icon-mr {
          margin-right: 6px;
        }

        .icon-ml {
          margin-left: 8px;
        }

        .payment-offer-discount {
          font-weight: 700;
          color: #ff961a;
          font-size: 14px;
        }

        .payment-offer-title {
          font-size: 13px;
          color: #64748b;
        }

        /* Utility Classes */
        .text-center {
          text-align: center;
        }

        .mt-8 {
          margin-top: 8px;
        }

        .mt-12 {
          margin-top: 12px;
        }

        .mt-16 {
          margin-top: 16px;
        }

        .mt-20 {
          margin-top: 20px;
        }

        .mb-8 {
          margin-bottom: 8px;
        }

        .mb-12 {
          margin-bottom: 12px;
        }

        .mb-16 {
          margin-bottom: 16px;
        }

        .mb-20 {
          margin-bottom: 20px;
        }

        /* === RESPONSIVE BREAKPOINTS === */

        /* Large screens: Side by side */
        @media (min-width: 1025px) {
          .main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
          }

          .students-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        /* Tablet and below: Column */
        @media (max-width: 1024px) {
          .verify-wrapper {
            padding: 24px 28px;
          }

          .main-grid {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .students-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }

          .main-title {
            font-size: 24px;
          }

          .card {
            padding: 24px;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .verify-wrapper {
            padding: 16px 20px;
          }

          .main-title {
            font-size: 22px;
          }

          .card {
            padding: 20px;
          }

          .students-grid {
            grid-template-columns: 1fr;
          }

          .qr-modal-content {
            max-width: 95%;
          }

          .qr-modal-image {
            width: 200px;
            height: 200px;
          }

          .student-alert {
            max-width: 90%;
            right: 5%;
            top: 10px;
          }

          .tab-btn {
            padding: 10px 12px;
            font-size: 12px;
          }

          .tab-btn span {
            display: none;
          }

          .tab-btn svg {
            font-size: 18px;
          }

          .qr-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .qr-subtitle {
            margin-left: 0;
          }

          .offer-preview {
            flex-direction: column;
            align-items: flex-start;
          }

          .promo-code-display {
            flex-wrap: wrap;
          }

          .promo-code-value {
            font-size: 14px;
            word-break: break-all;
          }

          .payment-modal-content {
            max-width: 98%;
          }

          .payment-student-info {
            flex-direction: column;
            text-align: center;
          }

          .payment-offer-badge {
            justify-content: center;
          }
        }

        /* Small mobile */
        @media (max-width: 480px) {
          .verify-wrapper {
            padding: 12px 16px;
            border-radius: 16px;
          }

          .main-title {
            font-size: 18px;
          }

          .sub-title {
            font-size: 12px;
          }

          .card {
            padding: 16px;
            border-radius: 20px;
          }

          .card-header {
            margin-bottom: 16px;
          }

          .card-title {
            font-size: 16px;
          }

          .input-field {
            font-size: 13px;
            padding: 12px 14px;
          }

          .input-wrapper {
            border-radius: 12px;
          }

          .dropdown-menu {
            max-height: 200px;
          }

          .dropdown-item {
            padding: 10px 14px;
          }

          .dropdown-item-text {
            font-size: 13px;
          }

          .verify-btn {
            padding: 12px 16px;
            font-size: 13px;
          }

          .student-alert-content {
            padding: 14px;
            flex-wrap: wrap;
          }

          .student-alert-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .student-alert-title {
            font-size: 14px;
          }

          .student-alert-text {
            font-size: 12px;
          }

          .qr-generator-container {
            padding: 16px;
          }

          .qr-modal-content {
            padding: 16px;
          }

          .qr-modal-image {
            width: 160px;
            height: 160px;
          }

          .qr-modal-actions {
            flex-direction: column;
          }

          .qr-action-btn {
            width: 100%;
            justify-content: center;
          }

          .payment-modal-content {
            max-width: 98%;
          }

          .payment-student-info {
            flex-direction: column;
            text-align: center;
          }

          .payment-offer-badge {
            flex-wrap: wrap;
            justify-content: center;
          }

          .summary-row,
          .summary-row-discount,
          .summary-row-total {
            font-size: 13px;
            flex-wrap: wrap;
            gap: 4px;
          }

          .total-amount {
            font-size: 17px;
          }

          .students-list-container {
            padding: 16px;
          }

          .student-card {
            padding: 12px;
          }

          .student-card-header {
            flex-wrap: wrap;
          }

          .student-card-badge {
            margin-left: auto;
          }

          .student-card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .payment-modal-body {
            padding: 16px;
          }

          .payment-modal-header {
            padding: 16px;
          }

          .payment-modal-title {
            font-size: 16px;
          }

          .payment-student-name {
            font-size: 14px;
          }

          .payment-student-roll {
            font-size: 12px;
          }

          .payment-student-uni {
            font-size: 11px;
          }

          .header-badge {
            font-size: 11px;
            padding: 4px 12px;
          }

          .tab-container {
            flex-wrap: wrap;
          }

          .tab-btn {
            flex: 1;
            min-width: 60px;
            padding: 8px;
          }

          .currency-symbol {
            padding: 10px 0 10px 12px;
            font-size: 14px;
          }

          .bill-input {
            padding: 10px 12px;
            font-size: 13px;
          }

          .calc-btn {
            padding: 10px 16px;
            font-size: 13px;
          }

          .pay-btn {
            padding: 12px 16px;
            font-size: 13px;
          }

          .qr-modal-image {
            width: 130px;
            height: 130px;
          }

          .qr-modal-brand {
            font-size: 16px;
          }

          .qr-modal-discount {
            font-size: 20px;
          }

          .qr-modal-offer {
            font-size: 12px;
          }

          .students-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Extra small */
        @media (max-width: 360px) {
          .verify-wrapper {
            padding: 8px 12px;
          }

          .main-title {
            font-size: 16px;
          }

          .card {
            padding: 12px;
          }

          .input-field {
            font-size: 12px;
            padding: 10px 12px;
          }

          .input-icon {
            margin-left: 12px;
            font-size: 12px;
          }

          .custom-select-input {
            font-size: 12px;
            padding: 10px 8px;
          }

          .qr-modal-image {
            width: 110px;
            height: 110px;
          }

          .student-card-name {
            font-size: 13px;
          }

          .student-card-roll {
            font-size: 11px;
          }
        }

        /* Landscape phone support */
        @media (max-height: 600px) and (orientation: landscape) {
          .verify-wrapper {
            padding: 12px 20px;
          }

          .header-section {
            margin-bottom: 16px;
          }

          .main-title {
            font-size: 20px;
          }

          .card {
            padding: 16px;
          }

          .card-header {
            margin-bottom: 12px;
          }

          .input-group {
            margin-bottom: 12px;
          }

          .empty-state {
            padding: 30px 16px;
          }

          .empty-icon {
            font-size: 40px;
          }

          .qr-modal-image {
            width: 140px;
            height: 140px;
          }

          .payment-modal-content {
            max-height: 95vh;
          }
        }

        /* Tablet landscape */
        @media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
          .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          .students-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        /* Large screens */
        @media (min-width: 1400px) {
          .verify-wrapper {
            padding: 40px 60px;
          }

          .main-grid {
            gap: 36px;
          }

          .card {
            padding: 36px;
          }

          .students-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          }
        }

        /* Print styles */
        @media print {
          .verify-wrapper {
            padding: 16px;
            background: #fff;
          }

          .bg-decoration-1,
          .bg-decoration-2 {
            display: none;
          }

          .verify-btn,
          .calc-btn,
          .pay-btn,
          .generate-qr-btn,
          .qr-action-btn,
          .process-payment-btn {
            display: none !important;
          }

          .card {
            box-shadow: none;
            border: 1px solid #e2e8f0;
            page-break-inside: avoid;
          }

          .student-alert {
            display: none !important;
          }

          .qr-modal-overlay {
            display: none !important;
          }

          .payment-modal-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyClaim;