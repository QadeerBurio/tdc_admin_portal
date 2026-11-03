// src/services/resumeStudioApi.js
// AI Resume Studio, employer side (server: routes/careerResume.routes.js, behind FLAG_RESUME_STUDIO_V2).
// The employer who posted the job sees which tailored resume version the candidate sent with this
// application, and downloads exactly that snapshot. Nothing else of the candidate's resumes: no drafts,
// no other versions. No version sent, the flag off, or not your job: the server says 404 and this
// returns null, so the drawer shows nothing.
import api from "./api";

export const resumeStudioApi = {
  attachedResume: (applicationId) =>
    api
      .get(`/career/resume/applications/${applicationId}/resume`)
      .then((r) => r.data?.data || null)
      .catch((e) => {
        if (e.response?.status === 404 || e.response?.status === 403) return null;
        throw new Error(e.response?.data?.error?.message || e.message || "request failed");
      }),
  // the snapshot PDF, saved through the browser
  downloadAttachedResume: async (applicationId, fileName) => {
    const res = await api.get(`/career/resume/applications/${applicationId}/resume.pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(fileName || "resume").replace(/[^A-Za-z0-9 ._-]/g, "").slice(0, 80) || "resume"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export default resumeStudioApi;
