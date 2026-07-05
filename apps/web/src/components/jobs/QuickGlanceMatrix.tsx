// ============================================================
// apps/web/src/components/jobs/QuickGlanceMatrix.tsx
// AI-structured info grid: Dates | Fees | Vacancies | Age
// ============================================================

import { Calendar, CreditCard, Users, Clock, IndianRupee, BadgeCheck } from "lucide-react";

interface Job {
  applicationStartDate: Date | null;
  applicationEndDate: Date | null;
  lastFeePaymentDate: Date | null;
  examDate: Date | null;
  admitCardDate: Date | null;
  resultDate: Date | null;
  ageCutoffDate: Date | null;
  feeGeneral: number | null;
  feeOBCEWS: number | null;
  feeSCSTFemale: number | null;
  feeExServiceman: number | null;
  feePaymentMode: string | null;
  totalVacancies: number | null;
  vacancyBreakdown: any;
  postWiseVacancies: any;
  ageMinYears: number | null;
  ageMaxYears: number | null;
  ageRelaxationJson: any;
  payScaleMin: number | null;
  payScaleMax: number | null;
  payScaleText: string | null;
  payBand: string | null;
}

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Cell({ label, value, highlight = false }: {
  label: string; value: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-blue-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">
      <Icon size={14} className="text-gray-400" /> {title}
    </h3>
  );
}

