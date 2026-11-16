import { escape, icon, formatDate, formatTime } from './ui.js';
import { DEMO_NOW } from './seed.js';

const local = { organizerTab: 'events', serviceTab: 'pending', adminTab: 'overview', selectedEventId: null };
let boundController;
const E = value => escape(String(value ?? ''));
const A = value => Array.isArray(value) ? value : [];
const cap = value => String(value || '').replace(/(^|[-_ ])\w/g, x => x.toUpperCase()).replaceAll('_', ' ');
const initials = name => String(name || 'Campus Connect').split(' ').slice(0, 2).map(x => x[0]).join('');
const personFor = state => A(state.personas).find(x => x.id === state.activePersonaId) || {};
const studentFor = (state, id) => A(state.students).find(x => x.id === id) || { name: 'Student', grade: 'Student' };
const clubFor = (state, id) => A(state.clubs).find(x => x.id === id) || { name: 'School community' };
const eventFor = (state, id) => A(state.events).find(x => x.id === id);
const partnerFor = (state, id) => A(state.partners).find(x => x.id === id) || { name: 'Community partner' };
const ownEvents = (state, persona) => A(state.events).filter(x => persona.role === 'admin' || A(persona.clubIds).includes(x.clubId) || (persona.role === 'advisor' && (!x.clubId || x.category === 'Volunteering')));
let currentDemoNow = DEMO_NOW;
const finished = event => Date.parse(event.end) <= Date.parse(currentDemoNow);
const dateText = value => value ? formatDate(value) : 'Date to be confirmed';
const timeText = value => value ? formatTime(value) : '';
const hoursText = value => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
const badge = status => `<span class="badge ${['published', 'approved', 'active', 'completed'].includes(status) ? 'green' : ['rejected', 'returned', 'cancelled'].includes(status) ? 'rose' : 'amber'}">${E(cap(status))}</span>`;
const btn = (label, action, data = {}, cls = 'secondary small') => `<button type="button" class="btn ${cls}" data-staff-action="${action}" ${Object.entries(data).map(([k, v]) => `data-${k}="${E(v)}"`).join(' ')}>${label}</button>`;
const empty = (title, description, symbol = 'check') => `<div class="staff-no-results">${icon(symbol)}<h3>${E(title)}</h3><p>${E(description)}</p></div>`;
const kpi = (label, value, detail, symbol) => `<div class="staff-kpi"><div class="staff-kpi-top"><span>${E(label)}</span>${icon(symbol)}</div><strong>${E(value)}</strong><small>${E(detail)}</small></div>`;
const tabs = (items, selected, group) => `<div class="tabs" role="group" aria-label="${E({ organizerTab: 'Club workspace sections', serviceTab: 'Service record status', adminTab: 'School workspace sections' }[group] || 'Workspace sections')}">${items.map(([key, label]) => `<button type="button" aria-pressed="${key === selected}" class="tab ${key === selected ? 'active' : ''}" data-staff-action="tab" data-group="${group}" data-value="${key}">${label}</button>`).join('')}</div>`;
const header = (eyebrow, title, subtitle, action = '') => `<div class="page-heading staff-page-heading"><div><div class="eyebrow">${E(eyebrow)}</div><h1>${E(title)}</h1><p>${E(subtitle)}</p></div>${action ? `<div class="staff-heading-actions">${action}</div>` : ''}</div>`;
const dateBlock = value => { const d = new Date(value); return Number.isNaN(+d) ? '<div class="staff-date"><span>DATE</span><strong>—</strong></div>' : `<div class="staff-date"><span>${E(d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' }))}</span><strong>${d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' })}</strong></div>`; };

