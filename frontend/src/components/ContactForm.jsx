import React from "react";

export default function ContactForm({ contact, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="field-label" htmlFor="name">
          Your name
        </label>
        <input
          id="name"
          className="field-input"
          value={contact.name}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
          placeholder="Jamie Reyes"
          autoComplete="name"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div>
        <label className="field-label" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          className="field-input"
          value={contact.phone}
          onChange={(e) => onChange({ ...contact, phone: e.target.value })}
          placeholder="(614) 555-0148"
          autoComplete="tel"
        />
        {errors.phone && <p className="field-error">{errors.phone}</p>}
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="field-input"
          value={contact.email}
          onChange={(e) => onChange({ ...contact, email: e.target.value })}
          placeholder="jamie@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>
      <p className="text-xs text-slate-soft">
        We'll use this to send your estimate and follow up about your project —
        never shared or sold.
      </p>
    </div>
  );
}
