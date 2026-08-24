"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RsvpResponse } from "@/lib/validation/rsvp";

export function DateLocationBadge() {
  return (
    <div className="date-location" aria-label="Wedding Date and Location">
      <strong>19th & 20th November 2026</strong>
      <strong>Jaipur</strong>
    </div>
  );
}

export function ScreenEntry() {
  return <p className="microcopy">INITIALISING</p>;
}

export function ScreenDate19() {
  return <h1 aria-label="19">19</h1>;
}

export function ScreenDate20() {
  return <h1 aria-label="20">20</h1>;
}

export function ScreenDateNovember() {
  return <h1 aria-label="November">NOVEMBER</h1>;
}

export function ScreenDateYear() {
  return <h1 aria-label="2026">2026</h1>;
}

export function ScreenJaipur() {
  return (
    <>
      <h1 aria-label="Jaipur">JAIPUR</h1>
      <p className="microcopy">location confirmed</p>
    </>
  );
}

export function ScreenIncident() {
  return <h2>AN INCIDENT IS TAKING PLACE</h2>;
}

export function ScreenCooking() {
  return <h2>SOMETHING IS COOKING</h2>;
}

export function ScreenBite() {
  return <h2>COME GRAB A BITE</h2>;
}

export function ScreenInformationRequest({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h2>INFORMATION REQUEST</h2>
      <p>We weren&apos;t going to tell you yet.</p>
      <p>But you&apos;re already here.</p>
      <button type="button" onClick={onContinue} autoFocus>
        CONTINUE
      </button>
    </>
  );
}

const SCAN_ITEMS = ["DATE", "LOCATION", "PEOPLE", "EVENT"];

export function ScreenSystemScan() {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleIndex((prev) => (prev < SCAN_ITEMS.length ? prev + 1 : prev));
    }, 700);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <h2>SEARCHING...</h2>
      <ul className="scan-list" aria-live="polite">
        {SCAN_ITEMS.map((item, index) => (
          <li key={item} style={{ opacity: index < visibleIndex ? 1 : 0.25 }}>
            {index < visibleIndex ? "✓ " : "· "}
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export function ScreenMatchFound() {
  return <h2>MATCH FOUND</h2>;
}

export function ScreenReveal() {
  return (
    <>
      <h1 className="names">
        JANHVI
        <br />
        <span>+</span>
        <br />
        KRISH
      </h1>
      <p className="reveal-subtext">
        relationship status: about to become significantly more complicated
      </p>
      <DateLocationBadge />
    </>
  );
}

export function ScreenMarriageApp({ onInstall }: { onInstall: () => void }) {
  return (
    <>
      <p className="microcopy">SYSTEM NOTIFICATION</p>
      <h2>NEW APPLICATION DETECTED</h2>
      <h3>MARRIAGE v1.0</h3>
      <p>Installation required.</p>
      <button type="button" onClick={onInstall} autoFocus>
        VIEW INSTALLATION
      </button>
    </>
  );
}

const COMPATIBILITY_CHECKS = [
  "Bride found",
  "Groom found",
  "Families notified",
  "Venue acquired",
  "Guest list generated",
  "Dance floor secured",
  "Escape route unavailable"
];

export function ScreenCompatibility() {
  const [visibleChecks, setVisibleChecks] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleChecks((prev) =>
        prev < COMPATIBILITY_CHECKS.length ? prev + 1 : prev
      );
    }, 550);
    return () => window.clearInterval(interval);
  }, []);

  const allComplete = visibleChecks >= COMPATIBILITY_CHECKS.length;

  return (
    <>
      <h3>MARRIAGE v1.0</h3>
      <p className="microcopy">Checking compatibility...</p>
      <ul className="compatibility-list" aria-live="polite">
        {COMPATIBILITY_CHECKS.map((check, index) => (
          <li
            key={check}
            style={{
              opacity: index < visibleChecks ? 1 : 0.2,
              transform: index < visibleChecks ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.2s ease, transform 0.2s ease"
            }}
          >
            {index < visibleChecks ? "✓ " : "· "}
            {check}
          </li>
        ))}
      </ul>
      {allComplete ? (
        <p className="status-compatible">SYSTEM STATUS: COMPATIBLE</p>
      ) : null}
    </>
  );
}

export function ScreenInstallation() {
  return (
    <>
      <p className="microcopy">SYSTEM DEPLOYMENT</p>
      <h2>Preparing installation...</h2>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
        <span />
      </div>
      <p className="microcopy progress-ticks">12% · 37% · 64% · 89% · 100%</p>
      <p>Installation ready.</p>
    </>
  );
}