function organizer(state, persona) {
  const events = ownEvents(state, persona).sort((a, b) => Number(finished(a)) - Number(finished(b)) || String(a.start).localeCompare(String(b.start)));
  const eventIds = new Set(events.map(x => x.id));
  const rsvps = A(state.rsvps).filter(x => eventIds.has(x.eventId));
  const attendees = A(state.attendance).filter(x => eventIds.has(x.eventId) && x.present);
  const joinRequests = A(state.memberships).filter(x => (persona.role === 'admin' || A(persona.clubIds).includes(x.clubId)) && x.status === 'pending');
  let content = '';
  if (local.organizerTab === 'announcements') content = announcements(state, persona);
  else if (local.organizerTab === 'members') content = membershipQueue(state, persona);
  else {
    const selected = events.find(x => x.id === local.selectedEventId) || events.find(x => x.status === 'published') || events[0];
    content = `<div class="staff-layout"><section><div class="staff-section-head"><div><h2>Your events</h2><p>Everything your clubs have coming up.</p></div><span class="badge green">${events.length} events</span></div><div class="staff-event-list">${events.length ? events.map(event => {
      const count = rsvps.filter(x => x.eventId === event.id).length;
      return `<article class="staff-event ${event.id === selected?.id ? 'selected' : ''}">${dateBlock(event.start)}<div><h3>${E(event.title)}</h3><p>${E(event.host || clubFor(state, event.clubId).name)}<br>${E(timeText(event.start))} · ${E(event.location || 'Location to be confirmed')}</p></div><div class="staff-event-end">${badge(finished(event) && event.status === 'published' ? 'completed' : event.status)}<div class="staff-event-actions">${btn(`${count} RSVP${count === 1 ? '' : 's'}`, 'roster', { id: event.id }, 'ghost small')}${!finished(event) && event.status !== 'cancelled' ? btn('Edit', 'edit-event', { id: event.id }) : ''}${event.status === 'draft' ? btn('Publish', 'publish-event', { id: event.id }, 'primary small') : event.status === 'published' && !finished(event) ? btn('Cancel', 'cancel-event', { id: event.id }, 'ghost small staff-danger') : ''}</div></div></article>`;
    }).join('') : empty('Your next event starts here', 'Create an event and give your community something to look forward to.', 'calendar')}</div></section><aside class="card staff-card-pad">${selected ? roster(state, selected) : empty('An empty guest list, for now', 'Create an event to manage RSVPs and attendance.', 'users')}</aside></div>`;
  }
  return `${header('CLUB WORKSPACE', 'Make good things happen.', 'Bring your club together, from the first announcement to the final check-in.', btn(`${icon('plus')} Create event`, 'new-event', {}, 'primary'))}<div class="staff-kpis">${kpi('Published events', events.filter(x => x.status === 'published').length, 'Across your managed clubs', 'calendar')}${kpi('Event RSVPs', rsvps.length, 'Current student commitments', 'users')}${kpi('Checked in', attendees.length, 'Recorded event attendance', 'check')}${kpi('Join requests', joinRequests.length, 'Students ready to get involved', 'users')}</div><div class="staff-toolbar">${tabs([['events', 'Events & attendance'], ['announcements', 'Announcements'], ['members', `Join requests${joinRequests.length ? ` <span class="staff-mini-count">${joinRequests.length}</span>` : ''}`]], local.organizerTab, 'organizerTab')}</div>${content}`;
}

function roster(state, event) {
  const rsvps = A(state.rsvps).filter(x => x.eventId === event.id);
  const present = A(state.attendance).filter(x => x.eventId === event.id && x.present);
  const capacity = Number(event.capacity || 0);
  return `<div class="staff-roster-head"><div class="eyebrow">ATTENDANCE DESK</div><h3>${E(event.title)}</h3><p>${E(dateText(event.start))} · ${E(timeText(event.start))}</p><div class="staff-progress-label"><span>${rsvps.length}${capacity ? ` of ${capacity}` : ''} spots reserved</span><span>${present.length} checked in</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, capacity ? rsvps.length / capacity * 100 : rsvps.length ? 100 : 0)}%"></div></div></div>${rsvps.length ? rsvps.map(r => {
    const student = studentFor(state, r.studentId); const checked = present.some(x => x.studentId === r.studentId);
    return `<div class="staff-roster-person"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><small>${student.grade ? `Grade ${E(student.grade)}` : 'Student member'}</small></div>${finished(event) && event.status === 'published' ? `<button type="button" class="staff-check ${checked ? 'present' : ''}" data-staff-action="attendance" data-event-id="${E(event.id)}" data-student-id="${E(r.studentId)}" data-present="${!checked}" aria-pressed="${checked}">${checked ? '✓ Checked in' : 'Check in'}</button>` : '<span class="badge green">Reserved</span>'}</div>`;
  }).join('') : empty('The guest list is open', 'Student RSVPs will appear here.', 'users')}<div class="staff-note">${icon('info')} <strong>A clearer picture of participation.</strong> ${finished(event) ? 'Record who attended. Attendance updates your school’s engagement overview.' : 'Check-in opens after this event finishes. Select a completed event to record attendance.'}${!finished(event) && event.status === 'published' ? `<div style="margin-top:12px">${btn('Simulate event completion', 'advance-demo', { id: event.id }, 'secondary small')}<p style="margin:8px 0 0">Moves the demo clock past this event. Reset demo to return to Nov 16.</p></div>` : ''}</div>`;
}

