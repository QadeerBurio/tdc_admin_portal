// src/screens/events/EventFormV2.js
// Create / edit form built from the server's category templates.
import React from "react";
import Ico from "../../portal/Ico";
import { Field, Input, Select, DateInput, Checkbox, Button, IconButton, Pill, Progress } from "../../portal/kit";
import FieldInput, { fieldLabel } from "./FieldInput";
import {
  findTemplate,
  commonFields,
  detailFields,
  usesTiers,
  needsAppUpdate,
  newTier,
  newAccount,
  makeKey,
  switchCategory,
  BASE_KEYS,
  MAX_ACCOUNTS,
  UPDATE_WARNING,
} from "./formLogic";

const METHOD_LABEL = { easypaisa: "Easypaisa", jazzcash: "JazzCash", bank: "Bank" };
const QUESTION_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Choice" },
];
const TYPE_LABEL = {
  text: "short text", textarea: "long text", number: "number", select: "choice", multiselect: "choices", date: "date",
  time: "time", url: "link", phone: "phone", email: "email", list: "list", file: "file",
};

const Section = ({ title, hint, children }) => (
  <div className="full-width ev2-section">
    <div className="ev2-section-title">{title}</div>
    {hint && <div className="ev2-section-hint">{hint}</div>}
    {children}
  </div>
);

// a small kit text field: label, input, error or hint
const Text = ({ label, error, hint, invalid, style, ...rest }) => (
  <Field label={label} error={error} hint={hint} style={style}>
    <Input invalid={invalid ?? !!error} {...rest} />
  </Field>
);

