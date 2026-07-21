
import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleCheck,
  Droplets,
  Fan,
  Gauge,
  Lock,
  PackageCheck,
  QrCode,
  Radio,
  ScanLine,
  ShieldCheck,
  Trash2,
  Unlock,
  Weight,
  Wind,
} from "lucide-react";

const C = {
  bg: "#f4f1f3",
  panel: "#111923",
  panel2: "#1c2733",
  pink: "#d92f7f",
  pinkSoft: "#f6d4e4",
  gold: "#c9a227",
  green: "#2f9e5b",
  amber: "#e0a339",
  red: "#d14343",
  ink: "#1c2024",
  white: "#ffffff",
};

const tierFor = (value, amber, red) =>
  value >= red ? "red" : value >= amber ? "amber" : "green";

const tierColor = (tier) => C[tier];

function useEventLog(initialMessage) {
  const [entries, setEntries] = useState([
    { t: new Date().toTimeString().slice(0, 8), msg: initialMessage, tier: "green" },
  ]);

  const push = (msg, tier = "green") => {
    const t = new Date().toTimeString().slice(0, 8);
    setEntries((prev) => [{ t, msg, tier }, ...prev].slice(0, 60));
  };

  return [entries, push];
}

function StatCard({ label, value, suffix = "", tier = "green", icon }) {
  return (
    <div className="card stat-card">
      <div className="stat-title">{icon}{label}</div>
      <div className="stat-value">{value}<span>{suffix}</span></div>
      <div className="meter">
        <div style={{ width: `${Math.min(100, Number(value) || 0)}%`, background: tierColor(tier) }} />
      </div>
      <div className="tier-label" style={{ color: tierColor(tier) }}>{tier.toUpperCase()}</div>
    </div>
  );
}

