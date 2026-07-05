// ============================================================
// apps/web/src/app/tools/photo-signature-resizer/page.tsx
// 100% client-side Canvas photo/signature resizer
// ============================================================
"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Download, Image as ImageIcon, RefreshCw, Check, AlertCircle } from "lucide-react";

// Government presets
const PRESETS = [
  { label: "Photo — 20KB JPEG (Standard)",   maxKB: 20,  w: 200, h: 230, type: "image/jpeg", q: 0.75 },
  { label: "Photo — 50KB JPEG",               maxKB: 50,  w: 300, h: 350, type: "image/jpeg", q: 0.85 },
  { label: "Signature — 10KB JPEG",           maxKB: 10,  w: 140, h:  60, type: "image/jpeg", q: 0.65 },
  { label: "Signature — 20KB JPEG",           maxKB: 20,  w: 200, h:  80, type: "image/jpeg", q: 0.75 },
  { label: "Photo — 100KB PNG",               maxKB: 100, w: 400, h: 500, type: "image/png",  q: 1.0  },
  { label: "Custom",                          maxKB: 0,   w: 0,   h: 0,   type: "image/jpeg", q: 0.8  },
] as const;

function compressToTarget(
  canvas: HTMLCanvasElement,
  type: string,
  targetKB: number,
  maxIterations = 12
): string {
  if (type === "image/png") return canvas.toDataURL("image/png");
  let lo = 0.1, hi = 1.0, best = canvas.toDataURL(type, 0.7);
  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const data = canvas.toDataURL(type, mid);
    const kb = Math.round((data.length * 3) / 4 / 1024);
    if (kb <= targetKB) { best = data; lo = mid; }
    else hi = mid;
    if (hi - lo < 0.01) break;
  }
  return best;
}

export default function PhotoResizerPage() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [customW, setCustomW] = useState(200);
  const [customH, setCustomH] = useState(200);
  const [customKB, setCustomKB] = useState(20);
  const [srcDataUrl, setSrcDataUrl] = useState<string | null>(null);
  const [outDataUrl, setOutDataUrl] = useState<string | null>(null);
  const [outSizeKB, setOutSizeKB] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("output");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preset = PRESETS[presetIdx];
  const isCustom = preset.label === "Custom";
  const targetW  = isCustom ? customW  : preset.w;
  const targetH  = isCustom ? customH  : preset.h;
  const targetKB = isCustom ? customKB : preset.maxKB;
  const targetType = preset.type;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      setSrcDataUrl(e.target?.result as string);
      setOutDataUrl(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const process = useCallback(() => {
    if (!srcDataUrl || !canvasRef.current) return;
    setProcessing(true);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width  = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetW, targetH);

      // Maintain aspect ratio with cover crop
      const srcAspect = img.width / img.height;
      const dstAspect = targetW / targetH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcAspect > dstAspect) {
        sw = img.height * dstAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dstAspect;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

      const result = compressToTarget(canvas, targetType, targetKB);
      const kb = Math.round((result.length * 3) / 4 / 1024);
      setOutDataUrl(result);
      setOutSizeKB(kb);
      setProcessing(false);
    };
    img.src = srcDataUrl;
  }, [srcDataUrl, targetW, targetH, targetKB, targetType]);

  const download = () => {
    if (!outDataUrl) return;
    const ext = targetType === "image/png" ? "png" : "jpg";
    const a = document.createElement("a");
    a.href = outDataUrl;
    a.download = `${fileName}_resized_${targetW}x${targetH}.${ext}`;
    a.click();
  };

  const meetsTarget = outSizeKB !== null && targetKB > 0 && outSizeKB <= targetKB;

  return (
    <main className="min-h-screen bg-[#F7F8FC] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <ImageIcon size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Photo & Signature Resizer</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Resize & compress to exact government specifications — 100% free, works offline
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Preset selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Preset</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setPresetIdx(i)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    presetIdx === i
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                  {p.label !== "Custom" && (
                    <span className="block text-xs font-normal text-gray-400 mt-0.5">
                      {p.w}×{p.h}px · Max {p.maxKB}KB
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom inputs */}
          {isCustom && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Width (px)", val: customW, set: setCustomW },
                { label: "Height (px)", val: customH, set: setCustomH },
                { label: "Max size (KB)", val: customKB, set: setCustomKB },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              srcDataUrl
                ? "border-blue-300 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {srcDataUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img src={srcDataUrl} alt="Source" className="max-h-32 rounded-lg shadow" />
                <p className="text-xs text-blue-600 font-medium">Click to change image</p>
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Drop image here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP supported</p>
              </>
            )}
          </div>

          {/* Process button */}
          <button
            onClick={process}
            disabled={!srcDataUrl || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><RefreshCw size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><ImageIcon size={16} /> Resize & Compress</>
            )}
          </button>

          {/* Output */}
          {outDataUrl && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className={`px-4 py-2.5 flex items-center gap-2 ${meetsTarget ? "bg-emerald-50" : "bg-yellow-50"}`}>
                {meetsTarget
                  ? <Check size={15} className="text-emerald-600" />
                  : <AlertCircle size={15} className="text-yellow-600" />}
                <span className={`text-sm font-semibold ${meetsTarget ? "text-emerald-700" : "text-yellow-700"}`}>
                  Output: {outSizeKB}KB · {targetW}×{targetH}px ·{" "}
                  {targetType === "image/jpeg" ? "JPEG" : "PNG"}
                  {!meetsTarget && targetKB > 0 && " (try reducing quality or dimensions)"}
                </span>
              </div>
              <div className="p-4 flex flex-col items-center gap-3">
                <img src={outDataUrl} alt="Output" className="max-h-40 rounded-lg shadow border border-gray-200" />
                <button
                  onClick={download}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Download size={15} /> Download Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/tools/sarkari-age-calculator/page.tsx
// Precision age calculator with cutoff date & relaxation
// ============================================================
"use client";
import { useState, useMemo } from "react";
import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { label: "General / EWS", relaxation: 0 },
  { label: "OBC (Non-Creamy Layer)", relaxation: 3 },
  { label: "SC / ST", relaxation: 5 },
  { label: "PwD (General)", relaxation: 10 },
  { label: "PwD (OBC)", relaxation: 13 },
  { label: "PwD (SC/ST)", relaxation: 15 },
  { label: "Ex-Serviceman (General)", relaxation: 3 },
  { label: "Ex-Serviceman (OBC)", relaxation: 6 },
  { label: "Ex-Serviceman (SC/ST)", relaxation: 8 },
];

