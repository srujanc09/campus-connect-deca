import { createSeed, DEMO_NOW } from './seed.js';

export const STORAGE_KEY = 'campus-connect.demo.v1';
const VERSION = 1;
const now = state => Date.parse(state.demoNow || DEMO_NOW);
const currentTime = state => state.demoNow || DEMO_NOW;
const copy = value => JSON.parse(JSON.stringify(value));
const fail = (message, code = 'VALIDATION') => { const error = new Error(message); error.code = code; throw error; };
const requireThat = (condition, message, code) => { if (!condition) fail(message, code); };
const clean = (value, label, max = 2000) => {
  const result = String(value ?? '').trim();
  requireThat(result.length > 0, `${label} is required.`);
  requireThat(result.length <= max, `${label} must be ${max} characters or fewer.`);
  return result;
};
const find = (rows, id, label) => {
  const row = rows.find(item => item.id === id);
  requireThat(row, `${label} was not found.`, 'NOT_FOUND');
  return row;
};
const nextId = (state, key, prefix) => {
  let number = state[key].reduce((max, row) => Math.max(max, Number(String(row.id || '').replace(/^\D+/, '')) || 0), 0) + 1;
  while (state[key].some(row => row.id === `${prefix}${number}`)) number++;
  return `${prefix}${number}`;
};
const timestamp = value => {
  let text = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) text += ':00-05:00';
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) text += '-05:00';
  requireThat(Number.isFinite(Date.parse(text)), 'Choose a valid date and time.');
  return text;
};
const duration = event => (Date.parse(event.end) - Date.parse(event.start)) / 3600000;
const personaOf = state => find(state.personas, state.activePersonaId, 'Demo persona');
const studentOf = state => {
  const persona = personaOf(state);
  requireThat(['student', 'leader'].includes(persona.role) && persona.studentId, 'Switch to a student demo view for this action.', 'FORBIDDEN');
  return find(state.students, persona.studentId, 'Student');
};
const staffOf = state => {
  const persona = personaOf(state);
  requireThat(['leader', 'advisor', 'admin'].includes(persona.role), 'This action is available in a staff demo view.', 'FORBIDDEN');
  return persona;
};
const adminOf = state => {
  const persona = personaOf(state);
  requireThat(persona.role === 'admin', 'Switch to the administrator demo view for this action.', 'FORBIDDEN');
  return persona;
};
const canManageEvent = (persona, event) => persona.role === 'admin' || (persona.role === 'advisor' && (!event.clubId || event.category === 'Volunteering')) || (persona.clubIds || []).includes(event.clubId);
const manageEvent = (state, event) => {
  const persona = staffOf(state);
  requireThat(canManageEvent(persona, event), 'This event belongs to another organizer.', 'FORBIDDEN');
  return persona;
};
const manageClub = (state, clubId) => {
  const persona = staffOf(state);
  find(state.clubs, clubId, 'Club');
  requireThat(persona.role === 'admin' || persona.clubIds.includes(clubId), 'This club belongs to another organizer.', 'FORBIDDEN');
  return persona;
};
const manageListing = (state, listing) => {
  const persona = personaOf(state);
  requireThat(persona.role === 'admin' || (persona.role === 'partner' && persona.partnerId === listing.partnerId), 'This listing belongs to another partner.', 'FORBIDDEN');
  return persona;
};
const notify = (state, studentId, title, body, href = '#/notifications') => {
  state.notifications.unshift({ id: nextId(state, 'notifications', 'n'), studentId, title, body, href, read: false, createdAt: currentTime(state) });
};
const record = (state, studentId, type, extra = {}) => state.activity.push({ id: nextId(state, 'activity', 'ac'), studentId, type, createdAt: currentTime(state), ...extra });
const eventRecipients = (state, eventId) => [...new Set(state.rsvps.filter(r => r.eventId === eventId).map(r => r.studentId))];
const notifyEvent = (state, event, title, body) => eventRecipients(state, event.id).forEach(id => notify(state, id, title, body, `#/event/${event.id}`));
const validateService = (state, event, studentId, hours) => {
  requireThat(event.category === 'Volunteering', 'Service hours must be linked to a volunteer event.');
  requireThat(event.status === 'published', 'This volunteer event is not available for service credit.');
  requireThat(Date.parse(event.end) <= now(state), 'Service hours can be submitted after the event has finished.');
  requireThat(state.attendance.some(a => a.eventId === event.id && a.studentId === studentId && a.present), 'An organizer must confirm your attendance before you can submit hours.');
  requireThat(Number.isFinite(hours) && hours > 0 && hours <= duration(event), `Enter hours greater than zero and no more than the event length (${duration(event)} hours).`);
};

