// Ico.js: the tdc icon tile from the portal design (design/portal/Ico): a rounded tile with a 24px stroke icon.
import React from "react";

const P = {
  home: "M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4M8 14h2M14 14h2M8 17h2",
  chart: "M4 20V11M10 20V5M16 20v-6M2 20h20",
  tag: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01",
  store: "M3 9l1.5-5h15L21 9M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8M10 21v-4h4v4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  gift: "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C10 4 7 4 7 6s3 2 5 2zM12 8c2-4 5-4 5-2s-3 2-5 2z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  megaphone: "M3 10v4h3l7 4V6L6 10zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11",
  grad: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6",
  plane: "M2 13l20-8-6 16-4-6zM12 15l4-4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  plus: "M12 5v14M5 12h14",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  check: "M20 6L9 17l-5-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 16V8h3.5a2.5 2.5 0 0 1 0 5H9M12 13l3 3",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  hat: "M2 18h20M4 18v-3a8 8 0 0 1 16 0v3M10 7v5M14 7v5",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  flame: "M12 21c-4 0-7-3-7-7 0-4 4-6 4-10 3 2 4 4 4 6 1-1 2-2 2-4 2 2 4 5 4 8 0 4-3 7-7 7z",
  heart: "M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14l-1.5 8 5-3 5 3-1.5-8",
  wallet: "M3 7h16v12H3zM3 7l12-4v4M16 13h2",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  back: "M15 18l-6-6 6-6",
};

export const TONES = {
  red: ["#FDE3E1", "#D9443F"], sky: ["#DDF0F8", "#1F86C4"], green: ["#E2F3E4", "#2E8B3E"], purple: ["#F1E6F5", "#8E44AD"],
  orange: ["#FFF0DC", "#C77700"], coral: ["#FDE6E2", "#D1383D"], blue: ["#E1F1FA", "#2B7FC0"], pink: ["#FCE4EC", "#C2185B"],
  yellow: ["#F9C349", "#111111"], ink: ["#111111", "#F9C349"], sand: ["#F5F2EA", "#111111"], white: ["#FFFFFF", "#111111"], plain: ["transparent", "currentColor"],
};

export default function Ico({ kind = "home", tone = "orange", size = 44 }) {
  const [bg, fg] = TONES[tone] || TONES.orange;
  const ip = Math.round(size * (tone === "plain" ? 0.9 : 0.46));
  return (
    <span aria-hidden="true" style={{ flex: "0 0 auto", width: size, height: size, borderRadius: Math.round(size * 0.32), background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", color: fg }}>
      <svg width={ip} height={ip} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={P[kind] || P.home} />
      </svg>
    </span>
  );
}
