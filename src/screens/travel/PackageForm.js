// New / edit package (design/portal/TrCreate). The full form, ready for partner packages.
// Not wired yet: partners cannot create packages today, so save draft and publish stay disabled unless
// an onSubmit handler is passed.
// Will need: POST /api/partner/travel/packages (multipart: name, category, price, discountPercent,
// location, description, inclusions[], requirements[], status draft|published, image) and
// PUT /api/partner/travel/packages/:id for edits.
import React, { useEffect, useRef, useState } from "react";
import Ico from "../../portal/Ico";
import { Modal, Button, IconButton, Field, Input, Textarea, Select } from "../../portal/kit";

export const DISCOUNTS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
// the same categories the admin package form uses (Traveling.js); one shared list once both use the same API
export const PACKAGE_CATEGORIES = [
  "Ziyarat", "International Tours", "Pakistan Tours",
  "Flights", "Hotels", "Visa Services", "Study Abroad", "Travel Insurance",
  "Transport Services", "Adventure Tourism", "Honeymoon Packages", "Family Tours",
  "Group Tours", "Corporate Travel", "Cruise Tours", "Events & Conferences",
  "Student Tours", "Luxury Travel",
];
const EMPTY = { name: "", category: "", price: "", discountPercent: 20, location: "", description: "", inclusions: [""], requirements: [""] };

// a list of short lines (what's included, what students need)
function LineList({ title, icon, tone, placeholder, items, onChange }) {
  const set = (i, v) => onChange(items.map((x, k) => (k === i ? v : x)));
  return (
    <div className="tr-lines">
      <div className="tr-lines-head">
        <span><Ico kind={icon} tone={tone} size={30} />{title}</span>
        <Button size="sm" variant="secondary" icon="plus" onClick={() => onChange([...items, ""])}>add</Button>
      </div>
      {items.map((v, i) => (
        <div className="tr-line" key={i}>
          <Input aria-label={`${title} ${i + 1}`} value={v} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
          {items.length > 1 && <IconButton icon="close" label="remove" size="sm" variant="ghost" onClick={() => onChange(items.filter((_, k) => k !== i))} />}
        </div>
      ))}
    </div>
  );
}

export default function PackageForm({ open, onClose, categories = PACKAGE_CATEGORIES, initial = null, onSubmit = null, submitting = false }) {
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const fileRef = useRef(null);
  const ready = typeof onSubmit === "function";

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...EMPTY, ...initial, inclusions: initial.inclusions?.length ? initial.inclusions : [""], requirements: initial.requirements?.length ? initial.requirements : [""] } : EMPTY);
    setImage(null);
    setPreview(initial?.image || "");
  }, [open, initial]);

  const set = (patch) => setForm({ ...form, ...patch });
  const pick = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };
  const submit = (status) => ready && onSubmit({ ...form, status, image });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon="plane"
      tone="sky"
      title={initial ? "edit package" : "new package"}
      sub="a trip students can book with their tdc discount."
      footer={<>
        {!ready && <span className="tr-soon"><Ico kind="clock" tone="plain" size={16} />publishing opens when partner packages go live.</span>}
        <Button variant="secondary" disabled={!ready || submitting} onClick={() => submit("draft")}>save draft</Button>
        <Button icon="send" disabled={!ready || submitting} loading={submitting} onClick={() => submit("published")}>publish package</Button>
      </>}
    >
      <div className="tr-form">
        <div className="tr-form-col">
          <Field label="package title" htmlFor="tp-name">
            <Input id="tp-name" value={form.name} placeholder="e.g. Hunza in 5 days" onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <div className="tr-form-three">
            <Field label="category" htmlFor="tp-cat">
              <Select id="tp-cat" value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="price (rs)" htmlFor="tp-price">
              <Input id="tp-price" type="number" min="0" inputMode="numeric" value={form.price} placeholder="0" onChange={(e) => set({ price: e.target.value })} />
            </Field>
            <Field label="tdc discount" htmlFor="tp-disc">
              <Select id="tp-disc" value={form.discountPercent} onChange={(e) => set({ discountPercent: Number(e.target.value) })}>
                {DISCOUNTS.map((d) => <option key={d} value={d}>{d}%</option>)}
              </Select>
            </Field>
          </div>
          <Field label="destination" htmlFor="tp-loc">
            <Input id="tp-loc" value={form.location} placeholder="e.g. Hunza, Gilgit-Baltistan" onChange={(e) => set({ location: e.target.value })} />
          </Field>
          <Field label="description" htmlFor="tp-desc">
            <Textarea id="tp-desc" rows={5} value={form.description} placeholder="what's the trip like? days, stays, travel…" onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
        <div className="tr-form-col">
          <label className="tr-cover">
            {preview ? <img src={preview} alt="cover preview" /> : <Ico kind="upload" tone="white" size={52} />}
            <b>{preview ? "change cover photo" : "upload cover photo"}</b>
            <span>PNG or JPG, up to 5MB</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={pick} />
          </label>
          <LineList title="what’s included" icon="check" tone="green" placeholder="e.g. hotel stay, breakfast, transport" items={form.inclusions} onChange={(v) => set({ inclusions: v })} />
          <LineList title="what students need" icon="file" tone="orange" placeholder="e.g. CNIC or student card" items={form.requirements} onChange={(v) => set({ requirements: v })} />
        </div>
      </div>
    </Modal>
  );
}