function action(state, type, payload = {}) {
  const p = payload || {};
  switch (type) {
    case 'rsvp': {
      const student = studentOf(state);
      const event = find(state.events, p.eventId, 'Event');
      requireThat(event.status === 'published', 'This event is not accepting reservations.');
      requireThat(Date.parse(event.start) > now(state), 'Reservations close when the event starts.');
      requireThat(!state.rsvps.some(r => r.eventId === event.id && r.studentId === student.id), 'You already have a place at this event.', 'DUPLICATE');
      requireThat(state.rsvps.filter(r => r.eventId === event.id).length < event.capacity, 'This event is full. Try another opportunity.', 'FULL');
      const conflicting = state.rsvps.filter(r => r.studentId === student.id).map(r => state.events.find(e => e.id === r.eventId)).find(other => other && other.status === 'published' && Date.parse(other.start) < Date.parse(event.end) && Date.parse(other.end) > Date.parse(event.start));
      requireThat(!conflicting || p.allowConflict === true, `This overlaps with ${conflicting?.title}. You can still reserve a place after confirming the conflict.`, 'CONFLICT');
      const row = { id: nextId(state, 'rsvps', 'r'), eventId: event.id, studentId: student.id };
      state.rsvps.push(row);
      record(state, student.id, 'rsvp', { eventId: event.id });
      notify(state, student.id, "You're on the list", `Your place at ${event.title} is reserved.`, `#/event/${event.id}`);
      return row;
    }
    case 'cancelRsvp': {
      const student = studentOf(state);
      const event = find(state.events, p.eventId, 'Event');
      requireThat(Date.parse(event.start) > now(state), 'Reservations for past events cannot be changed.');
      const row = state.rsvps.find(r => r.eventId === event.id && r.studentId === student.id);
      requireThat(row, 'You do not have a reservation for this event.');
      state.rsvps = state.rsvps.filter(r => r.id !== row.id);
      record(state, student.id, 'rsvp_cancelled', { eventId: event.id });
      notify(state, student.id, 'Reservation cancelled', `Your place at ${event.title} has been released.`, `#/event/${event.id}`);
      return row;
    }
    case 'joinClub': {
      const student = studentOf(state);
      const club = find(state.clubs, p.clubId, 'Club');
      requireThat(!state.memberships.some(m => m.clubId === club.id && m.studentId === student.id), 'You have already joined or requested to join this club.', 'DUPLICATE');
      const row = { id: nextId(state, 'memberships', 'm'), clubId: club.id, studentId: student.id, status: club.joinMode === 'approval' ? 'pending' : 'active' };
      state.memberships.push(row);
      record(state, student.id, 'club_join', { clubId: club.id });
      notify(state, student.id, row.status === 'active' ? `Welcome to ${club.name}` : 'Membership request submitted', row.status === 'active' ? 'Club announcements and events are now part of your campus experience.' : `An organizer will review your request to join ${club.name}.`, `#/club/${club.id}`);
      return row;
    }
    case 'leaveClub': {
      const student = studentOf(state);
      const row = state.memberships.find(m => m.clubId === p.clubId && m.studentId === student.id);
      requireThat(row, 'You are not a member of this club.');
      state.memberships = state.memberships.filter(m => m.id !== row.id);
      record(state, student.id, 'club_leave', { clubId: p.clubId });
      return row;
    }
    case 'setMembership': {
      const row = find(state.memberships, p.id, 'Membership');
      manageClub(state, row.clubId);
      const club = find(state.clubs, row.clubId, 'Club');
      requireThat(['active', 'pending', 'rejected', 'remove'].includes(p.status), 'Choose a valid membership status.');
      if (['rejected', 'remove'].includes(p.status)) state.memberships = state.memberships.filter(m => m.id !== row.id);
      else row.status = p.status;
      notify(state, row.studentId, 'Club membership updated', p.status === 'active' ? `You are now a member of ${club.name}.` : p.status === 'pending' ? `Your ${club.name} membership is awaiting review.` : `Your request or membership for ${club.name} was removed. Contact the club advisor for more information.`, `#/club/${club.id}`);
      return row;
    }
    case 'saveClub': {
      adminOf(state);
      const row = find(state.clubs, p.id, 'Club');
      row.name = clean(p.name ?? row.name, 'Club name', 80);
      row.category = clean(p.category ?? row.category, 'Category', 60);
      row.description = clean(p.description ?? row.description, 'Description', 1500);
      row.room = clean(p.room ?? p.location ?? row.room, 'Meeting location', 120);
      return row;
    }
    case 'saveEvent': {
      const persona = staffOf(state);
      const old = p.id ? find(state.events, p.id, 'Event') : null;
      if (old) manageEvent(state, old);
      const clubId = p.clubId === '' ? undefined : p.clubId ?? old?.clubId;
      if (clubId) find(state.clubs, clubId, 'Club');
      const event = { ...(old || {}), id: old?.id || nextId(state, 'events', 'e'), title: clean(p.title ?? old?.title, 'Event title', 140), description: clean(p.description ?? old?.description, 'Description'), category: p.category ?? old?.category ?? 'Club', start: timestamp(p.start ?? old?.start), end: timestamp(p.end ?? old?.end), location: clean(p.location ?? old?.location, 'Location', 160), capacity: Number(p.capacity ?? old?.capacity ?? 30), status: old?.status || 'draft', host: String(p.host ?? old?.host ?? (clubId ? state.clubs.find(c => c.id === clubId).name : persona.name)), color: old?.color || state.clubs.find(c => c.id === clubId)?.color || '#365d4e' };
      if (clubId) event.clubId = clubId; else delete event.clubId;
      requireThat(['Club', 'School', 'Athletics', 'Volunteering'].includes(event.category), 'Choose a valid event category.');
      requireThat(canManageEvent(persona, event), 'Choose a club you organize for this event.', 'FORBIDDEN');
      requireThat(event.status !== 'cancelled', 'Cancelled events cannot be edited. Create a new event instead.');
      requireThat(Date.parse(event.end) > Date.parse(event.start), 'The event must end after it starts.');
      requireThat(Date.parse(event.start) > now(state), 'Choose a future date for this event.');
      requireThat(Number.isInteger(event.capacity) && event.capacity > 0 && event.capacity <= 10000, 'Capacity must be a whole number between 1 and 10,000.');
      requireThat(event.capacity >= state.rsvps.filter(r => r.eventId === event.id).length, 'Capacity cannot be lower than existing reservations.');
      if (old) { state.events[state.events.findIndex(e => e.id === old.id)] = event; notifyEvent(state, event, 'Event details updated', `${event.title} has updated details. Check the time and location before you go.`); }
      else state.events.push(event);
      return event;
    }
    case 'publishEvent': {
      const event = find(state.events, p.id, 'Event');
      manageEvent(state, event);
      requireThat(event.status === 'draft', 'Only a draft event can be published.');
      requireThat(Date.parse(event.start) > now(state), 'Choose a future date before publishing this event.');
      if (event.listingId) requireThat(state.listings.find(l => l.id === event.listingId)?.status === 'published', 'The linked partner listing must be approved first.');
      event.status = 'published';
      return event;
    }
    case 'cancelEvent': {
      const event = find(state.events, p.id, 'Event');
      manageEvent(state, event);
      requireThat(Date.parse(event.start) > now(state), 'Past events cannot be cancelled.');
      requireThat(event.status !== 'cancelled', 'This event is already cancelled.');
      notifyEvent(state, event, 'Event cancelled', `${event.title} has been cancelled. Your reservation has been released.`);
      event.status = 'cancelled';
      state.rsvps = state.rsvps.filter(r => r.eventId !== event.id);
      if (event.listingId) { const listing = state.listings.find(l => l.id === event.listingId); if (listing) { listing.status = 'rejected'; listing.reason = 'The associated volunteer event was cancelled.'; } }
      return event;
    }
    case 'markAttendance': {
      const event = find(state.events, p.eventId, 'Event');
      manageEvent(state, event);
      find(state.students, p.studentId, 'Student');
      requireThat(event.status === 'published' && Date.parse(event.end) <= now(state), 'Attendance can be recorded after a published event has finished.');
      requireThat(state.rsvps.some(r => r.eventId === event.id && r.studentId === p.studentId), 'Only students on the event roster can be marked present.');
      requireThat(typeof p.present === 'boolean', 'Choose present or absent.');
      requireThat(p.present || !state.serviceLogs.some(h => h.eventId === event.id && h.studentId === p.studentId && ['pending', 'approved'].includes(h.status)), 'Attendance cannot be removed while submitted or approved service hours rely on it.');
      let row = state.attendance.find(a => a.eventId === event.id && a.studentId === p.studentId);
      if (row) row.present = p.present;
      else { row = { id: nextId(state, 'attendance', 'a'), eventId: event.id, studentId: p.studentId, present: p.present }; state.attendance.push(row); }
      return row;
    }
    case 'advanceDemoTime': {
      const event = find(state.events, p.eventId, 'Event');
      manageEvent(state, event);
      requireThat(event.status === 'published', 'Publish the event before advancing its demo timeline.');
      state.demoNow = new Date(Math.max(now(state), Date.parse(event.end) + 60000)).toISOString();
      return state.demoNow;
    }
    case 'submitHours': {
      const student = studentOf(state);
      const existing = p.id ? find(state.serviceLogs, p.id, 'Service submission') : state.serviceLogs.find(h => h.eventId === p.eventId && h.studentId === student.id);
      if (existing) {
        requireThat(existing.studentId === student.id, 'You can edit only your own service submission.', 'FORBIDDEN');
        requireThat(existing.status === 'returned', 'This event already has a pending or approved service submission.', 'DUPLICATE');
        requireThat(!p.eventId || p.eventId === existing.eventId, 'A resubmission must refer to the original event.');
      }
      const event = find(state.events, existing?.eventId || p.eventId, 'Event');
      const hours = Number(p.hours);
      validateService(state, event, student.id, hours);
      const row = { id: existing?.id || nextId(state, 'serviceLogs', 'h'), eventId: event.id, studentId: student.id, hours, notes: clean(p.notes, 'Service notes'), status: 'pending', reason: '', submittedAt: currentTime(state) };
      if (existing) state.serviceLogs[state.serviceLogs.findIndex(h => h.id === existing.id)] = row; else state.serviceLogs.push(row);
      record(state, student.id, 'hours_submitted', { eventId: event.id });
      notify(state, student.id, 'Service hours submitted', `${hours} hours from ${event.title} are ready for advisor review.`, '#/service');
      return row;
    }
    case 'reviewHours': {
      const persona = personaOf(state);
      requireThat(['advisor', 'admin'].includes(persona.role), 'Only an advisor or administrator can verify service hours.', 'FORBIDDEN');
      const row = find(state.serviceLogs, p.id, 'Service submission');
      requireThat(row.status === 'pending', 'Only pending service hours can be reviewed.');
      requireThat(['approved', 'returned'].includes(p.status), 'Choose approve or return.');
      if (p.status === 'approved') validateService(state, find(state.events, row.eventId, 'Event'), row.studentId, row.hours);
      row.reason = p.status === 'returned' ? clean(p.reason, 'A reason for returning the submission', 500) : '';
      row.status = p.status;
      row.reviewedAt = currentTime(state);
      row.reviewedBy = persona.name;
      notify(state, row.studentId, p.status === 'approved' ? 'Your service hours are approved' : 'Your service submission needs an update', p.status === 'approved' ? `${row.hours} verified hours have been added to your service total.` : row.reason, '#/service');
      return row;
    }
    case 'saveListing': {
      const persona = personaOf(state);
      requireThat(['partner', 'admin'].includes(persona.role), 'Switch to a partner or administrator demo view.', 'FORBIDDEN');
      const old = p.id ? find(state.listings, p.id, 'Listing') : null;
      if (old) manageListing(state, old);
      const partnerId = old?.partnerId || (persona.role === 'partner' ? persona.partnerId : p.partnerId);
      const partner = find(state.partners, partnerId, 'Partner');
      const listingType = p.type ?? old?.type ?? 'volunteer';
      requireThat(['volunteer', 'internship', 'job', 'discount', 'sponsorship'].includes(listingType), 'Choose a valid opportunity type.');
      if (old?.eventId) requireThat(listingType === 'volunteer', 'Create a separate listing to use a different opportunity type.');
      const row = { ...(old || {}), id: old?.id || nextId(state, 'listings', 'l'), partnerId, title: clean(p.title ?? old?.title, 'Opportunity title', 140), description: clean(p.description ?? old?.description, 'Description'), type: listingType, status: 'draft', location: clean(p.location ?? old?.location, 'Location', 160), benefit: clean(p.benefit ?? old?.benefit ?? 'Community opportunity', 'Benefit', 180), reason: '' };
      if (listingType === 'volunteer') {
        const previousEvent = old?.eventId ? find(state.events, old.eventId, 'Volunteer event') : null;
        const start = timestamp(p.start ?? previousEvent?.start);
        const end = timestamp(p.end ?? previousEvent?.end);
        requireThat(Date.parse(start) > now(state) && Date.parse(end) > Date.parse(start), 'Choose a future volunteer event with an end time after its start.');
        const capacity = Number(p.capacity ?? previousEvent?.capacity ?? 20);
        requireThat(Number.isInteger(capacity) && capacity > 0 && capacity <= 10000, 'Capacity must be a whole number between 1 and 10,000.');
        requireThat(capacity >= state.rsvps.filter(r => r.eventId === previousEvent?.id).length, 'Capacity cannot be lower than existing reservations.');
        const event = { ...(previousEvent || {}), id: previousEvent?.id || nextId(state, 'events', 'e'), listingId: row.id, title: row.title, description: row.description, category: 'Volunteering', start, end, location: row.location, capacity, status: 'draft', host: partner.name, color: partner.color };
        row.eventId = event.id;
        row.hours = duration(event);
        if (previousEvent) {
          if (previousEvent.status === 'published') {
            notifyEvent(state, previousEvent, 'Volunteer opportunity is being updated', `${previousEvent.title} is being reviewed again. Your reservation has been released; check back after approval.`);
            state.rsvps = state.rsvps.filter(r => r.eventId !== previousEvent.id);
          }
          state.events[state.events.findIndex(e => e.id === previousEvent.id)] = event;
        } else state.events.push(event);
      }
      if (old) state.listings[state.listings.findIndex(l => l.id === old.id)] = row; else state.listings.push(row);
      return row;
    }
    case 'submitListing': {
      const row = find(state.listings, p.id, 'Listing');
      manageListing(state, row);
      requireThat(['draft', 'rejected'].includes(row.status), 'Only a draft or returned listing can be submitted.');
      if (row.eventId) {
        const event = find(state.events, row.eventId, 'Volunteer event');
        requireThat(Date.parse(event.start) > now(state), 'Update the volunteer event date before submitting.');
        event.status = 'draft';
      }
      row.status = 'pending'; row.reason = '';
      return row;
    }
    case 'reviewListing': {
      adminOf(state);
      const row = find(state.listings, p.id, 'Listing');
      requireThat(row.status === 'pending', 'Only a submitted listing can be reviewed.');
      requireThat(['published', 'rejected'].includes(p.status), 'Choose approve or reject.');
      if (p.status === 'published') {
        requireThat(find(state.partners, row.partnerId, 'Partner').status === 'approved', 'Approve this partner before publishing its listing.');
        if (row.eventId) {
          const event = find(state.events, row.eventId, 'Volunteer event');
          requireThat(Date.parse(event.start) > now(state), 'The volunteer date has passed. Return the listing for an update.');
          event.status = 'published';
        }
        row.reason = '';
      } else {
        row.reason = clean(p.reason, 'A reason for returning the listing', 500);
        if (row.eventId) find(state.events, row.eventId, 'Volunteer event').status = 'draft';
      }
      row.status = p.status;
      return row;
    }
    case 'reviewPartner': {
      adminOf(state);
      const row = find(state.partners, p.id, 'Partner');
      requireThat(['approved', 'rejected'].includes(p.status), 'Choose approve or reject.');
      if (p.status === 'rejected') {
        row.reason = clean(p.reason || 'Partner participation was not approved for this demo school.', 'Reason', 500);
        for (const listing of state.listings.filter(l => l.partnerId === row.id && ['published', 'pending'].includes(l.status))) {
          listing.status = 'rejected'; listing.reason = row.reason;
          if (listing.eventId) {
            const event = find(state.events, listing.eventId, 'Volunteer event');
            if (Date.parse(event.start) > now(state)) { notifyEvent(state, event, 'Opportunity no longer available', `${event.title} is no longer available through this school.`); event.status = 'cancelled'; state.rsvps = state.rsvps.filter(r => r.eventId !== event.id); }
          }
        }
      } else row.reason = '';
      row.status = p.status;
      return row;
    }
    case 'postAnnouncement': {
      const persona = staffOf(state);
      if (p.clubId) manageClub(state, p.clubId);
      else requireThat(['advisor', 'admin'].includes(persona.role), 'Student organizers can post only to their own clubs.', 'FORBIDDEN');
      const row = { id: nextId(state, 'announcements', 'an'), title: clean(p.title, 'Announcement title', 140), body: clean(p.body, 'Announcement'), ...(p.clubId ? { clubId: p.clubId } : {}), author: persona.name, createdAt: currentTime(state) };
      state.announcements.unshift(row);
      const recipients = p.clubId ? state.memberships.filter(m => m.clubId === p.clubId && m.status === 'active').map(m => m.studentId) : state.students.map(s => s.id);
      [...new Set(recipients)].forEach(id => notify(state, id, row.title, row.body, p.clubId ? `#/club/${p.clubId}` : '#/'));
      return row;
    }
    case 'markRead': {
      const student = studentOf(state);
      if (p.id) {
        const row = find(state.notifications, p.id, 'Notification');
        requireThat(row.studentId === student.id, 'This notification belongs to another student.', 'FORBIDDEN'); row.read = true; return row;
      }
      state.notifications.filter(n => n.studentId === student.id).forEach(n => { n.read = true; });
      return true;
    }
    case 'saveOpportunity': {
      const student = studentOf(state);
      const listing = find(state.listings, p.listingId, 'Opportunity');
      requireThat(listing.status === 'published', 'This opportunity is not available yet.');
      const index = state.saved.findIndex(s => s.studentId === student.id && s.listingId === listing.id);
      if (index >= 0) { state.saved.splice(index, 1); return false; }
      state.saved.push({ studentId: student.id, listingId: listing.id });
      record(state, student.id, 'opportunity_saved', { listingId: listing.id });
      return true;
    }
    case 'setGoal': {
      const student = studentOf(state);
      const hours = Number(p.hours);
      requireThat(Number.isFinite(hours) && hours > 0 && hours <= 1000, 'Choose a service goal between 1 and 1,000 hours.');
      state.goals[student.id] = hours;
      return hours;
    }
    default: fail(`Unknown demo action: ${type}`, 'UNKNOWN_ACTION');
  }
}