function announcements(state, persona) {
  const clubs = A(state.clubs).filter(x => persona.role === 'admin' || A(persona.clubIds).includes(x.id));
  const schoolWide = ['advisor', 'admin'].includes(persona.role);
  const posts = A(state.announcements).filter(x => persona.role === 'admin' || A(persona.clubIds).includes(x.clubId) || (schoolWide && !x.clubId));
  return `<div class="staff-layout"><section class="card staff-card-pad"><div class="staff-section-head"><div><h2>One post. Everyone in the loop.</h2><p>Share a club update with your members.</p></div>${icon('bell')}</div><form data-staff-form="announcement"><div class="staff-form-grid"><label class="full">Audience<select name="clubId">${schoolWide ? '<option value="">School-wide announcement</option>' : ''}${clubs.map(c => `<option value="${E(c.id)}">${E(c.name)}</option>`).join('')}</select></label><label class="full">Title<input name="title" required maxlength="100" placeholder="What should your members know?"></label><label class="full">Announcement<textarea name="body" required maxlength="1500" placeholder="Share the details, next steps, or a quick reminder."></textarea></label></div><p class="staff-form-error" role="alert"></p><div class="staff-form-footer"><button class="btn primary" type="submit">${icon('arrow')} Publish announcement</button></div></form></section><section class="card staff-card-pad"><div class="staff-section-head"><div><h2>Recent announcements</h2><p>Your club’s latest updates.</p></div></div>${posts.length ? posts.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(x => `<article class="staff-announcement"><h3>${E(x.title)}</h3><p>${E(x.body || x.content)}</p><small>${E(clubFor(state, x.clubId).name)}${x.createdAt ? ` · ${E(dateText(x.createdAt))}` : ''}</small></article>`).join('') : empty('Room for your first update', 'Your published announcements will appear here.', 'bell')}</section></div>`;
}

function membershipQueue(state, persona) {
  const records = A(state.memberships).filter(x => (persona.role === 'admin' || A(persona.clubIds).includes(x.clubId)) && x.status === 'pending');
  return `<section class="card staff-card-pad"><div class="staff-section-head"><div><h2>A place in your community</h2><p>Review students who have requested to join your clubs.</p></div></div>${records.length ? records.map(x => { const student = studentFor(state, x.studentId); return `<div class="staff-roster-person"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><small>${E(clubFor(state, x.clubId).name)}${student.grade ? ` · Grade ${E(student.grade)}` : ''}</small></div><div class="staff-action-row">${btn('Decline', 'membership', { id: x.id, status: 'rejected' }, 'ghost small')}${btn('Welcome to the club', 'membership', { id: x.id, status: 'active' }, 'primary small')}</div></div>`; }).join('') : empty('You’re all caught up', 'New requests to join your clubs will appear here.', 'users')}</section>`;
}

function advisor(state) {
  const logs = A(state.serviceLogs);
  const pending = logs.filter(x => x.status === 'pending');
  const approved = logs.filter(x => x.status === 'approved');
  const returned = logs.filter(x => x.status === 'returned');
  const shown = logs.filter(x => x.status === local.serviceTab);
  return `${header('ADVISOR WORKSPACE', 'Recognize every contribution.', 'Review service records and help students turn their time into meaningful progress.')}<div class="staff-kpis">${kpi('Awaiting review', pending.length, 'Service records ready for you', 'bookmark')}${kpi('Approved hours', hoursText(approved.reduce((sum, x) => sum + Number(x.hours || 0), 0)), 'Verified across your school', 'heart')}${kpi('Students contributing', new Set(logs.map(x => x.studentId)).size, 'Students with service records', 'users')}${kpi('Returned for updates', returned.length, 'Students can edit and resubmit', 'reset')}</div><div class="staff-toolbar">${tabs([['pending', `Awaiting review <span class="staff-mini-count">${pending.length}</span>`], ['approved', 'Approved'], ['returned', 'Returned']], local.serviceTab, 'serviceTab')}<span class="muted" style="font-size:11px">${shown.length} record${shown.length === 1 ? '' : 's'}</span></div><div class="staff-review-grid">${shown.length ? shown.map(log => {
    const student = studentFor(state, log.studentId); const event = eventFor(state, log.eventId);
    return `<article class="staff-review-card"><div class="staff-review-person"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><span>${student.grade ? `Grade ${E(student.grade)}` : 'Student volunteer'}</span></div>${badge(log.status)}</div><h3>${E(event?.title || log.title || 'Community service')}</h3><p class="staff-review-description">${E(event?.location || log.organization || 'Community volunteering')}</p><div class="staff-review-meta"><span><strong>${hoursText(log.hours)} hours</strong> contributed</span><span>${E(dateText(log.date || event?.start || log.submittedAt))}</span></div>${log.notes ? `<div class="staff-review-note">“${E(log.notes)}”</div>` : ''}${log.reason ? `<div class="staff-review-note returned"><strong>Review note:</strong> ${E(log.reason)}</div>` : ''}${log.status === 'pending' ? `<div class="staff-action-row">${btn('Return for updates', 'return-hours', { id: log.id }, 'secondary small')}${btn(`${icon('check')} Approve hours`, 'approve-hours', { id: log.id }, 'primary small')}</div>` : `<div class="staff-table-note">${log.status === 'approved' ? 'These hours count toward the student’s approved service total.' : 'The student can update this record and submit it again.'}</div>`}</article>`;
  }).join('') : `<div class="card" style="grid-column:1/-1">${empty(local.serviceTab === 'pending' ? 'Every contribution is accounted for' : 'No records here yet', local.serviceTab === 'pending' ? 'There are no service records waiting for review.' : 'Records will appear here as your review queue progresses.', 'check')}</div>`}</div>`;
}

