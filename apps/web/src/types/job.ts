export type JobStatus = "DRAFT"|"LIVE"|"CLOSING_SOON"|"CLOSED"|"ARCHIVED"|"RESULT_OUT";
export type PostType  = "ONLINE_FORM"|"ADMIT_CARD"|"RESULT"|"SYLLABUS"|"ANSWER_KEY"|"RECRUITMENT_NOTIFICATION";

export interface JobSummary {
  id: string; slug: string; title: string; shortTitle: string | null;
  department: string; stateName: string | null; stateSlug: string | null;
  isNational: boolean; postType: PostType; status: JobStatus;
  totalVacancies: number | null; payScaleText: string | null;
  payScaleMin: number | null; payScaleMax: number | null;
  applicationEndDate: string | null; notificationDate: string | null;
  qualificationLabels: string[]; applyOnlineUrl: string | null;
  notificationPdfUrl: string | null;
}
