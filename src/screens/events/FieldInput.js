// src/screens/events/FieldInput.js
// One template field → the right kit input. The asterisk comes from the label only
// (the `required` attribute is not used, so there is never a second "*").
import React, { useState } from "react";
import Ico from "../../portal/Ico";
import { Field, Input, Textarea, Select, Dropdown, IconButton } from "../../portal/kit";

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
  const id = `ev2-${field.key}`;
  return (
    <div className="ev2-list-field">
      <Field label={fieldLabel(field)} htmlFor={id} error={error} hint={field.helpText}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            id={id}
            value={draft}
            placeholder="Type and press Enter"
            invalid={!!error}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <IconButton icon="plus" label={`add ${field.label}`} onClick={add} disabled={!draft.trim()} />
        </div>
      </Field>
      {items.length > 0 && (
        <div className="ev2-chips">
          {items.map((it, i) => (
            <span className="k-tag" key={`${it}-${i}`}>
              {it}
              <button type="button" aria-label={`remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Ico kind="close" tone="plain" size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FieldInput({ field, value, onChange, error, disabled }) {
  const label = fieldLabel(field);
  const id = `ev2-${field.key}`;

  if (field.type === "list") return <ListInput field={field} value={value} onChange={onChange} error={error} />;

  if (field.type === "multiselect") {
    return (
      <Field label={label} error={error} hint={field.helpText}>
        <Dropdown
          multiple
          searchable={(field.options || []).length > 8}
          options={(field.options || []).map((o) => ({ value: o, label: o }))}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          placeholder="choose…"
          disabled={disabled}
        />
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={label} htmlFor={id} error={error} hint={field.helpText}>
        <Select id={id} value={value || ""} invalid={!!error} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          {(!field.required || !value) && <option value="">{field.required ? "choose…" : "None"}</option>}
          {(field.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  const type =
    field.type === "number" ? "text" : field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text";
  const common = {
    id,
    value: value ?? "",
    disabled,
    invalid: !!error,
    placeholder: PLACEHOLDER[field.type],
    onChange: (e) => onChange(field.type === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value),
  };
  return (
    <Field label={label} htmlFor={id} error={error} hint={field.helpText}>
      {field.type === "textarea" ? (
        <Textarea rows={3} {...common} />
      ) : (
        <Input
          type={type}
          {...common}
          inputMode={field.type === "number" ? "numeric" : field.type === "phone" ? "tel" : undefined}
          pattern={field.type === "number" ? "[0-9]*" : undefined}
        />
      )}
    </Field>
  );
}
