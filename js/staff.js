import { escape, icon, formatDate, formatTime } from './ui.js?v=20261116c';
import { DEMO_NOW } from './seed.js?v=20261116c';

const initialView = () => ({ organizerTab: 'events', serviceTab: 'pending', adminTab: 'overview', selectedEventId: null, selectedLogId: null, organizerPage: 1, servicePage: 1, rosterPage: 1 });
const local = initialView();
export function resetStaffView() { Object.assign(local, initialView()); }
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
const kpi = (label, value, detail, symbol) => `<div class="staff-kpi"><div class="staff-kpi-top"><span>${E(label)}</span>${icon(symbol)}</div><strong>${E(value)}</strong></div>`;
const tabs = (items, selected, group) => `<div class="tabs" role="group" aria-label="${E({ organizerTab: 'Club workspace sections', serviceTab: 'Service record status', adminTab: 'School workspace sections' }[group] || 'Workspace sections')}">${items.map(([key, label]) => `<button type="button" aria-pressed="${key === selected}" class="tab ${key === selected ? 'active' : ''}" data-staff-action="tab" data-group="${group}" data-value="${key}">${label}</button>`).join('')}</div>`;
const header = (eyebrow, title, subtitle, action = '') => `<div class="page-heading staff-page-heading"><div>${eyebrow ? `<div class="eyebrow">${E(eyebrow)}</div>` : ''}<h1>${E(title)}</h1>${subtitle ? `<p>${E(subtitle)}</p>` : ''}</div>${action ? `<div class="staff-heading-actions">${action}</div>` : ''}</div>`;
const dateBlock = value => { const d = new Date(value); return Number.isNaN(+d) ? '<div class="staff-date"><span>DATE</span><strong>—</strong></div>' : `<div class="staff-date"><span>${E(d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' }))}</span><strong>${d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' })}</strong></div>`; };

function pageOf(records, requested, size) {
  const pages = Math.max(1, Math.ceil(records.length / size));
  const page = Math.max(1, Math.min(pages, Number(requested) || 1));
  const start = (page - 1) * size;
  return { page, pages, start, end: Math.min(start + size, records.length), items: records.slice(start, start + size) };
}
function pager(total, page, size, group, label) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (total <= size) return '';
  return `<nav class="staff-pagination" aria-label="${E(label)} pages"><span>${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}</span><div><button type="button" class="icon-btn" data-staff-action="page" data-group="${group}" data-value="${page - 1}" aria-label="Previous ${E(label)} page" ${page <= 1 ? 'disabled' : ''}>${icon('left',17)}</button><span class="staff-page-number">${page} / ${pages}</span><button type="button" class="icon-btn" data-staff-action="page" data-group="${group}" data-value="${page + 1}" aria-label="Next ${E(label)} page" ${page >= pages ? 'disabled' : ''}>${icon('chevron',17)}</button></div></nav>`;
}

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
    const chosenIndex = events.findIndex(x => x.id === local.selectedEventId);
    if (chosenIndex >= 0) local.organizerPage = Math.floor(chosenIndex / 5) + 1;
    const page = pageOf(events, local.organizerPage, 5);
    local.organizerPage = page.page;
    const selected = page.items.find(x => x.id === local.selectedEventId) || page.items.find(x => x.status === 'published') || page.items[0];
    if (local.selectedEventId !== selected?.id) local.rosterPage = 1;
    local.selectedEventId = selected?.id || null;
    content = `<div class="staff-layout staff-events-layout"><section class="card staff-event-panel"><div class="staff-section-head staff-panel-heading"><h2>Events</h2><span class="staff-record-count">${events.length} total</span></div><div class="staff-event-list">${events.length ? page.items.map(event => {
      const count = rsvps.filter(x => x.eventId === event.id).length;
      return `<article class="staff-event ${event.id === selected?.id ? 'selected' : ''}" data-event-row="${E(event.id)}">${dateBlock(event.start)}<div class="staff-event-main"><button type="button" class="staff-record-title" data-staff-action="roster" data-id="${E(event.id)}" aria-pressed="${event.id === selected?.id}">${E(event.title)}</button><p>${E(timeText(event.start))} · ${E(event.location || 'Location to be confirmed')}</p><div class="staff-event-actions">${btn(`${count} RSVP${count === 1 ? '' : 's'}`, 'roster', { id: event.id }, 'ghost small')}${!finished(event) && event.status !== 'cancelled' ? btn('Edit', 'edit-event', { id: event.id }) : ''}${event.status === 'draft' ? btn('Publish', 'publish-event', { id: event.id }, 'primary small') : event.status === 'published' && !finished(event) ? btn('Cancel', 'cancel-event', { id: event.id }, 'ghost small staff-danger') : ''}</div></div><div class="staff-event-state">${badge(finished(event) && event.status === 'published' ? 'completed' : event.status)}</div></article>`;
    }).join('') : empty('No events yet', 'Create an event to start accepting RSVPs.', 'calendar')}</div>${pager(events.length, page.page, 5, 'organizerPage', 'events')}</section><aside class="card staff-card-pad staff-attendance-panel" aria-label="Selected event attendance">${selected ? roster(state, selected) : empty('No event selected', 'Create an event to manage attendance.', 'users')}</aside></div>`;
  }
  return `${header('', 'Manage clubs', '', btn(`${icon('plus')} Create event`, 'new-event', {}, 'primary'))}<div class="staff-kpis">${kpi('Published events', events.filter(x => x.status === 'published').length, '', 'calendar')}${kpi('Event RSVPs', rsvps.length, '', 'users')}${kpi('Checked in', attendees.length, '', 'check')}${kpi('Join requests', joinRequests.length, '', 'users')}</div><div class="staff-toolbar">${tabs([['events', 'Events & attendance'], ['announcements', 'Announcements'], ['members', `Join requests${joinRequests.length ? ` <span class="staff-mini-count">${joinRequests.length}</span>` : ''}`]], local.organizerTab, 'organizerTab')}</div>${content}`;
}

