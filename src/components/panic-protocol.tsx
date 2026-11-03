"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const anchors = {
  sight: ["Let your eyes rest on one object. Notice its shape and color.", "Name three ordinary things you can see around you.", "Notice how light and shadow fall in this space.", "Choose one small next step, or simply finish here."],
  sound: ["Let the room be as it is. Notice one sound nearby.", "Notice a sound farther away, without needing to follow it.", "Listen for a brief quiet space between sounds.", "Choose one small next step, or simply finish here."],
  touch: ["If comfortable, notice where your body meets a chair or floor.", "Feel the texture or temperature of one nearby object.", "Notice one point of contact and let your attention rest there.", "Choose one small next step, or simply finish here."],
} as const;

type Anchor = keyof typeof anchors;

export function PanicProtocol() {
  const [anchor, setAnchor] = useState<Anchor>("sight");
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (!active || paused || step >= 4) return;
    const timer = window.setInterval(() => setSeconds((current) => {
      if (current <= 1) {
        setStep((currentStep) => Math.min(currentStep + 1, 4));
        return 30;
      }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [active, paused, step]);

  function start() {
    setStep(0);
    setSeconds(30);
    setPaused(false);
    setActive(true);
  }

  const completed = active && step >= 4;
  const remaining = completed ? 0 : Math.max(0, (3 - step) * 30 + seconds);
  const formatTime = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;

  return <main className="panic-shell">
    <header className="panic-topbar"><Link href="/dashboard" className="panic-exit">Exit to dashboard</Link><span aria-label="Two minute text exercise">2:00 · text exercise</span></header>
    <section className="panic-card" aria-live="polite">
      <p className="eyebrow">A moment to pause</p>
      <h1>Take this at your pace.</h1>
      <p className="panic-intro">This short grounding exercise offers a few prompts for the next two minutes. You can pause, skip, or leave whenever you want. It is not medical care or a substitute for professional support.</p>
      <label htmlFor="protocol-anchor">Choose an attention anchor</label>
      <select id="protocol-anchor" value={anchor} onChange={(event) => setAnchor(event.target.value as Anchor)} disabled={active && !completed}>
        <option value="sight">Things you can see</option><option value="sound">Sounds around you</option><option value="touch">Points of contact</option>
      </select>
      <p className="panic-audio-note">Text prompts are available. Audio is not enabled because no approved recording has been supplied.</p>
      {active ? <div className="panic-active">
        {completed ? <><h2>You reached the end of this exercise.</h2><p>You can stop here, restart, or choose another anchor.</p></> : <><p className="panic-countdown" aria-label={`${formatTime(remaining)} remaining`}>{formatTime(remaining)}</p><p className="panic-step-label">Step {step + 1} of 4</p><h2 className="panic-prompt">{anchors[anchor][step]}</h2><div className="panic-progress" role="progressbar" aria-label="Exercise progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step}><span style={{ width: `${step * 25}%` }}/></div></>}
        <div className="panic-actions">{!completed && <button type="button" className="button button-dark" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>}<button type="button" className="button button-outline-dark" onClick={start}>Restart</button><Link className="panic-exit" href="/dashboard">Exit</Link></div>
        {!completed && <button type="button" className="panic-skip" onClick={() => { setStep(Math.min(step + 1, 4)); setSeconds(30); }}>{paused ? "Continue to next prompt" : "Skip this prompt"}</button>}
      </div> : <button type="button" className="button button-dark" onClick={start}>Start two minutes</button>}
      <p className="panic-help">If you may be in immediate danger or need urgent help, contact local emergency services or someone you trust.</p>
    </section>
  </main>;
}
