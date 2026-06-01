import React, { useState, useContext } from "react";
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
  FaUserGraduate
} from "react-icons/fa";

const VerifyClaim = () => {
  const { token } = useContext(AuthContext);

  const universities = [
  "Aga Khan University",
  "Baqai Medical University",
  "Bahria University Karachi",
  "NED University of Engineering & Technology",
  "University of Karachi",
  "Institute of Business Administration (IBA Karachi)",
  "Institute of Business Management (IoBM)",
  "SZABIST",
  "FAST-NUCES Karachi",
  "Sir Syed University of Engineering & Technology",
  "Dawood University of Engineering & Technology",
  "Hamdard University",
  "Iqra University",
  "Jinnah Sindh Medical University",
  "Dow University of Health Sciences",
  "Indus University",
  "Benazir Bhutto Shaheed University Lyari",
  "Federal Urdu University",
  "Karachi Institute of Economics & Technology (KIET)",
  "Muhammad Ali Jinnah University",
  "Habib University",
  "Shaheed Zulfikar Ali Bhutto Institute of Science & Technology",
  "Preston University Karachi",
  "Mohi-ud-Din Islamic University Karachi",
  "Greenwich University",
  "Newports Institute of Communications & Economics",
  "Textile Institute of Pakistan",
  "Sindh Madressatul Islam University",
  "DHA Suffa University",
  "Usman Institute of Technology",
  "Jinnah University for Women",
  "Ziauddin University",
  "Al-Hamd Islamic University Karachi Campus",
  "Virtual University of Pakistan Karachi Campus",
  "Allama Iqbal Open University Karachi Campus",
  "Iqra National University Karachi Campus",
  "Dadabhoy Institute of Higher Education",
  "KASBIT",
  "CAMS Institute of Business & Technology",
  "Pakistan Institute of Engineering & Applied Sciences Karachi Campus",
  "APWA Government College for Women",
  "Government College University Hyderabad Karachi Campus",
  "Royal Institute of Science & Technology",
  "Metropolitan University Karachi",
  "Ilma University",
  "The Millennium Universal College (TMUC) Karachi",
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

  const verify = async () => {
    if (!inputs.name || !inputs.rollNo || !inputs.university) {
      return alert("Please fill in all student details");
    }

    setLoading(true);
    setResult(null);
    setPaymentInfo(null);

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
      }, 500);

    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const calculatePayment = () => {
    if (!result || !bill || bill <= 0)
      return alert("Please enter a valid bill amount");

    const billAmount = Number(bill);
    const discount = (billAmount * result.discountPercentage) / 100;

    setPaymentInfo({
      total: billAmount - discount,
      saved: discount
    });
  };

  const handleProcessPayment = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/offers/redeem-payment",
        {
          offerId: result.offerId,
          userId: result._id,
          billAmount: Number(bill),
          savedAmount: Number(paymentInfo.saved)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Success! Transaction has been recorded.");

      setResult(null);
      setBill("");
      setPaymentInfo(null);
      setInputs({ name: "", rollNo: "", university: "" });

    } catch (err) {
      alert(err.response?.data?.message || "Payment processing failed");
    }
  };

  // const resetForm = () => {
  //   setResult(null);
  //   setBill("");
  //   setPaymentInfo(null);
  //   setInputs({ name: "", rollNo: "", university: "" });
  // };

  return (
    <div style={styles.wrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

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

      <div style={styles.mainGrid}>
        {/* LEFT SIDE - Student Details */}
        <div className="animate-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <FaUserGraduate style={styles.cardHeaderIcon} />
            <h3 style={styles.cardTitle}>Student Details</h3>
          </div>

          <div className="animate-field" style={styles.inputGroup}>
            <label style={{...styles.label, color: focusedField === 'name' ? '#ff961a' : '#64748b'}}>
              Full Name
            </label>
            <div style={{...styles.inputWrapper, borderColor: focusedField === 'name' ? '#ff961a' : '#e2e8f0'}}>
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
            <label style={{...styles.label, color: focusedField === 'rollNo' ? '#ff961a' : '#64748b'}}>
              Roll Number / ID
            </label>
            <div style={{...styles.inputWrapper, borderColor: focusedField === 'rollNo' ? '#ff961a' : '#e2e8f0'}}>
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
            <div style={styles.inputWrapper}>
              <FaUniversity style={styles.inputIcon} />
              <select
                style={styles.select}
                value={inputs.university}
                onChange={e => setInputs({ ...inputs, university: e.target.value })}
              >
                <option value="">Select University</option>
                {universities.map((uni, index) => (
                  <option key={index} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="verify-btn"
            style={{...styles.verifyBtn, opacity: loading ? 0.7 : 1}}
            onClick={verify}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={styles.spinner}></div>
                Verifying...
              </>
            ) : (
              <>
                Verify Identity
                <FaArrowRight style={{marginLeft: '8px', fontSize: '12px'}} />
              </>
            )}
          </button>

          {result === "not_found" && (
            <div className="animate-error" style={styles.errorState}>
              <div style={styles.errorIcon}>!</div>
              <div>
                <strong>No active claim found</strong>
                <p style={{margin: '5px 0 0', fontSize: '12px'}}>This student hasn't claimed any active offer.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Payment Processing */}
        <div className="animate-card" style={styles.card}>
          <div style={styles.cardHeader}>
            <FaCreditCard style={styles.cardHeaderIcon} />
            <h3 style={styles.cardTitle}>Process Payment</h3>
          </div>

          {!result && (
            <div className="animate-empty" style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <p style={styles.emptyText}>Verify a student first</p>
              <p style={styles.emptySubtext}>Enter student details and click verify to process payment</p>
            </div>
          )}

          {result && result !== "not_found" && (
            <div className="animate-result">
              <div style={styles.successBadge}>
                <FaCheckCircle />
                Verified Student
              </div>

              <div style={styles.studentInfo}>
                <h4 style={styles.studentName}>{result.name}</h4>
                <p style={styles.studentRoll}>Roll No: {result.rollNo}</p>
                <p style={styles.studentUni}>{result.universityName}</p>
              </div>

              <div style={styles.offerBadge}>
                <FaPercent style={{fontSize: '14px'}} />
                <span style={{fontWeight: 'bold'}}>{result.discountPercentage}% OFF</span>
                <span style={{fontSize: '12px', opacity: 0.9}}>on {result.offerTitle}</span>
              </div>

              <div style={styles.divider} />

              <div className="animate-field" style={styles.inputGroup}>
                <label style={styles.label}>Bill Amount (PKR)</label>
                <div style={styles.billInputWrapper}>
                  <span style={styles.currencySymbol}>₨</span>
                  <input
                    type="number"
                    style={styles.billInput}
                    placeholder="0.00"
                    value={bill}
                    onChange={e => setBill(e.target.value)}
                  />
                </div>
              </div>

              <button className="calc-btn" style={styles.calcBtn} onClick={calculatePayment}>
                <FaCalculator style={{marginRight: '8px'}} />
                Calculate Discount
              </button>

              {paymentInfo && (
                <div className="animate-payment" style={styles.paymentSummary}>
                  <div style={styles.summaryHeader}>
                    <span>Payment Summary</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Original Amount:</span>
                    <span>₨ {Number(bill).toLocaleString()}</span>
                  </div>
                  <div style={styles.summaryRowDiscount}>
                    <span>Student Discount ({result.discountPercentage}%):</span>
                    <span style={{color: '#10b981'}}>- ₨ {paymentInfo.saved.toLocaleString()}</span>
                  </div>
                  <div style={styles.summaryRowTotal}>
                    <span>Final Amount:</span>
                    <span style={styles.totalVal}>₨ {paymentInfo.total.toLocaleString()}</span>
                  </div>

                  <button
                    className="pay-btn"
                    style={styles.payBtn}
                    onClick={handleProcessPayment}
                  >
                    <FaCheckCircle style={{marginRight: '8px'}} />
                    Complete Transaction
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
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
  select: { 
    border: "none", 
    backgroundColor: "transparent", 
    padding: "14px 16px", 
    width: "100%", 
    outline: "none", 
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "500",
    cursor: "pointer"
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
    borderBottom: "1px solid #e2e8f0"
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
    fontSize: "14px"
  }
};

export default VerifyClaim;