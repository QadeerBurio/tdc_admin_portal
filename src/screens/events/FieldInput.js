// src/screens/events/FieldInput.js
// One template field → the right MUI input. The asterisk comes from the label only
// (MUI's `required` prop is not used, so there is never a second "*").
import React, { useState } from "react";
import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Chip, IconButton, OutlinedInput } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export const fieldLabel = (f) => `${f.label || f.key}${f.required ? " *" : ""}`;

const PLACEHOLDER = { phone: "03XXXXXXXXX", url: "https://", email: "name@university.edu.pk", time: "18:30" };

function ListInput({ field, value, onChange, error }) {
  const [draft, setDraft] = useState("");
  const items = Array.isArray(value) ? value : [];
  const add = () => {
    const parts = draft.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...items, ...parts.filter((p) => !items.includes(p))]);
    setDraft("");
  };
  return (
    <div className="ev2-list-field">
      <TextField
        fullWidth
        size="small"
        className="form-field"
        label={fieldLabel(field)}
        value={draft}
        placeholder="Type and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        error={!!error}
        helperText={error || field.helpText || " "}
        slotProps={{
          input: {
            endAdornment: (
              <IconButton size="small" onClick={add} aria-label={`add ${field.label}`} disabled={!draft.trim()}>
                <AddIcon fontSize="small" />
              </IconButton>
            ),
          },
        }}
      />
      {items.length > 0 && (
        <div className="ev2-chips">
          {items.map((it, i) => (
            <Chip key={`${it}-${i}`} label={it} size="small" onDelete={() => onChange(items.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FieldInput({ field, value, onChange, error, disabled }) {
  const label = fieldLabel(field);
  const helper = error || field.helpText || " ";

  if (field.type === "list") return <ListInput field={field} value={value} onChange={onChange} error={error} />;

  if (field.type === "select" || field.type === "multiselect") {
    const multiple = field.type === "multiselect";
    const id = `ev2-${field.key}`;
    return (
      <FormControl fullWidth size="small" className="form-field" error={!!error} disabled={disabled}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          multiple={multiple}
          value={multiple ? (Array.isArray(value) ? value : []) : value || ""}
          label={label}
          input={<OutlinedInput label={label} />}
          onChange={(e) => onChange(e.target.value)}
          renderValue={multiple ? (sel) => sel.join(", ") : undefined}
        >
          {!multiple && !field.required && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {(field.options || []).map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{helper}</FormHelperText>
      </FormControl>
    );
  }

  const type =
    field.type === "number" ? "text" : field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text";
  return (
    <TextField
      fullWidth
      size="small"
      className="form-field"
      label={label}
      type={type}
      value={value ?? ""}
      disabled={disabled}
      multiline={field.type === "textarea"}
      minRows={field.type === "textarea" ? 3 : undefined}
      placeholder={PLACEHOLDER[field.type]}
      onChange={(e) => onChange(field.type === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
      error={!!error}
      helperText={helper}
      slotProps={{
        inputLabel: field.type === "date" || field.type === "time" ? { shrink: true } : undefined,
        htmlInput: field.type === "number" ? { inputMode: "numeric", pattern: "[0-9]*" } : field.type === "phone" ? { inputMode: "tel" } : undefined,
      }}
    />
  );
}
