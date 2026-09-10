/* ============================================================
   AI for Virtual Assistants — Shared Course Script
   Client-side only. Progress + saved work live in localStorage
   under the "aiva:" namespace. No account, no server required.
   Ported from the Real Estate Support VA reference (RSVA) script.
   ============================================================ */

const AIVA = (() => {
  const STORE_KEY = "aiva:progress:v1";

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function writeStore(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  const SAVE_FAILED_MSG = "Progress could not be saved on this browser. Your work may not be available after you leave this page.";

  function markComplete(id, complete = true) {
    const store = readStore();
    store[id] = store[id] || {};
    store[id].complete = complete;
    store[id].ts = Date.now();
    const ok = writeStore(store);
    toast(ok ? (complete ? "Saved — marked complete." : "Saved.") : SAVE_FAILED_MSG);
    document.dispatchEvent(new CustomEvent("aiva:progress-changed", { detail: { id, complete, ok } }));
    return ok;
  }

  function isComplete(id) {
    const store = readStore();
    return !!(store[id] && store[id].complete);
  }

  function saveField(id, value) {
    const store = readStore();
    store[id] = store[id] || {};
    store[id].value = value;
    store[id].ts = Date.now();
    return writeStore(store);
  }

  function saveFieldWithToast(id, value) {
    const ok = saveField(id, value);
    toast(ok ? "Saved." : SAVE_FAILED_MSG);
    return ok;
  }

  function getField(id, fallback = "") {
    const store = readStore();
    return store[id] && typeof store[id].value !== "undefined" ? store[id].value : fallback;
  }

  function completionCount(ids) {
    return ids.filter((id) => isComplete(id)).length;
  }

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".save-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "save-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  /* ---------- Mobile lesson-rail toggle ---------- */
  function initRailToggle() {
    const toggle = document.querySelector(".rail-toggle");
    const body = document.querySelector(".lesson-rail-body");
    if (!toggle || !body) return;
    toggle.addEventListener("click", () => {
      body.classList.toggle("open");
      const expanded = body.classList.contains("open");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
  }

  /* ---------- Reveal panels (practice-answer reveals) ---------- */
  function initReveals() {
    document.querySelectorAll("[data-reveal-btn]").forEach((btn) => {
      const targetId = btn.getAttribute("data-reveal-btn");
      const panel = document.getElementById(targetId);
      if (!panel) return;
      btn.addEventListener("click", () => {
        const isOpen = panel.classList.toggle("show");
        btn.textContent = isOpen ? btn.dataset.hideLabel || "Hide suggested answer" : btn.dataset.showLabel || "Show suggested answer";
        btn.setAttribute("aria-expanded", String(isOpen));
      });
    });
  }

  /* ---------- Autosaving textareas / text inputs / selects ---------- */
  const pendingAutosaveFields = new Set();

  function bindField(el) {
    if (el.dataset.aivaBound) return;
    el.dataset.aivaBound = "1";
    const id = el.getAttribute("data-save-id");
    const saved = getField(id, "");
    if (saved) el.value = saved;

    const doSave = () => {
      const ok = saveField(id, el.value);
      pendingAutosaveFields.delete(el);
      toast(ok ? "Saved." : SAVE_FAILED_MSG);
      return ok;
    };
    const debouncedSave = debounce(doSave, 700);

    const onInput = () => {
      pendingAutosaveFields.add(el);
      debouncedSave();
    };
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);

    el.addEventListener("blur", () => {
      if (pendingAutosaveFields.has(el)) debouncedSave.flush();
    });
  }
  function initAutosaveFields() {
    document.querySelectorAll("[data-save-id]").forEach(bindField);
  }

  function flushPendingAutosaves() {
    pendingAutosaveFields.forEach((el) => {
      const id = el.getAttribute("data-save-id");
      if (id) saveField(id, el.value);
    });
    pendingAutosaveFields.clear();
  }
  window.addEventListener("pagehide", flushPendingAutosaves);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingAutosaves();
  });

  function debounce(fn, wait) {
    let t;
    const debounced = (...args) => {
      clearTimeout(t);
      t = setTimeout(() => {
        t = null;
        fn(...args);
      }, wait);
    };
    debounced.flush = (...args) => {
      if (t) {
        clearTimeout(t);
        t = null;
        fn(...args);
      }
    };
    return debounced;
  }

  /* ---------- Mark-complete checkboxes ---------- */
  function initCompletionCheckboxes() {
    document.querySelectorAll("[data-complete-id]").forEach((el) => {
      const id = el.getAttribute("data-complete-id");
      el.checked = isComplete(id);
      el.addEventListener("change", () => {
        markComplete(id, el.checked);
        refreshRailAndProgress();
      });
    });
  }

  /* ---------- Checklists ---------- */
  function initChecklists() {
    document.querySelectorAll("[data-checklist-id]").forEach((el) => {
      const id = el.getAttribute("data-checklist-id");
      el.checked = isComplete(id);
      el.addEventListener("change", () => markComplete(id, el.checked));
    });
  }

  /* ---------- Decision (AI Can Help / Caution / Human) exercises ---------- */
  function initDecisionExercises() {
    document.querySelectorAll("[data-decision-exercise]").forEach((wrap) => {
      const correct = wrap.getAttribute("data-correct");
      const radios = wrap.querySelectorAll('input[type="radio"]');
      const feedback = wrap.querySelector(".feedback");
      const key = wrap.getAttribute("data-key");

      function showFeedback(value) {
        if (!feedback) return;
        const isRight = value === correct;
        feedback.classList.remove("correct", "neutral");
        feedback.classList.add(isRight ? "correct" : "neutral");
        feedback.classList.add("show");
      }

      // Restore a previously selected answer (this is part of the learner's
      // saved activity, same as any autosaved field) and show its feedback.
      if (key) {
        const savedValue = getField(key + ":selected", "");
        if (savedValue) {
          const savedRadio = wrap.querySelector(`input[type="radio"][value="${savedValue}"]`);
          if (savedRadio) {
            savedRadio.checked = true;
            showFeedback(savedValue);
          }
        }
      }

      radios.forEach((r) => {
        r.addEventListener("change", () => {
          showFeedback(r.value);
          if (key) {
            saveField(key + ":selected", r.value);
            markComplete(key, true);
          }
        });
      });
    });
  }

  /* ---------- Quiz engine (available for later modules with a knowledge check) ---------- */
  function initQuizzes() {
    document.querySelectorAll("[data-quiz]").forEach((quizEl) => {
      buildQuiz(quizEl);
    });
  }

  function buildQuiz(quizEl) {
    const questions = Array.from(quizEl.querySelectorAll(".quiz-question"));
    const stage = quizEl.querySelector(".quiz-stage");
    const nav = quizEl.querySelector(".quiz-nav");
    const progressEl = quizEl.querySelector(".quiz-progress");
    const resultEl = quizEl.querySelector(".quiz-result");
    const quizId = quizEl.getAttribute("data-quiz");
    let current = 0;
    const answers = new Array(questions.length).fill(null);

    function render() {
      questions.forEach((q, i) => (q.style.display = i === current ? "block" : "none"));
      if (progressEl) progressEl.textContent = `Question ${current + 1} of ${questions.length}`;
      nav.querySelector("[data-quiz-prev]").disabled = current === 0;
      const nextBtn = nav.querySelector("[data-quiz-next]");
      const submitBtn = nav.querySelector("[data-quiz-submit]");
      if (current === questions.length - 1) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "inline-flex";
      } else {
        nextBtn.style.display = "inline-flex";
        submitBtn.style.display = "none";
      }
    }

    questions.forEach((q, i) => {
      q.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", () => {
          answers[i] = input.value;
        });
      });
    });

    nav.querySelector("[data-quiz-prev]").addEventListener("click", () => {
      current = Math.max(0, current - 1);
      render();
    });
    nav.querySelector("[data-quiz-next]").addEventListener("click", () => {
      current = Math.min(questions.length - 1, current + 1);
      render();
    });
    nav.querySelector("[data-quiz-submit]").addEventListener("click", () => {
      let correctCount = 0;
      const rows = questions.map((q, i) => {
        const correctVal = q.getAttribute("data-correct");
        const isRight = answers[i] === correctVal;
        if (isRight) correctCount++;
        return {
          prompt: q.getAttribute("data-prompt-short") || `Question ${i + 1}`,
          isRight,
          explanation: q.getAttribute("data-explanation") || "",
        };
      });
      stage.style.display = "none";
      nav.style.display = "none";
      resultEl.style.display = "block";
      resultEl.querySelector(".quiz-result-badge").textContent = `${correctCount} / ${questions.length} correct`;
      const list = resultEl.querySelector(".quiz-summary-list");
      list.innerHTML = "";
      rows.forEach((r) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="mark ${r.isRight ? "right" : "wrong"}">${r.isRight ? "✓" : "✗"}</span><span>${r.prompt}${r.isRight ? "" : ` — ${r.explanation}`}</span>`;
        list.appendChild(li);
      });
      if (quizId) markComplete(quizId, true);
      refreshRailAndProgress();
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const retry = quizEl.querySelector("[data-quiz-retry]");
    if (retry) {
      retry.addEventListener("click", () => {
        current = 0;
        answers.fill(null);
        questions.forEach((q) => q.querySelectorAll('input[type="radio"]').forEach((i) => (i.checked = false)));
        stage.style.display = "block";
        nav.style.display = "flex";
        resultEl.style.display = "none";
        render();
        quizEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    render();
  }

  /* ---------- Rail progress refresh ---------- */
  function refreshRailAndProgress() {
    document.querySelectorAll(".lesson-rail a[data-progress-id]").forEach((a) => {
      const id = a.getAttribute("data-progress-id");
      a.classList.toggle("done", isComplete(id));
    });
    document.querySelectorAll("[data-complete-id]").forEach((el) => {
      const id = el.getAttribute("data-complete-id");
      const done = isComplete(id);
      if (el.checked !== done) el.checked = done;
    });
    const idsAttr = document.body.getAttribute("data-module-ids");
    if (idsAttr) {
      const ids = idsAttr.split(",").filter(Boolean);
      const done = completionCount(ids);
      document.querySelectorAll(".route-progress .dots .dot").forEach((dot, i) => {
        dot.classList.toggle("done", i < done);
      });
      document.querySelectorAll("[data-progress-fraction]").forEach((el) => {
        el.textContent = `${done} / ${ids.length}`;
      });
    }
  }

  function init() {
    initRailToggle();
    initReveals();
    initAutosaveFields();
    initCompletionCheckboxes();
    initChecklists();
    initDecisionExercises();
    initQuizzes();
    refreshRailAndProgress();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { markComplete, isComplete, saveField, saveFieldWithToast, getField, completionCount, toast, refreshRailAndProgress, bindField };
})();
