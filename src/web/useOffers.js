// Live list of partner brands with an offer, from the same public endpoint the old site used.
import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://the-deft-crew-production.up.railway.app/api";

// Shown only if the live list can't be loaded.
export const FALLBACK_BRANDS = [
  ["Jenpharm", "health & beauty"], ["Dear Croissant", "food & drinks"], ["Socials by YS", "restaurant"],
  ["Spark Saloon", "salon"], ["Fropresso", "cafe & coffee"], ["House of Burger", "restaurant"],
  ["Krema Coffee & Gelato", "cafe & coffee"], ["The Padel Factory", "sports"], ["Playdium", "entertainment"],
  ["Three Coffee Roasters", "cafe & coffee"], ["Muscle Lab Gym", "gym & fitness"], ["Xiongmao Hotpot", "restaurant"],
].map(([name, category]) => ({ name, category, image: null }));

export function useOffers() {
  const [state, setState] = useState({ brands: [], loading: true, live: false });

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/offers/images/all`)
      .then((res) => {
        const seen = new Set();
        const list = (res.data?.offers || [])
          .filter((o) => o && o.brand && o.brand.approved !== false)
          .map((o) => ({
            name: (o.brand.brandName || o.brand.name || o.title || "").trim(),
            category: (o.category || "").toLowerCase(),
            image: o.image && !String(o.image).includes("placeholder") ? o.image : null,
          }))
          .filter((b) => {
            const k = b.name.toLowerCase();
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        if (alive) setState({ brands: list.length ? list : FALLBACK_BRANDS, loading: false, live: list.length > 0 });
      })
      .catch(() => alive && setState({ brands: FALLBACK_BRANDS, loading: false, live: false }));
    return () => { alive = false; };
  }, []);

  return state;
}
