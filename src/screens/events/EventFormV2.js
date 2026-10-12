// src/screens/events/EventFormV2.js
// Create / edit form built from the server's category templates.
import React from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
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
    <div style={{ marginTop: 8 }}>
      {needsAppUpdate(templates, form) && (
        <Alert severity="warning" className="ev2-banner">
          {UPDATE_WARNING}
        </Alert>
      )}
      {errors._form && (
        <Alert severity="error" className="ev2-banner">
          {errors._form}
        </Alert>
      )}

      <div className="form-grid">
        {/* category */}
        <div className="full-width">
          <FormControl fullWidth size="small" className="form-field">
            <InputLabel id="ev2-category">Category *</InputLabel>
            <Select
              labelId="ev2-category"
              value={form.type}
              label="Category *"
              onChange={(e) => setForm((f) => switchCategory(templates, f, e.target.value))}
            >
              {categoryNames.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Changing the category rebuilds the form; title, organizer, city, description and image stay.</FormHelperText>
          </FormControl>
          {form.legacy && (
            <Alert severity="info" className="ev2-banner" action={
              findTemplate(templates, form.type)?.generic ? null : (
                <Button color="inherit" size="small" onClick={() => setForm((f) => switchCategory(templates, f, f.type))}>
                  Use the {form.type} form
                </Button>
              )
            }>
              This event was created before category forms. It keeps today's fields and today's registration form, so every app version can still register.
            </Alert>
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
          <label className="upload-label">Event Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={onPickImage}
          />
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <div className="upload-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="upload-preview-remove"
                  aria-label="remove image"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage();
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <CloudUploadIcon />
                <div className="upload-placeholder-text">Click to upload image</div>
                <div className="upload-placeholder-sub">JPG, PNG, WebP or GIF, up to 5 MB</div>
              </div>
            )}
          </div>
          {imageError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {imageError}
            </Alert>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div className="upload-progress-bar">
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 8 }} />
              </div>
              <span className="upload-progress-text">Uploading... {uploadProgress}%</span>
            </div>
          )}
        </div>

        {/* fee, tickets, seats */}
        <Section title="Fee, tickets and seats">
          <FormControlLabel
            control={
              <Switch
                checked={!!form.paid}
                onChange={(e) => set({ paid: e.target.checked, accounts: e.target.checked && !form.accounts.length ? [newAccount()] : form.accounts })}
              />
            }
            label={form.paid ? "Paid event" : "Free event"}
          />
          {errors.paid && <FormHelperText error>{errors.paid}</FormHelperText>}
          <div className="form-grid">
            {form.paid && !tiered && (
              <div>
                <TextField
                  fullWidth
                  size="small"
                  className="form-field"
                  label="Fee (PKR) *"
                  value={form.fee}
                  onChange={(e) => set({ fee: e.target.value.replace(/[^\d]/g, "") })}
                  error={!!errors.fee}
                  helperText={errors.fee || "Whole rupees, no paisa"}
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                />
              </div>
            )}
            <div>
              <TextField
                fullWidth
                size="small"
                className="form-field"
                label="Capacity"
                value={form.capacity}
                onChange={(e) => set({ capacity: e.target.value.replace(/[^\d]/g, "") })}
                error={!!errors.capacity}
                helperText={errors.capacity || "Total seats. Empty = unlimited"}
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
              />
            </div>
            <div>
              <TextField
                fullWidth
                size="small"
                className="form-field"
                type="datetime-local"
                label="Registration closes"
                value={form.registrationCloses}
                onChange={(e) => set({ registrationCloses: e.target.value })}
                error={!!errors.registrationCloses}
                helperText={errors.registrationCloses || "Empty = open until the event is removed"}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </div>
          </div>

          {tiered && (
            <div className="ev2-tiers">
              <div className="ev2-subtitle">Ticket tiers</div>
              {errors.tiers && <FormHelperText error>{errors.tiers}</FormHelperText>}
              {form.tiers.map((t, i) => (
                <div className="ev2-row" key={i}>
                  <TextField size="small" className="form-field" label="Name *" value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} error={!!errors[`tiers.${i}.name`]} helperText={errors[`tiers.${i}.name`] || " "} />
                  <TextField
                    size="small"
                    className="form-field"
                    label={form.paid ? "Price (PKR) *" : "Price"}
                    value={form.paid ? t.price : "0"}
                    disabled={!form.paid}
                    onChange={(e) => setTier(i, { price: e.target.value.replace(/[^\d]/g, "") })}
                    error={!!errors[`tiers.${i}.price`]}
                    helperText={errors[`tiers.${i}.price`] || (form.paid ? " " : "free event")}
                  />
                  <TextField size="small" className="form-field" label="Quantity *" value={t.quantity} onChange={(e) => setTier(i, { quantity: e.target.value.replace(/[^\d]/g, "") })} error={!!errors[`tiers.${i}.quantity`]} helperText={errors[`tiers.${i}.quantity`] || (t.sold ? `${t.sold} taken` : " ")} />
                  <TextField size="small" className="form-field" label="Max per student *" value={t.maxPerStudent} onChange={(e) => setTier(i, { maxPerStudent: e.target.value.replace(/[^\d]/g, "") })} error={!!errors[`tiers.${i}.maxPerStudent`]} helperText={errors[`tiers.${i}.maxPerStudent`] || " "} />
                  <Tooltip title={t.sold ? "This tier has registrations" : "Remove tier"}>
                    <span>
                      <IconButton aria-label="remove tier" disabled={!!t.sold} onClick={() => set({ tiers: form.tiers.filter((_, j) => j !== i) })}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              ))}
              {form.tiers.length < 10 && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => set({ tiers: [...form.tiers, newTier()] })}>
                  Add tier
                </Button>
              )}
            </div>
          )}
        </Section>

        {/* payment accounts */}
        {form.paid && (
          <Section title="Payment accounts" hint="students see these when they register">
            {errors.accounts && <FormHelperText error>{errors.accounts}</FormHelperText>}
            {form.accounts.map((a, i) => {
              const p = `accounts.${i}`;
              return (
                <div className="ev2-account" key={i}>
                  <div className="ev2-row">
                    <FormControl size="small" className="form-field" sx={{ minWidth: 150 }} error={!!errors[`${p}.method`]}>
                      <InputLabel id={`m-${i}`}>Method *</InputLabel>
                      <Select labelId={`m-${i}`} label="Method *" value={a.method} onChange={(e) => setAccount(i, { method: e.target.value })}>
                        {Object.entries(METHOD_LABEL).map(([v, l]) => (
                          <MenuItem key={v} value={v}>
                            {l}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {a.method === "bank" && (
                      <TextField size="small" className="form-field" label="Bank name *" value={a.bankName} onChange={(e) => setAccount(i, { bankName: e.target.value })} error={!!errors[`${p}.bankName`]} helperText={errors[`${p}.bankName`] || " "} />
                    )}
                    <TextField size="small" className="form-field" label={a.method === "bank" ? "Account title *" : "Account title"} value={a.accountTitle} onChange={(e) => setAccount(i, { accountTitle: e.target.value })} error={!!errors[`${p}.accountTitle`]} helperText={errors[`${p}.accountTitle`] || " "} />
                    <TextField
                      size="small"
                      className="form-field"
                      label={a.method === "bank" ? "Account number" : "Mobile number *"}
                      placeholder={a.method === "bank" ? "" : "03XXXXXXXXX"}
                      value={a.accountNumber}
                      onChange={(e) => setAccount(i, { accountNumber: e.target.value })}
                      error={!!errors[`${p}.accountNumber`]}
                      helperText={errors[`${p}.accountNumber`] || " "}
                    />
                    {a.method === "bank" && (
                      <TextField size="small" className="form-field" label="IBAN" placeholder="PK36SCBL0000001123456702" value={a.iban} onChange={(e) => setAccount(i, { iban: e.target.value })} error={!!errors[`${p}.iban`]} helperText={errors[`${p}.iban`] || "Account number or IBAN"} />
                    )}
                    <IconButton aria-label="remove account" onClick={() => set({ accounts: form.accounts.filter((_, j) => j !== i) })}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
              );
            })}
            {form.accounts.length < MAX_ACCOUNTS && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => set({ accounts: [...form.accounts, newAccount()] })}>
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
                      <TextField size="small" className="form-field" label="Question *" value={q.label} onChange={(e) => setQuestion(q.key, { label: e.target.value })} error={!!errors[`${p}.label`]} helperText={errors[`${p}.label`] || " "} sx={{ flex: 2 }} />
                      <FormControl size="small" className="form-field" sx={{ minWidth: 140 }}>
                        <InputLabel id={`qt-${q.key}`}>Answer type</InputLabel>
                        <Select labelId={`qt-${q.key}`} label="Answer type" value={q.type} onChange={(e) => setQuestion(q.key, { type: e.target.value })}>
                          {QUESTION_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {q.type === "select" && (
                        <TextField
                          size="small"
                          className="form-field"
                          label="Choices *"
                          placeholder="Yes, No"
                          value={(q.options || []).join(", ")}
                          onChange={(e) => setQuestion(q.key, { options: e.target.value.split(",").map((s) => s.trimStart()) })}
                          error={!!errors[`${p}.options`]}
                          helperText={errors[`${p}.options`] || "Separate with commas"}
                          sx={{ flex: 2 }}
                        />
                      )}
                      <FormControlLabel control={<Switch checked={!!q.required} onChange={(e) => setQuestion(q.key, { required: e.target.checked })} />} label="Required" />
                      <IconButton aria-label="remove question" onClick={() => set({ regForm: form.regForm.filter((x) => x.key !== q.key) })}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  ) : (
                    <div className="ev2-row ev2-question-fixed">
                      <span className="ev2-question-label">
                        {fieldLabel(q)}
                        {base && (
                          <Tooltip title="Base field: always on the form">
                            <LockIcon sx={{ fontSize: 14, ml: 0.5, color: "#999", verticalAlign: "middle" }} />
                          </Tooltip>
                        )}
                      </span>
                      <Chip size="small" label={TYPE_LABEL[q.type] || q.type} />
                      {!locked && (
                        <FormControlLabel control={<Switch size="small" checked={!!q.required} onChange={(e) => setQuestion(q.key, { required: e.target.checked })} />} label="Required" />
                      )}
                      {ticket && !tiered && <span className="ev2-section-hint">used when the event has ticket tiers</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!form.legacy && form.regForm.length < 30 && (
            <Button
              size="small"
              startIcon={<AddIcon />}
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