function partner(state, persona) {
  const p = partnerFor(state, persona.partnerId);
  const listings = A(state.listings).filter(x => x.partnerId === persona.partnerId);
  const listingIds = new Set(listings.map(x => x.id));
  const eventIds = new Set(listings.map(x => x.eventId).filter(Boolean));
  const interests = A(state.saved).filter(x => listingIds.has(x.listingId));
  const registrations = A(state.rsvps).filter(x => eventIds.has(x.eventId));
  return `${header('PARTNER WORKSPACE', 'A little local impact.', 'Connect students with opportunities that make a difference in their community.', btn(`${icon('plus')} Create listing`, 'new-listing', {}, 'primary'))}<div class="staff-partner-banner"><div class="staff-partner-mark">${icon('leaf')}</div><div><h2>${E(p.name)}</h2><p>${E(p.description || 'Opening doors for the next generation of community changemakers.')}</p></div>${badge(p.status || 'approved')}</div><div class="staff-kpis">${kpi('Published listings', listings.filter(x => x.status === 'published').length, 'Visible in student discovery', 'school')}${kpi('Student signups', registrations.length, 'Confirmed event registrations', 'users')}${kpi('Saved by students', interests.length, 'Across your opportunity listings', 'heart')}${kpi('Awaiting approval', listings.filter(x => x.status === 'pending').length, 'In the school review queue', 'clock')}</div><div class="staff-section-head"><div><h2>Your opportunities</h2><p>A meaningful next step is just one listing away.</p></div><span class="badge green">${listings.length} listings</span></div><div class="staff-listings">${listings.length ? listings.map(x => {
    const count = x.eventId ? A(state.rsvps).filter(r => r.eventId === x.eventId).length : interests.filter(i => i.listingId === x.id).length;
    return `<article class="staff-listing"><div class="staff-listing-top ${E(x.type)}">${icon(({ volunteer: 'heart', internship: 'briefcase', job: 'briefcase', discount: 'bookmark', sponsorship: 'users' })[x.type] || 'heart')}${badge(x.status)}</div><div class="staff-listing-body"><div class="eyebrow" style="margin-bottom:9px">${E(cap(x.type))}</div><h3>${E(x.title)}</h3><p>${E(x.description)}</p><div class="staff-listing-details"><span>${icon('pin')}${E(x.location || 'Local community')}</span>${x.hours ? `<span>${icon('clock')}${hoursText(x.hours)} service hours</span>` : x.benefit ? `<span>${icon('spark')}${E(x.benefit)}</span>` : ''}</div>${x.reason ? `<div class="staff-review-note returned"><strong>School feedback:</strong> ${E(x.reason)}</div>` : ''}<div class="staff-listing-footer"><small>${count} ${x.eventId ? 'student signups' : 'student saves'}</small><div class="staff-action-row">${btn('Edit', 'edit-listing', { id: x.id })}${['draft', 'rejected'].includes(x.status) ? btn('Submit for review', 'submit-listing', { id: x.id }, 'primary small') : ''}</div></div>${x.status === 'pending' ? '<div class="staff-status-note">Your listing becomes visible to students after school approval.</div>' : ''}</div></article>`;
  }).join('') : `<div class="card" style="grid-column:1/-1">${empty('Your next connection starts here', 'Create a volunteering, internship, job, discount, or sponsorship listing.', 'leaf')}</div>`}</div><p class="staff-wide-note">School approval keeps student discovery relevant. Editing a published listing sends it back through review before the updated version appears.</p>`;
}

function admin(state) {
  const listings = A(state.listings).filter(x => x.status === 'pending');
  const partners = A(state.partners).filter(x => x.status === 'pending');
  const pending = listings.length + partners.length;
  const approvedHours = A(state.serviceLogs).filter(x => x.status === 'approved').reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const participants = new Set([...A(state.rsvps).map(x => x.studentId), ...A(state.attendance).filter(x => x.present).map(x => x.studentId), ...A(state.serviceLogs).map(x => x.studentId)]);
  let content;
  if (local.adminTab === 'review') content = adminReview(state);
  else if (local.adminTab === 'clubs') content = adminClubs(state);
  else if (local.adminTab === 'plan') content = businessPlan();
  else content = analytics(state);
  return `${header('SCHOOL WORKSPACE', 'A more connected campus.', 'See involvement take shape, and give your community the support it needs.')}<div class="staff-kpis">${kpi('Students participating', participants.size, 'Unique students with activity', 'users')}${kpi('Active clubs', A(state.clubs).length, 'Places to find a community', 'compass')}${kpi('Approved service hours', hoursText(approvedHours), 'Time making a difference', 'heart')}${kpi('Waiting for review', pending, 'Partner and opportunity submissions', 'bookmark')}</div><div class="staff-toolbar">${tabs([['overview', 'Overview'], ['review', `Review queue${pending ? ` <span class="staff-mini-count">${pending}</span>` : ''}`], ['clubs', 'Clubs'], ['plan', 'Business model']], local.adminTab, 'adminTab')}<span class="badge green">Live demo data</span></div>${content}`;
}