export function QuickGlanceMatrix({ job }: { job: Job }) {
  const vacancyBreakdown: Record<string, number> = job.vacancyBreakdown ?? {};
  const postWiseVacancies: Array<{ post: string; vacancies: number; payScale?: string }> =
    job.postWiseVacancies ?? [];
  const ageRelaxation: Record<string, any> = job.ageRelaxationJson ?? {};

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3.5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <BadgeCheck size={15} className="text-blue-400" />
          Quick Glance Summary
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">All key details in one place</p>
      </div>

      <div className="p-5 space-y-6">

        {/* KEY DATES */}
        <div>
          <SectionHeader icon={Calendar} title="Key Dates" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Cell label="Notification Date" value={fmt(job.applicationStartDate)} />
            <Cell label="Apply Start" value={fmt(job.applicationStartDate)} />
            <Cell
              label="Apply Last Date"
              value={fmt(job.applicationEndDate)}
              highlight={!!job.applicationEndDate}
            />
            {job.lastFeePaymentDate && (
              <Cell label="Last Fee Payment" value={fmt(job.lastFeePaymentDate)} />
            )}
            {job.admitCardDate && (
              <Cell label="Admit Card" value={fmt(job.admitCardDate)} />
            )}
            {job.examDate && (
              <Cell label="Exam Date" value={fmt(job.examDate)} highlight />
            )}
            {job.resultDate && (
              <Cell label="Result Date" value={fmt(job.resultDate)} />
            )}
            {job.ageCutoffDate && (
              <Cell label="Age Cutoff Date" value={fmt(job.ageCutoffDate)} />
            )}
          </div>
        </div>

        {/* APPLICATION FEE */}
        {(job.feeGeneral || job.feeOBCEWS || job.feeSCSTFemale != null) && (
          <div>
            <SectionHeader icon={IndianRupee} title="Application Fee" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {job.feeGeneral != null && (
                <Cell label="General / OBC" value={`₹${job.feeGeneral}`} highlight />
              )}
              {job.feeOBCEWS != null && (
                <Cell label="OBC / EWS" value={`₹${job.feeOBCEWS}`} />
              )}
              {job.feeSCSTFemale != null && (
                <Cell
                  label="SC / ST / Female"
                  value={job.feeSCSTFemale === 0 ? "NIL" : `₹${job.feeSCSTFemale}`}
                />
              )}
              {job.feeExServiceman != null && (
                <Cell
                  label="Ex-Serviceman"
                  value={job.feeExServiceman === 0 ? "NIL" : `₹${job.feeExServiceman}`}
                />
              )}
            </div>
            {job.feePaymentMode && (
              <p className="text-xs text-gray-500 mt-2">
                💳 Payment Mode: <strong>{job.feePaymentMode}</strong>
              </p>
            )}
          </div>
        )}

        {/* VACANCIES */}
        {(job.totalVacancies || postWiseVacancies.length > 0) && (
          <div>
            <SectionHeader icon={Users} title="Vacancy Details" />
            {job.totalVacancies && (
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums mb-3">
                {job.totalVacancies.toLocaleString("en-IN")}
                <span className="text-sm font-normal text-gray-400 ml-1">total posts</span>
              </p>
            )}

            {/* Category breakdown */}
            {Object.keys(vacancyBreakdown).length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {Object.entries(vacancyBreakdown).map(([cat, count]) => (
                  <div key={cat} className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center">
                    <p className="text-xs text-indigo-500 font-semibold">{cat}</p>
                    <p className="text-base font-bold text-indigo-800 tabular-nums">
                      {(count as number).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Post-wise breakdown table */}
            {postWiseVacancies.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Post Name</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Vacancies</th>
                      {postWiseVacancies[0]?.payScale && (
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Pay Scale</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {postWiseVacancies.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 text-gray-700">{row.post}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-800 tabular-nums">
                          {row.vacancies.toLocaleString("en-IN")}
                        </td>
                        {row.payScale && (
                          <td className="px-3 py-2 text-right text-gray-500">{row.payScale}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AGE LIMIT */}
        {(job.ageMinYears || job.ageMaxYears) && (
          <div>
            <SectionHeader icon={Clock} title="Age Limit" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {job.ageMinYears && <Cell label="Minimum Age" value={`${job.ageMinYears} years`} />}
              {job.ageMaxYears && (
                <Cell label="Maximum Age" value={`${job.ageMaxYears} years`} highlight />
              )}
            </div>
            {Object.keys(ageRelaxation).length > 0 && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Age Relaxation
                </p>
                <div className="space-y-1">
                  {Object.entries(ageRelaxation).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">{cat}</span>
                      <span className="text-gray-800 font-bold">
                        {typeof val === "number" ? `+${val} years` : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              💡{" "}
              <a href="/tools/sarkari-age-calculator" className="text-blue-500 hover:underline">
                Calculate your exact age eligibility →
              </a>
            </p>
          </div>
        )}

        {/* PAY SCALE */}
        {(job.payScaleText || job.payScaleMin) && (
          <div>
            <SectionHeader icon={CreditCard} title="Pay Scale" />
            {job.payScaleText ? (
              <p className="text-base font-bold text-emerald-700">{job.payScaleText}</p>
            ) : (
              <p className="text-base font-bold text-emerald-700 tabular-nums">
                ₹{job.payScaleMin?.toLocaleString("en-IN")}
                {job.payScaleMax ? ` – ₹${job.payScaleMax?.toLocaleString("en-IN")}` : "+"} / month
              </p>
            )}
            {job.payBand && (
              <p className="text-xs text-gray-500 mt-1">Pay Band: {job.payBand}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// apps/web/src/components/jobs/JobDetailSidebar.tsx
// Sticky desktop conversion sidebar
// ============================================================
"use client";
import { useState } from "react";
import { ExternalLink, FileText, Globe, BookOpen, Bell, CheckCircle, AlertTriangle } from "lucide-react";

interface SidebarProps {
  applyUrl: string | null;
  pdfUrl: string | null;
  officialUrl: string | null;
  syllabusUrl: string | null;
  applyLinkDown: boolean;
  pdfLinkDown: boolean;
  applicationEndDate: string | null;
  totalVacancies: number | null;
  payScaleText: string | null;
  jobTitle: string;
}

export function JobDetailSidebar({
  applyUrl, pdfUrl, officialUrl, syllabusUrl,
  applyLinkDown, pdfLinkDown,
  applicationEndDate, totalVacancies, payScaleText, jobTitle,
}: SidebarProps) {
  const [subscribed, setSubscribed] = useState(false);

  const daysLeft = applicationEndDate
    ? Math.ceil((new Date(applicationEndDate).getTime() - Date.now()) / 86400000)
    : null;

  const handleSubscribe = async () => {
    try {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          // Register service worker push subscription
          await fetch("/api/subscribe", { method: "POST" });
          setSubscribed(true);
        }
      }
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Urgency strip */}
      {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && (
        <div className={`px-4 py-2.5 text-xs font-bold text-center ${
          daysLeft <= 2
            ? "bg-red-500 text-white animate-pulse"
            : "bg-orange-100 text-orange-800"
        }`}>
          {daysLeft === 0
            ? "⚡ Last day to apply!"
            : daysLeft === 1
            ? "⚡ Only 1 day left!"
            : `⏰ ${daysLeft} days left to apply`}
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Stats */}
        {(totalVacancies || payScaleText) && (
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
            {totalVacancies && (
              <div className="text-center">
                <p className="text-xl font-extrabold text-gray-900 tabular-nums">
                  {totalVacancies.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">Vacancies</p>
              </div>
            )}
            {payScaleText && (
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-700 leading-tight">{payScaleText}</p>
                <p className="text-xs text-gray-400">Pay Scale</p>
              </div>
            )}
          </div>
        )}

        {/* Primary CTA — Apply Online */}
        {applyLinkDown ? (
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 font-medium">
              Govt Server Down / Try Later. Check back soon.
            </p>
          </div>
        ) : applyUrl ? (
          <a
            href={applyUrl}
            target="_blank" rel="noopener noreferrer"
            className="block w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-center py-3.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-blue-200"
          >
            Apply Online ↗
          </a>
        ) : (
          <button
            disabled
            className="block w-full bg-gray-100 text-gray-400 font-semibold text-center py-3.5 px-4 rounded-xl text-sm cursor-not-allowed"
          >
            Application Closed
          </button>
        )}

        {/* Secondary CTAs */}
        <div className="space-y-2">
          {pdfUrl && !pdfLinkDown && (
            <a
              href={pdfUrl}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 w-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium py-2.5 px-3.5 rounded-xl text-sm transition-colors"
            >
              <FileText size={15} /> Download Official Notification (PDF)
            </a>
          )}
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-2.5 px-3.5 rounded-xl text-sm transition-colors"
            >
              <Globe size={15} /> Official Portal
            </a>
          )}
          {syllabusUrl && (
            <a
              href={syllabusUrl}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-2.5 px-3.5 rounded-xl text-sm transition-colors"
            >
              <BookOpen size={15} /> View Syllabus
            </a>
          )}
        </div>

        {/* Push notification subscribe */}
        <div className="border-t border-gray-100 pt-3">
          {subscribed ? (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
              <CheckCircle size={13} />
              You'll get alerts for this job
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="flex items-center gap-2 w-full text-xs text-gray-500 hover:text-blue-600 transition-colors font-medium py-1"
            >
              <Bell size={13} /> Get notified about updates to this job
            </button>
          )}
        </div>

        {/* Tools links */}
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Free Tools
          </p>
          <a href="/tools/sarkari-age-calculator" className="block text-xs text-blue-500 hover:underline">
            → Check age eligibility for this job
          </a>
          <a href="/tools/photo-signature-resizer" className="block text-xs text-blue-500 hover:underline">
            → Resize photo/signature for application
          </a>
          <a href="/tools/smart-eligibility-engine" className="block text-xs text-blue-500 hover:underline">
            → Find all jobs you're eligible for
          </a>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// apps/web/src/components/jobs/JobDetailMobileActions.tsx
// Compact action block shown inline on mobile (not sticky)
// ============================================================
"use client";
import { ExternalLink, FileText, Globe, AlertTriangle } from "lucide-react";

export function JobDetailMobileActions({
  applyUrl, pdfUrl, officialUrl,
  applyLinkDown, pdfLinkDown,
}: {
  applyUrl: string | null;
  pdfUrl: string | null;
  officialUrl: string | null;
  applyLinkDown: boolean;
  pdfLinkDown: boolean;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
      {applyLinkDown ? (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-800 font-medium">
          <AlertTriangle size={13} className="text-yellow-600 shrink-0" />
          Govt Server Down / Try Later
        </div>
      ) : applyUrl ? (
        <a
          href={applyUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl"
        >
          Apply Online <ExternalLink size={13} />
        </a>
      ) : null}
      <div className="flex gap-2">
        {pdfUrl && !pdfLinkDown && (
          <a
            href={pdfUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium py-2.5 rounded-lg"
          >
            <FileText size={13} /> PDF
          </a>
        )}
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium py-2.5 rounded-lg"
          >
            <Globe size={13} /> Portal
          </a>
        )}
      </div>
    </div>
  );
}