export function ScreenWarning({
  saving,
  onSelectDecision
}: {
  saving: boolean;
  onSelectDecision: (response: RsvpResponse) => void;
}) {
  return (
    <>
      <h2>⚠️ WARNING</h2>
      <p className="warning-text">Once installed, marriage cannot be uninstalled.</p>
      <p>Please confirm that you understand the consequences.</p>
      <div className="rsvp-choices">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectDecision("yes")}
          className="choice-btn"
        >
          <span>YES</span>
          <small>I&apos;m coming.</small>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectDecision("maybe")}
          className="choice-btn"
        >
          <span>MAYBE</span>
          <small>I need to check.</small>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectDecision("no")}
          className="choice-btn"
        >
          <span>NO</span>
          <small>I cannot make it.</small>
        </button>
      </div>
    </>
  );
}

export function ScreenRsvpName({
  initialValue,
  saving,
  onSubmitName
}: {
  initialValue: string;
  saving: boolean;
  onSubmitName: (name: string) => void;
}) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setError(null);
    onSubmitName(name); // preserve exact string as typed
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      <h2>WHO&apos;S MAKING THIS DECISION?</h2>
      <p className="input-label">Your name</p>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Rahul Sharma"
          autoComplete="name"
          disabled={saving}
          className="large-text-input"
          aria-required="true"
        />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={saving || !name.trim()} className="primary-action-btn">
        CONTINUE
      </button>
    </form>
  );
}

export function ScreenRsvpCount({
  saving,
  onSelectCount
}: {
  saving: boolean;
  onSelectCount: (count: number | "more") => void;
}) {
  return (
    <div className="count-selection-screen">
      <h2>HOW MANY PEOPLE WILL BE ATTENDING?</h2>
      <div className="count-grid" role="group" aria-label="Attendance count options">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount(1)}
          className="count-card"
        >
          1 PERSON
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount(2)}
          className="count-card"
        >
          2 PEOPLE
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount(3)}
          className="count-card"
        >
          3 PEOPLE
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount(4)}
          className="count-card"
        >
          4 PEOPLE
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount(5)}
          className="count-card"
        >
          5 PEOPLE
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSelectCount("more")}
          className="count-card count-card-more"
        >
          MORE THAN 5
        </button>
      </div>
    </div>
  );
}

export function ScreenRsvpCountCustom({
  initialValue,
  saving,
  onSubmitCount
}: {
  initialValue?: number;
  saving: boolean;
  onSubmitCount: (count: number) => void;
}) {
  const [val, setVal] = useState<string>(initialValue && initialValue > 5 ? String(initialValue) : "6");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 6) {
      setError("Please enter a number of 6 or more.");
      return;
    }
    setError(null);
    onSubmitCount(num);
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      <h2>HOW MANY PEOPLE?</h2>
      <p className="input-label">Enter the total number of people attending</p>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="number"
          min={6}
          max={99}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (error) setError(null);
          }}
          disabled={saving}
          className="large-number-input"
          aria-required="true"
        />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={saving} className="primary-action-btn">
        CONFIRM
      </button>
    </form>
  );
}

export function ScreenOutcomeYes() {
  return (
    <>
      <p className="microcopy">INSTALLING...</p>
      <h2>INSTALLATION COMPLETE</h2>
      <p>Congratulations.</p>
      <p className="emphasis-text">
        <strong>You are now officially part of the problem.</strong>
      </p>
      <DateLocationBadge />
      <p className="see-you">See you there.</p>
    </>
  );
}

export function ScreenOutcomeMaybe() {
  return (
    <>
      <h2>INSTALLATION PAUSED</h2>
      <p>Compatibility could not be confirmed.</p>
      <p>That&apos;s okay.</p>
      <p className="emphasis-text">
        <strong>We&apos;ll wait.</strong>
      </p>
      <p className="microcopy">but not indefinitely</p>
      <button type="button" className="later-btn">
        I&apos;LL CONFIRM LATER
      </button>
    </>
  );
}

export function ScreenOutcomeNo() {
  return (
    <>
      <h2>INSTALLATION CANCELLED</h2>
      <p>Your decision has been recorded.</p>
      <p>We respect your choice.</p>
      <p>We don&apos;t understand it.</p>
      <p className="emphasis-text">
        <strong>The wedding will proceed anyway.</strong>
      </p>
      <p>You&apos;ll be missed.</p>
      <DateLocationBadge />
      <button type="button" className="exit-btn">
        EXIT SYSTEM
      </button>
    </>
  );
}

export function ScreenReturning({
  response,
  submittedName,
  onChange
}: {
  response: RsvpResponse | null;
  submittedName: string | null;
  onChange: () => void;
}) {
  const status =
    response === "yes"
      ? "INSTALLED"
      : response === "maybe"
      ? "PENDING"
      : "DECLINED";

  return (
    <>
      <h2>WELCOME BACK.</h2>
      {submittedName ? <p className="returning-name">{submittedName}</p> : null}
      <p className="microcopy">STATUS: {status}</p>
      {response === "yes" ? <p>You already made this decision.</p> : null}
      <DateLocationBadge />
      <button type="button" onClick={onChange} className="primary-action-btn">
        CHANGE RSVP
      </button>
    </>
  );
}