function analytics(state) {
  const clubs = A(state.clubs);
  const memberCounts = clubs.map(c => ({ name: c.name, count: A(state.memberships).filter(m => m.clubId === c.id && m.status === 'active').length })).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxMembers = Math.max(1, ...memberCounts.map(x => x.count));
  const stats = [
    ['Club memberships', A(state.memberships).filter(x => x.status === 'active').length],
    ['Event RSVPs', A(state.rsvps).length],
    ['Attendance records', A(state.attendance).filter(x => x.present).length],
    ['Approved service records', A(state.serviceLogs).filter(x => x.status === 'approved').length]
  ];
  const max = Math.max(1, ...stats.map(x => x[1]));
  const categories = [...new Set(A(state.events).filter(x => x.status === 'published').map(x => x.category))].filter(Boolean);
  const summary = categories.map(c => ({ label: c, value: A(state.events).filter(x => x.category === c && x.status === 'published').length }));
  return `<div class="staff-analytics-grid"><section class="card staff-analytics-card"><h3>Where students find their people</h3><p>Active memberships by club</p><div class="staff-chart" role="img" aria-label="Club membership counts: ${E(memberCounts.map(x => `${x.name}: ${x.count}`).join(', '))}">${memberCounts.map(x => `<div class="staff-bar-group"><span class="staff-bar-value">${x.count}</span><div class="staff-bar" style="height:${x.count / maxMembers * 135}px"></div><span class="staff-bar-label">${E(x.name.replace(' Club', ''))}</span></div>`).join('')}</div><div class="staff-analytics-foot">A student can belong to more than one club. Counts include approved memberships.</div></section><section class="card staff-analytics-card"><h3>From interest to involvement</h3><p>Participation records across your school</p><div class="staff-funnel">${stats.map(([label, value]) => `<div class="staff-funnel-row"><div><span>${E(label)}</span><strong>${value}</strong></div><div class="staff-funnel-track"><div class="staff-funnel-fill" style="width:${value / max * 100}%"></div></div></div>`).join('')}</div><div class="staff-analytics-foot">These are different types of activity, not stages of a measured conversion funnel. One student can contribute multiple records.</div></section><section class="card staff-analytics-card"><h3>A full campus calendar</h3><p>Published events by category</p><div class="staff-funnel">${summary.length ? summary.map(({ label, value }) => `<div class="staff-funnel-row"><div><span>${E(cap(label))}</span><strong>${value} event${value === 1 ? '' : 's'}</strong></div><div class="staff-funnel-track"><div class="staff-funnel-fill" style="width:${value / Math.max(1, ...summary.map(x => x.value)) * 100}%"></div></div></div>`).join('') : empty('The calendar is ready', 'Published events will be summarized here.', 'calendar')}</div></section><section class="card staff-analytics-card"><h3>Community at a glance</h3><p>The people and opportunities beyond the classroom</p><div class="staff-funnel">${[['Approved partners', A(state.partners).filter(x => x.status === 'approved').length], ['Published opportunities', A(state.listings).filter(x => x.status === 'published').length], ['Student service submissions', A(state.serviceLogs).length], ['Published announcements', A(state.announcements).length]].map(([label, n]) => `<div class="staff-funnel-row"><div><span>${E(label)}</span><strong>${n}</strong></div></div>`).join('')}</div><div class="staff-analytics-foot">Every number comes from the shared demo records and updates as students and staff take action.</div></section></div>`;
}

