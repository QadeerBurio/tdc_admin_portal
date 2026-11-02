// DeleteAccountDialog.js: permanently delete a brand or student account (DELETE /api/admin/users/:id).
// Loads the server's preview (what goes, what stays without the name, the exact name to type), asks for
// that name in a TypeToConfirm, then tells the admin what was removed. onDeleted(result) after success.
import React, { useEffect, useState } from "react";
import { usersApi } from "../services/api";
import { TypeToConfirm, PageLoading, toast } from "./kit";

// preview keys -> words; "kept" ones stay (without the person) so totals don't change
const GOES = {
  offers: ["offer", "offers"], promoCodes: ["promo code", "promo codes"], branches: ["branch", "branches"], campaigns: ["campaign", "campaigns"],
  rewards: ["reward", "rewards"], activeRewardCodesRefunded: ["active reward code (points refunded)", "active reward codes (points refunded)"],
  shopifyStores: ["Shopify connection", "Shopify connections"], posts: ["post", "posts"], confessions: ["confession", "confessions"],
  stories: ["story", "stories"], conversations: ["chat (for both people)", "chats (for both people)"], listings: ["listing", "listings"],
  claims: ["claimed offer", "claimed offers"], resumes: ["resume", "resumes"], jobApplications: ["job application", "job applications"],
  eventRegistrations: ["event registration", "event registrations"], eventsCreated: ["event they created", "events they created"],
  notifications: ["notification", "notifications"],
};
const KEPT = {
  redemptionsKeptAnonymous: ["offer with their redemptions", "offers with their redemptions"],
  bookingsKeptAnonymous: ["travel booking", "travel bookings"],
};
const words = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;

// what the server reports as removed -> one line for the toast
function removedLine(result) {
  const c = result?.counts || {};
  const d = (coll) => c[coll]?.deleted || 0;
  const parts = [
    [d("offers"), ["offer", "offers"]], [d("promocodes"), ["promo code", "promo codes"]], [d("branches"), ["branch", "branches"]],
    [d("rewards"), ["reward", "rewards"]], [c.rewardredemptions?.cancelled || 0, ["reward code refunded", "reward codes refunded"]],
    [d("posts"), ["post", "posts"]], [d("confessions"), ["confession", "confessions"]], [d("stories"), ["story", "stories"]],
    [d("conversations"), ["chat", "chats"]], [d("listings"), ["listing", "listings"]], [d("resumes"), ["resume", "resumes"]],
    [d("jobapplications"), ["job application", "job applications"]], [result?.external?.media?.deleted || 0, ["image or file", "images and files"]],
  ].filter(([n]) => n > 0).map(([n, w]) => words(n, w));
  return parts.length ? parts.join(", ") : "nothing else was linked to it";
}

export default function DeleteAccountDialog({ userId, onClose, onDeleted }) {
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    usersApi.deletePreview(userId)
      .then((p) => { if (live) setPreview(p); })
      .catch((e) => { if (live) setLoadError(e?.response?.data?.message || "could not load this account"); });
    return () => { live = false; };
  }, [userId]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await usersApi.deleteAccount(userId, preview.name);
      toast(`deleted ${preview.name}: ${removedLine(result)}.`, "ok");
      onDeleted?.(result);
    } catch (e) {
      setError(e?.response?.data?.message || "could not delete the account");
      setBusy(false);
    }
  };

  const counts = preview?.counts || {};
  const goes = Object.keys(GOES).filter((k) => counts[k]).map((k) => words(counts[k], GOES[k]));
  const kept = Object.keys(KEPT).filter((k) => counts[k]).map((k) => words(counts[k], KEPT[k]));
  const disabledReason = loadError
    || (preview && !preview.supported ? "only brand and student accounts can be deleted for now." : "")
    || (preview && !preview.enabled ? "account deletion is switched off on the server (ADMIN_DELETE_ENABLED)." : "");

  return (
    <TypeToConfirm
      onClose={onClose}
      title={preview ? `delete ${preview.name}?` : "delete account?"}
      sub="this can't be undone. there are no backups."
      expected={preview?.name}
      confirmLabel={preview?.role === "brand" ? "delete brand" : preview?.role === "student" ? "delete student" : "delete"}
      loading={busy}
      error={error}
      disabledReason={preview || loadError ? disabledReason : "loading…"}
      onConfirm={confirm}
    >
      {!preview && !loadError && <PageLoading label="checking what's linked…" minHeight={80} />}
      {preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5, lineHeight: 1.5 }} data-screen="delete-account">
          <p style={{ margin: 0 }}>
            the {preview.role === "brand" ? "brand" : "student"} account{goes.length ? `, ${goes.join(", ")},` : ""} will be removed for good.
          </p>
          {preview.role === "brand" && <p style={{ margin: 0 }}>revenue figures and students' savings stay the same: past redemptions are kept without the brand.</p>}
          {kept.length > 0 && <p style={{ margin: 0 }}>{kept.join(" and ")} stay, without their name, so totals don't change.</p>}
        </div>
      )}
    </TypeToConfirm>
  );
}
