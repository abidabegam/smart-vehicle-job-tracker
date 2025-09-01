import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

/* ---------- Small tab button ---------- */
function TabBtn({
  active, onClick, children, href
}: {active:boolean; onClick:()=>void; children:any; href:string}) {
  return (
    <a href={href}>
      <button
        onClick={onClick}
        className={`px-3 py-2 rounded-lg font-medium ${active ? "bg-blue-600 text-white" : "bg-white border"}`}
      >
        {children}
      </button>
    </a>
  );
}

type Tab = "CAN" | "JD" | "HIL";

// tiny helper
const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

// sample strings used by the demo
const SAMPLE_CAN = [
  "0.001,0x0CFF050,00,10,34,12,00,00,00,00",
  "0.101,0x0CFF050,10,10,40,12,00,00,00,00",
  "0.201,0x0CFF050,20,10,48,12,00,00,00,00",
  "0.301,0x0CFF050,30,10,58,12,00,00,00,00",
  "0.401,0x0CFF050,40,10,58,12,00,00,00,00",
  "0.501,0x0CFF050,50,10,60,12,00,00,00,00",
].join("\n");

const SAMPLE_JD =
  "We need an AUTOSAR developer with ISO 26262, ADAS, CANoe/Vector tools, UDS diagnostics, and dSPACE HIL experience.";

export default function AutoLab() {
  const [params, setParams] = useSearchParams();
  const tabFromUrl = (params.get("tab") || "can").toLowerCase();
  const toTab = (v: string): Tab => (v === "jd" ? "JD" : v === "hil" ? "HIL" : "CAN");
  const [tab, setTab] = useState<Tab>(toTab(tabFromUrl));

  // refs to control child tabs from the demo player
  const canRef = useRef<any>(null);
  const jdRef  = useRef<any>(null);
  const hilRef = useRef<any>(null);

  useEffect(() => setTab(toTab(tabFromUrl)), [tabFromUrl]);

  function select(t: Tab) {
    setTab(t);
    setParams({ tab: t.toLowerCase() });
  }

  async function playDemo() {
    // 1) CAN
    select("CAN");
    await sleep(400);
    canRef.current?.setText?.(SAMPLE_CAN);
    await sleep(500);
    canRef.current?.run?.();
    await sleep(1200);

    // 2) JD → Skills Map
    select("JD");
    await sleep(400);
    jdRef.current?.setJD?.(SAMPLE_JD);
    await sleep(400);
    jdRef.current?.analyze?.();
    await sleep(1200);

    // 3) HIL Test Plan
    select("HIL");
    await sleep(400);
    hilRef.current?.setFeature?.("Adaptive Cruise Control (ACC)");
    await sleep(300);
    hilRef.current?.generate?.();
  }

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between text-white">
          <h1 className="text-3xl font-bold">Automotive Lab</h1>
          <nav className="space-x-4 flex items-center">
            <button
              onClick={playDemo}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30"
              title="Auto-play a short demo for GIF/recording"
            >
              ▶ Demo (30s)
            </button>
            <a className="underline" href="/dashboard">Dashboard</a>
            <a className="underline" href="/jobs">Jobs</a>
            <a className="underline" href="/">Logout</a>
          </nav>
        </header>

        {/* Tab buttons with shareable links */}
        <div className="flex gap-2">
          <TabBtn active={tab === "CAN"} onClick={() => select("CAN")} href="/auto-lab?tab=can">
            CAN Decoder
          </TabBtn>
          <TabBtn active={tab === "JD"} onClick={() => select("JD")} href="/auto-lab?tab=jd">
            JD → Skills Map
          </TabBtn>
          <TabBtn active={tab === "HIL"} onClick={() => select("HIL")} href="/auto-lab?tab=hil">
            HIL Test Plan
          </TabBtn>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "CAN" && <CanDecoder demoRef={canRef} />}
              {tab === "JD"  && <JDMap demoRef={jdRef} />}
              {tab === "HIL" && <HilPlan demoRef={hilRef} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-white/90">
          Quick links:
          <a className="underline ml-2" href="/auto-lab?tab=can">CAN</a> •
          <a className="underline ml-2" href="/auto-lab?tab=jd">JD Map</a> •
          <a className="underline ml-2" href="/auto-lab?tab=hil">HIL Plan</a>
        </div>
      </div>
    </div>
  );
}