function adminReview(state) {
  const partners = A(state.partners).filter(x => x.status === 'pending');
  const listings = A(state.listings).filter(x => x.status === 'pending');
  if (!partners.length && !listings.length) return `<section class="card">${empty('Good to go, campus', 'There are no partner applications or listings waiting for review.', 'check')}</section>`;
  return `${partners.length ? `<h3 class="staff-admin-review-heading">Partner applications <span class="staff-mini-count">${partners.length}</span></h3><div class="staff-review-grid">${partners.map(p => `<article class="staff-review-card"><div class="staff-review-person"><div class="avatar">${E(initials(p.name))}</div><div><strong>${E(p.name)}</strong><span>${E(p.type || p.category || 'Community organization')}</span></div>${badge(p.status)}</div><p class="staff-review-description">${E(p.description || 'A local organization requesting to share student opportunities.')}</p>${p.website ? `<p class="staff-review-description">Website: ${E(p.website)}</p>` : ''}<div class="staff-action-row">${btn('Decline', 'reject-partner', { id: p.id }, 'secondary small')}${btn('Approve partner', 'approve-partner', { id: p.id }, 'primary small')}</div></article>`).join('')}</div>` : ''}${listings.length ? `<h3 class="staff-admin-review-heading">Opportunity listings <span class="staff-mini-count">${listings.length}</span></h3><div class="staff-review-grid">${listings.map(x => `<article class="staff-review-card"><div class="staff-review-person"><div class="avatar">${icon('leaf')}</div><div><strong>${E(partnerFor(state, x.partnerId).name)}</strong><span>${E(cap(x.type))}</span></div>${badge(x.status)}</div><h3>${E(x.title)}</h3><p class="staff-review-description">${E(x.description)}</p><div class="staff-review-meta"><span>${E(x.location || 'Local community')}</span>${x.hours ? `<span><strong>${hoursText(x.hours)} hours</strong></span>` : ''}${x.benefit ? `<span>${E(x.benefit)}</span>` : ''}</div><div class="staff-action-row">${btn('Return with feedback', 'reject-listing', { id: x.id })}${btn('Approve & publish', 'approve-listing', { id: x.id }, 'primary small')}</div></article>`).join('')}</div>` : ''}`;
}

function adminClubs(state) {
  return `<section class="card staff-card-pad"><div class="staff-section-head"><div><h2>The communities on campus</h2><p>Club profiles and the students who make them.</p></div><span class="badge green">${A(state.clubs).length} clubs</span></div>${A(state.clubs).map(c => `<div class="staff-club-row"><div class="staff-club-symbol">${E(initials(c.name))}</div><div><h3>${E(c.name)}</h3><p>${E(c.category || 'Student organization')} · ${A(state.memberships).filter(m => m.clubId === c.id && m.status === 'active').length} active members${c.advisor ? ` · ${E(c.advisor)}` : ''}</p></div>${btn('Edit profile', 'edit-club', { id: c.id })}</div>`).join('')}</section>`;
}

function businessPlan() {
  return `<div class="staff-plan-grid"><article class="staff-plan featured"><span class="badge green">PROPOSED SCHOOL PLAN</span><h3>One subscription. The whole campus.</h3><div class="staff-price">$2,000 <span>/ school / year</span></div><p>The school supports the platform so students can focus on getting involved.</p><ul><li>Access for students, staff, and club leaders</li><li>Calendar, RSVP, announcements, and attendance tools</li><li>Volunteer hour tracking and school review</li><li>School engagement analytics</li></ul></article><article class="staff-plan"><span class="badge amber">PROPOSED PARTNER PLAN</span><h3>Local opportunities, closer to students.</h3><div class="staff-price">$25 <span>/ business / month</span></div><p>An optional listing plan for approved local businesses and community partners.</p><ul><li>School-reviewed opportunity listings</li><li>Volunteer, internship, job, and sponsorship opportunities</li><li>Student discounts and expressions of interest</li><li>Listing activity and student signup counts</li></ul></article></div><div class="staff-note"><strong>A business model for the DECA presentation.</strong> These are proposed prices from the Campus Connect concept. This demo does not accept payments, start subscriptions, or represent a signed school agreement.</div>`;
}

export function renderStaff(route, state, persona) {
  currentDemoNow = state.demoNow || DEMO_NOW;
  const name = String(route).replace(/^#/, '').split('?')[0];
  if (name === '/advisor') return advisor(state, persona);
  if (name === '/partner') return partner(state, persona);
  if (name === '/admin') return admin(state, persona);
  return organizer(state, persona);
}

function inputDate(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(+d)) return fallback;
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return parts.replace(' ', 'T');
}

function showForm(api, title, fields, submitLabel, onSubmit) {
  api.modal(title, `<form data-staff-modal><div class="staff-form-grid">${fields}</div><p class="staff-form-error" role="alert"></p><div class="staff-form-footer"><button type="button" class="btn secondary" data-staff-modal-close>Cancel</button><button type="submit" class="btn primary">${E(submitLabel)}</button></div></form>`);
  const form = document.querySelector('[data-staff-modal]');
  if (!form) return;
  form.querySelector('[data-staff-modal-close]').addEventListener('click', () => api.closeModal());
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try { onSubmit(Object.fromEntries(new FormData(form)), form); api.closeModal(); }
    catch (error) { form.querySelector('.staff-form-error').textContent = error.message || 'Please check the details and try again.'; }
  });
  return form;
}