function EventLog({ entries }) {
  return (
    <div className="console">
      <div className="console-title"><Radio size={15} /> LIVE TELEMETRY</div>
      <div className="console-body">
        {entries.map((entry, index) => (
          <div className="log-row" key={`${entry.t}-${index}`}>
            <span>{entry.t}</span>
            <b style={{ color: entry.tier === "green" ? "#d7dadd" : tierColor(entry.tier) }}>
              {entry.msg}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}

function BagStation() {
  const [stage, setStage] = useState("idle");
  const [bags, setBags] = useState(240);
  const [binFill, setBinFill] = useState(24);
  const [odour, setOdour] = useState(19);
  const [locked, setLocked] = useState(false);
  const busy = useRef(false);
  const [log, push] = useEventLog("SYSTEM: GenevieveBagStation online.");

  const stockTier = tierFor(100 - (bags / 240) * 100, 55, 80);
  const binTier = tierFor(binFill, 60, 85);
  const odourTier = tierFor(odour, 55, 80);

  const dispense = () => {
    if (busy.current || stage !== "idle" || bags <= 0 || locked) return;
    busy.current = true;
    setStage("advancing");
    push("GATE: dispense trigger accepted.");
    setTimeout(() => { setStage("preopening"); push("PRE-OPEN: bag mouth being separated."); }, 700);
    setTimeout(() => { setStage("presented"); push("STATUS: one bag presented. Gate locked."); }, 1450);
  };

  const takeBag = () => {
    if (stage !== "presented") return;
    setStage("resetting");
    push("SENSOR: withdrawal confirmed.");
    setTimeout(() => {
      setBags((v) => Math.max(0, v - 1));
      setStage("idle");
      busy.current = false;
      push("READY: station reset for next visitor.");
    }, 500);
  };

  const depositWaste = () => {
    setBinFill((v) => Math.min(100, v + 8));
    setOdour((v) => Math.min(100, v + 6));
    push("BIN: sealed chute accepted dog waste.");
  };

  const service = () => {
    setBinFill(0);
    setOdour(5);
    push("SERVICE: cassette replaced and odour filter reset.", "green");
  };

  return (
    <div className="layout">
      <section className="device-shell green">
        <div className="device-led" style={{ background: tierColor(binTier) }} />
        <h2>GenevieveBagStation™</h2>
        <div className="device-screen">
          <div className="screen-icon"><ShieldCheck size={34} /></div>
          <div>{locked ? "UNIT LOCKED" : stage === "idle" ? "READY" : stage.replaceAll("-", " ").toUpperCase()}</div>
        </div>
        <div className="aperture">
          {stage === "presented" ? <div className="bag-strip">BAG</div> : "PULL"}
        </div>
        <div className="chute-label">SEALED WASTE CHUTE</div>
        <div className="button-grid">
          <button onClick={dispense} disabled={stage !== "idle" || locked || bags <= 0}>Dispense Bag</button>
          <button onClick={takeBag} disabled={stage !== "presented"}>Take Bag</button>
          <button onClick={depositWaste}>Deposit Waste</button>
          <button onClick={() => setLocked(v => !v)}>{locked ? <Unlock size={15}/> : <Lock size={15}/>} {locked ? "Unlock" : "Remote Lock"}</button>
          <button onClick={service}><Trash2 size={15}/> Service Cassette</button>
        </div>
      </section>

      <section className="right-column">
        <div className="stats-grid">
          <StatCard label="Bag stock" value={Math.round((bags/240)*100)} suffix="%" tier={stockTier} icon={<PackageCheck size={15}/>} />
          <StatCard label="Bin fill" value={binFill} suffix="%" tier={binTier} icon={<Gauge size={15}/>} />
          <StatCard label="Odour risk" value={odour} suffix="%" tier={odourTier} icon={<Wind size={15}/>} />
        </div>
        <EventLog entries={log} />
      </section>
    </div>
  );
}

function SaniStation() {
  const [publicOpen, setPublicOpen] = useState(true);
  const [serviceDoor, setServiceDoor] = useState(false);
  const [stage, setStage] = useState("ready");
  const [fill, setFill] = useState(37);
  const [weight, setWeight] = useState(7.4);
  const [odour, setOdour] = useState(16);
  const [leachate, setLeachate] = useState(9);
  const [sealQuality, setSealQuality] = useState(100);
  const [log, push] = useEventLog("SYSTEM: GenevieveSaniStation online.");

  const fillTier = tierFor(fill, 60, 85);
  const weightTier = tierFor(weight, 13, 18);
  const odourTier = tierFor(odour, 55, 80);
  const leachateTier = tierFor(leachate, 45, 75);

  const deposit = () => {
    if (!publicOpen || stage !== "ready") {
      push("ACCESS: deposit blocked while station is in service mode.", "amber");
      return;
    }
    setFill((v) => Math.min(100, v + 7));
    setWeight((v) => Math.min(25, +(v + 0.8).toFixed(1)));
    setOdour((v) => Math.min(100, v + 4));
    setLeachate((v) => Math.min(100, v + 2));
    push("USER: sanitary item deposited via hands-free opening.");
  };

  const prepareCollection = () => {
    if (stage !== "ready") return;
    setPublicOpen(false);
    setServiceDoor(false);
    setStage("locking");
    push("SERVICE: Prepare for Collection initiated.");
    setTimeout(() => {
      setStage("extracting");
      push("HYGIENE: negative-pressure odour extraction active.");
      setOdour((v) => Math.max(5, v - 12));
    }, 700);
    setTimeout(() => {
      setStage("double-sealing");
      push("SEAL: upper and lower seals applying.");
    }, 1500);
    setTimeout(() => {
      setStage("cutting");
      push("CUTTER: separation between verified seals.");
    }, 2450);
    setTimeout(() => {
      const quality = Math.random() < 0.08 ? 62 : 100;
      setSealQuality(quality);
      if (quality < 80) {
        setStage("seal-fault");
        push("FAULT: seal verification failed. Service door remains locked.", "red");
      } else {
        setStage("safe-to-remove");
        setServiceDoor(true);
        push("SAFE: sealed cassette ready. Service door unlocked.", "green");
      }
    }, 3200);
  };

  const replaceCassette = () => {
    if (stage !== "safe-to-remove") return;
    setStage("replacing");
    push("WORKER: sealed cassette removed on slide-out rails.");
    setTimeout(() => {
      setFill(0);
      setWeight(0);
      setOdour(4);
      setLeachate(0);
      setSealQuality(100);
      setServiceDoor(false);
      setPublicOpen(true);
      setStage("ready");
      push("SERVICE COMPLETE: clean cassette installed and station returned to public use.", "green");
    }, 1200);
  };

  const retrySeal = () => {
    if (stage !== "seal-fault") return;
    setSealQuality(100);
    setStage("double-sealing");
    push("RETRY: backup mechanical clamp and second seal cycle started.", "amber");
    setTimeout(() => {
      setStage("safe-to-remove");
      setServiceDoor(true);
      push("SAFE: backup seal verified. Cassette may now be removed.", "green");
    }, 1500);
  };

  const stageText = useMemo(() => ({
    ready: "READY FOR USE",
    locking: "PUBLIC OPENING LOCKED",
    extracting: "ODOUR EXTRACTION",
    "double-sealing": "DOUBLE SEALING",
    cutting: "SEPARATING SEALED BAG",
    "seal-fault": "SEAL FAULT — LOCKED",
    "safe-to-remove": "SAFE TO REMOVE",
    replacing: "CASSETTE REPLACEMENT",
  }[stage]), [stage]);

  return (
    <div className="layout">
      <section className="device-shell pink">
        <div className="device-led" style={{ background: stage === "seal-fault" ? C.red : stage === "safe-to-remove" ? C.green : C.pink }} />
        <h2>GenevieveSaniStation™</h2>
        <div className="device-screen">
          <div className="screen-icon">{stage === "safe-to-remove" ? <BadgeCheck size={34}/> : <ScanLine size={34}/>}</div>
          <div>{stageText}</div>
        </div>
        <div className="sanitary-lid">{publicOpen ? "HANDS-FREE LID OPEN" : "LID LOCKED"}</div>
        <div className="seal-window">
          <div>FULL LINER</div>
          <div className="seal-line" />
          <div className="cut-line">CUT</div>
          <div className="seal-line" />
          <div>NEXT LINER</div>
        </div>
        <div className="button-grid">
          <button onClick={deposit} disabled={!publicOpen || stage !== "ready"}>Simulate Deposit</button>
          <button onClick={prepareCollection} disabled={stage !== "ready"}><QrCode size={15}/> Prepare Collection</button>
          <button onClick={replaceCassette} disabled={stage !== "safe-to-remove"}><PackageCheck size={15}/> Remove Sealed Cassette</button>
          <button onClick={retrySeal} disabled={stage !== "seal-fault"}><ShieldCheck size={15}/> Retry Backup Seal</button>
        </div>
        <div className="safety-state">
          {serviceDoor ? <Unlock size={16}/> : <Lock size={16}/>}
          Service door: {serviceDoor ? "UNLOCKED" : "LOCKED"}
        </div>
      </section>

      <section className="right-column">
        <div className="stats-grid">
          <StatCard label="Cassette fill" value={fill} suffix="%" tier={fillTier} icon={<Gauge size={15}/>} />
          <StatCard label="Weight" value={weight} suffix=" kg" tier={weightTier} icon={<Weight size={15}/>} />
          <StatCard label="Odour risk" value={odour} suffix="%" tier={odourTier} icon={<Fan size={15}/>} />
          <StatCard label="Leachate" value={leachate} suffix="%" tier={leachateTier} icon={<Droplets size={15}/>} />
          <StatCard label="Seal quality" value={sealQuality} suffix="%" tier={sealQuality < 80 ? "red" : "green"} icon={<CircleCheck size={15}/>} />
        </div>
        <EventLog entries={log} />
      </section>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("sanitary");

  return (
    <main>
      <header>
        <div>
          <div className="eyebrow">GENEVIEVE APP™ — SMART AMENITY SYSTEMS</div>
          <h1>GENEVIEVE CLEAN-SAFE™ Prototype</h1>
          <p>Worker-safe disposal systems with automatic sealing, odour control, telemetry, and accountable service records.</p>
        </div>
        <div className="tabs">
          <button className={mode === "sanitary" ? "active" : ""} onClick={() => setMode("sanitary")}>Sanitary Auto-Seal</button>
          <button className={mode === "dog" ? "active" : ""} onClick={() => setMode("dog")}>Dog Waste Station</button>
        </div>
      </header>
      {mode === "sanitary" ? <SaniStation /> : <BagStation />}
    </main>
  );
}