function calcAge(dob: Date, cutoff: Date): { years: number; months: number; days: number } {
  let years  = cutoff.getFullYear() - dob.getFullYear();
  let months = cutoff.getMonth()    - dob.getMonth();
  let days   = cutoff.getDate()     - dob.getDate();
  if (days < 0) { months--; days += new Date(cutoff.getFullYear(), cutoff.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

export default function AgeCalculatorPage() {
  const [dob, setDob] = useState("");
  const [cutoff, setCutoff] = useState(new Date().toISOString().slice(0, 10));
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(27);
  const [categoryIdx, setCategoryIdx] = useState(0);

  const result = useMemo(() => {
    if (!dob || !cutoff) return null;
    const dobDate    = new Date(dob);
    const cutoffDate = new Date(cutoff);
    if (dobDate >= cutoffDate) return null;
    const age = calcAge(dobDate, cutoffDate);
    const category = CATEGORIES[categoryIdx];
    const effectiveMax = maxAge + category.relaxation;
    const eligible = age.years >= minAge && age.years < effectiveMax ||
      (age.years === effectiveMax && age.months === 0 && age.days === 0);
    return { age, effectiveMax, relaxation: category.relaxation, eligible, category };
  }, [dob, cutoff, minAge, maxAge, categoryIdx]);

  return (
    <main className="min-h-screen bg-[#F7F8FC] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Calendar size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sarkari Age Calculator</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Calculate exact age as on recruitment cutoff date with category relaxation
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* DOB */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              max={cutoff}
              onChange={(e) => setDob(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Cutoff date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recruitment Age Cutoff Date
            </label>
            <input
              type="date"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <p className="text-xs text-gray-400 mt-1">
              Usually mentioned as "Age as on DD/MM/YYYY" in the notification
            </p>
          </div>

          {/* Age limit range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Min Age</label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Age (General)</label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Category
            </label>
            <select
              value={categoryIdx}
              onChange={(e) => setCategoryIdx(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            >
              {CATEGORIES.map((c, i) => (
                <option key={c.label} value={i}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border-2 p-5 ${
              result.eligible
                ? "border-emerald-300 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {result.eligible
                  ? <CheckCircle size={20} className="text-emerald-600" />
                  : <XCircle size={20} className="text-red-500" />}
                <p className={`font-bold text-lg ${result.eligible ? "text-emerald-800" : "text-red-700"}`}>
                  {result.eligible ? "✅ You are Eligible!" : "❌ Not Eligible"}
                </p>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Age on Cutoff Date</span>
                  <strong className="text-gray-900 tabular-nums">
                    {result.age.years}y {result.age.months}m {result.age.days}d
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age Limit (General)</span>
                  <strong className="text-gray-900">{minAge} – {maxAge} years</strong>
                </div>
                {result.relaxation > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Relaxation ({result.category.label})</span>
                    <strong className="text-emerald-700">+{result.relaxation} years</strong>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                  <span className="font-semibold text-gray-700">Effective Max Age for You</span>
                  <strong className="text-violet-700 text-base">{result.effectiveMax} years</strong>
                </div>
              </div>

              {!result.eligible && (
                <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-lg p-3">
                  <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    Your age ({result.age.years} years) exceeds the effective maximum age of{" "}
                    {result.effectiveMax} years for {result.category.label} category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


// ============================================================
// apps/web/src/app/tools/smart-eligibility-engine/page.tsx
// Profile-based eligibility wizard
// ============================================================
"use client";
import { useState, useEffect } from "react";
import { Zap, ChevronRight, Loader2, BookOpen, MapPin, User } from "lucide-react";

const QUALIFICATIONS = [
  { label: "10th Pass", slug: "10th-pass" },
  { label: "12th Pass", slug: "12th-pass" },
  { label: "ITI",       slug: "iti" },
  { label: "Diploma",   slug: "diploma" },
  { label: "Graduate",  slug: "graduate" },
  { label: "B.Tech",    slug: "btech" },
  { label: "Post Graduate", slug: "post-graduate" },
  { label: "MBBS",      slug: "mbbs" },
  { label: "LLB",       slug: "llb" },
];

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "PwD"];

const STATES = [
  "All India", "Uttar Pradesh", "Bihar", "Rajasthan", "Madhya Pradesh",
  "Maharashtra", "Gujarat", "West Bengal", "Karnataka", "Tamil Nadu",
  "Andhra Pradesh", "Telangana", "Haryana", "Punjab", "Delhi",
  "Jharkhand", "Odisha", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh",
];

interface EligibleJob {
  id: string; slug: string; title: string; department: string;
  totalVacancies: number | null; applicationEndDate: string | null;
  payScaleText: string | null; status: string;
}

interface Profile {
  dob: string; category: string;
  qualifications: string[]; state: string;
}

function saveProfile(p: Profile) {
  try { localStorage.setItem("eligibility_profile", JSON.stringify(p)); } catch {}
}
function loadProfile(): Profile | null {
  try {
    const s = localStorage.getItem("eligibility_profile");
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function EligibilityEnginePage() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [dob, setDob] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedQuals, setSelectedQuals] = useState<string[]>([]);
  const [state, setState] = useState("All India");
  const [jobs, setJobs] = useState<EligibleJob[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setDob(p.dob); setCategory(p.category);
      setSelectedQuals(p.qualifications); setState(p.state);
    }
  }, []);

  const toggleQual = (slug: string) =>
    setSelectedQuals((prev) =>
      prev.includes(slug) ? prev.filter((q) => q !== slug) : [...prev, slug]
    );

  const handleFind = async () => {
    if (!dob || selectedQuals.length === 0) return;
    const profile: Profile = { dob, category, qualifications: selectedQuals, state };
    saveProfile(profile);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        dob, category, state,
        qualifications: selectedQuals.join(","),
      });
      const res = await fetch(`/api/eligibility?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setStep("results");
    } catch {
      setJobs([]);
      setStep("results");
    } finally {
      setLoading(false);
    }
  };

  const age = dob
    ? Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <main className="min-h-screen bg-[#F7F8FC] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Smart Eligibility Engine</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Enter your profile once — instantly see every job you're eligible for
          </p>
        </div>

        {step === "form" ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            {/* DOB */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <User size={14} /> Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              {age !== null && (
                <p className="text-xs text-gray-400 mt-1">You are {age} years old</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      category === c
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Qualifications — multi-select */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                <BookOpen size={14} /> Highest Qualification(s)
              </label>
              <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUALIFICATIONS.map((q) => {
                  const selected = selectedQuals.includes(q.slug);
                  return (
                    <button
                      key={q.slug}
                      onClick={() => toggleQual(q.slug)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${
                        selected
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* State */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <MapPin size={14} /> Preferred State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <button
              onClick={handleFind}
              disabled={!dob || selectedQuals.length === 0 || loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Finding jobs...</>
              ) : (
                <><Zap size={16} /> Find My Eligible Jobs</>
              )}
            </button>
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {jobs.length} Eligible Jobs Found
              </h2>
              <button
                onClick={() => setStep("form")}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                ← Edit Profile
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <Zap size={30} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-500">No matching jobs found right now</p>
                <p className="text-sm text-gray-400 mt-1">Try updating your qualification or state filters</p>
              </div>
            ) : (
              jobs.map((job) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.slug}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 line-clamp-2 transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.department}</p>
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {job.totalVacancies && (
                          <span className="text-xs text-gray-500 tabular-nums">
                            👥 {job.totalVacancies.toLocaleString("en-IN")} posts
                          </span>
                        )}
                        {job.applicationEndDate && (
                          <span className="text-xs text-gray-500">
                            📅 {new Date(job.applicationEndDate).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                        {job.payScaleText && (
                          <span className="text-xs text-emerald-600 font-medium">
                            ₹ {job.payScaleText}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-blue-500">
                      <span className="text-xs font-semibold">View</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
