/* AI for Virtual Assistants — course data model
   Source of truth for structure only (titles/order). Lesson CONTENT lives in
   each lesson's own index.html per the locked master doc — this file is not
   a content store, just navigation + progress bookkeeping. */

const COURSE_DATA = {
  title: "AI for Virtual Assistants",
  subtitle: "Practical AI Skills for Real Client Work",
  client: "BrightPath Learning Co.",
  modules: [
    {
      id: 1,
      slug: "module-1",
      title: "AI-Assisted VA Mindset & Responsible Use",
      lessons: [
        { id: "1.1", slug: "lesson-1-1", title: "AI Is Changing VA Work", type: "concept" },
        { id: "1.2", slug: "lesson-1-2", title: "AI Is Your Assistant, Not Your Replacement", type: "concept" },
        { id: "1.3", slug: "lesson-1-3", title: "What Should You Give AI?", type: "concept" },
        { id: "1.4", slug: "lesson-1-4", title: "Protecting Client Information", type: "safety" },
        { id: "1.5", slug: "lesson-1-5", title: "AI Can Sound Confident and Still Be Wrong", type: "concept" }
      ]
    },
    {
      id: 2,
      slug: "module-2",
      title: "Getting Useful Results From AI",
      lessons: [
        { id: "2.1", slug: "lesson-2-1", title: "Start With the Actual Task", type: "skill" },
        { id: "2.2", slug: "lesson-2-2", title: "Give AI the Right Context", type: "skill" },
        { id: "2.3", slug: "lesson-2-3", title: "Tell AI What a Useful Result Looks Like", type: "skill" },
        { id: "2.4", slug: "lesson-2-4", title: "Work in Rounds", type: "skill" },
        { id: "2.5", slug: "lesson-2-5", title: "AI-Assisted Workflow: From Request to Deliverable", type: "skill" }
      ]
    },
    {
      id: 3,
      slug: "module-3",
      title: "AI for Communication",
      lessons: [
        { id: "3.1", slug: "lesson-3-1", title: "Writing Client Emails With AI", type: "communication" },
        { id: "3.2", slug: "lesson-3-2", title: "Customer Service Responses", type: "communication" },
        { id: "3.3", slug: "lesson-3-3", title: "Tone Is Part of the Job", type: "communication" },
        { id: "3.4", slug: "lesson-3-4", title: "Working With International Clients", type: "communication" },
        { id: "3.5", slug: "lesson-3-5", title: "Recognizing and Removing AI Slop", type: "communication" },
        { id: "3.6", slug: "lesson-3-6", title: "Async Communication: EODs, Weekly Updates & Handoffs", type: "communication" },
        { id: "3.7", slug: "lesson-3-7", title: "Scheduling, Coordination & Time Zones", type: "communication" }
      ]
    },
    {
      id: 4,
      slug: "module-4",
      title: "AI for Research, Summarizing & Information",
      lessons: [
        { id: "4.1", slug: "lesson-4-1", title: "AI as a Research Assistant", type: "research" },
        { id: "4.2", slug: "lesson-4-2", title: "Summarizing Long Information", type: "research" },
        { id: "4.3", slug: "lesson-4-3", title: "Extracting and Organizing Information", type: "research" },
        { id: "4.4", slug: "lesson-4-4", title: "Verify Before You Use It", type: "verification" },
        { id: "4.5", slug: "lesson-4-5", title: "Build a Client-Ready Research Brief", type: "research" }
      ]
    },
    {
      id: 5,
      slug: "module-5",
      title: "AI for Admin, Documentation & Operations",
      lessons: [
        { id: "5.1", slug: "lesson-5-1", title: "From Messy Input to Useful Output", type: "admin" },
        { id: "5.2", slug: "lesson-5-2", title: "AI for SOPs", type: "admin" },
        { id: "5.3", slug: "lesson-5-3", title: "Checklists and Task Management", type: "admin" },
        { id: "5.4", slug: "lesson-5-4", title: "Reports and Status Updates", type: "admin" },
        { id: "5.5", slug: "lesson-5-5", title: "Spreadsheet Assistance: Formulas and Organization", type: "data" },
        { id: "5.6", slug: "lesson-5-6", title: "Spreadsheet Assistance: Data Understanding", type: "data" },
        { id: "5.7", slug: "lesson-5-7", title: "Process Improvement", type: "admin" }
      ]
    },
    {
      id: 6,
      slug: "module-6",
      title: "Choosing the Right AI Tool",
      lessons: [
        { id: "6.1", slug: "lesson-6-1", title: "The Core Three", type: "tool" },
        { id: "6.2", slug: "lesson-6-2", title: "Same Task, Three Tools", type: "tool" },
        { id: "6.3", slug: "lesson-6-3", title: "Tool Strengths Change", type: "tool" },
        { id: "6.4", slug: "lesson-6-4", title: "Choosing a Tool for the Job", type: "tool" },
        { id: "6.5", slug: "lesson-6-5", title: "Don't Become a Tool Fan", type: "tool" }
      ]
    },
    {
      id: 7,
      slug: "module-7",
      title: "Proving Your AI-Assisted VA Skills",
      lessons: [
        { id: "7.1", slug: "lesson-7-1", title: "Capstone Brief: Meet the Client", type: "capstone" },
        { id: "7.2", slug: "lesson-7-2", title: "Build the AI-Assisted Client Operations Package", type: "capstone" },
        { id: "7.3", slug: "lesson-7-3", title: "Audit, Correct and Finalize", type: "capstone" },
        { id: "7.4", slug: "lesson-7-4", title: "Portfolio Evidence and AI-Use Explanation", type: "capstone" }
      ]
    }
  ]
};

// Flat lookup helpers
COURSE_DATA.allLessons = COURSE_DATA.modules.flatMap(m =>
  m.lessons.map(l => ({ ...l, moduleId: m.id, moduleSlug: m.slug, moduleTitle: m.title }))
);

COURSE_DATA.getLessonById = function (id) {
  return COURSE_DATA.allLessons.find(l => l.id === id) || null;
};

COURSE_DATA.getNeighbors = function (id) {
  const idx = COURSE_DATA.allLessons.findIndex(l => l.id === id);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? COURSE_DATA.allLessons[idx - 1] : null,
    next: idx < COURSE_DATA.allLessons.length - 1 ? COURSE_DATA.allLessons[idx + 1] : null
  };
};

COURSE_DATA.lessonPath = function (l) {
  return `/${l.moduleSlug}/${l.slug}/`;
};
