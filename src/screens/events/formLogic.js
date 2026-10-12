// src/screens/events/formLogic.js
// Event form logic with no React: templates → form state, validation (same rules as the
// server, see server services/events/eventValidation.js), form state → request body.

export const MAX_PKR = 10000000;
export const MAX_ACCOUNTS = 3;
export const BASE_KEYS = ["studentName", "email", "whatsapp", "university", "studentId"];
export const UPDATE_WARNING = "students on older app versions must update tdc to register for this event";
const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
// money / timing fields have their own section; the image has its own uploader
const OWN_SECTION = ["fee", "capacity", "registrationCloses", "image"];

const str = (v) => (v == null ? "" : String(v)).trim();
const norm = (s) => str(s).toLowerCase().replace(/\s+/g, " ");
const wholeOrNull = (v) => {
  const s = str(v);
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
};

// ── formats (same as the server) ────────────────────────────────
export function normalizePkMobile(v) {
  let s = str(v).replace(/[\s-]/g, "");
  if (/^\+92/.test(s)) s = "0" + s.slice(3);
  else if (/^92\d{10}$/.test(s)) s = "0" + s.slice(2);
  return /^03\d{9}$/.test(s) ? s : null;
}
export function normalizePkIban(v) {
  const s = str(v).replace(/\s+/g, "").toUpperCase();
  if (!/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(s)) return null;
  const digits = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const d of digits) rem = (rem * 10 + Number(d)) % 97;
  return rem === 1 ? s : null;
}
const isEmail = (v) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(str(v));
const isHttpUrl = (v) => {
  const s = str(v);
  if (s.length > 500) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

// ── templates ───────────────────────────────────────────────────
// same matching as the server: case-insensitive, singular or plural, else generic
export function findTemplate(templates, type) {
  if (!templates) return null;
  const t = norm(type);
  const hit = (templates.categories || []).find(
    (c) => norm(c.name) === t || norm(c.name).replace(/s$/, "") === t.replace(/s$/, "")
  );
  return hit || templates.generic;
}
export const commonFields = (tpl) => (tpl?.createFields || []).filter((f) => f.store === "event" && !OWN_SECTION.includes(f.key));
export const detailFields = (tpl) => (tpl?.createFields || []).filter((f) => f.store === "details");

// an event saved before v2 (no category form, no details, no tickets, no fee):
// edit it with the generic form so saving keeps it exactly as it was
export const isLegacyEvent = (event) =>
  !!event &&
  !(event.registrationForm && event.registrationForm.length) &&
  !(event.details && Object.keys(event.details).length) &&
  !(event.ticketTiers && event.ticketTiers.length) &&
  !((event.fee?.amount || 0) > 0);

const copyFields = (fields) => (fields || []).map((f) => ({ ...f, options: [...(f.options || [])] }));

// ── form state ──────────────────────────────────────────────────
const blankAccount = (method = "easypaisa") => ({ method, accountTitle: "", accountNumber: "", bankName: "", iban: "", note: "" });
export const newAccount = blankAccount;
export const newTier = () => ({ name: "", price: "", quantity: "", maxPerStudent: "1", sold: 0 });

export function emptyForm(templates, type) {
  const firstType = type || templates?.categories?.[0]?.name || "Hackathons";
  const tpl = findTemplate(templates, firstType);
  return {
    _id: null,
    legacy: false,
    type: firstType,
    values: { title: "", organizer: "", city: "", description: "", date: "", location: "", contact: "", prize: "", deadline: "", teamSize: "" },
    image: "",
    details: {},
    paid: false,
    fee: "",
    tiers: tpl?.usesTicketTiers ? [newTier()] : [],
    capacity: "",
    registrationCloses: "",
    accounts: [],
    regForm: copyFields(tpl?.registrationFields),
  };
}

const toInputList = (v) => (Array.isArray(v) ? v.map(String) : v == null ? [] : String(v).split(/\r?\n/).filter(Boolean));

// local "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// event (+ payment-info for prices / accounts) → form
export function formFromEvent(templates, event, paymentInfo) {
  const legacy = isLegacyEvent(event);
  const tpl = legacy ? templates.generic : findTemplate(templates, event.type);
  const form = emptyForm(templates, event.type);
  form._id = event._id;
  form.legacy = legacy;
  form.type = event.type || form.type;
  for (const k of Object.keys(form.values)) form.values[k] = event[k] == null ? "" : String(event[k]);
  form.image = event.image || "";

  form.details = {};
  for (const f of detailFields(tpl)) {
    const v = event.details?.[f.key];
    if (v == null) continue;
    form.details[f.key] = f.type === "list" || f.type === "multiselect" ? toInputList(v) : String(v);
  }

  const prices = new Map((paymentInfo?.ticketTiers || []).map((t) => [norm(t.name), t.price]));
  form.tiers = (event.ticketTiers || []).map((t) => ({
    name: t.name || "",
    price: prices.has(norm(t.name)) ? String(prices.get(norm(t.name)) ?? 0) : "",
    quantity: t.quantity == null ? "" : String(t.quantity),
    maxPerStudent: String(t.maxPerStudent || 1),
    sold: Math.max(0, (t.quantity || 0) - (t.remaining ?? t.quantity ?? 0)),
  }));
  if (!form.tiers.length && tpl?.usesTicketTiers && !legacy) form.tiers = [newTier()];
  const feeAmount = paymentInfo?.fee?.amount ?? event.fee?.amount ?? 0;
  form.fee = feeAmount ? String(feeAmount) : "";
  form.accounts = (paymentInfo?.paymentAccounts || []).map((a) => ({ ...blankAccount(a.method), ...a }));
  form.paid = feeAmount > 0 || form.tiers.some((t) => Number(t.price) > 0) || form.accounts.length > 0;
  form.capacity = event.capacity == null ? "" : String(event.capacity);
  form.registrationCloses = toLocalInput(event.registrationCloses);
  // the form students fill: as saved, else the template's (generic for old events)
  const saved = event.registrationForm && event.registrationForm.length ? event.registrationForm : null;
  const tplKeys = new Set((tpl?.registrationFields || []).map((f) => f.key));
  form.regForm = copyFields(saved || tpl?.registrationFields).map((f) =>
    BASE_KEYS.includes(f.key) || tplKeys.has(f.key) || f.store === "ticket" ? f : { ...f, custom: true }
  );
  form.paymentInfoLoaded = !!paymentInfo;
  return form;
}

// category changed: common values stay, details / form rebuild, custom questions stay
export function switchCategory(templates, form, type) {
  const tpl = findTemplate(templates, type);
  const tplKeys = new Set((tpl?.registrationFields || []).map((f) => f.key));
  const oldTplKeys = new Set(BASE_KEYS);
  const custom = form.regForm.filter((f) => f.custom && !tplKeys.has(f.key) && !oldTplKeys.has(f.key));
  const keep = new Set(detailFields(tpl).map((f) => f.key));
  return {
    ...form,
    type,
    legacy: false,
    details: Object.fromEntries(Object.entries(form.details).filter(([k]) => keep.has(k))),
    tiers: tpl?.usesTicketTiers ? (form.tiers.length ? form.tiers : [newTier()]) : [],
    regForm: [...copyFields(tpl?.registrationFields), ...custom],
  };
}

// a short unique key for a custom question
export function makeKey(label, regForm) {
  const used = new Set(regForm.map((f) => f.key));
  const slug = str(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  let key = `q_${slug || "question"}`;
  let i = 2;
  while (used.has(key)) key = `q_${slug || "question"}_${i++}`;
  return key;
}

export const usesTiers = (templates, form) => !form.legacy && !!findTemplate(templates, form.type)?.usesTicketTiers;
export const isPaidForm = (templates, form) =>
  !!form.paid && (usesTiers(templates, form) ? form.tiers.some((t) => Number(t.price) > 0) : Number(form.fee) > 0);

// Same rule as the server (register route): old app builds must update only for a fee,
// any ticket tiers, or a required question beyond the base fields. Base fields (incl.
// university, whatever store an older saved form says) and the ticket choice / quantity
// fields never count as extra questions.
const isExtraQuestion = (f) => !!f.required && !BASE_KEYS.includes(f.key) && f.store !== "ticket";
export function needsAppUpdate(templates, form) {
  if (isPaidForm(templates, form)) return true;
  if (usesTiers(templates, form) && form.tiers.length) return true;
  if (form.legacy) return false;
  return form.regForm.some(isExtraQuestion);
}
export function eventNeedsAppUpdate(event) {
  if (!event) return false;
  if ((event.fee?.amount || 0) > 0) return true;
  if ((event.ticketTiers || []).length) return true;
  return (event.registrationForm || []).some(isExtraQuestion);
}

// ── one value (same rules as the server's checkField) ───────────
export function checkValue(field, raw) {
  const label = field.label || field.key;
  const isList = field.type === "list" || field.type === "multiselect";
  const empty = isList ? !(raw || []).some((x) => str(x)) : !str(raw);
  if (empty) return field.required ? `${label} is required` : null;
  switch (field.type) {
    case "text":
      return str(raw).length > 200 ? `${label} is too long (max 200 characters)` : null;
    case "textarea":
      return str(raw).length > 2000 ? `${label} is too long (max 2000 characters)` : null;
    case "number": {
      const n = wholeOrNull(raw);
      return n == null || n > MAX_PKR ? `${label} must be a whole number` : null;
    }
    case "select":
      return (field.options || []).includes(str(raw)) ? null : `Choose a ${label.toLowerCase()}`;
    case "multiselect":
      return raw.every((x) => (field.options || []).includes(x)) ? null : `${label} has an invalid choice`;
    case "list": {
      const items = raw.map(str).filter(Boolean);
      if (items.length > 30) return `${label}: max 30 items`;
      return items.some((x) => x.length > 200) ? `${label}: an item is too long (max 200 characters)` : null;
    }
    case "date":
      return Number.isNaN(new Date(raw).getTime()) ? `${label} must be a date` : null;
    case "time":
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(str(raw)) ? null : `${label} must be a time like 18:30`;
    case "url":
      return isHttpUrl(raw) ? null : `${label} must be a link starting with https://`;
    case "phone":
      return normalizePkMobile(raw) ? null : `${label} must be a Pakistani mobile number like 03XXXXXXXXX`;
    case "email":
      return isEmail(raw) ? null : `${label} must be an email address`;
    default:
      return null;
  }
}

// ── the whole form → { path: message } ──────────────────────────
export function validateForm(templates, form) {
  const errors = {};
  const tpl = form.legacy ? templates.generic : findTemplate(templates, form.type);
  if (!tpl) return { _form: "Category templates are not loaded" };

  for (const f of commonFields(tpl)) {
    const e = checkValue(f, form.values[f.key]);
    if (e) errors[f.key] = e;
  }
  if (!form.legacy) {
    for (const f of detailFields(tpl)) {
      const e = checkValue(f, form.details[f.key]);
      if (e) errors[`details.${f.key}`] = e;
    }
    const min = wholeOrNull(form.details.teamSizeMin);
    const max = wholeOrNull(form.details.teamSizeMax);
    if (min != null && max != null && min > max) errors["details.teamSizeMax"] = "Maximum team size can't be less than the minimum";
  }

  const tiered = usesTiers(templates, form);
  if (form.paid && !tiered) {
    const n = wholeOrNull(form.fee);
    if (n == null || n < 1 || n > MAX_PKR) errors.fee = "Enter the fee in whole rupees (1 or more)";
  }
  if (tiered) {
    if (!form.tiers.length && norm(form.type) === "concerts") errors.tiers = "Add at least one ticket tier";
    const names = new Set();
    form.tiers.forEach((t, i) => {
      const name = str(t.name);
      if (!name || name.length > 60) errors[`tiers.${i}.name`] = "Name is required (max 60 characters)";
      else if (names.has(name.toLowerCase())) errors[`tiers.${i}.name`] = "This name is used twice";
      names.add(name.toLowerCase());
      if (form.paid) {
        const p = wholeOrNull(t.price);
        if (p == null || p > MAX_PKR) errors[`tiers.${i}.price`] = "Whole rupees, 0 or more";
      }
      const q = wholeOrNull(t.quantity);
      if (q == null || q < 1 || q > 100000) errors[`tiers.${i}.quantity`] = "1 or more";
      else if (q < (t.sold || 0)) errors[`tiers.${i}.quantity`] = `${t.sold} already taken`;
      const m = wholeOrNull(t.maxPerStudent);
      if (m == null || m < 1 || m > 20) errors[`tiers.${i}.maxPerStudent`] = "1 to 20";
    });
  }
  if (form.paid && !isPaidForm(templates, form) && !errors.fee && !Object.keys(errors).some((k) => k.endsWith(".price"))) {
    errors.paid = tiered ? "A paid event needs at least one ticket price above 0" : "Enter the fee";
  }

  if (str(form.capacity)) {
    const c = wholeOrNull(form.capacity);
    if (c == null || c < 1 || c > 1000000) errors.capacity = "A whole number from 1, or empty for unlimited";
  }
  if (str(form.registrationCloses) && Number.isNaN(new Date(form.registrationCloses).getTime())) {
    errors.registrationCloses = "Pick a date and time";
  }

  if (isPaidForm(templates, form)) {
    if (!form.accounts.length) errors.accounts = "A paid event needs at least one payment account";
    form.accounts.forEach((a, i) => {
      const p = `accounts.${i}`;
      if (a.method === "easypaisa" || a.method === "jazzcash") {
        if (!normalizePkMobile(a.accountNumber)) errors[`${p}.accountNumber`] = "A Pakistani mobile number like 03XXXXXXXXX";
      } else if (a.method === "bank") {
        if (!str(a.bankName)) errors[`${p}.bankName`] = "Bank name is required";
        if (!str(a.accountTitle)) errors[`${p}.accountTitle`] = "Account title is required";
        if (str(a.iban) && !normalizePkIban(a.iban)) errors[`${p}.iban`] = "A Pakistani IBAN has 24 characters, e.g. PK36SCBL0000001123456702";
        if (!str(a.accountNumber) && !str(a.iban)) errors[`${p}.accountNumber`] = "Account number or IBAN is required";
      } else {
        errors[`${p}.method`] = "Choose Easypaisa, JazzCash or Bank";
      }
      if (str(a.accountTitle).length > 80) errors[`${p}.accountTitle`] = "Max 80 characters";
    });
  }

  if (!form.legacy) {
    form.regForm.forEach((f) => {
      if (!f.custom) return;
      const p = `form.${f.key}`;
      if (!str(f.label)) errors[`${p}.label`] = "Write the question";
      else if (str(f.label).length > 80) errors[`${p}.label`] = "Max 80 characters";
      if (f.type === "select") {
        const opts = (f.options || []).map(str).filter(Boolean);
        if (!opts.length) errors[`${p}.options`] = "Add at least one choice";
        else if (opts.length > 30 || opts.some((o) => o.length > 60)) errors[`${p}.options`] = "Max 30 choices, 60 characters each";
      }
      if (!KEY_RE.test(f.key)) errors[`${p}.label`] = "Invalid question";
    });
  }
  if (form.paid && form.legacy === false && form._id && form.paymentInfoLoaded === false) {
    errors._form = "Prices and payment accounts didn't load, so saving could overwrite them. Close and open the event again.";
  }
  return errors;
}

// ── form state → request body ───────────────────────────────────
export function buildPayload(templates, form, imageUrl, { isCreate }) {
  const v = form.values;
  const tpl = form.legacy ? templates.generic : findTemplate(templates, form.type);
  const tiered = usesTiers(templates, form);
  // today's fields, sent exactly as before so old app builds show the event
  const body = {
    title: str(v.title),
    organizer: str(v.organizer),
    city: str(v.city),
    type: form.type,
    description: str(v.description),
    location: str(v.location) || "Online/Venue TBD",
    contact: str(v.contact),
    date: str(v.date) || new Date().toLocaleDateString(),
    image: imageUrl,
    formVersion: 2,
  };
  if (form.legacy || tpl?.generic) {
    // generic form: the old text fields are on the form itself
    body.prize = str(v.prize) || "TBD";
    body.deadline = str(v.deadline) || "Limited spots";
    body.teamSize = str(v.teamSize) || "1-4 Members";
  }
  // category form: prize / teamSize / deadline are filled by the server from the details
  // (prizePool, team sizes, registration closes) when not sent

  if (!form.legacy) {
    const details = {};
    for (const f of detailFields(tpl)) {
      const raw = form.details[f.key];
      if (f.type === "list" || f.type === "multiselect") {
        const items = (raw || []).map(str).filter(Boolean);
        if (items.length) details[f.key] = items;
      } else if (str(raw)) {
        details[f.key] = f.type === "number" ? Number(str(raw)) : str(raw);
      }
    }
    body.details = details;
    body.registrationForm = form.regForm.map((f) => ({
      key: f.key,
      label: str(f.label),
      type: f.type,
      required: !!f.required,
      options: (f.options || []).map(str).filter(Boolean),
      helpText: str(f.helpText),
    }));
  }

  const paid = isPaidForm(templates, form);
  body.fee = !tiered && form.paid ? Number(str(form.fee) || 0) : 0;
  body.ticketTiers = tiered
    ? form.tiers.map((t) => ({
        name: str(t.name),
        price: form.paid ? Number(str(t.price) || 0) : 0,
        quantity: Number(str(t.quantity)),
        maxPerStudent: Number(str(t.maxPerStudent) || 1),
      }))
    : [];
  body.paymentAccounts = paid
    ? form.accounts.map((a) => {
        const out = { method: a.method, accountTitle: str(a.accountTitle), note: str(a.note) };
        if (a.method === "bank") {
          out.bankName = str(a.bankName);
          out.accountNumber = str(a.accountNumber);
          out.iban = str(a.iban) ? normalizePkIban(a.iban) : "";
        } else {
          out.accountNumber = normalizePkMobile(a.accountNumber);
        }
        return out;
      })
    : [];
  body.capacity = str(form.capacity) ? Number(str(form.capacity)) : null;
  body.registrationCloses = str(form.registrationCloses) ? new Date(form.registrationCloses).toISOString() : null;
  if (isCreate) delete body._id;
  return body;
}