function roster(state, event) {
  const rsvps = A(state.rsvps).filter(x => x.eventId === event.id);
  const present = A(state.attendance).filter(x => x.eventId === event.id && x.present);
  const capacity = Number(event.capacity || 0);
  const page = pageOf(rsvps, local.rosterPage, 6);
  local.rosterPage = page.page;
  return `<div class="staff-roster-head"><div class="staff-detail-eyebrow">${icon('users',16)} Attendance</div><h3>${E(event.title)}</h3><p>${E(dateText(event.start))} · ${E(timeText(event.start))}</p><div class="staff-progress-label"><span>${rsvps.length}${capacity ? ` of ${capacity}` : ''} spots reserved</span><span>${present.length} checked in</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, capacity ? rsvps.length / capacity * 100 : rsvps.length ? 100 : 0)}%"></div></div></div><div class="staff-roster-list">${rsvps.length ? page.items.map(r => {
    const student = studentFor(state, r.studentId); const checked = present.some(x => x.studentId === r.studentId);
    return `<div class="staff-roster-person" data-roster-student="${E(r.studentId)}"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><small>${student.grade ? `Grade ${E(student.grade)}` : 'Student member'}</small></div>${finished(event) && event.status === 'published' ? `<button type="button" class="staff-check ${checked ? 'present' : ''}" data-staff-action="attendance" data-event-id="${E(event.id)}" data-student-id="${E(r.studentId)}" data-present="${!checked}" aria-pressed="${checked}">${checked ? '✓ Checked in' : 'Check in'}</button>` : '<span class="badge">Reserved</span>'}</div>`;
  }).join('') : empty('No RSVPs yet', 'Students who RSVP will appear here.', 'users')}</div>${pager(rsvps.length, page.page, 6, 'rosterPage', 'attendees')}<div class="staff-note">${event.status === 'cancelled' ? 'This event was cancelled.' : event.status === 'draft' ? 'Publish this event to accept RSVPs.' : finished(event) ? 'Record attendance using the check-in buttons.' : 'Check-in opens after the event ends.'}${!finished(event) && event.status === 'published' ? `<div class="staff-simulation">${btn('Simulate event completion', 'advance-demo', { id: event.id }, 'secondary small')}<p>Advances the demo clock. Reset restores Nov 16.</p></div>` : ''}</div>`;
}