function eventForm(api, id) {
  const state = api.store.get(); const persona = personFor(state); const event = eventFor(state, id) || {};
  const clubs = A(state.clubs).filter(c => persona.role === 'admin' || A(persona.clubIds).includes(c.id));
  const categories = ['Club', 'School', 'Athletics', 'Volunteering'];
  const fields = `<label class="full">Event title<input name="title" value="${E(event.title)}" required maxlength="100" placeholder="Give your event a memorable name"></label><label>Hosted by<select name="clubId">${['advisor','admin'].includes(persona.role) ? '<option value="">School-wide event</option>' : ''}${clubs.map(c => `<option value="${E(c.id)}" ${c.id === event.clubId ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select></label><label>Category<select name="category">${categories.map(c => `<option value="${E(c)}" ${c === (event.category || 'Club') ? 'selected' : ''}>${E(cap(c))}</option>`).join('')}</select></label><label>Starts · Eastern time<input name="start" type="datetime-local" required value="${inputDate(event.start, '2026-11-18T15:30')}"></label><label>Ends · Eastern time<input name="end" type="datetime-local" required value="${inputDate(event.end, '2026-11-18T16:30')}"></label><label>Location<input name="location" required maxlength="120" value="${E(event.location)}" placeholder="Room 214, Lightridge High School"></label><label>Student capacity<input name="capacity" type="number" required min="1" max="2000" value="${Number(event.capacity || 30)}"></label><label class="full">Description<textarea name="description" required maxlength="1500" placeholder="Let students know what to expect.">${E(event.description)}</textarea></label>`;
  showForm(api, id ? 'Edit event' : 'Create a campus moment', fields, id ? 'Save changes' : 'Save draft', data => {
    if (new Date(data.end) <= new Date(data.start)) throw new Error('The event must end after it starts.');
    api.store.act('saveEvent', { ...data, id, capacity: Number(data.capacity), status: event.status || 'draft', host: data.clubId ? clubFor(state, data.clubId).name : 'Student Activities', color: event.color || 'green' });
    api.toast(id ? 'Event updated. Student calendars are up to date.' : 'Event draft saved. Publish it when you’re ready.');
    api.render();
  });
}

function listingForm(api, id) {
  const state = api.store.get();
  const listing = A(state.listings).find(x => x.id === id) || {};
  const linked = eventFor(state, listing.eventId) || {};
  const types = listing.eventId ? ['volunteer'] : ['volunteer', 'internship', 'job', 'discount', 'sponsorship'];
  const fields = `${listing.status === 'published' ? '<div class="full staff-note"><strong>This listing is currently published.</strong> Saving changes moves it to draft and releases existing volunteer reservations with a notification. Submit it again for school review; students can reserve again after approval.</div>' : ''}<label class="full">Listing title<input name="title" required maxlength="100" value="${E(listing.title)}" placeholder="An opportunity worth discovering"></label><label>Opportunity type<select name="type">${types.map(t => `<option value="${t}" ${t === (listing.type || 'volunteer') ? 'selected' : ''}>${cap(t)}</option>`).join('')}</select></label><label>Location<input name="location" required maxlength="120" value="${E(listing.location)}" placeholder="Where does it take place?"></label><div class="full staff-form-grid" data-volunteer-fields><label>Starts · Eastern time<input name="start" type="datetime-local" value="${inputDate(linked.start, '2026-11-21T10:00')}"></label><label>Ends · Eastern time<input name="end" type="datetime-local" value="${inputDate(linked.end, '2026-11-21T13:00')}"></label><label>Volunteer capacity<input name="capacity" type="number" min="1" max="10000" step="1" value="${Number(linked.capacity || 20)}"></label><div class="staff-note" style="margin-top:0">Service hours are calculated from the event’s start and end time.</div></div><label class="full">Benefit or offer<input name="benefit" required maxlength="100" value="${E(listing.benefit)}" placeholder="3 service hours, paid internship, 10% off…"></label><label class="full">Description<textarea name="description" required maxlength="1500" placeholder="Explain who this is for and what students can expect.">${E(listing.description)}</textarea></label>`;
  const form = showForm(api, id ? 'Edit your listing' : 'Make an opportunity happen', fields, 'Save listing', data => {
    if (data.type === 'volunteer' && (!data.start || !data.end || new Date(data.end) <= new Date(data.start))) throw new Error('Volunteer opportunities need a start and an end time after the start.');
    api.store.act('saveListing', { ...data, id, capacity: Number(data.capacity) || undefined });
    api.toast('Listing saved. Submit it for school review when you’re ready.'); api.render();
  });
  if (form) {
    const updateFields = () => {
      const enabled = form.elements.type.value === 'volunteer';
      const section = form.querySelector('[data-volunteer-fields]');
      section.hidden = !enabled;
      section.style.display = enabled ? '' : 'none';
      section.querySelectorAll('input').forEach(input => { input.required = enabled; input.disabled = !enabled; });
    };
    form.elements.type.addEventListener('change', updateFields);
    updateFields();
  }
}

function reasonForm(api, title, prompt, label, action, payload, success) {
  showForm(api, title, `<label class="full">${E(prompt)}<textarea name="reason" required maxlength="500" placeholder="A helpful note makes the next step clear."></textarea></label>`, label, data => { api.store.act(action, { ...payload, reason: data.reason }); api.toast(success); api.render(); });
}

export function bindStaff(root, api) {
  if (boundController) boundController.abort();
  boundController = new AbortController();
  const options = { signal: boundController.signal };
  const act = (type, payload, message) => { api.store.act(type, payload); if (message) api.toast(message); api.render(); };
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-staff-action]');
    if (!target || !root.contains(target)) return;
    const { staffAction: action, id } = target.dataset;
    try {
      if (action === 'tab') {
        const { group, value } = target.dataset;
        local[group] = value;
        api.render();
        Array.from(document.querySelectorAll('[data-staff-action="tab"]')).find(button => button.dataset.group === group && button.dataset.value === value)?.focus({ preventScroll: true });
      }
      else if (action === 'roster') { local.selectedEventId = id; api.render(); }
      else if (action === 'new-event') eventForm(api);
      else if (action === 'edit-event') eventForm(api, id);
      else if (action === 'publish-event') act('publishEvent', { id }, 'Event published. Students can now discover and RSVP.');
      else if (action === 'cancel-event') {
        const eventRecord = eventFor(api.store.get(), id);
        showForm(api, 'Cancel this event?', `<div class="full staff-note"><strong>${E(eventRecord?.title)}</strong><br>Students who RSVP’d will receive a cancellation notification. The event will remain in your records.</div>`, 'Cancel event', () => act('cancelEvent', { id }, 'Event cancelled and students notified.'));
      }
      else if (action === 'attendance') act('markAttendance', { eventId: target.dataset.eventId, studentId: target.dataset.studentId, present: target.dataset.present === 'true' }, target.dataset.present === 'true' ? 'Student checked in.' : 'Check-in removed.');
      else if (action === 'advance-demo') {
        showForm(api, 'Simulate this event’s completion', '<div class="full staff-note">This advances only the sample timeline so you can check students in and continue the service-hours journey. Use Reset demo to return to November 16.</div>', 'Move demo clock forward', () => { local.selectedEventId = id; act('advanceDemoTime', { eventId: id }, 'Demo clock advanced. Attendance is now available.'); });
      }
      else if (action === 'membership') act('setMembership', { id, status: target.dataset.status }, target.dataset.status === 'active' ? 'Membership approved. Welcome to the club!' : 'Join request declined.');
      else if (action === 'approve-hours') act('reviewHours', { id, status: 'approved' }, 'Service hours approved. The student’s total is updated.');
      else if (action === 'return-hours') reasonForm(api, 'Help the student update their record', 'What needs to be corrected?', 'Return for updates', 'reviewHours', { id, status: 'returned' }, 'Record returned with your feedback.');
      else if (action === 'new-listing') listingForm(api);
      else if (action === 'edit-listing') listingForm(api, id);
      else if (action === 'submit-listing') act('submitListing', { id }, 'Listing submitted for school review.');
      else if (action === 'approve-listing') act('reviewListing', { id, status: 'published' }, 'Listing approved and available to students.');
      else if (action === 'reject-listing') reasonForm(api, 'Return listing with feedback', 'What should the partner update?', 'Return listing', 'reviewListing', { id, status: 'rejected' }, 'Listing returned with your feedback.');
      else if (action === 'approve-partner') act('reviewPartner', { id, status: 'approved' }, 'Community partner approved.');
      else if (action === 'reject-partner') reasonForm(api, 'Decline partner application', 'Reason for declining', 'Decline application', 'reviewPartner', { id, status: 'rejected' }, 'Partner application declined.');
      else if (action === 'edit-club') {
        const club = clubFor(api.store.get(), id);
        showForm(api, 'Edit club profile', `<label class="full">Club name<input name="name" required maxlength="80" value="${E(club.name)}"></label><label>Category<input name="category" required maxlength="60" value="${E(club.category)}"></label><label>Meeting location<input name="room" maxlength="120" value="${E(club.room)}"></label><label class="full">About the club<textarea name="description" required maxlength="1500">${E(club.description)}</textarea></label>`, 'Save club profile', data => act('saveClub', { ...data, id }, 'Club profile updated.'));
      }
    } catch (error) { api.toast(error.message || 'Something needs another look. Please try again.', 'error'); }
  }, options);
  root.addEventListener('submit', event => {
    const form = event.target.closest('[data-staff-form]');
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      if (form.dataset.staffForm === 'announcement') {
        const data = Object.fromEntries(new FormData(form));
        act('postAnnouncement', data, 'Announcement published. Your members are in the loop.');
      }
    } catch (error) { form.querySelector('.staff-form-error').textContent = error.message || 'Please check your announcement.'; }
  }, options);
}
