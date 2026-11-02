// storeBadge.js: one wording for a brand's online store everywhere in the portal.
// store: { platform, status } from the server (onlineStore), or just a platform string.
// Returns { tone, label }: "WooCommerce", "Shopify", "WooCommerce · needs attention", "no online store"…
export function storeBadge(store) {
  const s = typeof store === "string" ? { platform: store, status: "connected" } : store || {};
  const name = s.platform === "woocommerce" ? "WooCommerce" : s.platform === "shopify" ? "Shopify" : "";
  if (!name) return { tone: "sand", label: "no online store" };
  if (s.status === "error") return { tone: "red", label: `${name} · needs attention` };
  if (s.status === "pending") return { tone: "yellow", label: `${name} · pending` };
  return { tone: s.platform === "shopify" ? "green" : "blue", label: name };
}

// where a single redemption happened (per promo code): store name, or checked by the brand
export function redemptionPlace(platform) {
  if (platform === "woocommerce") return { tone: "blue", label: "WooCommerce" };
  if (platform === "shopify") return { tone: "green", label: "Shopify" };
  if (platform === "in-store") return { tone: "sand", label: "In-store" };
  return { tone: "purple", label: "checked by brand" };
}