function announcements(state, persona) {
  const clubs = A(state.clubs).filter(x => persona.role === 'admin' || A(persona.clubIds).includes(x.id));
  const schoolWide = ['advisor', 'admin'].includes(persona.role);
  const posts = A(state.announcements).filter(x => persona.role === 'admin' || A(persona.clubIds).includes(x.clubId) || (schoolWide && !x.clubId));
  return `<div class="staff-layout"><section class="card staff-card-pad"><div class="staff-section-head"><div><h2>New announcement</h2></div>${icon('bell')}</div><form data-staff-form="announcement"><div class="staff-form-grid"><label class="full">Audience<select name="clubId">${schoolWide ? '<option value="">School-wide announcement</option>' : ''}${clubs.map(c => `<option value="${E(c.id)}">${E(c.name)}</option>`).join('')}</select></label><label class="full">Title<input name="title" required maxlength="100" placeholder="Announcement title"></label><label class="full">Announcement<textarea name="body" required maxlength="1500" placeholder="Add details or a reminder"></textarea></label></div><p class="staff-form-error" role="alert"></p><div class="staff-form-footer"><button class="btn primary" type="submit">${icon('arrow')} Publish announcement</button></div></form></section><section class="card staff-card-pad"><div class="staff-section-head"><div><h2>Recent announcements</h2></div></div>${posts.length ? posts.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).map(x => `<article class="staff-announcement"><h3>${E(x.title)}</h3><p>${E(x.body || x.content)}</p><small>${E(clubFor(state, x.clubId).name)}${x.createdAt ? ` · ${E(dateText(x.createdAt))}` : ''}</small></article>`).join('') : empty('No announcements yet', 'Published announcements will appear here.', 'bell')}</section></div>`;
}

function membershipQueue(state, persona) {
  const records = A(state.memberships).filter(x => (persona.role === 'admin' || A(persona.clubIds).includes(x.clubId)) && x.status === 'pending');
  return `<section class="card staff-card-pad"><div class="staff-section-head"><div><h2>Join requests</h2></div></div>${records.length ? records.map(x => { const student = studentFor(state, x.studentId); return `<div class="staff-roster-person"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><small>${E(clubFor(state, x.clubId).name)}${student.grade ? ` · Grade ${E(student.grade)}` : ''}</small></div><div class="staff-action-row">${btn('Decline', 'membership', { id: x.id, status: 'rejected' }, 'ghost small')}${btn('Approve', 'membership', { id: x.id, status: 'active' }, 'primary small')}</div></div>`; }).join('') : empty('No pending requests', 'New club requests will appear here.', 'users')}</section>`;
}

function serviceReviewDetail(log, state) {
  const student = studentFor(state, log.studentId);
  const event = eventFor(state, log.eventId);
  return `<article class="staff-review-card staff-selected-review" data-selected-review="${E(log.id)}"><div class="staff-detail-eyebrow">${icon('shield',16)} Service record</div><div class="staff-review-person"><div class="avatar">${E(initials(student.name))}</div><div><strong>${E(student.name)}</strong><span>${student.grade ? `Grade ${E(student.grade)}` : 'Student volunteer'}</span></div>${badge(log.status)}</div><h3>${E(event?.title || log.title || 'Community service')}</h3><p class="staff-review-description">${E(event?.location || log.organization || 'Community volunteering')}</p><dl class="staff-review-facts"><div><dt>Hours submitted</dt><dd>${hoursText(log.hours)} hours</dd></div><div><dt>Activity date</dt><dd>${E(dateText(log.date || event?.start || log.submittedAt))}</dd></div><div><dt>Attendance</dt><dd>${A(state.attendance).some(x => x.eventId === log.eventId && x.studentId === log.studentId && x.present) ? `${icon('check',14)} Confirmed` : 'Not recorded'}</dd></div></dl>${log.notes ? `<div class="staff-review-note"><span>Student notes</span><p>${E(log.notes)}</p></div>` : ''}${log.reason ? `<div class="staff-review-note returned"><span>Review note</span><p>${E(log.reason)}</p></div>` : ''}${log.status === 'pending' ? `<div class="staff-review-decision"><p>Approved hours count toward the student’s total.</p><div class="staff-action-row">${btn('Return for updates', 'return-hours', { id: log.id }, 'secondary')}${btn(`${icon('check',17)} Approve hours`, 'approve-hours', { id: log.id }, 'primary')}</div></div>` : `<div class="staff-table-note">${log.status === 'approved' ? 'Added to the student’s service total.' : 'Waiting for the student to resubmit.'}</div>`}</article>`;
}

