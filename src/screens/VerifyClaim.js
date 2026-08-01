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
  FaCreditCard,
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
    "Aga Khan University",
    "Air University",
    "Aror University of Art, Architecture, Design & Heritage",
    "Allama Iqbal Open University",
    "Bahria University Islamabad",
    "Bahria University Karachi",
    "COMSATS University Islamabad",
    "COMSATS University Lahore Campus",
    "COMSATS University Sahiwal Campus",
    "COMSATS University Vehari Campus",
    "Dawood University of Engineering & Technology Karachi",
    "DHA Suffa University",
    "Dow International Medical College",
    "Faisalabad Medical University",
    "FAST-NUCES Karachi",
    "FAST-NUCES Lahore",
    "Fatima Jinnah Medical University",
    "FMH College of Medicine & Dentistry",
    "Foundation University Medical College",
    "Gambat Institute of Medical Sciences (GIMS)",
    "Gilgit Medical College",
    "Government College University Faisalabad",
    "Government College University Lahore",
    "Habib University Karachi",
    "Hamdard University Karachi",
    "Ilma University Karachi",
    "Indus Medical College",
    "Indus University",
    "Institute of Business Administration (IBA Karachi)",
    "Institute of Business Management (IoBM)",
    "International Islamic University Islamabad",
    "Iqra University",
    "Islamabad Medical & Dental College",
    "Isra Medical College",
    "Isra University",
    "Jhalawan Medical College",
    "Jinnah Medical & Dental College",
    "Jinnah Sindh Medical University",
    "Karakoram International University",
    "Karachi Institute of Medical Sciences",
    "Karachi Medical & Dental College",
    "KASBIT",
    "Khawaja Muhammad Safdar Medical College",
    "Khyber Medical College",
    "Khyber Medical University",
    "King Edward Medical University",
    "Lahore Medical & Dental College",
    "Lahore University of Management Sciences (LUMS)",
    "Liaquat College of Medicine & Dentistry",
    "Liaquat University of Medical & Health Sciences",
    "Loralai Medical College",
    "Makran Medical College",
    "Mehran University of Engineering & Technology (MUET)",
    "Mohtarma Benazir Bhutto Shaheed Medical College",
    "Muhammad Ali Jinnah University",
    "National Defence University",
    "National Textile University",
    "National University of Medical Sciences (NUMS)",
    "National University of Modern Languages (NUML)",
    "National University of Sciences & Technology (NUST)",
    "NED University of Engineering & Technology",
    "Pakistan Institute of Engineering & Applied Sciences (PIEAS)",
    "Pakistan Institute of Medical Sciences (PIMS)",
    "Peoples University of Medical & Health Sciences",
    "Pir Mehr Ali Shah Arid Agriculture University",
    "Punjab Medical College",
    "Quaid-e-Awam University of Engineering, Science & Technology (QUEST)",
    "Quaid-e-Azam Medical College",
    "Quaid-i-Azam University",
    "Rawalpindi Medical University",
    "Riphah International University",
    "Shah Abdul Latif University",
    "Shaheed Benazir Bhutto University Nawabshah",
    "Shaheed Mohtarma Benazir Bhutto Medical University Larkana",
    "Sindh Madressatul Islam University",
    "Sir Syed University of Engineering & Technology",
    "Sukkur IBA University",
    "SZABIST",
    "The Islamia University of Bahawalpur",
    "University of Agriculture Faisalabad",
    "University of Azad Jammu & Kashmir",
    "University of Balochistan",
    "University of Central Punjab",
    "University of Chakwal",
    "University of Engineering & Technology Lahore",
    "University of Engineering & Technology Peshawar",
    "University of Gujrat",
    "University of Karachi",
    "University of Lahore",
    "University of Management & Technology",
    "University of Okara",
    "University of Peshawar",
    "University of Sahiwal",
    "University of Sindh Jamshoro",
    "University of South Asia",
    "University of the Punjab",
    "Women University Multan",
    "Ziauddin Medical College",
    "Ziauddin University",
    "Ziauddin University Sukkur"
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

  // Reset all form states
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

  // Load brand's offers for QR generation
  useEffect(() => {
    if (isBrand) {
      loadBrandOffers();
      loadScannedStudents();
      loadPaymentHistory();
    }
  }, [user, isBrand]);

  // Setup polling for student scans - only if not processing
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
      
      // Filter out processed students
      const pendingScans = res.data.filter(scan => 
        scan.status === 'pending' && 
        !processedStudentIds.includes(scan.studentId)
      );
      
      // Remove duplicates by studentId
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
        // Get first pending scan that hasn't been processed
        const pendingScans = res.data.filter(scan => 
          scan.status === 'pending' && 
          !processedStudentIds.includes(scan.studentId) &&
          scan.studentId !== lastProcessedStudentId
        );
        
        if (pendingScans.length > 0) {
          const studentData = pendingScans[0];
          
          // Extract university name properly
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
        // Don't auto-set bill amount - let user enter it
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
          // Don't auto-set bill - let user enter it
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

      // Mark this student as processed
      const studentId = scannedStudent?.studentId || result._id;
      if (studentId) {
        setProcessedStudentIds(prev => [...prev, studentId]);
        setLastProcessedStudentId(studentId);
        
        // Also mark on backend
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

      // COMPLETELY RESET EVERYTHING
      resetAllStates();

      // Refresh data
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

  // Render Scanned Students List
  const renderScannedStudents = () => (
    <div style={styles.studentsListContainer}>
      <div style={styles.studentsListHeader}>
        <FaQrCodeScan style={{ color: '#ff961a' }} />
        <h4 style={styles.studentsListTitle}>QR Scanned Students</h4>
        <span style={styles.studentsCount}>{scannedStudentsList.length} students</span>
      </div>

      {scannedStudentsList.length === 0 ? (
        <div style={styles.noStudentsMessage}>
          <p>No students have scanned the QR code yet.</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
            When a student scans your QR code, they will appear here for verification.
          </p>
        </div>
      ) : (
        <div style={styles.studentsGrid}>
          {scannedStudentsList.map((student, index) => (
            <div
              key={student._id || index}
              style={styles.studentCard}
              onClick={() => handleStudentSelect(student)}
            >
              <div style={styles.studentCardHeader}>
                <div style={styles.studentAvatar}>
                  {String(student.name?.charAt(0) || 'S')}
                </div>
                <div style={styles.studentCardInfo}>
                  <h5 style={styles.studentCardName}>{String(student.name || 'Student')}</h5>
                  <p style={styles.studentCardRoll}>Roll: {String(student.rollNo || 'N/A')}</p>
                </div>
                <div style={styles.studentCardBadge}>
                  <span style={styles.scanBadge}>
                    <FaQrCodeScan size={10} /> Scanned
                  </span>
                  <span style={styles.discountBadge}>{String(student.discountPercentage || 0)}%</span>
                </div>
              </div>
              <div style={styles.studentCardFooter}>
                <span style={styles.studentCardUniversity}>
                  <FaUniversity size={12} /> {String(student.universityName || 'University')}
                </span>
                <span style={styles.studentCardOffer}>{String(student.offerTitle || 'Offer')}</span>
              </div>
              {student.scannedAt && (
                <div style={styles.scannedTimeStamp}>
                  <FaClock size={10} /> Scanned at: {new Date(student.scannedAt).toLocaleTimeString()}
                </div>
              )}
              <button
                style={styles.processPaymentBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudentSelect(student);
                }}
                disabled={processingPayment || isProcessingScan}
              >
                <FaCreditCard /> Process Payment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Payment Modal
  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedStudent) return null;

    return (
      <div style={styles.paymentModalOverlay} onClick={() => setShowPaymentModal(false)}>
        <div style={styles.paymentModalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.paymentModalHeader}>
            <h4 style={styles.paymentModalTitle}>
              <FaCreditCard style={{ marginRight: '8px', color: '#ff961a' }} />
              Process Payment
            </h4>
            <button
              style={styles.paymentModalClose}
              onClick={() => setShowPaymentModal(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div style={styles.paymentModalBody}>
            <div style={styles.paymentStudentInfo}>
              <div style={styles.paymentStudentAvatar}>
                {String(selectedStudent.name?.charAt(0) || 'S')}
              </div>
              <div style={styles.paymentStudentDetails}>
                <h5 style={styles.paymentStudentName}>{String(selectedStudent.name || 'Student')}</h5>
                <p style={styles.paymentStudentRoll}>Roll No: {String(selectedStudent.rollNo || 'N/A')}</p>
                <p style={styles.paymentStudentUni}>
                  <FaUniversity size={12} /> {String(selectedStudent.universityName || 'University')}
                </p>
                {selectedStudent.scannedAt && (
                  <p style={styles.paymentScannedTime}>
                    <FaClock size={10} /> Scanned: {new Date(selectedStudent.scannedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div style={styles.paymentOfferDetails}>
              <div style={styles.paymentOfferBadge}>
                <FaPercent style={{ marginRight: '6px' }} />
                <span style={styles.paymentOfferDiscount}>
                  {String(selectedStudent.discountPercentage || 0)}% OFF
                </span>
                <span style={styles.paymentOfferTitle}>on {String(selectedStudent.offerTitle || 'Offer')}</span>
              </div>
            </div>

            <div style={styles.divider} />

            <div className="animate-field" style={styles.inputGroup}>
              <label style={styles.label}>Bill Amount (PKR)</label>
              <div style={styles.billInputWrapper}>
                <span style={styles.currencySymbol}>₨</span>
                <input
                  type="number"
                  style={styles.billInput}
                  placeholder="Enter bill amount"
                  value={bill}
                  onChange={e => setBill(e.target.value)}
                />
              </div>
            </div>

            <button
              className="calc-btn"
              style={styles.calcBtn}
              onClick={calculatePayment}
            >
              <FaCalculator style={{ marginRight: '8px' }} />
              Calculate Discount
            </button>

            {paymentInfo && (
              <div className="animate-payment" style={styles.paymentSummary}>
                <div style={styles.summaryHeader}>
                  <span>Payment Summary</span>
                  {scannedStudent && (
                    <span style={styles.autoTag}>Auto-verified</span>
                  )}
                </div>
                <div style={styles.summaryRow}>
                  <span>Original Amount:</span>
                  <span>₨ {Number(bill).toLocaleString()}</span>
                </div>
                <div style={styles.summaryRowDiscount}>
                  <span>Student Discount ({String(selectedStudent.discountPercentage || 0)}%):</span>
                  <span style={{ color: '#10b981' }}>- ₨ {paymentInfo.saved.toLocaleString()}</span>
                </div>
                <div style={styles.summaryRowTotal}>
                  <span>Final Amount:</span>
                  <span style={styles.totalVal}>₨ {paymentInfo.total.toLocaleString()}</span>
                </div>

                {redemptionSuccess && (
                  <div style={styles.successBanner}>
                    <FaCheckCircle style={{ color: '#10b981', fontSize: '20px' }} />
                    <span>Payment processed successfully!</span>
                  </div>
                )}

                <button
                  className="pay-btn"
                  style={{ ...styles.payBtn, opacity: processingPayment ? 0.7 : 1 }}
                  onClick={handleProcessPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <FaSpinner style={{ animation: 'pulse 0.8s linear infinite', marginRight: '8px' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle style={{ marginRight: '8px' }} />
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

  const renderPaymentHistory = () => (
    <div style={styles.historyContainer}>
      <div style={styles.historyHeader}>
        <FaHistory style={{ color: '#ff961a' }} />
        <h4 style={styles.historyTitle}>Payment History</h4>
        <span style={styles.historyCount}>{paymentHistory.length} Redemption</span>
      </div>

      {paymentHistory.length === 0 ? (
        <div style={styles.noHistoryMessage}>
          <p>No payment history yet. Process payments to see them here.</p>
        </div>
      ) : (
        <div style={styles.historyList}>
          {paymentHistory.slice(0, 10).map((payment, index) => (
            <div key={index} style={styles.historyItem}>
              <div style={styles.historyItemLeft}>
                <div style={styles.historyItemIcon}>
                  <FaReceipt />
                </div>
                <div style={styles.historyItemInfo}>
                  <h6 style={styles.historyItemName}>{String(payment.name || 'Student')}</h6>
                  <p style={styles.historyItemDetails}>
                    {String(payment.brand || 'Brand')} • {String(payment.university || 'University')}
                  </p>
                  <p style={styles.historyItemDate}>
                    <FaClock size={10} /> {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div style={styles.historyItemRight}>
                <div style={styles.historyItemAmount}>
                  <span style={styles.historyItemOriginal}>₨ {Number(payment.bill || 0).toLocaleString()}</span>
                  <span style={styles.historyItemSaved}>-₨ {Number(payment.saved || 0).toLocaleString()}</span>
                  <span style={styles.historyItemTotal}>₨ {Number(payment.paid || 0).toLocaleString()}</span>
                </div>
                <span style={styles.historyItemStatus}>✅ Paid</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      {showStudentAlert && !isProcessingScan && !paymentInfo && (
        <div style={styles.studentAlert}>
          <div style={styles.studentAlertContent}>
            <div style={styles.studentAlertIcon}>
              {loading ? <FaSpinner style={styles.studentAlertSpinner} /> : <FaUserCheck />}
            </div>
            <div style={styles.studentAlertInfo}>
              <h4 style={styles.studentAlertTitle}>
                {loading ? 'Verifying...' : result && result !== "not_found" ? 'Verified!' : 'Student Scanned!'}
              </h4>
              <p style={styles.studentAlertText}>
                {scannedStudent && scannedStudent.name ? (
                  <>
                    <strong>{String(scannedStudent.name)}</strong> from {String(scannedStudent.universityName || 'University')}
                  </>
                ) : (
                  String(alertMessage || 'Processing scan...')
                )}
              </p>
              <p style={styles.studentAlertSubtext}>
                {loading ? 'Please wait while we verify...' : 
                 result && result !== "not_found" ? 'Enter bill amount and calculate discount' :
                 'Please try again'}
              </p>
            </div>
            {!loading && result && result !== "not_found" && (
              <div style={styles.studentAlertStatus}>
                <FaCheckCircle color="#10b981" />
                <span style={styles.studentAlertStatusText}>Verified</span>
              </div>
            )}
            {!loading && result === "not_found" && (
              <div style={{ ...styles.studentAlertStatus, color: '#dc2626' }}>
                <FaTimes color="#dc2626" />
                <span style={{ ...styles.studentAlertStatusText, color: '#dc2626' }}>Not Found</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.headerSection}>
        <div style={styles.headerBadge}>
          <FaShieldAlt />
          <span>Secure Verification</span>
        </div>
        <h2 style={styles.mainTitle}>
          Verification Desk
        </h2>
        <p style={styles.subTitle}>
          Verify student identity and process discounted transactions securely
        </p>
      </div>

      {isBrand && (
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'verify' ? styles.tabButtonActive : {})
            }}
            onClick={() => handleTabChange('verify')}
          >
            <FaUserGraduate />
            <span>Verify Student</span>
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'qr-generator' ? styles.tabButtonActive : {})
            }}
            onClick={() => handleTabChange('qr-generator')}
          >
            <FaQrcode />
            <span>QR Generator</span>
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'students' ? styles.tabButtonActive : {})
            }}
            onClick={() => handleTabChange('students')}
          >
            <FaUsers />
            <span>Scanned Students</span>
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'history' ? styles.tabButtonActive : {})
            }}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory />
            <span>History</span>
          </button>
        </div>
      )}

      {activeTab === 'qr-generator' && isBrand ? (
        <div style={styles.qrGeneratorContainer}>
          <div style={styles.qrHeader}>
            <FaQrcode style={{ fontSize: '24px', color: '#ff961a' }} />
            <h3 style={styles.qrTitle}>QR Code Generator</h3>
            <span style={styles.qrSubtitle}>Generate QR codes for student discounts</span>
          </div>

          {!brandOffers || brandOffers.length === 0 ? (
            <div style={styles.noOffersMessage}>
              <p>No offers found. Create an offer first to generate QR codes.</p>
            </div>
          ) : (
            <>
              <div style={styles.offerSelector}>
                <label style={styles.label}>Select Offer</label>
                <select
                  style={styles.offerSelect}
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
                <div style={styles.offerPreview}>
                  <div style={styles.offerPreviewContent}>
                    <span style={styles.offerPreviewLabel}>Selected Offer:</span>
                    <span style={styles.offerPreviewTitle}>{String(selectedOffer.title || 'Untitled')}</span>
                    <span style={styles.offerPreviewDiscount}>
                      {String(selectedOffer.discountPercentage || 0)}% OFF
                    </span>
                  </div>
                  <div style={styles.offerTypeBadge}>
                    {selectedOffer.isOnline && selectedOffer.isInStore ? (
                      <span style={{ ...styles.badge, backgroundColor: '#8b5cf6' }}>💻 Online & 🏪 In-Store</span>
                    ) : selectedOffer.isOnline ? (
                      <span style={{ ...styles.badge, backgroundColor: '#3b82f6' }}>💻 Online Only</span>
                    ) : selectedOffer.isInStore ? (
                      <span style={{ ...styles.badge, backgroundColor: '#10b981' }}>🏪 In-Store Only</span>
                    ) : null}
                  </div>
                </div>
              )}

              {isOnlineOnly && selectedOffer && (
                <div style={styles.promoCodeSection}>
                  <div style={styles.promoCodeHeader}>
                    <span style={styles.promoCodeLabel}>🔑 Promo Code</span>
                    <span style={styles.promoCodeHint}>Valid for online purchases</span>
                  </div>
                  <div style={styles.promoCodeDisplay}>
                    <span style={styles.promoCodeValue}>{String(promoCode)}</span>
                    <button
                      style={styles.copyButton}
                      onClick={copyPromoCode}
                      title="Copy promo code"
                    >
                      {copied ? <FaCheckCircle color="#10b981" /> : <FaCopy />}
                    </button>
                    <button
                      style={styles.refreshButton}
                      onClick={generatePromoCode}
                      title="Generate new promo code"
                    >
                      🔄
                    </button>
                  </div>
                  <p style={styles.promoCodeNote}>
                    This promo code will be embedded in the QR code for online verification
                  </p>
                </div>
              )}

              <button
                style={styles.generateQRBtn}
                onClick={generateQRCode}
              >
                <FaQrcode style={{ marginRight: '8px' }} />
                Generate QR Code
              </button>

              {qrImage && !showQrModal && (
                <div style={styles.qrPreviewSmall}>
                  <img src={qrImage} alt="QR Preview" style={styles.qrPreviewImage} />
                  <div style={styles.qrPreviewActions}>
                    <button onClick={() => setShowQrModal(true)} style={styles.viewQrBtn}>
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
      {activeTab === 'history' && isBrand && renderPaymentHistory()}

      {showQrModal && (
        <div style={styles.qrModalOverlay} onClick={() => setShowQrModal(false)}>
          <div style={styles.qrModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.qrModalHeader}>
              <h4 style={styles.qrModalTitle}>QR Code</h4>
              <button style={styles.qrModalClose} onClick={() => setShowQrModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div style={styles.qrModalBody}>
              <div style={styles.qrModalImageContainer}>
                {qrImage && (
                  <img src={qrImage} alt="QR Code" style={styles.qrModalImage} />
                )}
              </div>

              <div style={styles.qrModalInfo}>
                <p style={styles.qrModalBrand}>{String(user?.brandName || user?.name || 'Brand')}</p>
                <p style={styles.qrModalOffer}>{String(selectedOffer?.title || 'Offer')}</p>
                <p style={styles.qrModalDiscount}>{String(selectedOffer?.discountPercentage || 0)}% OFF</p>
                {isOnlineOnly && promoCode && (
                  <p style={styles.qrModalPromo}>Promo Code: <strong>{String(promoCode)}</strong></p>
                )}
                <p style={styles.qrModalType}>
                  {selectedOffer?.isOnline && selectedOffer?.isInStore ? 'Online & In-Store' :
                   selectedOffer?.isOnline ? 'Online Only' :
                   selectedOffer?.isInStore ? 'In-Store Only' : 'Standard'}
                </p>
              </div>

              <div style={styles.qrModalActions}>
                <button style={styles.qrActionBtn} onClick={downloadQR}>
                  <FaDownload /> Download
                </button>
                <button style={styles.qrActionBtn} onClick={shareQR}>
                  <FaShare /> Share
                </button>
                <button style={{ ...styles.qrActionBtn, backgroundColor: '#10b981' }} onClick={() => {
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
        <div style={styles.mainGrid}>
          <div className="animate-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <FaUserGraduate style={styles.cardHeaderIcon} />
              <h3 style={styles.cardTitle}>Student Details</h3>
            </div>

            <div className="animate-field" style={styles.inputGroup}>
              <label style={{ ...styles.label, color: focusedField === 'name' ? '#ff961a' : '#64748b' }}>
                Full Name
              </label>
              <div style={{ ...styles.inputWrapper, borderColor: focusedField === 'name' ? '#ff961a' : '#e2e8f0' }}>
                <FaSearch style={styles.inputIcon} />
                <input
                  style={styles.input}
                  placeholder="Enter student's full name"
                  value={inputs.name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setInputs({ ...inputs, name: e.target.value })}
                />
              </div>
            </div>

            <div className="animate-field" style={styles.inputGroup}>
              <label style={{ ...styles.label, color: focusedField === 'rollNo' ? '#ff961a' : '#64748b' }}>
                Roll Number / ID
              </label>
              <div style={{ ...styles.inputWrapper, borderColor: focusedField === 'rollNo' ? '#ff961a' : '#e2e8f0' }}>
                <FaIdCard style={styles.inputIcon} />
                <input
                  style={styles.input}
                  placeholder="Enter roll number"
                  value={inputs.rollNo}
                  onFocus={() => setFocusedField('rollNo')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => setInputs({ ...inputs, rollNo: e.target.value })}
                />
              </div>
            </div>

            <div className="animate-field" style={styles.inputGroup}>
              <label style={styles.label}>University</label>
              <div style={styles.customSelectWrapper} ref={dropdownRef}>
                <div
                  style={{
                    ...styles.inputWrapper,
                    ...styles.customSelectTrigger,
                    borderColor: isDropdownOpen ? '#ff961a' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={toggleDropdown}
                >
                  <FaUniversity style={styles.inputIcon} />
                  <input
                    style={styles.customSelectInput}
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
                      style={styles.clearButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearch();
                        setInputs({ ...inputs, university: "" });
                      }}
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                  <span style={styles.dropdownArrow}>
                    {isDropdownOpen ? '▲' : '▼'}
                  </span>
                </div>

                {isDropdownOpen && (
                  <div style={styles.dropdownMenu}>
                    {filteredUniversities.length > 0 ? (
                      <>
                        <div style={styles.resultsCount}>
                          {filteredUniversities.length} {filteredUniversities.length === 1 ? 'university' : 'universities'} found
                        </div>
                        {filteredUniversities.map((uni, index) => (
                          <div
                            key={index}
                            style={{
                              ...styles.dropdownItem,
                              backgroundColor: inputs.university === uni ? '#fff7ed' : 'transparent',
                              borderLeft: inputs.university === uni ? '3px solid #ff961a' : '3px solid transparent'
                            }}
                            onClick={() => handleUniversitySelect(uni)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                inputs.university === uni ? '#fff7ed' : 'transparent';
                            }}
                          >
                            <span style={styles.dropdownItemText}>{String(uni)}</span>
                            {inputs.university === uni && (
                              <FaCheckCircle style={{ color: '#ff961a', fontSize: '14px' }} />
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={styles.noResults}>
                        <div style={styles.noResultsIcon}>🔍</div>
                        <p style={styles.noResultsText}>No universities found</p>
                        <p style={styles.noResultsSubtext}>Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              className="verify-btn"
              style={{ ...styles.verifyBtn, opacity: loading ? 0.7 : 1 }}
              onClick={verify}
              disabled={loading || processingPayment || isProcessingScan}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Identity
                  <FaArrowRight style={{ marginLeft: '8px', fontSize: '12px' }} />
                </>
              )}
            </button>

            {result === "not_found" && (
              <div className="animate-error" style={styles.errorState}>
                <div style={styles.errorIcon}>!</div>
                <div>
                  <strong>No active claim found</strong>
                  <p style={{ margin: '5px 0 0', fontSize: '12px' }}>This student hasn't claimed any active offer.</p>
                </div>
              </div>
            )}
          </div>

          <div className="animate-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <FaCreditCard style={styles.cardHeaderIcon} />
              <h3 style={styles.cardTitle}>Process Payment</h3>
            </div>

            {(!result || result === "not_found") && !processingPayment && !isProcessingScan && (
              <div className="animate-empty" style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔍</div>
                <p style={styles.emptyText}>Verify a student first</p>
                <p style={styles.emptySubtext}>Enter student details and click verify to process payment</p>
                {scannedStudent && scannedStudent.name && !result && (
                  <p style={{ ...styles.emptySubtext, color: '#10b981', marginTop: '12px' }}>
                    <FaCheckCircle /> Student automatically verified from QR scan!
                  </p>
                )}
              </div>
            )}

            {processingPayment && (
              <div className="animate-empty" style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <FaSpinner style={{ animation: 'pulse 0.8s linear infinite' }} />
                </div>
                <p style={styles.emptyText}>Processing Payment...</p>
                <p style={styles.emptySubtext}>Please wait while we complete the transaction</p>
              </div>
            )}

            {isProcessingScan && (
              <div className="animate-empty" style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <FaSpinner style={{ animation: 'pulse 0.8s linear infinite' }} />
                </div>
                <p style={styles.emptyText}>Processing Scan...</p>
                <p style={styles.emptySubtext}>Please wait while we verify the student</p>
              </div>
            )}

            {result && result !== "not_found" && !processingPayment && (
              <div className="animate-result">
                <div style={styles.successBadge}>
                  <FaCheckCircle />
                  Verified Student
                  {scannedStudent && (
                    <span style={styles.scannedBadge}>
                      <FaQrcode /> Scanned
                    </span>
                  )}
                </div>

                <div style={styles.studentInfo}>
                  <h4 style={styles.studentName}>{String(result.name || 'Student')}</h4>
                  <p style={styles.studentRoll}>Roll No: {String(result.rollNo || 'N/A')}</p>
                  <p style={styles.studentUni}>{String(result.universityName || 'University')}</p>
                  {scannedStudent && scannedStudent.scannedAt && (
                    <p style={styles.scannedTime}>
                      <FaClock /> Verified from QR scan at {new Date(scannedStudent.scannedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div style={styles.offerBadge}>
                  <FaPercent style={{ fontSize: '14px' }} />
                  <span style={{ fontWeight: 'bold' }}>{String(result.discountPercentage || 0)}% OFF</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>on {String(result.offerTitle || 'Offer')}</span>
                </div>

                <div style={styles.divider} />

                <div className="animate-field" style={styles.inputGroup}>
                  <label style={styles.label}>Bill Amount (PKR)</label>
                  <div style={styles.billInputWrapper}>
                    <span style={styles.currencySymbol}>₨</span>
                    <input
                      type="number"
                      style={styles.billInput}
                      placeholder="Enter bill amount"
                      value={bill}
                      onChange={e => setBill(e.target.value)}
                    />
                  </div>
                </div>

                <button className="calc-btn" style={styles.calcBtn} onClick={calculatePayment}>
                  <FaCalculator style={{ marginRight: '8px' }} />
                  Calculate Discount
                </button>

                {paymentInfo && (
                  <div className="animate-payment" style={styles.paymentSummary}>
                    <div style={styles.summaryHeader}>
                      <span>Payment Summary</span>
                      {scannedStudent && (
                        <span style={styles.autoTag}>Auto-verified</span>
                      )}
                    </div>
                    <div style={styles.summaryRow}>
                      <span>Original Amount:</span>
                      <span>₨ {Number(bill).toLocaleString()}</span>
                    </div>
                    <div style={styles.summaryRowDiscount}>
                      <span>Student Discount ({String(result.discountPercentage || 0)}%):</span>
                      <span style={{ color: '#10b981' }}>- ₨ {paymentInfo.saved.toLocaleString()}</span>
                    </div>
                    <div style={styles.summaryRowTotal}>
                      <span>Final Amount:</span>
                      <span style={styles.totalVal}>₨ {paymentInfo.total.toLocaleString()}</span>
                    </div>

                    <button
                      className="pay-btn"
                      style={{ ...styles.payBtn, opacity: processingPayment ? 0.7 : 1 }}
                      onClick={handleProcessPayment}
                      disabled={processingPayment}
                    >
                      <FaCheckCircle style={{ marginRight: '8px' }} />
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
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
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
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-card {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }
        .animate-card:first-child { animation-delay: 0.1s; }
        .animate-card:last-child { animation-delay: 0.2s; }

        .animate-field {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .animate-field:nth-child(1) { animation-delay: 0.15s; }
        .animate-field:nth-child(2) { animation-delay: 0.25s; }
        .animate-field:nth-child(3) { animation-delay: 0.35s; }

        .animate-result {
          animation: fadeInScale 0.4s ease forwards;
        }

        .animate-payment {
          animation: slideInRight 0.4s ease forwards;
        }

        .animate-empty {
          animation: pulse 2s ease infinite;
        }

        .animate-error {
          animation: fadeInScale 0.3s ease forwards;
        }

        .verify-btn, .calc-btn, .pay-btn {
          transition: all 0.3s ease;
        }
        .verify-btn:hover, .calc-btn:hover, .pay-btn:hover {
          transform: translateY(-2px);
        }

        input:focus, select:focus {
          outline: none;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};


const styles = {
  wrapper: {
    padding: "30px 40px",
    minHeight: "85vh",
    position: "relative",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "32px",
    overflow: "hidden"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.08) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-60px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.05) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  studentAlert: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 1000,
    animation: "slideInLeft 0.5s ease forwards",
    maxWidth: "450px",
    width: "100%"
  },
  studentAlertContent: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 20px 60px -12px rgba(0,0,0,0.2)",
    border: "1px solid #d1fae5",
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  studentAlertIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#d1fae5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#065f46"
  },
  studentAlertSpinner: {
    fontSize: "24px",
    color: "#ff961a",
    animation: "pulse 0.8s linear infinite"
  },
  studentAlertInfo: {
    flex: 1
  },
  studentAlertTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0
  },
  studentAlertText: {
    fontSize: "13px",
    color: "#475569",
    margin: "4px 0 0 0"
  },
  studentAlertSubtext: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: "2px 0 0 0"
  },
  studentAlertStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  studentAlertStatusText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#10b981"
  },
  headerSection: {
    marginBottom: "32px",
    position: "relative",
    zIndex: 1
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff7ed",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "16px"
  },
  mainTitle: {
    fontSize: "28px",
    color: "#1e293b",
    margin: 0,
    fontWeight: "800",
    letterSpacing: "-0.5px"
  },
  subTitle: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "8px"
  },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    background: "#fff",
    padding: "4px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    position: "relative",
    zIndex: 1
  },
  tabButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  tabButtonActive: {
    background: "#1e293b",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(30,41,59,0.15)"
  },
  qrGeneratorContainer: {
    background: "#fff",
    padding: "28px",
    borderRadius: "28px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,150,26,0.1)",
    position: "relative",
    zIndex: 1
  },
  qrHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9"
  },
  qrTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  qrSubtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginLeft: "auto"
  },
  noOffersMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8"
  },
  offerSelector: {
    marginBottom: "20px"
  },
  offerSelect: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    background: "#f8fafc",
    cursor: "pointer",
    transition: "border-color 0.2s ease"
  },
  offerPreview: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px"
  },
  offerPreviewContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  offerPreviewLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  offerPreviewTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b"
  },
  offerPreviewDiscount: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ff961a",
    background: "#fff7ed",
    padding: "2px 10px",
    borderRadius: "20px"
  },
  offerTypeBadge: {
    display: "flex",
    gap: "6px"
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff"
  },
  promoCodeSection: {
    background: "#f0f9ff",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "1px solid #bae6fd"
  },
  promoCodeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  promoCodeLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0369a1"
  },
  promoCodeHint: {
    fontSize: "11px",
    color: "#64748b"
  },
  promoCodeDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #bae6fd"
  },
  promoCodeValue: {
    flex: 1,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0c4a6e",
    fontFamily: "monospace",
    letterSpacing: "2px"
  },
  copyButton: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "16px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  refreshButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "16px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  promoCodeNote: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "8px",
    fontStyle: "italic"
  },
  generateQRBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease"
  },
  qrPreviewSmall: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  },
  qrPreviewImage: {
    width: "120px",
    height: "120px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0"
  },
  qrPreviewActions: {
    display: "flex",
    gap: "8px"
  },
  viewQrBtn: {
    padding: "6px 16px",
    background: "#1e293b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  qrModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },
  qrModalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    animation: "qrModalIn 0.3s ease forwards",
    boxShadow: "0 40px 80px -20px rgba(0,0,0,0.3)"
  },
  qrModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0"
  },
  qrModalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0
  },
  qrModalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  },
  qrModalBody: {
    padding: "24px"
  },
  qrModalImageContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px"
  },
  qrModalImage: {
    width: "280px",
    height: "280px",
    borderRadius: "16px",
    border: "3px solid #e2e8f0"
  },
  qrModalInfo: {
    textAlign: "center",
    marginBottom: "20px"
  },
  qrModalBrand: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0"
  },
  qrModalOffer: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 4px 0"
  },
  qrModalDiscount: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#ff961a",
    margin: "4px 0"
  },
  qrModalPromo: {
    fontSize: "13px",
    color: "#0369a1",
    margin: "4px 0",
    background: "#f0f9ff",
    padding: "4px 12px",
    borderRadius: "20px",
    display: "inline-block"
  },
  qrModalType: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "4px 0"
  },
  qrModalActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  qrActionBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    color: "#1e293b",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "28px",
    position: "relative",
    zIndex: 1
  },
  card: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "28px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,150,26,0.1)",
    transition: "box-shadow 0.3s ease"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9"
  },
  cardHeaderIcon: {
    fontSize: "20px",
    color: "#ff961a"
  },
  cardTitle: {
    fontSize: "18px",
    color: "#1e293b",
    margin: 0,
    fontWeight: "600"
  },
  inputGroup: {
    marginBottom: "20px"
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    transition: "color 0.2s ease"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    transition: "all 0.2s ease"
  },
  inputIcon: {
    marginLeft: "16px",
    color: "#94a3b8",
    fontSize: "14px"
  },
  input: {
    border: "none",
    backgroundColor: "transparent",
    padding: "14px 16px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b"
  },
  customSelectWrapper: {
    position: "relative",
    width: "100%"
  },
  customSelectTrigger: {
    cursor: "pointer",
    position: "relative"
  },
  customSelectInput: {
    border: "none",
    backgroundColor: "transparent",
    padding: "14px 12px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    flex: 1
  },
  clearButton: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  dropdownArrow: {
    padding: "0 16px",
    color: "#94a3b8",
    fontSize: "12px"
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px -12px rgba(0,0,0,0.2)",
    border: "1px solid #e2e8f0",
    maxHeight: "280px",
    overflowY: "auto",
    zIndex: 1000,
    animation: "dropdownSlide 0.2s ease forwards"
  },
  resultsCount: {
    padding: "12px 16px 8px",
    fontSize: "12px",
    color: "#94a3b8",
    borderBottom: "1px solid #f1f5f9",
    fontWeight: "500"
  },
  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.15s ease",
    borderLeft: "3px solid transparent"
  },
  dropdownItemText: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "500"
  },
  noResults: {
    padding: "40px 20px",
    textAlign: "center"
  },
  noResultsIcon: {
    fontSize: "40px",
    marginBottom: "12px",
    opacity: 0.5
  },
  noResultsText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#64748b",
    margin: 0
  },
  noResultsSubtext: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "4px"
  },
  verifyBtn: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    border: "none",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    marginTop: "8px"
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "pulse 0.8s linear infinite",
    marginRight: "8px"
  },
  errorState: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "14px 16px",
    borderRadius: "16px",
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #fecaca"
  },
  errorIcon: {
    width: "24px",
    height: "24px",
    background: "#dc2626",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    opacity: 0.5
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#64748b",
    margin: 0
  },
  emptySubtext: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "8px"
  },
  successBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "8px 16px",
    borderRadius: "40px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "20px"
  },
  scannedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "8px"
  },
  scannedTime: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  scanBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "600",
    marginRight: "6px"
  },
  scannedTimeStamp: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    paddingTop: "6px",
    borderTop: "1px solid #e2e8f0"
  },
  paymentScannedTime: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  autoTag: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#10b981",
    background: "#d1fae5",
    padding: "2px 10px",
    borderRadius: "20px"
  },
  studentInfo: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "16px"
  },
  studentName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0"
  },
  studentRoll: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 2px 0"
  },
  studentUni: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0
  },
  offerBadge: {
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    marginBottom: "20px"
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, #e2e8f0 0%, #ff961a 50%, #e2e8f0 100%)",
    margin: "20px 0"
  },
  billInputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    overflow: "hidden"
  },
  currencySymbol: {
    padding: "14px 0 14px 16px",
    fontWeight: "600",
    color: "#ff961a",
    fontSize: "16px"
  },
  billInput: {
    border: "none",
    backgroundColor: "transparent",
    padding: "14px 16px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b"
  },
  calcBtn: {
    backgroundColor: "#334155",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "14px",
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "16px"
  },
  paymentSummary: {
    marginTop: "20px",
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0"
  },
  summaryHeader: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#475569"
  },
  summaryRowDiscount: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#10b981"
  },
  summaryRowTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px dashed #e2e8f0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b"
  },
  totalVal: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ff961a"
  },
  payBtn: {
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    padding: "14px 20px",
    borderRadius: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    transition: "all 0.3s ease"
  },
  studentsListContainer: {
    background: "#fff",
    padding: "28px",
    borderRadius: "28px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,150,26,0.1)",
    position: "relative",
    zIndex: 1
  },
  studentsListHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9"
  },
  studentsListTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  studentsCount: {
    marginLeft: "auto",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  noStudentsMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8"
  },
  studentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px"
  },
  studentCard: {
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    cursor: "pointer"
  },
  studentCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },
  studentAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px"
  },
  studentCardInfo: {
    flex: 1
  },
  studentCardName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  studentCardRoll: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0 0"
  },
  studentCardBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  discountBadge: {
    background: "#ff961a",
    color: "#fff",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  studentCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#64748b"
  },
  studentCardUniversity: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  studentCardOffer: {
    background: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#475569"
  },
  processPaymentBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "8px",
    background: "#1e293b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.3s ease"
  },
  paymentModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },
  paymentModalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    animation: "qrModalIn 0.3s ease forwards",
    boxShadow: "0 40px 80px -20px rgba(0,0,0,0.3)"
  },
  paymentModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0"
  },
  paymentModalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
    display: "flex",
    alignItems: "center"
  },
  paymentModalClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  },
  paymentModalBody: {
    padding: "24px"
  },
  paymentStudentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "16px"
  },
  paymentStudentAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "20px"
  },
  paymentStudentDetails: {
    flex: 1
  },
  paymentStudentName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  paymentStudentRoll: {
    fontSize: "13px",
    color: "#64748b",
    margin: "2px 0"
  },
  paymentStudentUni: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  paymentOfferDetails: {
    marginBottom: "16px"
  },
  paymentOfferBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff7ed",
    padding: "8px 14px",
    borderRadius: "12px",
    border: "1px solid #fed7aa"
  },
  paymentOfferDiscount: {
    fontWeight: "700",
    color: "#ff961a",
    fontSize: "14px"
  },
  paymentOfferTitle: {
    fontSize: "13px",
    color: "#64748b"
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#d1fae5",
    padding: "12px 16px",
    borderRadius: "12px",
    marginTop: "12px",
    color: "#065f46",
    fontSize: "14px",
    fontWeight: "500"
  },
  historyContainer: {
    background: "#fff",
    padding: "28px",
    borderRadius: "28px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,150,26,0.1)",
    position: "relative",
    zIndex: 1
  },
  historyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9"
  },
  historyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  historyCount: {
    marginLeft: "auto",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500"
  },
  noHistoryMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8"
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease"
  },
  historyItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1
  },
  historyItemIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b"
  },
  historyItemInfo: {
    flex: 1
  },
  historyItemName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  historyItemDetails: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0"
  },
  historyItemDate: {
    fontSize: "11px",
    color: "#cbd5e1",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  historyItemRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px"
  },
  historyItemAmount: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end"
  },
  historyItemOriginal: {
    fontSize: "11px",
    color: "#94a3b8",
    textDecoration: "line-through"
  },
  historyItemSaved: {
    fontSize: "12px",
    color: "#10b981"
  },
  historyItemTotal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b"
  },
  historyItemStatus: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#10b981",
    background: "#d1fae5",
    padding: "2px 10px",
    borderRadius: "20px"
  }
};

export default VerifyClaim;