// Ambassador.js — public campus ambassador application (/ambassador).
// There is no public backend endpoint for applications yet, so submitting opens a
// pre-filled email to hr@gettdc.pk. Swap `submitApplication` for an API call once one exists.
import React, { useEffect, useState } from "react";
import { WebNav, WebFooter, LINKS, pageTitle, IconTile, ICONS } from "../web/site";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Other"];
const LEVELS = ["university", "college", "O/A levels"];

const PERKS = [
  { icon: ICONS.bulb, title: "founder mentorship", body: "work directly with the founders on how tdc grows on your campus." },
  { icon: ICONS.chat, title: "1-on-1 career counselling", body: "real sessions on your CV, internships and next steps." },
  { icon: ICONS.mail, title: "a referral letter", body: "for ambassadors who show up and get it done." },
  { icon: ICONS.star, title: "a shot at founder circle", body: "the top tier of the crew. 50 seats, hand-picked." },
];

const EMPTY = { name: "", email: "", phone: "", institute: "", level: "university", city: "Karachi", program: "", instagram: "", why: "" };

function submitApplication(form) {
  const body = [
    "campus ambassador application",
    "",
    `name: ${form.name}`,
    `email: ${form.email}`,
    `phone: ${form.phone}`,
    `institute: ${form.institute} (${form.level})`,
    `city: ${form.city}`,
    `program / year: ${form.program || "-"}`,
    `instagram: ${form.instagram || "-"}`,
    "",
    "why me:",
    form.why,
  ].join("\n");
  const subject = `ambassador application: ${form.name}, ${form.institute}`;
  window.location.href = `mailto:${LINKS.hr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Ambassador() {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = pageTitle("campus ambassadors");
    window.scrollTo(0, 0);
  }, []);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const touch = (f) => setTouched((t) => ({ ...t, [f]: true }));

  const valid = {
    name: form.name.trim().length > 1,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    phone: /^0\d{10}$/.test(form.phone),
    institute: form.institute.trim().length > 1,
    why: form.why.trim().length >= 20,
  };
  const errors = {
    name: "your full name, please",
    email: "enter a valid email",
    phone: "11 digits, starting with 0",
    institute: "which university, college or school?",
    why: "a few lines, at least 20 characters",
  };
  const bad = (f) => touched[f] && !valid[f];
  const err = (f) => (bad(f) ? <span className="field-error">{errors[f]}</span> : null);

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, institute: true, why: true });
    if (Object.values(valid).some((v) => !v)) return;
    submitApplication(form);
    setSent(true);
  };

  return (
    <div className="tdcw">
      <WebNav />
      <main className="wrap" style={{ paddingTop: 64 }}>
        <div className="grid-2" style={{ gap: 56, alignItems: "start" }}>
          <div>
            <span className="chip"><span className="chip-dot" />now recruiting, 5 per campus</span>
            <h1 className="h-lg" style={{ marginTop: 20 }}>run tdc on your campus<span className="dot" aria-hidden="true">.</span></h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: 480 }}>be the person your campus asks about tdc. bring the crew, run events with your societies, and grow with the founders.</p>
            <div className="grid" style={{ marginTop: 32, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
              {PERKS.map((p) => (
                <div className="card" key={p.title} style={{ padding: 20 }}>
                  <IconTile d={p.icon} />
                  <h2 className="card-h" style={{ fontSize: 18 }}>{p.title}</h2>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>questions? <a href={`mailto:${LINKS.hr}`}>{LINKS.hr}</a></p>
          </div>

          {sent ? (
            <div className="card" style={{ padding: 32, borderRadius: 28 }}>
              <h2 className="h-md">almost sorted<span className="dot" aria-hidden="true">.</span></h2>
              <p style={{ fontSize: 16 }}>your email app should have opened with your application filled in. hit send and we'll get back to you.</p>
              <p style={{ fontSize: 15 }}>nothing opened? email your details to <a href={`mailto:${LINKS.hr}`} style={{ fontWeight: 700 }}>{LINKS.hr}</a>.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                <button type="button" className="btn btn-primary" onClick={() => submitApplication(form)}>open the email again</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setForm(EMPTY); setTouched({}); setSent(false); }}>start over</button>
              </div>
            </div>
          ) : (
            <form className="card" onSubmit={onSubmit} noValidate style={{ padding: 32, borderRadius: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontWeight: 800, fontSize: 26, letterSpacing: -0.6 }}>apply now<span className="dot" aria-hidden="true">.</span></h2>

              <div className="field">
                <label htmlFor="a-name">full name</label>
                <input id="a-name" name="name" className={`input ${bad("name") ? "invalid" : ""}`} value={form.name} onChange={set} onBlur={() => touch("name")} autoComplete="name" />
                {err("name")}
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                <div className="field">
                  <label htmlFor="a-email">email</label>
                  <input id="a-email" name="email" type="email" className={`input ${bad("email") ? "invalid" : ""}`} value={form.email} onChange={set} onBlur={() => touch("email")} autoComplete="email" />
                  {err("email")}
                </div>
                <div className="field">
                  <label htmlFor="a-phone">phone</label>
                  <input id="a-phone" name="phone" type="tel" inputMode="numeric" maxLength={11} placeholder="03XXXXXXXXX" className={`input ${bad("phone") ? "invalid" : ""}`} value={form.phone} onChange={set} onBlur={() => touch("phone")} autoComplete="tel" />
                  {err("phone")}
                </div>
              </div>
              <div className="field">
                <label htmlFor="a-inst">university, college or school</label>
                <input id="a-inst" name="institute" className={`input ${bad("institute") ? "invalid" : ""}`} value={form.institute} onChange={set} onBlur={() => touch("institute")} placeholder="e.g. IoBM" />
                {err("institute")}
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                <div className="field">
                  <label htmlFor="a-level">studying at</label>
                  <select id="a-level" name="level" className="input" value={form.level} onChange={set}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="a-city">city</label>
                  <select id="a-city" name="city" className="input" value={form.city} onChange={set}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                <div className="field">
                  <label htmlFor="a-prog">program and year (optional)</label>
                  <input id="a-prog" name="program" className="input" value={form.program} onChange={set} placeholder="e.g. BBA, 2nd year" />
                </div>
                <div className="field">
                  <label htmlFor="a-ig">instagram (optional)</label>
                  <input id="a-ig" name="instagram" className="input" value={form.instagram} onChange={set} placeholder="@yourhandle" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="a-why">why you? (societies, events, anything you've run)</label>
                <textarea id="a-why" name="why" className={`input ${bad("why") ? "invalid" : ""}`} value={form.why} onChange={set} onBlur={() => touch("why")} />
                {err("why")}
              </div>
              <button type="submit" className="btn btn-primary btn-block">send application</button>
              <p className="muted" style={{ fontSize: 13 }}>this opens your email app with everything filled in, addressed to {LINKS.hr}.</p>
            </form>
          )}
        </div>
      </main>
      <WebFooter />
    </div>
  );
}
