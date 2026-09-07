# Bustan Academy role curriculum

All learning content is original teaching, with verified primary-source references. All user-facing text uses a translation object `{ "en": "...", "he": "...", "th": "..." }` (called T below). No HTML in data, except plain text mathematical notation. Never copy source passages. Do not claim training is professional licensure or authorization to perform hazardous work. Explain safety/approval boundaries within relevant decisions.

Each author writes one JSON file with `{ "tracks": [TRACK, TRACK], "sources": [SOURCE, ...] }`.

SOURCE: `{ "id": "unique-prefix-id", "title": "Official document title", "publisher": "...", "url": "https://...", "published": "Visible document date/version, or undated", "accessed": "2026-09-07", "scope": T }`. Source title/publisher may stay in original language. At least 10 useful primary sources per author; diverse, directly opened/read; source notes in research file. Respect limits on quotations/attributed paraphrase; most teaching should be original worked examples and application, not long source summaries.

TRACK: `{ "id": "installers", "title": T, "audience": T, "summary": T, "outcome": T, "capstone": { "title": T, "brief": T, "deliverables": [T,T,T], "rubric": [T,T,T], "supervised": true }, "lessons": [LESSON,...] }`

LESSON: `{ "num": 1, "title": T, "summary": T, "minutes": 40, "objectives": [T,T,T], "sections": [SECTION,...], "workedExample": { "title": T, "scenario": T, "steps": [T,T,T], "result": T }, "exercise": { "title": T, "brief": T, "deliverables": [T,T], "solution": T }, "checklist": [T,T,T], "quiz": [QUESTION,...], "sourceIds": ["source-id",...] }`

SECTION: `{ "title": T, "paragraphs": [T,T], "bullets": [T,T] (optional), "sourceIds": ["source-id"] }`

QUESTION: `{ "question": T, "options": [T,T,T,T], "correct": 0, "explanation": T }`. correct is zero-based. Exactly 5 questions per lesson. Vary correct positions. Questions should test practical distinctions, numerical reasoning and decisions, not just vocabulary. All correct answers must follow from the lesson. No trick/unbounded/unverifiable regulation questions. New lesson passing score is 80% (4/5). Each role has a capstone with evidence and human assessment; completing quizzes alone does not imply practical qualification.

Quality target per lesson: 4 substantial sections (each 2 paragraphs), a concrete island-property worked example, a different learner exercise with a collapsible model solution, a field/desk checklist, and 5 meaningful quiz questions with explanations. Aim for 450–700 original teaching words per language excluding questions, not terse outlines or repeated boilerplate. Thai can naturally use fewer whitespace-delimited words. Depth and correctness matter more than a rigid word count. Longer lessons allowed when necessary. Clearly label invented numbers/scenarios as training assumptions. If an actual current tariff/rule is taught, include applicable category, effective date and primary-source citation. Avoid fake actual customer data. Do not call administrative models implemented legal requirements. Do not claim exact current requirements from a search snippet alone.

Stable track IDs: `foundation` (root), `installers` and `service` (technical author), `sales` and `finance` (commercial author), `leadership` and `design-permitting` (planning/management author).

Author each role as 9 lessons (18 total per author), with lesson 9 integrating prior lessons into the capstone. Root authors 8 shared foundation lessons. Total 62 new lessons, with 8 foundation + 9 specialist lessons per role (17 lessons per path). The existing 24 lessons remain accessible as a reference library with existing progress intact. Source-based sections should point to the most specific references; capstone may reuse sourceIds when the lesson is mostly an original scenario.

Output files: technical.json, commercial.json, planning-management.json, foundation.json. Validate with JSON.parse. Do not edit runtime, HTML templates or other authors' files. Do not commit or deploy.
