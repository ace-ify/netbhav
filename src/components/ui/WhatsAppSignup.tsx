"use client";

import { useState } from "react";
import { Send } from "lucide-react";

// Landing CTA (design.md §6.7 / §5): sr-only label, border-b input, dark pill
// with Send icon. Opens WhatsApp to the NetBhav channel, pre-filling the
// farmer's number so the (backend-owned) signup flow can pick it up.
export default function WhatsAppSignup({
  businessNumber = "911234567890",
}: {
  businessNumber?: string;
}) {
  const [phone, setPhone] = useState("");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const text = encodeURIComponent(
      `नमस्ते NetBhav! मुझे मेरी मंडी की सलाह चाहिए।${phone ? ` मेरा नंबर: ${phone}` : ""}`
    );
    window.open(`https://wa.me/${businessNumber}?text=${text}`, "_blank", "noopener");
  }

  return (
    <form onSubmit={start} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="signup-phone" className="sr-only">
          फ़ोन नंबर
        </label>
        <input
          id="signup-phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="अपना WhatsApp नंबर"
          className="w-full border-b border-neutral-300 bg-transparent py-3 text-lg outline-none transition focus:border-neutral-900"
        />
      </div>
      <button
        type="submit"
        className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-500 text-white transition duration-300 hover:bg-neutral-800"
      >
        WhatsApp पर शुरू करें
        <Send className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