/* ====== 1) CAN DECODER ====== */
type ParsedFrame = { t:number; id:number; bytes:number[] };
type Signal = { name:string; start:number; length:number; factor:number; offset:number; unit?:string };

const sampleDBC: Record<number, Signal[]> = {
  0x0CFF050: [
    { name:"VehicleSpeed", start:0,  length:16, factor:0.01, offset:0, unit:"km/h" },
    { name:"EngineRPM",    start:16, length:16, factor:0.25, offset:0, unit:"rpm"  },
  ],
};

function parseCan(text:string): ParsedFrame[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const out: ParsedFrame[] = [];
  for (const line of lines) {
    if (line.includes("#")) {
      const m = line.match(/^\(([\d.]+)\)\s+\S+\s+([0-9A-Fa-f]+)#([0-9A-Fa-f]+)/);
      if (!m) continue;
      const t = parseFloat(m[1]);
      const id = parseInt(m[2],16);
      const hex = m[3];
      const bytes:number[] = [];
      for (let i=0;i<hex.length;i+=2) bytes.push(parseInt(hex.slice(i,i+2),16));
      out.push({t, id, bytes});
    } else {
      const parts = line.split(/[,\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        const t = parseFloat(parts[0]);
        const id = parts[1].startsWith("0x") ? parseInt(parts[1],16) : parseInt(parts[1],10);
        const bytes = parts.slice(2).map(b=>parseInt(b,16));
        if (!Number.isNaN(id) && bytes.every(x=>!Number.isNaN(x))) out.push({t,id,bytes});
      }
    }
  }
  return out.sort((a,b)=>a.t-b.t);
}

function extractSignal(bytes:number[], start:number, length:number){
  let value = 0;
  for (let bit=0; bit<length; bit++){
    const absolute = start + bit;
    const byteIndex = Math.floor(absolute/8);
    const bitIndex  = absolute % 8;
    const bitVal = ((bytes[byteIndex] ?? 0) >> bitIndex) & 1;
    value |= (bitVal << bit);
  }
  return value;
}

function CanDecoder({ demoRef }:{ demoRef?: React.MutableRefObject<any|null> }){
  const [text,setText] = useState<string>("");
  const [decoded,setDecoded] = useState<{t:number; [k:string]:number}[]>([]);
  const [error,setError] = useState<string>("");

  useEffect(()=>{
    if (demoRef) {
      demoRef.current = {
        setText: (s:string)=>setText(s),
        run: ()=>run()
      };
    }
  },[demoRef]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then(setText);
  }

  function run(){
    try {
      const frames = parseCan(text);
      const rows: {t:number; [k:string]:number}[] = [];
      for (const fr of frames){
        const signals = sampleDBC[fr.id];
        if (!signals) continue;
        const row:any = { t: fr.t };
        for (const s of signals){
          const raw = extractSignal(fr.bytes, s.start, s.length);
          row[s.name] = raw * s.factor + s.offset;
        }
        rows.push(row);
      }
      setDecoded(rows);
      setError("");
    } catch (e:any){
      setError(e.message || "Parse error");
    }
  }

  const preview = useMemo(()=>{
    if (decoded.length===0) return null;
    const last = decoded[decoded.length-1];
    const names = Object.keys(last).filter(k=>k!=="t");
    return (
      <motion.div
        className="grid md:grid-cols-2 gap-4"
        initial="hidden" animate="show"
        variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.06 } } }}
      >
        {names.map(n=>(
          <motion.div key={n} className="p-3 rounded-lg border"
            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
            <div className="text-sm text-gray-600 mb-1">{n}</div>
            <div className="text-2xl font-semibold">{(decoded[decoded.length-1] as any)[n].toFixed(2)}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  },[decoded]);

  const sampleHelp = `# Paste your CAN log here or choose a file.
# CSV: "t,id_hex,b0..b7"
# 0.001,0x0CFF050,00,10,34,12,00,00,00,00
# candump: "(123.456) can0 0CFF050#0010341200000000"`;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">CAN Log Decoder</h2>
      <p className="text-gray-600">Upload a CAN log (CSV or candump) and decode <strong>VehicleSpeed</strong> + <strong>EngineRPM</strong>.</p>
      <div className="flex gap-2">
        <input type="file" accept=".txt,.log,.csv" onChange={onFile}/>
        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={run}>Decode</button>
      </div>
      <textarea className="w-full h-48 border rounded p-2 font-mono text-sm" placeholder={sampleHelp} value={text} onChange={e=>setText(e.target.value)} />
      {error && <div className="text-red-600">{error}</div>}
      {decoded.length>0 && (
        <>
          <div className="text-sm text-gray-600">Decoded {decoded.length} frames.</div>
          {preview}
          <div className="overflow-x-auto mt-3">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr><th className="px-2 py-1 text-left">t</th><th className="px-2 py-1 text-left">VehicleSpeed</th><th className="px-2 py-1 text-left">EngineRPM</th></tr>
              </thead>
              <tbody>
                {decoded.slice(-20).map((r,i)=>(
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{r.t.toFixed(3)}</td>
                    <td className="px-2 py-1">{(r as any).VehicleSpeed?.toFixed(2)}</td>
                    <td className="px-2 py-1">{(r as any).EngineRPM?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ====== 2) JD -> Skills Map ====== */
const ONTOLOGY: Record<string,string[]> = {
  ADAS:["lane","radar","camera","fusion","perception","adas","acc","lka","ldw"],
  AUTOSAR:["autosar","rte","arxml","swc","classic","adaptive"],
  "ISO 26262":["iso 26262","functional safety","fusa","safety goal","asil"],
  ASPICE:["aspice","v-model","process","sys.2","eng.5"],
  HIL:["hil","hardware-in-the-loop","dspace","vector vt","ni"],
  SIL:["sil","software-in-the-loop","model-in-the-loop","mil"],
  ROS2:["ros2","dds","colcon","nav2"],
  CAN:["can","canfd","dbc","candump","canalyzer","canoe"],
  UDS:["uds","iso 14229","diagnostic","dtc","pdu"],
  LANG:["c++","c ","python","matlab","simulink","rust"],
  CLOUD:["aws","azure","gcp","kubernetes","docker","microservices"],
  TOOLS:["vector","canalyzer","canoe","capl","jira","git","jenkins"],
};

function JDMap({ demoRef }:{ demoRef?: React.MutableRefObject<any|null> }){
  const [jd,setJd] = useState("");
  const [skills,setSkills] = useState<string[]>([]);
  const [gaps,setGaps] = useState<string[]>([]);
  const [mySkills,setMySkills] = useState("C/C++, Python, CAN, UDS, AUTOSAR Classic, ISO 26262 basics, Git, Jenkins");

  useEffect(()=>{
    if (demoRef) {
      demoRef.current = {
        setJD: (s:string)=>setJd(s),
        analyze: ()=>analyze()
      };
    }
  },[demoRef]);

  function analyze(){
    const text = jd.toLowerCase();
    const hits:string[] = [];
    for (const [k, kws] of Object.entries(ONTOLOGY)) if (kws.some(w=>text.includes(w))) hits.push(k);
    setSkills(hits.sort());
    const mine = (mySkills.toLowerCase().match(/[a-z0-9\+\.\s-]+/g)||[]).join(" ");
    const missing = Object.keys(ONTOLOGY).filter(k => !hits.includes(k) && !mine.includes(k.toLowerCase()));
    setGaps(missing);
  }

  const plan = useMemo(()=>(
    gaps.slice(0,3).map(g=>{
      if (g==="AUTOSAR") return `AUTOSAR: sample SWC + stub RTE in C++ (1–2 days).`;
      if (g==="HIL") return `HIL: fault-injection cases for ACC (timeout, stuck-at) + pass/fail (1 day).`;
      if (g==="ISO 26262") return `ISO 26262: HARA for ACC → ASIL-B safety goal + FSC (1–2 days).`;
      if (g==="ROS2") return `ROS2: pub/sub demo with nav message (1 day).`;
      return `${g}: 1-page cheat sheet + 30-min demo.`;
    })
  ),[gaps]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">JD → Skills Map</h2>
      <p className="text-gray-600">Paste a job description, auto-tag domains & get a short study plan.</p>
      <textarea className="w-full h-40 border rounded p-2" placeholder="Paste job description here…" value={jd} onChange={e=>setJd(e.target.value)} />
      <div className="flex flex-col sm:flex-row gap-3">
        <textarea className="flex-1 h-28 border rounded p-2" placeholder="Your core skills…" value={mySkills} onChange={e=>setMySkills(e.target.value)} />
        <button onClick={analyze} className="px-3 py-2 rounded-lg bg-blue-600 text-white self-start">Analyze</button>
      </div>

      {skills.length>0 && (
        <div>
          <div className="font-semibold mb-1">Detected domains:</div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s=><span key={s} className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{s}</span>)}
          </div>
        </div>
      )}

      {plan.length>0 && (
        <div>
          <div className="font-semibold mb-1">2-week quick study plan:</div>
          <ul className="list-disc ml-6 text-sm">
            {plan.map((s,i)=><li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ====== 3) HIL TEST PLAN ====== */
type TestRow = { id:number; pre:string; step:string; expected:string };

function HilPlan({ demoRef }:{ demoRef?: React.MutableRefObject<any|null> }){
  const [feature,setFeature] = useState("Cruise Control (ACC)");
  const [rows,setRows] = useState<TestRow[]>([]);

  useEffect(()=>{
    if (demoRef) {
      demoRef.current = {
        setFeature: (s:string)=>setFeature(s),
        generate: ()=>generate()
      };
    }
  },[demoRef]);

  function generate(){
    setRows([
      { id:1, pre:"Vehicle speed ≥ 40 km/h; radar valid", step:"Press ACC ON then SET at 60 km/h", expected:"Set speed = 60; vehicle maintains 60 on level road" },
      { id:2, pre:"ACC active at 60; lead vehicle at 50", step:"Approach lead vehicle", expected:"Ego decelerates; time gap maintained (≥ selected)" },
      { id:3, pre:"ACC following; lead vehicle brakes hard", step:"Lead decelerates 4 m/s²", expected:"Ego brakes; no collision; warning if decel limit exceeded" },
      { id:4, pre:"ACC active", step:"Inject radar timeout (HIL fault)", expected:"ACC gracefully disengages; driver alert" },
      { id:5, pre:"ACC active", step:"Inject sensor stuck-at for speed", expected:"Fault detected; limp strategy; DTC logged (UDS)" },
    ]);
  }

  function downloadCSV(){
    const header = "Pre-conditions,Steps,Expected\n";
    const body = rows.map(r=>[r.pre,r.step,r.expected].map(v=>`"${v.replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([header+body], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hil_test_plan.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">HIL Test Plan Generator</h2>
      <div className="flex gap-2">
        <input className="border p-2 rounded w-full" value={feature} onChange={e=>setFeature(e.target.value)} />
        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={generate}>Generate</button>
        {rows.length>0 && <button className="px-3 py-2 rounded-lg border" onClick={downloadCSV}>Download CSV</button>}
      </div>

      {rows.length>0 && (
        <>
          <div className="text-gray-600">Feature: <strong>{feature}</strong></div>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Pre-conditions</th>
                  <th className="px-3 py-2 text-left">Steps</th>
                  <th className="px-3 py-2 text-left">Expected</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 align-top">{r.pre}</td>
                    <td className="px-3 py-2 align-top">{r.step}</td>
                    <td className="px-3 py-2 align-top">{r.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
