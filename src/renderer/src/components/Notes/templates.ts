export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultTitle: string;
  tags: string[];
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'study-notes',
    name: 'Study & Lecture Notes',
    description: 'Cornell-inspired structured template for lectures, courses, and readings.',
    icon: 'GraduationCap',
    defaultTitle: 'Study Notes: [Subject / Topic]',
    tags: ['study', 'education', 'review'],
    content: `<h1>Study Notes: [Topic Name]</h1>
<p><strong>Course / Subject:</strong> Computer Science / Systems<br>
<strong>Date:</strong> [Date]<br>
<strong>Instructor / Source:</strong> [Source]</p>
<hr>
<h2>🎯 Key Objectives &amp; Questions</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>What fundamental problem does this topic solve?</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>What are the trade-offs of this approach?</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>How does this relate to previous concepts?</div></li>
</ul>
<h2>📝 Core Lecture Notes</h2>
<p>Record primary concepts, formulas, and definitions here:</p>
<blockquote>Important principle: Optimize for clarity and maintainability before premature optimization.</blockquote>
<table>
  <thead>
    <tr><th>Concept</th><th>Definition</th><th>Example</th></tr>
  </thead>
  <tbody>
    <tr><td>Concept A</td><td>Description of concept</td><td>Code or scenario</td></tr>
    <tr><td>Concept B</td><td>Description of concept</td><td>Code or scenario</td></tr>
  </tbody>
</table>
<h2>💡 Summary &amp; Takeaways</h2>
<p>Write a 2-3 sentence synthesis of the most critical takeaways in your own words.</p>
<h2>✅ Review Tasks</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Review practice problems in chapter 4</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Summarize notes into flashcards</div></li>
</ul>`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured agenda, discussion points, decisions made, and action items.',
    icon: 'Users',
    defaultTitle: 'Meeting: [Topic / Project]',
    tags: ['meeting', 'collaboration', 'work'],
    content: `<h1>Meeting: [Meeting Title]</h1>
<p><strong>Date &amp; Time:</strong> [Date, Time]<br>
<strong>Attendees:</strong> Alex, Jordan, Taylor<br>
<strong>Facilitator:</strong> [Name]</p>
<hr>
<h2>📋 Agenda</h2>
<ol>
  <li>Project progress and milestones</li>
  <li>Architecture review &amp; security considerations</li>
  <li>Blockers and resource dependencies</li>
  <li>Next steps and rollout schedule</li>
</ol>
<h2>💬 Discussion &amp; Key Points</h2>
<p>Document the key perspectives and arguments shared during the session:</p>
<ul>
  <li><strong>Feature Scope</strong>: Agreement to prioritize core user flows first.</li>
  <li><strong>Performance</strong>: Memory budgets established for background tasks.</li>
</ul>
<h2>📌 Decisions Made</h2>
<blockquote>Decision: Use local SQLite / JSON with atomic disk flush to ensure offline data safety.</blockquote>
<h2>🚀 Action Items</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Alex: Finalize API schemas by Friday</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Jordan: Create visual diagrams and asset mockups</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Taylor: Configure CI/CD automated test harness</div></li>
</ul>`,
  },
  {
    id: 'research-log',
    name: 'Research Log',
    description: 'Hypothesis testing, literature notes, source references, and findings.',
    icon: 'Search',
    defaultTitle: 'Research: [Hypothesis / Topic]',
    tags: ['research', 'analysis', 'notes'],
    content: `<h1>Research Log: [Topic / Technology]</h1>
<p><strong>Objective:</strong> Investigate performance and compatibility trade-offs.<br>
<strong>Status:</strong> Active Investigation</p>
<hr>
<h2>🔬 Hypothesis</h2>
<p>State what you expect to observe or validate:</p>
<blockquote>Hypothesis: Transitioning to local vector storage decreases query latency by &gt;40% without increasing peak memory.</blockquote>
<h2>📚 Sources &amp; Citations</h2>
<ul>
  <li><a href="https://example.com/spec">System Specification Documentation</a></li>
  <li><a href="https://example.com/benchmarks">Benchmark Report (2026)</a></li>
</ul>
<h2>📊 Experimental Findings</h2>
<table>
  <thead>
    <tr><th>Trial</th><th>Configuration</th><th>Latency (ms)</th><th>Memory (MB)</th></tr>
  </thead>
  <tbody>
    <tr><td>Trial 1</td><td>Baseline</td><td>124 ms</td><td>45 MB</td></tr>
    <tr><td>Trial 2</td><td>Optimized Cache</td><td>68 ms</td><td>48 MB</td></tr>
  </tbody>
</table>
<h2>💡 Insights &amp; Synthesis</h2>
<p>Summarize how the findings inform the overall project architecture.</p>`,
  },
  {
    id: 'daily-journal',
    name: 'Daily Developer Journal',
    description: 'Daily priorities, achievements, blockers, and technical reflections.',
    icon: 'Calendar',
    defaultTitle: 'Daily Log: [YYYY-MM-DD]',
    tags: ['journal', 'daily', 'productivity'],
    content: `<h1>Daily Log: [Date]</h1>
<h2>🌅 Morning Focus &amp; Top 3 Priorities</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Implement rich-text note editor toolbar</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Verify offline spell checking dictionary</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Pass all automated test suites</div></li>
</ul>
<h2>💻 Technical Notes &amp; Discoveries</h2>
<pre><code class="language-typescript">// Key code insight of the day
const optimizedBuffer = Buffer.from(pdfData);
</code></pre>
<h2>🚧 Blockers &amp; Solved Issues</h2>
<p>Detail any tricky bugs resolved and lessons learned.</p>
<h2>🌙 End of Day Reflection</h2>
<p>What went well today? What should be improved tomorrow?</p>`,
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'Architecture RFC, API contracts, data models, and rollout plans.',
    icon: 'FileCode',
    defaultTitle: 'Tech Spec: [Feature Name]',
    tags: ['spec', 'engineering', 'architecture'],
    content: `<h1>Technical Specification: [Feature Name]</h1>
<p><strong>Author:</strong> NEXUS Engineering Team<br>
<strong>Status:</strong> Proposed / Under Review<br>
<strong>Target Release:</strong> v1.2.0</p>
<hr>
<h2>1. Problem Statement &amp; Goals</h2>
<p>Describe the user problem, architectural motivation, and measurable success criteria.</p>
<h2>2. Architecture &amp; Data Models</h2>
<pre><code class="language-typescript">interface FeatureContract {
  id: string;
  name: string;
  enabled: boolean;
  execute(): Promise&lt;void&gt;;
}
</code></pre>
<h2>3. Security &amp; Privacy Considerations</h2>
<ul>
  <li>All data is persisted strictly to local storage under the user profile directory.</li>
  <li>No network telemetry or third-party cloud services are invoked.</li>
</ul>
<h2>4. Verification &amp; Testing Plan</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Unit tests for data serialization and edge cases</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>End-to-end user interaction verification</div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>Three-mode styling consistency check</div></li>
</ul>`,
  },
];
