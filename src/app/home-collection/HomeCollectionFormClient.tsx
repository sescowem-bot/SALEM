"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Home, MapPin, Navigation, Phone } from "lucide-react";
import type { ResolvedSiteSettings } from "@/lib/data/siteSettings";
import { HOME_COLLECTION_TIME_SLOTS } from "@/lib/bookingConstants";
import { requestHomeCollectionAction, type HomeCollectionState } from "./actions";

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-navy-deep outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan focus:bg-card";

const initialState: HomeCollectionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 sm:w-auto"
    >
      <Home className="h-4 w-4 shrink-0" /> {pending ? "Submitting\u2026" : "Request a home visit"}
    </button>
  );
}

export function HomeCollectionFormClient({ settings }: { settings: ResolvedSiteSettings }) {
  const [state, formAction] = useActionState(requestHomeCollectionAction, initialState);

  const [locationState, setLocationState] = useState<{ latitude?: number; longitude?: number; mapUrl?: string; error?: string }>({});

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationState({ error: "Your browser does not support location sharing. Please enter your address manually." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        setLocationState({ latitude, longitude, mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}` });
      },
      () => setLocationState({ error: "We could not access your location. Please enter your full address and landmark manually." }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  if (state.bookingReference) {
    return (
      <div className="surface-card p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-navy">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-navy-deep">Request received</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your home-collection request has been received. <strong>Do not dispatch anyone to your address yet.</strong> Salem will confirm the visit and verify payment before the home visit is assigned.
          </p>
          <p className="mt-4 rounded-xl border border-cyan/40 bg-accent p-4 font-mono text-base font-semibold text-navy-deep">
            {state.bookingReference}
          </p>
        </div>
        {settings.homeCollectionPaymentRequired ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
            <h3 className="text-base font-semibold text-navy-deep">Payment is required before the home visit</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy">{settings.homeCollectionPaymentMessage || "Please complete the required payment and wait for Salem to verify it before the visit is confirmed."}</p>
            {(settings.homeCollectionBankName || settings.homeCollectionAccountName || settings.homeCollectionAccountNumber) ? (
              <dl className="mt-4 grid gap-2 text-sm">
                {settings.homeCollectionBankName ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bank</dt><dd className="font-semibold text-navy-deep">{settings.homeCollectionBankName}</dd></div> : null}
                {settings.homeCollectionAccountName ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account name</dt><dd className="text-right font-semibold text-navy-deep">{settings.homeCollectionAccountName}</dd></div> : null}
                {settings.homeCollectionAccountNumber ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account number</dt><dd className="font-mono font-semibold text-navy-deep">{settings.homeCollectionAccountNumber}</dd></div> : null}
              </dl>
            ) : (
              <p className="mt-3 text-xs font-medium text-amber-800">Payment details will be provided by Salem before confirmation.</p>
            )}
            {settings.homeCollectionPaymentPhone ? (
              <a href={`tel:${settings.homeCollectionPaymentPhone.replace(/[^\d+]/g, "")}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy underline"><Phone className="h-4 w-4" /> Payment support: {settings.homeCollectionPaymentPhone}</a>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-cyan/30 bg-accent/50 p-5 text-sm text-navy">Our team will contact you on the phone number you provided to confirm the home visit.</div>
        )}
      </div>
    );
  }

  return (
    <div className="surface-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-navy-deep">Request a home visit</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tell us where and when, and a phlebotomist will confirm your visit.
      </p>

      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy-deep">
          Full name
          <input className={fieldClass} name="fullName" placeholder="Your full name" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Phone number
          <input className={fieldClass} name="phone" placeholder="+234 …" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Email address (optional)
          <input className={fieldClass} name="email" type="email" placeholder="you@email.com" />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Test or panel requested
          <input className={fieldClass} name="testOrPackage" placeholder="e.g. Full Blood Count" />
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Home address
          <textarea rows={3} className={fieldClass} name="address" placeholder="House number, street, area, city" required />
          <span className="mt-1 block text-xs text-muted-foreground">Please provide enough detail for a safe visit. Your address is required even when you share a map location.</span>
        </label>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Landmark / delivery note (optional)
          <input className={fieldClass} name="landmark" placeholder="Nearby landmark, estate gate, flat number, etc." />
        </label>
        <div className="sm:col-span-2 rounded-2xl border border-border bg-secondary/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-deep"><MapPin className="h-4 w-4" /> Share your map location</p>
              <p className="mt-1 text-xs text-muted-foreground">Optional but strongly recommended for home visits. Your address remains required.</p>
            </div>
            <button type="button" onClick={useMyLocation} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold text-navy hover:border-cyan hover:bg-accent"><Navigation className="h-4 w-4" /> Use my current location</button>
          </div>
          {locationState.latitude != null && locationState.longitude != null ? (
            <div className="mt-3 rounded-xl border border-cyan/30 bg-accent p-3 text-xs text-navy-deep">Location captured: {locationState.latitude}, {locationState.longitude}</div>
          ) : null}
          {locationState.error ? <p className="mt-2 text-xs font-medium text-destructive">{locationState.error}</p> : null}
          <input type="hidden" name="latitude" value={locationState.latitude ?? ""} />
          <input type="hidden" name="longitude" value={locationState.longitude ?? ""} />
          <input type="hidden" name="mapUrl" value={locationState.mapUrl ?? ""} />
        </div>
        <label className="block text-sm font-medium text-navy-deep">
          Preferred date
          <input className={fieldClass} name="preferredDate" type="date" required />
        </label>
        <label className="block text-sm font-medium text-navy-deep">
          Preferred time
          <select className={fieldClass} name="preferredTime" required defaultValue="">
            <option value="" disabled>
              Choose a window
            </option>
            {HOME_COLLECTION_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-navy-deep">{settings.homeCollectionPaymentRequired ? "Payment is required before a home visit is confirmed" : "Home visit confirmation"}</p>
          <p className="mt-1 text-xs leading-relaxed text-navy">{settings.homeCollectionPaymentMessage || "Submit your request first. Salem will review the request, confirm the service and contact you before dispatch."}</p>
        </div>
        <label className="block text-sm font-medium text-navy-deep sm:col-span-2">
          Notes (optional)
          <textarea rows={3} className={fieldClass} name="notes" placeholder="Accessibility needs, fasting status…" />
        </label>

        {state.error ? <p className="text-sm font-medium text-destructive sm:col-span-2">{state.error}</p> : null}

        <div className="sm:col-span-2">
          <SubmitButton />
        </div>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">
        Prefer to talk it through?{" "}
        <Link href="/contact" className="font-semibold text-purple hover:text-navy">
          Contact us
        </Link>
      </p>
    </div>
  );
}