export default function EventFormV2({
  templates,
  form,
  setForm,
  errors,
  imagePreview,
  onPickImage,
  onRemoveImage,
  imageError,
  uploadProgress,
  fileInputRef,
}) {
  const tpl = form.legacy ? templates.generic : findTemplate(templates, form.type);
  const tiered = usesTiers(templates, form);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setValue = (key, v) => setForm((f) => ({ ...f, values: { ...f.values, [key]: v } }));
  const setDetail = (key, v) => setForm((f) => ({ ...f, details: { ...f.details, [key]: v } }));
  const setTier = (i, patch) => setForm((f) => ({ ...f, tiers: f.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  const setAccount = (i, patch) => setForm((f) => ({ ...f, accounts: f.accounts.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const setQuestion = (key, patch) => setForm((f) => ({ ...f, regForm: f.regForm.map((q) => (q.key === key ? { ...q, ...patch } : q)) }));

  const categoryNames = (templates.categories || []).map((c) => c.name);
  if (form.type && !categoryNames.some((n) => n.toLowerCase() === String(form.type).toLowerCase())) categoryNames.push(form.type);

  return (
    <div className="ev2-form">
      {needsAppUpdate(templates, form) && <div className="k-note warn ev2-banner">{UPDATE_WARNING}</div>}
      {errors._form && <div className="k-note bad ev2-banner">{errors._form}</div>}

      <div className="form-grid">
        {/* category */}
        <div className="full-width">
          <Field label="Category *" htmlFor="ev2-category" hint="Changing the category rebuilds the form; title, organizer, city, description and image stay.">
            <Select id="ev2-category" value={form.type} onChange={(e) => setForm((f) => switchCategory(templates, f, e.target.value))}>
              {!form.type && <option value="">choose…</option>}
              {categoryNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          {form.legacy && (
            <div className="k-note ev2-banner" style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 260px" }}>This event was created before category forms. It keeps today's fields and today's registration form, so every app version can still register.</span>
              {findTemplate(templates, form.type)?.generic ? null : (
                <Button size="sm" variant="secondary" onClick={() => setForm((f) => switchCategory(templates, f, f.type))}>
                  Use the {form.type} form
                </Button>
              )}
            </div>
          )}
        </div>

        {/* common fields */}
        {commonFields(tpl).map((f) => (
          <div key={f.key} className={f.type === "textarea" || f.key === "title" ? "full-width" : ""}>
            <FieldInput field={f} value={form.values[f.key]} onChange={(v) => setValue(f.key, v)} error={errors[f.key]} />
          </div>
        ))}

        {/* category details */}
        {!form.legacy && detailFields(tpl).length > 0 && (
          <Section title={`${tpl.name} details`}>
            <div className="form-grid">
              {detailFields(tpl).map((f) => (
                <div key={f.key} className={f.type === "textarea" || f.type === "list" ? "full-width" : ""}>
                  <FieldInput field={f} value={form.details[f.key]} onChange={(v) => setDetail(f.key, v)} error={errors[`details.${f.key}`]} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* image */}
        <div className="full-width upload-section">
          <span className="k-label">Event Image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={onPickImage}
          />
          {imagePreview ? (
            <div className="upload-preview">
              <img src={imagePreview} alt="Preview" />
              <IconButton
                icon="close"
                label="remove image"
                className="upload-preview-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage();
                }}
              />
            </div>
          ) : (
            <div
              className="k-drop"
              role="button"
              tabIndex={0}
              data-kit="upload"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
            >
              <Ico kind="image" tone="sand" size={40} />
              <span><b>Click to upload image</b></span>
              <span className="k-hint">JPG, PNG, WebP or GIF, up to 5 MB</span>
            </div>
          )}
          {imageError && <div className="k-note bad">{imageError}</div>}
          {uploadProgress > 0 && uploadProgress < 100 && <Progress value={uploadProgress} label={`Uploading... ${uploadProgress}%`} />}
        </div>

        {/* fee, tickets, seats */}
        <Section title="Fee, tickets and seats">
          <Checkbox
            checked={!!form.paid}
            onChange={(e) => set({ paid: e.target.checked, accounts: e.target.checked && !form.accounts.length ? [newAccount()] : form.accounts })}
            label={form.paid ? "Paid event" : "Free event"}
          />
          {errors.paid && <span className="k-error">{errors.paid}</span>}
          <div className="form-grid">
            {form.paid && !tiered && (
              <Text
                label="Fee (PKR) *"
                value={form.fee}
                onChange={(e) => set({ fee: e.target.value.replace(/[^\d]/g, "") })}
                error={errors.fee}
                hint="Whole rupees, no paisa"
                inputMode="numeric"
              />
            )}
            <Text
              label="Capacity"
              value={form.capacity}
              onChange={(e) => set({ capacity: e.target.value.replace(/[^\d]/g, "") })}
              error={errors.capacity}
              hint="Total seats. Empty = unlimited"
              inputMode="numeric"
            />
            <Field label="Registration closes" error={errors.registrationCloses} hint="Empty = open until the event is removed">
              <DateInput withTime value={form.registrationCloses} className={errors.registrationCloses ? "invalid" : undefined} onChange={(e) => set({ registrationCloses: e.target.value })} />
            </Field>
          </div>

          {tiered && (
            <div className="ev2-tiers">
              <div className="ev2-subtitle">Ticket tiers</div>
              {errors.tiers && <span className="k-error">{errors.tiers}</span>}
              {form.tiers.map((t, i) => (
                <div className="ev2-row" key={i}>
                  <Text label="Name *" value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} error={errors[`tiers.${i}.name`]} />
                  <Text
                    label={form.paid ? "Price (PKR) *" : "Price"}
                    value={form.paid ? t.price : "0"}
                    disabled={!form.paid}
                    onChange={(e) => setTier(i, { price: e.target.value.replace(/[^\d]/g, "") })}
                    error={errors[`tiers.${i}.price`]}
                    hint={form.paid ? undefined : "free event"}
                  />
                  <Text label="Quantity *" value={t.quantity} onChange={(e) => setTier(i, { quantity: e.target.value.replace(/[^\d]/g, "") })} error={errors[`tiers.${i}.quantity`]} hint={t.sold ? `${t.sold} taken` : undefined} />
                  <Text label="Max per student *" value={t.maxPerStudent} onChange={(e) => setTier(i, { maxPerStudent: e.target.value.replace(/[^\d]/g, "") })} error={errors[`tiers.${i}.maxPerStudent`]} />
                  <span className="ev2-row-btn" title={t.sold ? "This tier has registrations" : "Remove tier"}>
                    <IconButton icon="trash" label="remove tier" variant="danger" disabled={!!t.sold} onClick={() => set({ tiers: form.tiers.filter((_, j) => j !== i) })} />
                  </span>
                </div>
              ))}
              {form.tiers.length < 10 && (
                <Button size="sm" variant="ghost" icon="plus" onClick={() => set({ tiers: [...form.tiers, newTier()] })}>
                  Add tier
                </Button>
              )}
            </div>
          )}
        </Section>

        {/* payment accounts */}
        {form.paid && (
          <Section title="Payment accounts" hint="students see these when they register">
            {errors.accounts && <span className="k-error">{errors.accounts}</span>}
            {form.accounts.map((a, i) => {
              const p = `accounts.${i}`;
              return (
                <div className="ev2-account" key={i}>
                  <div className="ev2-row">
                    <Field label="Method *" error={errors[`${p}.method`]} style={{ flex: "0 1 170px" }}>
                      <Select value={a.method} invalid={!!errors[`${p}.method`]} onChange={(e) => setAccount(i, { method: e.target.value })}>
                        {!a.method && <option value="">choose…</option>}
                        {Object.entries(METHOD_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {a.method === "bank" && (
                      <Text label="Bank name *" value={a.bankName} onChange={(e) => setAccount(i, { bankName: e.target.value })} error={errors[`${p}.bankName`]} />
                    )}
                    <Text label={a.method === "bank" ? "Account title *" : "Account title"} value={a.accountTitle} onChange={(e) => setAccount(i, { accountTitle: e.target.value })} error={errors[`${p}.accountTitle`]} />
                    <Text
                      label={a.method === "bank" ? "Account number" : "Mobile number *"}
                      placeholder={a.method === "bank" ? "" : "03XXXXXXXXX"}
                      value={a.accountNumber}
                      onChange={(e) => setAccount(i, { accountNumber: e.target.value })}
                      error={errors[`${p}.accountNumber`]}
                    />
                    {a.method === "bank" && (
                      <Text label="IBAN" placeholder="PK36SCBL0000001123456702" value={a.iban} onChange={(e) => setAccount(i, { iban: e.target.value })} error={errors[`${p}.iban`]} hint="Account number or IBAN" />
                    )}
                    <span className="ev2-row-btn">
                      <IconButton icon="trash" label="remove account" variant="danger" onClick={() => set({ accounts: form.accounts.filter((_, j) => j !== i) })} />
                    </span>
                  </div>
                </div>
              );
            })}
            {form.accounts.length < MAX_ACCOUNTS && (
              <Button size="sm" variant="ghost" icon="plus" onClick={() => set({ accounts: [...form.accounts, newAccount()] })}>
                Add account
              </Button>
            )}
          </Section>
        )}

        {/* registration form */}
        <Section
          title="Registration form"
          hint={form.legacy ? "Today's form: name, email, WhatsApp and student ID." : "What students fill in when they register. Base fields can't be removed."}
        >
          <div className="ev2-questions">
            {form.regForm.map((q) => {
              const base = BASE_KEYS.includes(q.key);
              const ticket = q.store === "ticket";
              const locked = base || ticket || form.legacy;
              const p = `form.${q.key}`;
              return (
                <div className={`ev2-question ${q.custom ? "custom" : ""}`} key={q.key}>
                  {q.custom ? (
                    <div className="ev2-row">
                      <Text label="Question *" value={q.label} onChange={(e) => setQuestion(q.key, { label: e.target.value })} error={errors[`${p}.label`]} style={{ flex: "2 1 200px" }} />
                      <Field label="Answer type" style={{ flex: "0 1 160px" }}>
                        <Select value={q.type} onChange={(e) => setQuestion(q.key, { type: e.target.value })}>
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {q.type === "select" && (
                        <Text
                          label="Choices *"
                          placeholder="Yes, No"
                          value={(q.options || []).join(", ")}
                          onChange={(e) => setQuestion(q.key, { options: e.target.value.split(",").map((s) => s.trimStart()) })}
                          error={errors[`${p}.options`]}
                          hint="Separate with commas"
                          style={{ flex: "2 1 200px" }}
                        />
                      )}
                      <span className="ev2-row-btn">
                        <Checkbox checked={!!q.required} onChange={(e) => setQuestion(q.key, { required: e.target.checked })} label="Required" />
                      </span>
                      <span className="ev2-row-btn">
                        <IconButton icon="trash" label="remove question" variant="danger" onClick={() => set({ regForm: form.regForm.filter((x) => x.key !== q.key) })} />
                      </span>
                    </div>
                  ) : (
                    <div className="ev2-row ev2-question-fixed">
                      <span className="ev2-question-label">
                        {fieldLabel(q)}
                        {base && (
                          <span title="Base field: always on the form" style={{ marginLeft: 6, verticalAlign: "middle", color: "var(--muted)", display: "inline-flex" }}>
                            <Ico kind="lock" tone="plain" size={14} />
                          </span>
                        )}
                      </span>
                      <Pill tone="sand">{TYPE_LABEL[q.type] || q.type}</Pill>
                      {!locked && <Checkbox checked={!!q.required} onChange={(e) => setQuestion(q.key, { required: e.target.checked })} label="Required" />}
                      {ticket && !tiered && <span className="ev2-section-hint">used when the event has ticket tiers</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!form.legacy && form.regForm.length < 30 && (
            <Button
              size="sm"
              variant="ghost"
              icon="plus"
              onClick={() => set({ regForm: [...form.regForm, { key: makeKey(`question ${form.regForm.length + 1}`, form.regForm), label: "", type: "text", required: false, options: [], helpText: "", store: "answers", custom: true }] })}
            >
              Add question
            </Button>
          )}
        </Section>
      </div>
    </div>
  );
}