function validState(candidate) {
  const arrays = ['personas', 'students', 'clubs', 'events', 'memberships', 'rsvps', 'attendance', 'partners', 'listings', 'serviceLogs', 'announcements', 'notifications', 'saved', 'activity'];
  return candidate && candidate.schemaVersion === VERSION && arrays.every(key => Array.isArray(candidate[key])) && candidate.goals && candidate.school && candidate.personas.some(p => p.id === candidate.activePersonaId);
}

export function createStore(options = {}) {
  let storage = options.storage;
  let storageAvailable = false;
  let state = copy(options.initialState || createSeed());
  const listeners = new Set();
  if (!Object.prototype.hasOwnProperty.call(options, 'storage')) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  if (storage) {
    try {
      const probe = `${STORAGE_KEY}.probe`;
      storage.setItem(probe, '1'); storage.removeItem(probe);
      storageAvailable = true;
      if (!options.initialState) {
        const raw = storage.getItem(STORAGE_KEY);
        try {
          const saved = JSON.parse(raw || 'null');
          if (saved?.version === VERSION && validState(saved.state)) state = saved.state;
        } catch { /* Malformed saved demo data recovers to the seed; storage still works. */ }
      }
    } catch { storageAvailable = false; }
  }
  const persist = () => {
    if (storageAvailable) {
      try { storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, state })); }
      catch { storageAvailable = false; }
    }
    for (const listener of [...listeners]) {
      try { listener(state); } catch (error) { console.error('Campus Connect view could not update:', error); }
    }
  };
  return {
    get: () => state,
    get storageAvailable() { return storageAvailable; },
    act(type, payload = {}) {
      const draft = copy(state);
      const result = action(draft, type, payload);
      state = draft;
      persist();
      return result;
    },
    setPersona(id) {
      find(state.personas, id, 'Demo persona');
      state = { ...state, activePersonaId: id };
      persist();
      return personaOf(state);
    },
    reset() { state = createSeed(); persist(); return state; },
    subscribe(fn) {
      requireThat(typeof fn === 'function', 'A subscription callback is required.');
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const store = createStore();

export function metrics(state = store.get()) {
  const approved = state.serviceLogs.filter(h => h.status === 'approved');
  const pending = state.serviceLogs.filter(h => h.status === 'pending');
  const approvedHours = approved.reduce((sum, h) => sum + h.hours, 0);
  const pendingHours = pending.reduce((sum, h) => sum + h.hours, 0);
  const upcomingEvents = state.events.filter(e => e.status === 'published' && Date.parse(e.start) > now(state));
  const completedIds = new Set(state.events.filter(e => e.status === 'published' && Date.parse(e.end) <= now(state)).map(e => e.id));
  const attendedCount = state.attendance.filter(a => a.present && completedIds.has(a.eventId)).length;
  const completedRsvps = state.rsvps.filter(r => completedIds.has(r.eventId)).length;
  const activeStudents = new Set(state.activity.filter(a => a.studentId && Date.parse(a.createdAt) >= now(state) - 7 * 86400000 && Date.parse(a.createdAt) <= now(state)).map(a => a.studentId)).size;
  const pendingListings = state.listings.filter(l => l.status === 'pending').length;
  const pendingPartners = state.partners.filter(p => p.status === 'pending').length;
  const pendingMemberships = state.memberships.filter(m => m.status === 'pending').length;
  const enrollment = state.school.enrollment;
  const attendanceRate = completedRsvps ? Math.round(attendedCount / completedRsvps * 100) : 0;
  const adoptionRate = enrollment ? Math.round(state.students.length / enrollment * 100) : 0;
  const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  const labelFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
  const localDay = value => dayFormatter.format(new Date(value));
  const dailyStudents = new Map();
  for (const entry of state.activity) {
    if (Date.parse(entry.createdAt) > now(state)) continue;
    const key = localDay(entry.createdAt);
    if (!dailyStudents.has(key)) dailyStudents.set(key, new Set());
    dailyStudents.get(key).add(entry.studentId);
  }
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now(state) - (6 - i) * 86400000);
    const key = localDay(date);
    return { label: labelFormatter.format(date), date: key, count: dailyStudents.get(key)?.size || 0 };
  });
  const clubEngagement = state.clubs.map(club => ({ id: club.id, name: club.name, color: club.color, members: state.memberships.filter(m => m.clubId === club.id && m.status === 'active').length, events: state.events.filter(e => e.clubId === club.id && e.status === 'published').length })).sort((a, b) => b.members - a.members);
  const studentStats = Object.fromEntries(state.students.map(student => {
    const studentApproved = approved.filter(h => h.studentId === student.id).reduce((sum, h) => sum + h.hours, 0);
    const studentPending = pending.filter(h => h.studentId === student.id).reduce((sum, h) => sum + h.hours, 0);
    return [student.id, { approvedHours: studentApproved, pendingHours: studentPending, goal: state.goals[student.id] || 20, clubs: state.memberships.filter(m => m.studentId === student.id && m.status === 'active').length, upcomingRsvps: state.rsvps.filter(r => r.studentId === student.id && upcomingEvents.some(e => e.id === r.eventId)).length }];
  }));
  return {
    totalStudents: state.students.length, registeredStudents: state.students.length, enrollment, activeStudents, weeklyActiveUsers: activeStudents, adoptionRate,
    approvedHours, totalHours: approvedHours, pendingHours, pendingService: pending.length, pendingServiceLogs: pending.length,
    upcomingEvents: upcomingEvents.length, totalEvents: state.events.length, publishedEvents: state.events.filter(e => e.status === 'published').length,
    totalRsvps: state.rsvps.length, attendedCount, attendanceRate, completedRsvps, totalClubs: state.clubs.length,
    pendingListings, pendingPartners, pendingMemberships, pendingApprovals: pending.length + pendingListings + pendingPartners + pendingMemberships,
    publishedListings: state.listings.filter(l => l.status === 'published').length, approvedPartners: state.partners.filter(p => p.status === 'approved').length,
    weeklyActivity, clubEngagement, studentStats,
  };
}
