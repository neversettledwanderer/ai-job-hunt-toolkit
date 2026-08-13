(function () {
  'use strict';

  const pageContent = document.getElementById('page-content');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const primaryNav = document.getElementById('primary-nav');
  const secondaryNav = document.getElementById('secondary-nav');
  const searchInput = document.getElementById('global-search');
  const drawer = document.getElementById('job-drawer');
  const coachPanel = document.getElementById('coach-panel');
  const scrim = document.getElementById('drawer-scrim');
  const addJobDialog = document.getElementById('add-job-dialog');
  const addJobForm = document.getElementById('add-job-form');
  const toastRegion = document.getElementById('toast-region');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '⌂', group: 'primary' },
    { id: 'pipeline', label: 'Pipeline', icon: '▥', group: 'primary', count: 12 },
    { id: 'jobs', label: 'Jobs', icon: '▣', group: 'primary', count: 24 },
    { id: 'applications', label: 'Applications', icon: '▤', group: 'primary' },
    { id: 'interviews', label: 'Interviews', icon: '□', group: 'primary', count: 2 },
    { id: 'contacts', label: 'Contacts', icon: '◎', group: 'secondary' },
    { id: 'documents', label: 'Documents', icon: '◇', group: 'secondary' },
    { id: 'activity', label: 'Activity', icon: '↻', group: 'secondary' },
    { id: 'settings', label: 'Settings', icon: '⚙', group: 'secondary' }
  ];

  const pageMeta = {
    overview: ['Overview', 'Your job search at a glance'],
    pipeline: ['Pipeline', 'Move applications towards an offer'],
    jobs: ['Jobs', 'Discover, triage and rank opportunities'],
    applications: ['Applications', 'Track documents and submission status'],
    interviews: ['Interviews', 'Prepare for upcoming conversations'],
    contacts: ['Contacts', 'Build relationships around priority roles'],
    documents: ['Documents', 'Manage source and application files'],
    activity: ['Activity', 'Understand every human and agent change'],
    settings: ['Settings', 'Connections, workspace and safeguards']
  };

  const state = {
    page: validPage(location.hash.slice(1)) ? location.hash.slice(1) : 'overview',
    query: '',
    jobFilter: 'All jobs',
    applicationFilter: 'Active',
    selectedJobId: null,
    draggedApplicationId: null,
    coachMessages: [
      { role: 'assistant', text: 'I’ve reviewed your current pipeline. Luma AI closes soon and is your strongest strategic fit. Finishing that tailored resume is the best next move.' }
    ],
    jobs: [
      { id: 'job-luma', company: 'Luma AI', logo: 'LA', logoTone: 'purple', title: 'Senior Product Manager, AI Platform', location: 'London · Hybrid', salary: '£95k–£115k', priority: 'High', rank: 1, source: 'LinkedIn', networking: '2 contacts found', closing: '16 Aug', triaged: true, notes: 'Strong platform and AI-product fit.' },
      { id: 'job-wise', company: 'Wise', logo: 'W', logoTone: 'navy', title: 'Principal Product Manager, Growth', location: 'London · Hybrid', salary: '£100k–£125k', priority: 'High', rank: 2, source: 'Company site', networking: 'Outreach sent', closing: '24 Aug', triaged: true, notes: 'Strong fit for growth and international product leadership.' },
      { id: 'job-monzo', company: 'Monzo', logo: 'M', logoTone: 'orange', title: 'Lead Product Manager, Lending', location: 'London · Remote', salary: '£90k–£110k', priority: 'Medium', rank: 1, source: 'Indeed', networking: 'Not started', closing: '30 Aug', triaged: true, notes: 'Good domain adjacency; networking has not started.' },
      { id: 'job-synthesia', company: 'Synthesia', logo: 'S', logoTone: 'blue', title: 'Product Lead, Enterprise', location: 'London · Hybrid', salary: '£90k–£105k', priority: 'Medium', rank: 2, source: 'Adzuna', networking: '1 contact found', closing: '—', triaged: true, notes: 'Enterprise AI experience maps well.' },
      { id: 'job-deliveroo', company: 'Deliveroo', logo: 'D', logoTone: 'green', title: 'Product Director, Marketplace', location: 'London · Hybrid', salary: 'Competitive', priority: 'Low', rank: 1, source: 'LinkedIn', networking: 'Not started', closing: '4 Sep', triaged: true, notes: 'Interesting scope but weaker role-shape fit.' },
      { id: 'job-pixel', company: 'Pixel Labs', logo: 'PL', logoTone: 'purple', title: 'Principal Product Manager', location: 'London · Remote', salary: '£90k–£120k', priority: 'Untriaged', rank: null, source: 'Adzuna', networking: 'Not started', closing: '—', triaged: false, notes: 'Newly discovered role awaiting review.' }
    ],
    applications: [
      { id: 'app-luma', jobId: 'job-luma', status: 'Preparing', detail: 'Resume in progress', applied: '—', documents: 'CV draft', activity: '12 min ago' },
      { id: 'app-monzo', jobId: 'job-monzo', status: 'Preparing', detail: 'Needs outreach', applied: '—', documents: 'Base CV', activity: 'Yesterday' },
      { id: 'app-synthesia', jobId: 'job-synthesia', status: 'Preparing', detail: 'Review required', applied: '—', documents: 'CV + Cover letter', activity: '2 days ago' },
      { id: 'app-paddle', company: 'Paddle', title: 'Group Product Manager', priority: 'Medium', status: 'Applied', detail: 'Applied 8 Aug', applied: '8 Aug', documents: 'CV + Cover letter', activity: '4 days ago' },
      { id: 'app-checkout', company: 'Checkout.com', title: 'Principal PM, Payments', priority: 'Medium', status: 'Applied', detail: 'Applied 6 Aug', applied: '6 Aug', documents: 'CV', activity: '6 days ago' },
      { id: 'app-cleo', company: 'Cleo', title: 'Lead Product Manager', priority: 'Low', status: 'Applied', detail: 'Applied 3 Aug', applied: '3 Aug', documents: 'CV', activity: '9 days ago' },
      { id: 'app-wise', jobId: 'job-wise', status: 'Screening', detail: 'Recruiter call Thursday', applied: '31 Jul', documents: 'CV + Cover letter', activity: 'Today' },
      { id: 'app-multiverse', company: 'Multiverse', title: 'Senior Product Lead', priority: 'Medium', status: 'Screening', detail: 'Assessment sent', applied: '29 Jul', documents: 'CV', activity: '2 days ago' },
      { id: 'app-octopus', company: 'Octopus Energy', title: 'Head of Product, Flex', priority: 'High', status: 'Interviewing', detail: 'Hiring manager Friday', applied: '25 Jul', documents: 'CV + Cover letter', activity: 'Yesterday' },
      { id: 'app-trainline', company: 'Trainline', title: 'Principal Product Manager', priority: 'High', status: 'Interviewing', detail: 'Case study Monday', applied: '22 Jul', documents: 'CV + Case study', activity: 'Today' },
      { id: 'app-spotify', company: 'Spotify', title: 'Group Product Manager', priority: 'Medium', status: 'Offer', detail: 'Decision due Friday', applied: '4 Jul', documents: 'CV + Portfolio', activity: 'Today' },
      { id: 'app-revolut', company: 'Revolut', title: 'Lead Product Manager', priority: 'Low', status: 'Rejected', detail: 'Closed 6 Aug', applied: '20 Jul', documents: 'CV', activity: '6 days ago' }
    ],
    interviews: [
      { id: 'int-wise', day: 'Thu', date: '14 August', time: '10:30', duration: '30 min', company: 'Wise', role: 'Principal Product Manager, Growth', type: 'Recruiter screening', person: 'Amelia R.', prep: 'In progress' },
      { id: 'int-octopus', day: 'Fri', date: '15 August', time: '14:00', duration: '45 min', company: 'Octopus Energy', role: 'Head of Product, Flex', type: 'Hiring manager', person: 'James T.', prep: 'Needs prep' }
    ],
    contacts: [
      { name: 'Amelia Reed', title: 'Senior Talent Partner', company: 'Wise', relationship: 'Confirmed recruiter', last: 'Today' },
      { name: 'Daniel King', title: 'VP Product', company: 'Luma AI', relationship: 'Hiring manager', last: 'Not contacted' },
      { name: 'Sophie Chen', title: 'Product Director', company: 'Luma AI', relationship: 'Employee', last: 'Yesterday' },
      { name: 'Priya Shah', title: 'Lead Recruiter', company: 'Synthesia', relationship: 'Recruiter', last: '3 days ago' }
    ]
  };

  function validPage(page) {
    return navItems.some((item) => item.id === page);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function jobForApplication(application) {
    return state.jobs.find((job) => job.id === application.jobId) || {
      id: application.id,
      company: application.company,
      title: application.title,
      priority: application.priority || 'Medium',
      location: 'London',
      salary: 'Not listed',
      source: 'Company site',
      networking: 'Completed',
      closing: '—',
      logo: application.company.split(/\s/).map((word) => word[0]).join('').slice(0, 2),
      logoTone: 'navy',
      notes: 'Imported application record.'
    };
  }

  function logoClass(job) {
    return `logo-${job.logoTone || 'navy'}`;
  }

  function priorityClass(priority) {
    return `priority-${slug(priority)}`;
  }

  function renderNavigation() {
    const template = (item) => `
      <button class="nav-link" type="button" data-nav="${item.id}" ${state.page === item.id ? 'aria-current="page"' : ''}>
        <span class="nav-icon" aria-hidden="true">${item.icon}</span>
        <span>${item.label}</span>
        ${item.count ? `<span class="nav-count">${item.count}</span>` : ''}
      </button>`;
    primaryNav.innerHTML = navItems.filter((item) => item.group === 'primary').map(template).join('');
    secondaryNav.innerHTML = navItems.filter((item) => item.group === 'secondary').map(template).join('');
  }

  function navigate(page, updateHash = true) {
    if (!validPage(page)) return;
    state.page = page;
    state.query = '';
    searchInput.value = '';
    if (updateHash) history.pushState(null, '', `#${page}`);
    closeOverlays();
    render();
    pageContent.focus({ preventScroll: true });
  }

  function render() {
    renderNavigation();
    const [title, subtitle] = pageMeta[state.page];
    pageTitle.textContent = title;
    pageSubtitle.textContent = subtitle;
    const renderer = {
      overview: renderOverview,
      pipeline: renderPipeline,
      jobs: renderJobs,
      applications: renderApplications,
      interviews: renderInterviews,
      contacts: renderContacts,
      documents: renderDocuments,
      activity: renderActivity,
      settings: renderSettings
    }[state.page];
    pageContent.innerHTML = renderer();
  }

  function renderOverview() {
    const priorityJobs = state.jobs
      .filter((job) => ['High', 'Medium'].includes(job.priority))
      .sort((a, b) => ['High', 'Medium'].indexOf(a.priority) - ['High', 'Medium'].indexOf(b.priority) || a.rank - b.rank)
      .slice(0, 4);
    const activeApplications = state.applications.filter((application) => !['Rejected', 'Withdrawn', 'Accepted'].includes(application.status));
    const pipelineStages = ['Preparing', 'Applied', 'Screening', 'Interviewing', 'Offer'];
    const stageCounts = pipelineStages.map((stage) => activeApplications.filter((application) => application.status === stage).length);
    const maxCount = Math.max(...stageCounts, 1);
    return `
      <section class="page-section">
        <div class="page-intro">
          <div><h2>Good morning, Yogesh</h2><p>You have ${state.jobs.filter((job) => !job.triaged).length} new role to triage and 2 applications that need attention.</p></div>
          <div class="sync-status">Pipeline synced moments ago</div>
        </div>
        <div class="metrics-grid">
          ${metric('Active roles', state.jobs.length, '+1 this week', '▣', 'purple')}
          ${metric('Applications', activeApplications.length, '4 awaiting response', '▤', 'blue')}
          ${metric('Interviews', state.interviews.length, 'Next: Thu, 10:30', '□', 'green')}
          ${metric('Weekly target', '7/10', '3 applications remaining', '✓', 'amber')}
        </div>
        <div class="dashboard-grid">
          <div>
            <section class="panel">
              ${panelHeader('Priority queue', 'Ranked roles ready for your next action', 'View all jobs', 'jobs')}
              <div class="job-list">${priorityJobs.map(renderJobRow).join('')}</div>
            </section>
            <section class="panel">
              ${panelHeader('Application pipeline', 'Current progress across active applications', 'Open board', 'pipeline')}
              <div class="funnel">
                ${pipelineStages.map((stage, index) => `<div class="funnel-stage"><div class="funnel-bar"><span style="width:${(stageCounts[index] / maxCount) * 100}%"></span></div><strong>${stageCounts[index]}</strong><small>${stage}</small></div>`).join('')}
              </div>
            </section>
          </div>
          <aside class="panel">
            ${panelHeader('AI Job Coach', 'Focused on the highest-impact next step', 'Open', 'coach')}
            <div class="coach-summary">
              <div class="coach-message"><div class="coach-orb">✦</div><div class="coach-bubble"><strong>Your best move today</strong>Luma AI closes in 3 days. Finish the tailored resume, then start outreach to the two contacts already identified.</div></div>
              <div class="next-actions">
                ${nextAction(1, 'Tailor resume for Luma AI', 'Estimated 20 minutes', 'resume')}
                ${nextAction(2, 'Draft two outreach messages', 'Contacts already researched', 'outreach')}
                ${nextAction(3, 'Triage newly found roles', 'About 5 minutes', 'triage')}
              </div>
              <div class="coach-composer"><input id="overview-coach-input" placeholder="Ask your coach anything…"><button class="send-action" type="button" data-action="send-overview-coach" aria-label="Send">➤</button></div>
            </div>
          </aside>
        </div>
      </section>`;
  }

  function metric(label, value, note, icon, tone) {
    return `<article class="metric-card"><div class="metric-header"><span>${label}</span><span class="metric-icon tone-${tone}">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-note">${note.startsWith('+') ? `<strong>${note}</strong>` : note}</div></article>`;
  }

  function panelHeader(title, subtitle, actionLabel, action) {
    const attribute = ['jobs', 'pipeline'].includes(action) ? `data-nav="${action}"` : `data-action="open-${action}"`;
    return `<header class="panel-header"><div><h3>${title}</h3><p>${subtitle}</p></div><button class="text-action" type="button" ${attribute}>${actionLabel}</button></header>`;
  }

  function renderJobRow(job) {
    return `<button class="job-row" type="button" data-job-id="${job.id}">
      <span class="company-logo ${logoClass(job)}">${escapeHtml(job.logo)}</span>
      <span class="job-copy"><strong>${escapeHtml(job.title)}</strong><span>${escapeHtml(job.company)} · ${escapeHtml(job.location)} · ${escapeHtml(job.salary)}</span></span>
      <span class="job-row-end"><span class="priority ${priorityClass(job.priority)}">${escapeHtml(job.priority)}</span><span class="chevron">›</span></span>
    </button>`;
  }

  function nextAction(number, title, detail, action) {
    return `<button class="next-action" type="button" data-action="${action}"><span class="next-action-number">${number}</span><span><strong>${title}</strong><small>${detail}</small></span></button>`;
  }

  function renderPipeline() {
    const stages = ['Preparing', 'Applied', 'Screening', 'Interviewing', 'Offer'];
    const applications = filterApplications(state.applications);
    return `
      <section class="page-section">
        ${sectionHeading('Application pipeline', 'Drag a card to preview a valid status change. Production will validate transitions before saving.', ['Active', 'All'], state.applicationFilter, 'application-filter')}
        <div class="pipeline-scroller"><div class="pipeline-board">
          ${stages.map((stage) => {
            const stageApplications = applications.filter((application) => application.status === stage);
            return `<section class="pipeline-column" data-status="${stage}"><header class="pipeline-column-heading"><strong>${stage}</strong><span>${stageApplications.length}</span></header>${stageApplications.map(renderPipelineCard).join('')}</section>`;
          }).join('')}
        </div></div>
      </section>`;
  }

  function renderPipelineCard(application) {
    const job = jobForApplication(application);
    return `<article class="pipeline-card" draggable="true" tabindex="0" data-application-id="${application.id}" data-job-id="${job.id}" aria-grabbed="false">
      <div class="pipeline-company">${escapeHtml(job.company)}</div>
      <h3>${escapeHtml(job.title)}</h3>
      <div class="pipeline-card-footer"><span>${escapeHtml(application.detail)}</span><span class="priority ${priorityClass(job.priority)}">${escapeHtml(job.priority)}</span></div>
    </article>`;
  }

  function filterApplications(applications) {
    const query = state.query.trim().toLowerCase();
    let result = applications;
    if (state.applicationFilter === 'Active') result = result.filter((application) => !['Rejected', 'Withdrawn', 'Accepted'].includes(application.status));
    if (query) result = result.filter((application) => {
      const job = jobForApplication(application);
      return `${job.company} ${job.title} ${application.status}`.toLowerCase().includes(query);
    });
    return result;
  }

  function sectionHeading(title, subtitle, options = [], selected = '', action = '') {
    return `<div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div>${options.length ? `<div class="filter-group">${options.map((option) => `<button class="filter-action" type="button" data-filter-action="${action}" data-filter-value="${escapeHtml(option)}" aria-pressed="${option === selected}">${escapeHtml(option)}</button>`).join('')}</div>` : ''}</div>`;
  }

  function renderJobs() {
    const filters = ['All jobs', `Untriaged ${state.jobs.filter((job) => !job.triaged).length}`, 'High priority'];
    const jobs = filterJobs();
    return `
      <section class="page-section">
        ${sectionHeading('Job opportunities', 'Discovered, saved and ranked roles in one place.', filters, state.jobFilter, 'job-filter')}
        <div class="data-panel"><div class="table-scroller"><table class="data-table">
          <thead><tr><th>Role</th><th>Priority</th><th>Source</th><th>Networking</th><th>Closing</th></tr></thead>
          <tbody>${jobs.map((job) => `<tr data-job-id="${job.id}"><td><strong>${escapeHtml(job.title)}</strong><small>${escapeHtml(job.company)} · ${escapeHtml(job.location)}</small></td><td><span class="priority ${priorityClass(job.priority)}">${escapeHtml(job.priority)}${job.rank ? ` #${job.rank}` : ''}</span></td><td><span class="source-pill">${escapeHtml(job.source)}</span></td><td>${escapeHtml(job.networking)}</td><td>${escapeHtml(job.closing)}</td></tr>`).join('')}</tbody>
        </table></div>${jobs.length ? '' : emptyState('⌕', 'No matching jobs', 'Try a different search or filter.')}</div>
      </section>`;
  }

  function filterJobs() {
    const query = state.query.trim().toLowerCase();
    let jobs = [...state.jobs];
    if (state.jobFilter.startsWith('Untriaged')) jobs = jobs.filter((job) => !job.triaged);
    if (state.jobFilter === 'High priority') jobs = jobs.filter((job) => job.priority === 'High');
    if (query) jobs = jobs.filter((job) => `${job.company} ${job.title} ${job.location} ${job.source}`.toLowerCase().includes(query));
    return jobs;
  }

  function renderApplications() {
    const applications = filterApplications(state.applications);
    return `
      <section class="page-section">
        ${sectionHeading('Applications', 'Documents, status changes and submission history.', ['Active', 'All'], state.applicationFilter, 'application-filter')}
        <div class="data-panel"><div class="table-scroller"><table class="data-table">
          <thead><tr><th>Application</th><th>Status</th><th>Applied</th><th>Documents</th><th>Latest activity</th></tr></thead>
          <tbody>${applications.map((application) => {
            const job = jobForApplication(application);
            return `<tr data-job-id="${job.id}"><td><strong>${escapeHtml(job.title)}</strong><small>${escapeHtml(job.company)}</small></td><td><span class="status-pill status-${slug(application.status)}">${escapeHtml(application.status)}</span></td><td>${escapeHtml(application.applied)}</td><td>${escapeHtml(application.documents)}</td><td>${escapeHtml(application.activity)}</td></tr>`;
          }).join('')}</tbody>
        </table></div>${applications.length ? '' : emptyState('▤', 'No matching applications', 'No application records match the current view.')}</div>
      </section>`;
  }

  function renderInterviews() {
    const query = state.query.trim().toLowerCase();
    const interviews = state.interviews.filter((interview) => `${interview.company} ${interview.role} ${interview.type} ${interview.person}`.toLowerCase().includes(query));
    return `
      <section class="page-section">
        ${sectionHeading('Upcoming interviews', 'Preparation, people and timing for your next conversations.')}
        <div class="interview-list">${interviews.map((interview) => `<article class="interview-card"><div class="interview-date"><strong>${escapeHtml(interview.day)} ${escapeHtml(interview.time)}</strong><span>${escapeHtml(interview.date)} · ${escapeHtml(interview.duration)}</span></div><div class="interview-copy"><h3>${escapeHtml(interview.company)} · ${escapeHtml(interview.type)}</h3><p>${escapeHtml(interview.role)} · with ${escapeHtml(interview.person)}</p></div><div class="interview-actions"><span class="status-pill ${interview.prep === 'Needs prep' ? 'status-rejected' : 'status-ready'}">${escapeHtml(interview.prep)}</span><button class="secondary-action" type="button" data-action="interview-prep" data-interview-id="${interview.id}">Prepare</button></div></article>`).join('')}${interviews.length ? '' : emptyState('□', 'No matching interviews', 'Upcoming interviews will appear here.')}</div>
      </section>`;
  }

  function renderContacts() {
    const query = state.query.trim().toLowerCase();
    const contacts = state.contacts.filter((contact) => `${contact.name} ${contact.title} ${contact.company} ${contact.relationship}`.toLowerCase().includes(query));
    return `
      <section class="page-section">
        ${sectionHeading('Contacts', 'People linked to your target companies and applications.', ['All contacts', 'Follow-up due'], 'All contacts', 'contact-filter')}
        <div class="data-panel"><div class="table-scroller"><table class="data-table"><thead><tr><th>Contact</th><th>Company</th><th>Relationship</th><th>Last contact</th><th>Next action</th></tr></thead><tbody>
          ${contacts.map((contact) => `<tr><td><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.title)}</small></td><td>${escapeHtml(contact.company)}</td><td>${escapeHtml(contact.relationship)}</td><td>${escapeHtml(contact.last)}</td><td><button class="text-action" type="button" data-action="draft-outreach">Draft message</button></td></tr>`).join('')}
        </tbody></table></div></div>
      </section>`;
  }

  function renderDocuments() {
    const documents = [
      ['MASTER_BULLETS.md', 'Master evidence library', 'Updated 2 days ago', 'MD'],
      ['MASTER_PROFILES.md', 'Positioning statements', 'Updated 1 week ago', 'MD'],
      ['MASTER_SKILLS.md', 'Skills inventory', 'Updated 1 week ago', 'MD'],
      ['Luma AI — Tailored CV.docx', 'Application document', 'Updated 12 min ago', 'DOC'],
      ['Wise — Cover Letter.docx', 'Application document', 'Updated 5 days ago', 'DOC'],
      ['CAREER_NARRATIVE.md', 'Story and positioning themes', 'Updated 3 weeks ago', 'MD']
    ].filter((document) => document.join(' ').toLowerCase().includes(state.query.trim().toLowerCase()));
    return `
      <section class="page-section">
        ${sectionHeading('Documents', 'Master source content and generated application files.')}
        <div class="document-grid">${documents.map((document) => `<button class="document-card" type="button" data-action="open-document"><span class="document-icon">${document[3]}</span><span><strong>${escapeHtml(document[0])}</strong><small>${escapeHtml(document[1])} · ${escapeHtml(document[2])}</small></span></button>`).join('')}</div>
      </section>`;
  }

  function renderActivity() {
    const activities = [
      ['✦', 'resume-optimizer created a tailored resume', 'Luma AI · Senior Product Manager, AI Platform', '12 min ago'],
      ['↗', 'Yogesh changed application status', 'Wise · Applied → Screening', 'Today'],
      ['◎', 'linkedin-outreach drafted two messages', 'Luma AI · Daniel King and Sophie Chen', 'Yesterday'],
      ['✓', 'application-reviewer logged PASS', 'Wise · Reviewed current CV and cover letter', '5 days ago'],
      ['+', 'job-finder-adzuna discovered a role', 'Synthesia · Product Lead, Enterprise', '6 days ago']
    ].filter((activity) => activity.join(' ').toLowerCase().includes(state.query.trim().toLowerCase()));
    return `
      <section class="page-section">
        ${sectionHeading('Activity', 'An attributable history of human, agent and automation changes.', ['All activity', 'Agents', 'Human'], 'All activity', 'activity-filter')}
        <div class="activity-list">${activities.map((activity) => `<article class="activity-item"><span class="activity-icon">${activity[0]}</span><span class="activity-copy"><strong>${escapeHtml(activity[1])}</strong><span>${escapeHtml(activity[2])}</span></span><time class="activity-time">${escapeHtml(activity[3])}</time></article>`).join('')}</div>
      </section>`;
  }

  function renderSettings() {
    const settings = [
      ['Supabase pipeline', 'Shared source of truth for jobs, applications, interviews and contacts.', 'Connected'],
      ['Local workspace', 'Approved folder for master content and generated documents.', 'Connected'],
      ['Claude Agent runtime', 'Runs coach and document workflows outside the visual interface.', 'Prototype only'],
      ['macOS Keychain', 'Stores MCP, provider and ATS credentials outside renderer state.', 'Available'],
      ['Browser assistant', 'Visible Playwright worker with approval gates and manual takeover.', 'Disabled'],
      ['Notifications', 'Interview reminders, closing dates and completed background tasks.', 'Enabled']
    ];
    return `
      <section class="page-section">
        ${sectionHeading('Settings', 'Integration health and safety controls for this workspace.')}
        <div class="settings-grid">${settings.map((setting) => `<article class="settings-card"><h3>${escapeHtml(setting[0])}</h3><p>${escapeHtml(setting[1])}</p><div class="settings-status"><span>Status</span><span class="${['Connected', 'Available', 'Enabled'].includes(setting[2]) ? 'health-ok' : ''}">${escapeHtml(setting[2])}</span></div></article>`).join('')}</div>
      </section>`;
  }

  function emptyState(icon, title, detail) {
    return `<div class="empty-state"><div><div class="empty-state-icon">${icon}</div><h3>${title}</h3><p>${detail}</p></div></div>`;
  }

  function openJob(jobId) {
    const job = state.jobs.find((item) => item.id === jobId) || jobForApplication(state.applications.find((item) => item.id === jobId) || {});
    if (!job || !job.company) return;
    state.selectedJobId = job.id;
    const application = state.applications.find((item) => item.jobId === job.id);
    const readiness = getReadiness(job, application);
    drawer.innerHTML = `
      <header class="drawer-header"><span class="company-logo ${logoClass(job)}">${escapeHtml(job.logo)}</span><div class="drawer-title"><h2>${escapeHtml(job.title)}</h2><p>${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p></div><button class="close-action" type="button" data-action="close-drawer" aria-label="Close">×</button></header>
      <div class="drawer-body">
        <div class="detail-grid">
          <div class="detail-field"><small>Salary</small><strong>${escapeHtml(job.salary)}</strong></div>
          <div class="detail-field"><small>Priority</small><strong>${escapeHtml(job.priority)}${job.rank ? ` · Rank #${job.rank}` : ''}</strong></div>
          <div class="detail-field"><small>Closing date</small><strong>${escapeHtml(job.closing)}</strong></div>
          <div class="detail-field"><small>Source</small><strong>${escapeHtml(job.source)}</strong></div>
        </div>
        <h3>Application readiness</h3>
        <div class="readiness-list">${readiness.map((step, index) => `<div class="readiness-step" data-state="${step.state}"><span class="step-dot">${step.state === 'done' ? '✓' : index + 1}</span><strong>${escapeHtml(step.label)}</strong><span>${escapeHtml(step.detail)}</span></div>`).join('')}</div>
        <h3>Coach note</h3>
        <div class="drawer-note">${escapeHtml(job.notes || 'Review this role against your target criteria before applying.')}</div>
        <div class="drawer-actions"><button class="secondary-action" type="button" data-action="open-posting">Open posting</button><button class="primary-action" type="button" data-action="resume" data-job-id="${job.id}">${application ? 'Continue application' : 'Tailor resume'}</button></div>
      </div>`;
    closeCoach();
    drawer.setAttribute('aria-hidden', 'false');
    scrim.dataset.open = 'true';
    drawer.querySelector('.close-action').focus();
  }

  function getReadiness(job, application) {
    if (!application) return [
      { label: 'Role triaged', detail: job.triaged ? 'Complete' : 'Required', state: job.triaged ? 'done' : 'current' },
      { label: 'Contacts researched', detail: job.networking === 'Not started' ? 'Not started' : job.networking, state: job.networking === 'Not started' ? '' : 'done' },
      { label: 'Tailored resume', detail: 'Not started', state: '' },
      { label: 'Pre-submission review', detail: 'Blocked', state: '' }
    ];
    return [
      { label: 'Role triaged', detail: 'Complete', state: 'done' },
      { label: 'Contacts researched', detail: job.networking, state: job.networking === 'Not started' ? 'current' : 'done' },
      { label: 'Tailored resume', detail: application.documents.includes('CV') ? 'In progress' : 'Not started', state: application.documents.includes('CV') ? 'current' : '' },
      { label: 'Cover letter', detail: application.documents.includes('Cover letter') ? 'Drafted' : 'Not required yet', state: application.documents.includes('Cover letter') ? 'done' : '' },
      { label: 'Pre-submission review', detail: application.status === 'Preparing' ? 'Blocked' : 'Passed', state: application.status === 'Preparing' ? '' : 'done' }
    ];
  }

  function closeDrawer() {
    drawer.setAttribute('aria-hidden', 'true');
    if (coachPanel.getAttribute('aria-hidden') === 'true') scrim.dataset.open = 'false';
  }

  function openCoach(initialMessage = '') {
    coachPanel.innerHTML = `
      <header class="drawer-header"><div class="coach-orb">✦</div><div class="drawer-title"><h2>AI Job Coach</h2><p>Grounded in your pipeline and career workspace</p></div><button class="close-action" type="button" data-action="close-coach" aria-label="Close">×</button></header>
      <div class="drawer-body"><div id="chat-log" class="chat-log">${state.coachMessages.map((message) => `<div class="chat-message" data-role="${message.role}">${escapeHtml(message.text)}</div>`).join('')}</div>
        <div class="chat-suggestions"><button class="chat-suggestion" type="button" data-coach-suggestion="What should I focus on today?">Today’s priority</button><button class="chat-suggestion" type="button" data-coach-suggestion="Help me triage the new roles.">Triage jobs</button><button class="chat-suggestion" type="button" data-coach-suggestion="Prepare me for my next interview.">Interview prep</button></div>
        <div class="chat-composer"><textarea id="coach-textarea" placeholder="Ask your coach…">${escapeHtml(initialMessage)}</textarea><button class="send-action" type="button" data-action="send-coach" aria-label="Send">➤</button></div>
      </div>`;
    closeDrawer();
    coachPanel.setAttribute('aria-hidden', 'false');
    scrim.dataset.open = 'true';
    const input = document.getElementById('coach-textarea');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function closeCoach() {
    coachPanel.setAttribute('aria-hidden', 'true');
    if (drawer.getAttribute('aria-hidden') === 'true') scrim.dataset.open = 'false';
  }

  function closeOverlays() {
    closeDrawer();
    closeCoach();
  }

  function sendCoachMessage(text) {
    const clean = text.trim();
    if (!clean) {
      showToast('Type a message first');
      return;
    }
    state.coachMessages.push({ role: 'user', text: clean });
    state.coachMessages.push({ role: 'assistant', text: coachReply(clean) });
    openCoach();
    const input = document.getElementById('coach-textarea');
    input.value = '';
    const log = document.getElementById('chat-log');
    log.scrollTop = log.scrollHeight;
  }

  function coachReply(message) {
    const lower = message.toLowerCase();
    if (lower.includes('triage')) return 'You have one untriaged role from Pixel Labs. I would compare it against Luma AI and Wise first, then assign a priority based on strategic fit, compensation and likelihood of interview.';
    if (lower.includes('interview')) return 'Your next interview is the Wise recruiter screening on Thursday at 10:30. Prepare a two-minute career narrative, motivation for Wise, compensation range and three examples of product growth impact.';
    if (lower.includes('resume') || lower.includes('luma')) return 'For Luma AI, lead with AI-platform adoption, cross-functional product leadership and measurable enterprise outcomes. The prototype would now launch the resume-optimizer workflow.';
    return 'Based on the current pipeline, finishing Luma AI and preparing for the Wise screening will create the most progress today. Which one would you like to work through first?';
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastRegion.appendChild(toast);
    setTimeout(() => { toast.dataset.exit = 'true'; }, 1600);
    setTimeout(() => { toast.remove(); }, 1850);
  }

  function openAddJob() {
    addJobForm.reset();
    addJobDialog.showModal();
    setTimeout(() => addJobForm.elements.url.focus(), 0);
  }

  function closeAddJob() {
    if (addJobDialog.open) addJobDialog.close();
  }

  function saveJob(form) {
    const data = new FormData(form);
    const company = String(data.get('company')).trim();
    const title = String(data.get('title')).trim();
    const priority = String(data.get('priority'));
    const initials = company.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    state.jobs.unshift({
      id: `job-${Date.now()}`,
      company,
      title,
      logo: initials || 'J',
      logoTone: 'purple',
      location: String(data.get('location')).trim() || 'Location not listed',
      salary: String(data.get('salary')).trim() || 'Not listed',
      priority,
      rank: priority === 'Untriaged' ? null : state.jobs.filter((job) => job.priority === priority).length + 1,
      source: String(data.get('source')),
      networking: 'Not started',
      closing: '—',
      triaged: priority !== 'Untriaged',
      notes: String(data.get('notes')).trim() || 'Added manually in the prototype.'
    });
    closeAddJob();
    showToast(`${company} role saved to Jobs`);
    navigate('jobs');
  }

  function moveApplication(applicationId, targetStatus) {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application || application.status === targetStatus) return;
    const stages = ['Preparing', 'Applied', 'Screening', 'Interviewing', 'Offer'];
    const currentIndex = stages.indexOf(application.status);
    const targetIndex = stages.indexOf(targetStatus);
    if (targetIndex < 0 || Math.abs(targetIndex - currentIndex) > 1) {
      showToast('That transition requires an intermediate pipeline step');
      render();
      return;
    }
    application.status = targetStatus;
    application.detail = `Moved to ${targetStatus} in prototype`;
    application.activity = 'Just now';
    showToast(`Application moved to ${targetStatus}`);
    render();
  }

  function setFilter(action, value) {
    if (action === 'job-filter') state.jobFilter = value;
    if (action === 'application-filter') state.applicationFilter = value;
    if (['contact-filter', 'activity-filter'].includes(action)) showToast(`${value} selected`);
    render();
  }

  function handleAction(action, target) {
    const jobId = target.dataset.jobId || state.selectedJobId;
    const actions = {
      'open-add-job': openAddJob,
      'close-add-job': closeAddJob,
      'close-drawer': closeDrawer,
      'close-coach': closeCoach,
      'open-coach': () => openCoach(),
      'notifications': () => showToast('2 interview reminders and 1 closing-date alert'),
      'resume': () => { closeDrawer(); openCoach('Help me tailor the resume for Luma AI.'); },
      'outreach': () => openCoach('Draft outreach messages for the Luma AI contacts.'),
      'triage': () => { navigate('jobs'); state.jobFilter = `Untriaged ${state.jobs.filter((job) => !job.triaged).length}`; render(); },
      'interview-prep': () => openCoach('Prepare me for my next interview.'),
      'draft-outreach': () => openCoach('Help me draft a concise outreach message.'),
      'open-posting': () => showToast('Production would validate and open the HTTPS posting URL'),
      'open-document': () => showToast('Production would open this file through the workspace broker')
    };
    if (action === 'send-overview-coach') {
      const input = document.getElementById('overview-coach-input');
      openCoach(input?.value || 'What should I focus on today?');
      return;
    }
    if (action === 'send-coach') {
      sendCoachMessage(document.getElementById('coach-textarea')?.value || '');
      return;
    }
    if (jobId && action === 'open-job') { openJob(jobId); return; }
    (actions[action] || (() => showToast('This control is represented in the prototype')))();
  }

  document.addEventListener('click', (event) => {
    const navTarget = event.target.closest('[data-nav]');
    if (navTarget) {
      event.preventDefault();
      navigate(navTarget.dataset.nav);
      return;
    }
    const jobTarget = event.target.closest('[data-job-id]');
    if (jobTarget && !event.target.closest('[data-action]')) {
      openJob(jobTarget.dataset.jobId);
      return;
    }
    const filterTarget = event.target.closest('[data-filter-action]');
    if (filterTarget) {
      setFilter(filterTarget.dataset.filterAction, filterTarget.dataset.filterValue);
      return;
    }
    const suggestion = event.target.closest('[data-coach-suggestion]');
    if (suggestion) {
      sendCoachMessage(suggestion.dataset.coachSuggestion);
      return;
    }
    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) handleAction(actionTarget.dataset.action, actionTarget);
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    render();
  });

  addJobForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!addJobForm.reportValidity()) return;
    saveJob(addJobForm);
  });

  addJobDialog.addEventListener('click', (event) => {
    if (event.target === addJobDialog) closeAddJob();
  });

  pageContent.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-application-id]');
    if (!card) return;
    state.draggedApplicationId = card.dataset.applicationId;
    card.setAttribute('aria-grabbed', 'true');
    event.dataTransfer.effectAllowed = 'move';
  });

  pageContent.addEventListener('dragover', (event) => {
    const column = event.target.closest('[data-status]');
    if (!column) return;
    event.preventDefault();
    pageContent.querySelectorAll('[data-status]').forEach((item) => { item.dataset.dragover = String(item === column); });
  });

  pageContent.addEventListener('drop', (event) => {
    const column = event.target.closest('[data-status]');
    if (!column || !state.draggedApplicationId) return;
    event.preventDefault();
    moveApplication(state.draggedApplicationId, column.dataset.status);
    state.draggedApplicationId = null;
  });

  pageContent.addEventListener('dragend', () => {
    state.draggedApplicationId = null;
    pageContent.querySelectorAll('[data-status]').forEach((item) => { item.dataset.dragover = 'false'; });
    pageContent.querySelectorAll('[aria-grabbed="true"]').forEach((item) => item.setAttribute('aria-grabbed', 'false'));
  });

  window.addEventListener('popstate', () => {
    const page = location.hash.slice(1);
    if (validPage(page)) navigate(page, false);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === 'Escape') {
      closeOverlays();
      closeAddJob();
    }
    if (event.key === 'Enter' && event.target.id === 'overview-coach-input') {
      handleAction('send-overview-coach', event.target);
    }
    if (event.key === 'Enter' && !event.shiftKey && event.target.id === 'coach-textarea') {
      event.preventDefault();
      sendCoachMessage(event.target.value);
    }
  });

  render();
})();