function advisor(state) {
  const logs = A(state.serviceLogs);
  const pending = logs.filter(x => x.status === 'pending');
  const approved = logs.filter(x => x.status === 'approved');
  const returned = logs.filter(x => x.status === 'returned');
  const shown = logs.filter(x => x.status === local.serviceTab).sort((a,b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  const page = pageOf(shown, local.servicePage, 8);
  local.servicePage = page.page;
  const selected = page.items.find(x => x.id === local.selectedLogId) || page.items[0];
  local.selectedLogId = selected?.id || null;
  const records = shown.length ? `<div class="staff-review-layout"><section class="card staff-review-list"><div class="staff-panel-heading"><h2>${local.serviceTab === 'pending' ? 'Review queue' : cap(local.serviceTab) + ' records'}</h2><span class="staff-record-count">${shown.length} total</span></div>${page.items.map(log => { const student = studentFor(state, log.studentId); const event = eventFor(state, log.eventId); return `<button type="button" class="staff-review-row ${log.id === selected?.id ? 'selected' : ''}" data-staff-action="review-record" data-id="${E(log.id)}" aria-pressed="${log.id === selected?.id}"><span class="avatar">${E(initials(student.name))}</span><span class="staff-review-row-copy"><strong>${E(student.name)}</strong><span>${E(event?.title || log.title || 'Community service')}</span><small>${E(dateText(log.date || event?.start || log.submittedAt))}</small></span><span class="staff-review-row-hours">${hoursText(log.hours)}<small>hours</small></span>${icon('chevron',17)}</button>`; }).join('')}${pager(shown.length, page.page, 8, 'servicePage', 'service records')}</section><aside aria-label="Selected service record">${serviceReviewDetail(selected,state)}</aside></div>` : `<section class="card">${empty(local.serviceTab === 'pending' ? 'No pending records' : 'No records yet', local.serviceTab === 'pending' ? 'All submitted hours have been reviewed.' : 'Reviewed records will appear here.', 'check')}</section>`;
  return `${header('', 'Service hours', '')}<div class="staff-kpis">${kpi('Awaiting review', pending.length, '', 'bookmark')}${kpi('Approved hours', hoursText(approved.reduce((sum, x) => sum + Number(x.hours || 0), 0)), '', 'heart')}${kpi('Students', new Set(logs.map(x => x.studentId)).size, '', 'users')}${kpi('Returned', returned.length, '', 'reset')}</div><div class="staff-toolbar">${tabs([['pending', `Awaiting review <span class="staff-mini-count">${pending.length}</span>`], ['approved', 'Approved'], ['returned', 'Returned']], local.serviceTab, 'serviceTab')}</div>${records}`;
}

function partner(state, persona) {
  const p = partnerFor(state, persona.partnerId);
  const listings = A(state.listings).filter(x => x.partnerId === persona.partnerId);
  const listingIds = new Set(listings.map(x => x.id));
  const eventIds = new Set(listings.map(x => x.eventId).filter(Boolean));
  const interests = A(state.saved).filter(x => listingIds.has(x.listingId));
  const registrations = A(state.rsvps).filter(x => eventIds.has(x.eventId));
  return `${header('', 'Opportunities', '', btn(`${icon('plus')} Create listing`, 'new-listing', {}, 'primary'))}<div class="staff-partner-banner"><div class="staff-partner-mark">${icon('leaf')}</div><div><h2>${E(p.name)}</h2><p>${E(p.description || 'Community partner')}</p></div>${badge(p.status || 'approved')}</div><div class="staff-kpis">${kpi('Published listings', listings.filter(x => x.status === 'published').length, 'Visible in student discovery', 'school')}${kpi('Student signups', registrations.length, 'Confirmed event registrations', 'users')}${kpi('Saved by students', interests.length, 'Across your opportunity listings', 'heart')}${kpi('Awaiting approval', listings.filter(x => x.status === 'pending').length, 'In the school review queue', 'clock')}</div><div class="staff-section-head"><div><h2>Your listings</h2></div><span class="badge green">${listings.length} listings</span></div><div class="staff-listings">${listings.length ? listings.map(x => {
    const count = x.eventId ? A(state.rsvps).filter(r => r.eventId === x.eventId).length : interests.filter(i => i.listingId === x.id).length;
    return `<article class="staff-listing"><div class="staff-listing-top ${E(x.type)}">${icon(({ volunteer: 'heart', internship: 'briefcase', job: 'briefcase', discount: 'bookmark', sponsorship: 'users' })[x.type] || 'heart')}${badge(x.status)}</div><div class="staff-listing-body"><div class="eyebrow" style="margin-bottom:9px">${E(cap(x.type))}</div><h3>${E(x.title)}</h3><p>${E(x.description)}</p><div class="staff-listing-details"><span>${icon('pin')}${E(x.location || 'Local community')}</span>${x.hours ? `<span>${icon('clock')}${hoursText(x.hours)} service hours</span>` : x.benefit ? `<span>${icon('spark')}${E(x.benefit)}</span>` : ''}</div>${x.reason ? `<div class="staff-review-note returned"><strong>School feedback:</strong> ${E(x.reason)}</div>` : ''}<div class="staff-listing-footer"><small>${count} ${x.eventId ? 'student signups' : 'student saves'}</small><div class="staff-action-row">${btn('Edit', 'edit-listing', { id: x.id })}${['draft', 'rejected'].includes(x.status) ? btn('Submit for review', 'submit-listing', { id: x.id }, 'primary small') : ''}</div></div>${x.status === 'pending' ? '<div class="staff-status-note">Awaiting school approval.</div>' : ''}</div></article>`;
  }).join('') : `<div class="card" style="grid-column:1/-1">${empty('No listings yet', 'Create an opportunity for students.', 'leaf')}</div>`}</div><p class="staff-wide-note">Published listings need school approval again after edits.</p>`;
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
  return `${header('', 'School overview', '')}<div class="staff-kpis">${kpi('Participating students', participants.size, 'Unique students with activity', 'users')}${kpi('Active clubs', A(state.clubs).length, 'Places to find a community', 'compass')}${kpi('Approved hours', hoursText(approvedHours), 'Time making a difference', 'heart')}${kpi('Partner reviews', pending, 'Partner and opportunity submissions', 'bookmark')}</div><div class="staff-toolbar">${tabs([['overview', 'Overview'], ['review', `Review queue${pending ? ` <span class="staff-mini-count">${pending}</span>` : ''}`], ['clubs', 'Clubs'], ['plan', 'Business model']], local.adminTab, 'adminTab')}</div>${content}`;
}

function analytics(state) {
  const memberCounts = A(state.clubs).map(c => ({ name: c.name, count: A(state.memberships).filter(m => m.clubId === c.id && m.status === 'active').length })).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxMembers = Math.max(1, ...memberCounts.map(x => x.count));
  const stats = [
    ['Club memberships', A(state.memberships).filter(x => x.status === 'active').length, 'users'],
    ['Event RSVPs', A(state.rsvps).length, 'calendar'],
    ['Attendance records', A(state.attendance).filter(x => x.present).length, 'check'],
    ['Approved service records', A(state.serviceLogs).filter(x => x.status === 'approved').length, 'heart']
  ];
  const categories = [...new Set(A(state.events).filter(x => x.status === 'published').map(x => x.category))].filter(Boolean);
  const summary = categories.map(c => ({ label: c, value: A(state.events).filter(x => x.category === c && x.status === 'published').length }));
  return `<div class="staff-analytics-grid"><section class="card staff-analytics-card"><div class="staff-analytics-title"><div><h3>Club membership</h3><p>Top 6 clubs by active members</p></div>${icon('users',20)}</div><div class="staff-horizontal-chart" role="img" aria-label="Club membership counts: ${E(memberCounts.map(x => `${x.name}: ${x.count}`).join(', '))}">${memberCounts.map(x => `<div class="staff-horizontal-bar"><div><span>${E(x.name)}</span><strong>${x.count}</strong></div><div class="staff-horizontal-track"><span style="width:${x.count / maxMembers * 100}%"></span></div></div>`).join('')}</div><div class="staff-analytics-foot">Students may belong to multiple clubs.</div></section><section class="card staff-analytics-card"><div class="staff-analytics-title"><div><h3>Participation</h3><p>Activity across your school</p></div>${icon('chart',20)}</div><div class="staff-activity-totals">${stats.map(([label, value, symbol]) => `<div>${icon(symbol,19)}<strong>${value}</strong><span>${E(label)}</span></div>`).join('')}</div><div class="staff-analytics-foot">Activity counts, not unique students.</div></section><section class="card staff-analytics-card"><div class="staff-analytics-title"><div><h3>Events by category</h3><p>Published events</p></div>${icon('calendar',20)}</div><div class="staff-category-counts">${summary.length ? summary.map(({ label, value }) => `<div><span class="staff-category-dot category-${E(label.toLowerCase())}"></span><span>${E(cap(label))}</span><strong>${value}</strong><small>events</small></div>`).join('') : empty('No published events', 'Publish an event to see it here.', 'calendar')}</div></section><section class="card staff-analytics-card"><div class="staff-analytics-title"><div><h3>Community</h3><p>Partners and school content</p></div>${icon('school',20)}</div><dl class="staff-community-counts">${[['Approved partners', A(state.partners).filter(x => x.status === 'approved').length], ['Published opportunities', A(state.listings).filter(x => x.status === 'published').length], ['Student service submissions', A(state.serviceLogs).length], ['Published announcements', A(state.announcements).length]].map(([label, n]) => `<div><dt>${E(label)}</dt><dd>${n}</dd></div>`).join('')}</dl></section></div>`;
}

function adminReview(state) {
  const partners = A(state.partners).filter(x => x.status === 'pending');
  const listings = A(state.listings).filter(x => x.status === 'pending');
  if (!partners.length && !listings.length) return `<section class="card">${empty('No pending reviews', 'Partner applications and listings will appear here.', 'check')}</section>`;
  return `${partners.length ? `<h3 class="staff-admin-review-heading">Partner applications <span class="staff-mini-count">${partners.length}</span></h3><div class="staff-review-grid">${partners.map(p => `<article class="staff-review-card"><div class="staff-review-person"><div class="avatar">${E(initials(p.name))}</div><div><strong>${E(p.name)}</strong><span>${E(p.type || p.category || 'Community organization')}</span></div>${badge(p.status)}</div><p class="staff-review-description">${E(p.description || 'A local organization requesting to share student opportunities.')}</p>${p.website ? `<p class="staff-review-description">Website: ${E(p.website)}</p>` : ''}<div class="staff-action-row">${btn('Decline', 'reject-partner', { id: p.id }, 'secondary small')}${btn('Approve partner', 'approve-partner', { id: p.id }, 'primary small')}</div></article>`).join('')}</div>` : ''}${listings.length ? `<h3 class="staff-admin-review-heading">Opportunity listings <span class="staff-mini-count">${listings.length}</span></h3><div class="staff-review-grid">${listings.map(x => `<article class="staff-review-card"><div class="staff-review-person"><div class="avatar">${icon('leaf')}</div><div><strong>${E(partnerFor(state, x.partnerId).name)}</strong><span>${E(cap(x.type))}</span></div>${badge(x.status)}</div><h3>${E(x.title)}</h3><p class="staff-review-description">${E(x.description)}</p><div class="staff-review-meta"><span>${E(x.location || 'Local community')}</span>${x.hours ? `<span><strong>${hoursText(x.hours)} hours</strong></span>` : ''}${x.benefit ? `<span>${E(x.benefit)}</span>` : ''}</div><div class="staff-action-row">${btn('Return with feedback', 'reject-listing', { id: x.id })}${btn('Approve & publish', 'approve-listing', { id: x.id }, 'primary small')}</div></article>`).join('')}</div>` : ''}`;
}

function adminClubs(state) {
  return `<section class="card staff-card-pad"><div class="staff-section-head"><div><h2>Clubs</h2></div><span class="badge green">${A(state.clubs).length} clubs</span></div>${A(state.clubs).map(c => `<div class="staff-club-row"><div class="staff-club-symbol">${E(initials(c.name))}</div><div><h3>${E(c.name)}</h3><p>${E(c.category || 'Student organization')} · ${A(state.memberships).filter(m => m.clubId === c.id && m.status === 'active').length} active members${c.advisor ? ` · ${E(c.advisor)}` : ''}</p></div>${btn('Edit profile', 'edit-club', { id: c.id })}</div>`).join('')}</section>`;
}

function businessPlan() {
  return `<div class="staff-plan-grid"><article class="staff-plan featured"><span class="badge green">PROPOSED SCHOOL PLAN</span><h3>School plan</h3><div class="staff-price">$2,000 <span>/ school / year</span></div><ul><li>Access for students, staff, and club leaders</li><li>Calendar, RSVP, announcements, and attendance tools</li><li>Volunteer hour tracking and school review</li><li>School engagement analytics</li></ul></article><article class="staff-plan"><span class="badge amber">PROPOSED PARTNER PLAN</span><h3>Partner plan</h3><div class="staff-price">$25 <span>/ business / month</span></div><p>Optional plan for approved community partners.</p><ul><li>School-reviewed opportunity listings</li><li>Volunteer, internship, job, and sponsorship opportunities</li><li>Student discounts and expressions of interest</li><li>Listing activity and student signup counts</li></ul></article></div><div class="staff-note"><strong>Proposed pricing.</strong> For the DECA concept only. No payments or subscriptions are processed.</div>`;
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
  const fields = `<label class="full">Event title<input name="title" value="${E(event.title)}" required maxlength="100" placeholder="Event title"></label><label>Hosted by<select name="clubId">${['advisor','admin'].includes(persona.role) ? '<option value="">School-wide event</option>' : ''}${clubs.map(c => `<option value="${E(c.id)}" ${c.id === event.clubId ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select></label><label>Category<select name="category">${categories.map(c => `<option value="${E(c)}" ${c === (event.category || 'Club') ? 'selected' : ''}>${E(cap(c))}</option>`).join('')}</select></label><label>Starts · Eastern time<input name="start" type="datetime-local" required value="${inputDate(event.start, '2026-11-18T15:30')}"></label><label>Ends · Eastern time<input name="end" type="datetime-local" required value="${inputDate(event.end, '2026-11-18T16:30')}"></label><label>Location<input name="location" required maxlength="120" value="${E(event.location)}" placeholder="Room 214, Lightridge High School"></label><label>Student capacity<input name="capacity" type="number" required min="1" max="2000" value="${Number(event.capacity || 30)}"></label><label class="full">Description<textarea name="description" required maxlength="1500" placeholder="What should students know?">${E(event.description)}</textarea></label>`;
  showForm(api, id ? 'Edit event' : 'Create event', fields, id ? 'Save changes' : 'Save draft', data => {
    if (new Date(data.end) <= new Date(data.start)) throw new Error('The event must end after it starts.');
    api.store.act('saveEvent', { ...data, id, capacity: Number(data.capacity), status: event.status || 'draft', host: data.clubId ? clubFor(state, data.clubId).name : 'Student Activities', color: event.color || 'green' });
    api.toast(id ? 'Event updated.' : 'Draft saved.');
    api.render();
  });
}

function listingForm(api, id) {
  const state = api.store.get();
  const listing = A(state.listings).find(x => x.id === id) || {};
  const linked = eventFor(state, listing.eventId) || {};
  const types = listing.eventId ? ['volunteer'] : ['volunteer', 'internship', 'job', 'discount', 'sponsorship'];
  const fields = `${listing.status === 'published' ? '<div class="full staff-note"><strong>Editing unpublishes this listing.</strong> Existing volunteer reservations are released and students are notified. Resubmit for school approval after saving.</div>' : ''}<label class="full">Listing title<input name="title" required maxlength="100" value="${E(listing.title)}" placeholder="Listing title"></label><label>Opportunity type<select name="type">${types.map(t => `<option value="${t}" ${t === (listing.type || 'volunteer') ? 'selected' : ''}>${cap(t)}</option>`).join('')}</select></label><label>Location<input name="location" required maxlength="120" value="${E(listing.location)}" placeholder="Location"></label><div class="full staff-form-grid" data-volunteer-fields><label>Starts · Eastern time<input name="start" type="datetime-local" value="${inputDate(linked.start, '2026-11-21T10:00')}"></label><label>Ends · Eastern time<input name="end" type="datetime-local" value="${inputDate(linked.end, '2026-11-21T13:00')}"></label><label>Volunteer capacity<input name="capacity" type="number" min="1" max="10000" step="1" value="${Number(linked.capacity || 20)}"></label><div class="staff-note" style="margin-top:0">Service hours use the event duration.</div></div><label class="full">Benefit or offer<input name="benefit" required maxlength="100" value="${E(listing.benefit)}" placeholder="3 service hours, paid internship, 10% off…"></label><label class="full">Description<textarea name="description" required maxlength="1500" placeholder="Requirements and details">${E(listing.description)}</textarea></label>`;
  const form = showForm(api, id ? 'Edit listing' : 'Create listing', fields, 'Save listing', data => {
    if (data.type === 'volunteer' && (!data.start || !data.end || new Date(data.end) <= new Date(data.start))) throw new Error('Volunteer opportunities need a start and an end time after the start.');
    api.store.act('saveListing', { ...data, id, capacity: Number(data.capacity) || undefined });
    api.toast('Draft saved. Submit it for school review.'); api.render();
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
  showForm(api, title, `<label class="full">${E(prompt)}<textarea name="reason" required maxlength="500" placeholder="Explain the required changes"></textarea></label>`, label, data => { api.store.act(action, { ...payload, reason: data.reason }); api.toast(success); api.render(); });
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
        if (!['organizerTab', 'serviceTab', 'adminTab'].includes(group)) return;
        local[group] = value;
        if (group === 'serviceTab') { local.servicePage = 1; local.selectedLogId = null; }
        api.render();
        Array.from(document.querySelectorAll('[data-staff-action="tab"]')).find(button => button.dataset.group === group && button.dataset.value === value)?.focus({ preventScroll: true });
      }
      else if (action === 'page') {
        const { group, value } = target.dataset;
        if (!['organizerPage', 'servicePage', 'rosterPage'].includes(group)) return;
        local[group] = Math.max(1, Number(value) || 1);
        if (group === 'organizerPage') { local.selectedEventId = null; local.rosterPage = 1; }
        if (group === 'servicePage') local.selectedLogId = null;
        api.render();
      }
      else if (action === 'roster') { local.selectedEventId = id; local.rosterPage = 1; api.render(); }
      else if (action === 'review-record') { local.selectedLogId = id; api.render(); }
      else if (action === 'new-event') eventForm(api);
      else if (action === 'edit-event') eventForm(api, id);
      else if (action === 'publish-event') act('publishEvent', { id }, 'Event published.');
      else if (action === 'cancel-event') {
        const eventRecord = eventFor(api.store.get(), id);
        showForm(api, 'Cancel this event?', `<div class="full staff-note"><strong>${E(eventRecord?.title)}</strong><br>Students who RSVP’d will receive a cancellation notification. The event will remain in your records.</div>`, 'Cancel event', () => act('cancelEvent', { id }, 'Event cancelled and students notified.'));
      }
      else if (action === 'attendance') act('markAttendance', { eventId: target.dataset.eventId, studentId: target.dataset.studentId, present: target.dataset.present === 'true' }, target.dataset.present === 'true' ? 'Student checked in.' : 'Check-in removed.');
      else if (action === 'advance-demo') {
        showForm(api, 'Simulate this event’s completion', '<div class="full staff-note">Advances the demo clock past this event to enable attendance. Reset demo restores November 16.</div>', 'Advance demo clock', () => { local.selectedEventId = id; act('advanceDemoTime', { eventId: id }, 'Demo clock advanced. Attendance is now available.'); });
      }
      else if (action === 'membership') act('setMembership', { id, status: target.dataset.status }, target.dataset.status === 'active' ? 'Membership approved.' : 'Join request declined.');
      else if (action === 'approve-hours') act('reviewHours', { id, status: 'approved' }, 'Service hours approved.');
      else if (action === 'return-hours') reasonForm(api, 'Return service record', 'What needs to be corrected?', 'Return for updates', 'reviewHours', { id, status: 'returned' }, 'Record returned with your feedback.');
      else if (action === 'new-listing') listingForm(api);
      else if (action === 'edit-listing') listingForm(api, id);
      else if (action === 'submit-listing') act('submitListing', { id }, 'Listing submitted for school review.');
      else if (action === 'approve-listing') act('reviewListing', { id, status: 'published' }, 'Listing published.');
      else if (action === 'reject-listing') reasonForm(api, 'Return listing with feedback', 'What should the partner update?', 'Return listing', 'reviewListing', { id, status: 'rejected' }, 'Listing returned with your feedback.');
      else if (action === 'approve-partner') act('reviewPartner', { id, status: 'approved' }, 'Community partner approved.');
      else if (action === 'reject-partner') reasonForm(api, 'Decline partner application', 'Reason for declining', 'Decline application', 'reviewPartner', { id, status: 'rejected' }, 'Partner application declined.');
      else if (action === 'edit-club') {
        const club = clubFor(api.store.get(), id);
        showForm(api, 'Edit club profile', `<label class="full">Club name<input name="name" required maxlength="80" value="${E(club.name)}"></label><label>Category<input name="category" required maxlength="60" value="${E(club.category)}"></label><label>Meeting location<input name="room" maxlength="120" value="${E(club.room)}"></label><label class="full">About the club<textarea name="description" required maxlength="1500">${E(club.description)}</textarea></label>`, 'Save club profile', data => act('saveClub', { ...data, id }, 'Club profile updated.'));
      }
    } catch (error) { api.toast(error.message || 'Could not save. Please try again.', 'error'); }
  }, options);
  root.addEventListener('submit', event => {
    const form = event.target.closest('[data-staff-form]');
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      if (form.dataset.staffForm === 'announcement') {
        const data = Object.fromEntries(new FormData(form));
        act('postAnnouncement', data, 'Announcement published.');
      }
    } catch (error) { form.querySelector('.staff-form-error').textContent = error.message || 'Please check your announcement.'; }
  }, options);
}
