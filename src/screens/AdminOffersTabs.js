// AdminOffersTabs.js: "offers" in the admin menu: one page with two tabs, all offers (the list: edit, delete, QR) and
// new offer (the create form). Both are the pages from before ("manage offers", "create offer"), unchanged.
import React from "react";
import { Tabs } from "../portal/kit";
import AdminOffers from "./AdminOffers";
import CreateOfferAdmin from "./CreateOfferAdmin";

export default function AdminOffersTabs({ tab = "all", onTab }) {
  return (
    <div data-screen="admin-offers-tabs">
      <Tabs label="offers" value={tab} onChange={onTab} tabs={[{ id: "all", label: "all offers", icon: "tag" }, { id: "new", label: "new offer", icon: "plus" }]} />
      {tab === "new" ? <CreateOfferAdmin /> : <AdminOffers />}
    </div>
  );
}
