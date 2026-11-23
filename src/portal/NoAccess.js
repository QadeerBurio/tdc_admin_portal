// src/portal/NoAccess.js
// Phase A (A-7): a page this admin can't open (an old link, a bookmark), or paused admin access.
import React from "react";
import { EmptyState } from "./kit";

export default function NoAccess({ paused = false }) {
  return paused
    ? <EmptyState icon="shield" tone="red" title="your admin access is paused" text="ask a super admin to restore it." />
    : <EmptyState icon="shield" tone="sand" title="you don't have access to this" text="ask a super admin." />;
}
