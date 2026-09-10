/* AI for Virtual Assistants — local progress store.
   No login, no server, no analytics call. Everything lives in this browser's
   localStorage under one key. If the learner clears browser data or switches
   devices, progress is gone — the "Before You Start" notice on the homepage
   and every lesson footer says this plainly. */

const AIVA_STORAGE_KEY = "aiva_progress_v1";

const AIVAProgress = {
  _read() {
    try {
      const raw = localStorage.getItem(AIVA_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { lessons: {}, capstone: {} };
    } catch (e) {
      console.warn("AIVAProgress: could not read local storage", e);
      return { lessons: {}, capstone: {} };
    }
  },

  _write(data) {
    try {
      localStorage.setItem(AIVA_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn("AIVAProgress: could not save to local storage", e);
      return false;
    }
  },

  // Mark a lesson complete. `evidence` is optional free-form data the lesson
  // wants to remember (e.g. which practice items the learner got right) —
  // used only to render this browser's own summary, never transmitted.
  markLessonComplete(lessonId, evidence) {
    const data = this._read();
    data.lessons[lessonId] = {
      status: "complete",
      completedAt: new Date().toISOString(),
      evidence: evidence || null
    };
    return this._write(data);
  },

  markLessonStarted(lessonId) {
    const data = this._read();
    if (!data.lessons[lessonId]) {
      data.lessons[lessonId] = { status: "started", startedAt: new Date().toISOString() };
      this._write(data);
    }
  },

  isLessonComplete(lessonId) {
    const data = this._read();
    return data.lessons[lessonId] && data.lessons[lessonId].status === "complete";
  },

  getLessonStatus(lessonId) {
    const data = this._read();
    if (!data.lessons[lessonId]) return "not-started";
    return data.lessons[lessonId].status; // "started" | "complete"
  },

  moduleProgress(moduleId) {
    const lessons = COURSE_DATA.modules.find(m => m.id === moduleId).lessons;
    const done = lessons.filter(l => this.isLessonComplete(l.id)).length;
    return { done, total: lessons.length };
  },

  courseProgress() {
    const total = COURSE_DATA.allLessons.length;
    const done = COURSE_DATA.allLessons.filter(l => this.isLessonComplete(l.id)).length;
    return { done, total };
  },

  // Wipe everything — used only by the explicit "Reset my progress" control.
  reset() {
    localStorage.removeItem(AIVA_STORAGE_KEY);
  }
};
