export const DEMO_NOW = '2026-11-16T12:00:00-05:00';

const at = (day, time = '15:30') => `2026-11-${String(day).padStart(2, '0')}T${time}:00-05:00`;

export function createSeed() {
  const names = ['Maya Patel', 'Jordan Brooks', 'Ava Chen', 'Noah Williams', 'Sofia Garcia', 'Ethan Kim', 'Isabella Reed', 'Liam Hassan', 'Amelia Davis', 'Lucas Nguyen', 'Harper Singh', 'Oliver Ross', 'Evelyn Moore', 'Elijah Carter', 'Aria Thompson', 'James Wilson', 'Chloe Park', 'Benjamin Flores', 'Zoe Bennett', 'Henry Shah', 'Nora Mitchell', 'Alexander Lopez', 'Lily Morgan', 'Daniel Wright', 'Grace Allen', 'Samuel Rivera', 'Layla Evans', 'Matthew Lewis', 'Ellie Cooper', 'Owen Scott', 'Hannah Cruz', 'Sebastian Young', 'Riley Adams', 'Jack Robinson', 'Stella Baker', 'Levi Walker', 'Natalie Turner', 'Gabriel Hill', 'Audrey Green', 'Isaac Bell'];
  const students = names.map((name, i) => ({ id: `s${i + 1}`, name, grade: 9 + (i % 4), interests: i % 3 === 0 ? ['Business', 'Volunteering'] : i % 3 === 1 ? ['Technology', 'Arts'] : ['Athletics', 'Community'] }));
  students[0].grade = 11;
  const clubs = [
    ['DECA', 'Business', 'Business competitions, role-play practice, and presentation workshops.', 'DE', '#365d4e', 'Ms. Avery Lee', 'Room 214', 'open'],
    ['Robotics', 'Technology', 'Robot design, programming, and team builds.', 'RB', '#657699', 'Mr. Quinn Ellis', 'Engineering Lab', 'open'],
    ['Green Team', 'Service', 'Campus gardening, cleanups, and conservation projects.', 'GT', '#65805a', 'Ms. Taylor Monroe', 'Room 118', 'open'],
    ['Art Collective', 'Arts', 'Art workshops, student exhibitions, and campus projects.', 'AC', '#b87962', 'Ms. Casey Harper', 'Art Studio', 'open'],
    ['Key Club', 'Service', 'Community volunteering and service projects.', 'KC', '#a68c45', 'Mr. Cameron Lane', 'Room 206', 'open'],
    ['Model UN', 'Leadership', 'Debate practice and Model UN conferences.', 'UN', '#6a789c', 'Ms. Riley West', 'Room 221', 'open'],
    ['Photography', 'Arts', 'Photography practice, photo walks, and school coverage.', 'PH', '#a4778e', 'Mr. Drew Spencer', 'Media Lab', 'open'],
    ['National Honor Society', 'Service', 'Scholarship, leadership, and community service.', 'NH', '#9b8747', 'Ms. Hayden Cole', 'Library', 'approval'],
    ['Coding Club', 'Technology', 'Programming workshops and student software projects.', 'CC', '#5b8391', 'Mr. Quinn Ellis', 'Computer Lab', 'open'],
    ['Student Council', 'Leadership', 'Student representation and school event planning.', 'SC', '#8b6588', 'Ms. Peyton Blake', 'Room 102', 'approval'],
    ['Running Club', 'Athletics', 'Group runs for all experience levels.', 'RC', '#bc8056', 'Coach Alex Stone', 'Track', 'open'],
    ['Literary Magazine', 'Arts', 'Student writing, illustration, and magazine publishing.', 'LM', '#737a60', 'Ms. Sage Martin', 'Room 203', 'open'],
  ].map((v, i) => ({ id: `c${i + 1}`, name: v[0], category: v[1], description: v[2], initials: v[3], color: v[4], advisor: v[5], room: v[6], joinMode: v[7] }));
  const partners = [
    ['p1', 'Willow Community Pantry', 'Nonprofit', 'Food and essential supplies for local families.', 'approved', 'WP', '#768d5e'],
    ['p2', 'Cedar Grove Library', 'Community', 'Reading programs and student volunteer projects.', 'approved', 'CL', '#7589a0'],
    ['p3', 'Brightside Design Studio', 'Business', 'Design services and student career programs.', 'approved', 'BD', '#b77d67'],
    ['p4', 'Trail & Field Outfitters', 'Business', 'Outdoor gear and sporting goods.', 'approved', 'TF', '#608a7d'],
    ['p5', 'Juniper Coffee House', 'Business', 'Local cafe with student employment opportunities.', 'pending', 'JC', '#af916a'],
    ['p6', 'Riverbend Conservation', 'Nonprofit', 'Volunteer trail maintenance and conservation.', 'approved', 'RC', '#7a915b'],
  ].map(([id, name, category, description, status, initials, color]) => ({ id, name, category, description, status, initials, color }));
  const events = [
    ['e1', 'DECA competition workshop', 'Practice role-plays, review judging criteria, and work on presentations.', 'c1', 'Club', 17, '15:30', '17:00', 'Room 214', 30, 'published', 'DECA', '#365d4e'],
    ['e2', 'Food pantry packing', 'Sort donations and pack grocery kits for local families. Wear comfortable shoes.', null, 'Volunteering', 21, '09:00', '12:00', 'Willow Community Pantry', 18, 'published', 'Willow Community Pantry', '#768d5e'],
    ['e3', 'Robotics build session', 'Test the team robot and work on the current design challenge.', 'c2', 'Club', 17, '16:00', '17:30', 'Engineering Lab', 24, 'published', 'Robotics', '#657699'],
    ['e4', 'Printmaking workshop', 'Printmaking with Art Collective. All materials included.', 'c4', 'Club', 19, '15:30', '17:00', 'Art Studio', 8, 'published', 'Art Collective', '#b87962'],
    ['e5', 'Neighborhood food drive', 'Collect and sort shelf-stable groceries with the pantry team.', null, 'Volunteering', 7, '09:00', '12:00', 'Willow Community Pantry', 20, 'published', 'Willow Community Pantry', '#768d5e'],
    ['e6', 'Library reading buddies', 'Read with younger students and help prepare take-home literacy kits.', null, 'Volunteering', 12, '15:00', '17:00', 'Cedar Grove Library', 15, 'published', 'Cedar Grove Library', '#7589a0'],
    ['e7', 'Trail cleanup', 'Clear litter and restore a local walking trail with the conservation team.', 'c3', 'Volunteering', 15, '09:00', '12:00', 'Riverbend Trail entrance', 25, 'published', 'Green Team', '#65805a'],
    ['e8', 'Sunset photography walk', 'This walk has been cancelled. A new date will be announced through the club.', 'c7', 'Club', 18, '16:00', '17:00', 'Campus courtyard', 20, 'cancelled', 'Photography', '#a4778e'],
    ['e9', 'Fall club showcase', 'Meet club leaders and browse school clubs.', null, 'School', 20, '15:30', '17:30', 'Main commons', 150, 'published', 'Student Activities', '#365d4e'],
    ['e10', 'Website workshop', 'A hands-on coding session for beginners. Bring a laptop and an idea.', 'c9', 'Club', 18, '15:30', '17:00', 'Computer Lab', 30, 'published', 'Coding Club', '#5b8391'],
    ['e11', 'After-school easy run', 'A relaxed group run with routes for beginners and experienced runners.', 'c11', 'Athletics', 19, '16:00', '17:00', 'Track', 40, 'published', 'Running Club', '#bc8056'],
    ['e12', 'Model UN practice debate', 'Practice respectful debate and collaborative problem solving before our next conference.', 'c6', 'Club', 23, '15:30', '17:00', 'Room 221', 30, 'published', 'Model UN', '#6a789c'],
    ['e13', 'Pitch night', 'Share a business idea, meet your teammates, and get constructive feedback.', 'c1', 'Club', 24, '16:00', '18:00', 'Library', 50, 'published', 'DECA', '#365d4e'],
    ['e14', 'Poetry reading', 'Read your writing or listen to student work.', 'c12', 'Club', 20, '15:45', '17:00', 'Room 203', 25, 'published', 'Literary Magazine', '#737a60'],
    ['e15', 'Winter coat sorting', 'Help prepare donated winter coats for distribution. This opportunity is awaiting school review.', null, 'Volunteering', 28, '10:00', '13:00', 'Willow Community Pantry', 20, 'draft', 'Willow Community Pantry', '#768d5e'],
    ['e16', 'Campus gardening', 'Plant seasonal seedlings and tidy the courtyard garden.', 'c3', 'Volunteering', 22, '10:00', '12:00', 'Campus garden', 16, 'published', 'Green Team', '#65805a'],
    ['e17', 'DECA welcome meeting', 'An introduction to this year’s chapter, competition categories, and team projects.', 'c1', 'Club', 3, '15:30', '16:30', 'Room 214', 40, 'published', 'DECA', '#365d4e'],
    ['e18', 'Robotics design sprint', 'Sketch, prototype, and share ideas for the upcoming build season.', 'c2', 'Club', 5, '15:30', '17:30', 'Engineering Lab', 30, 'published', 'Robotics', '#657699'],
    ['e19', 'Community cleanup', 'Clean up litter in Community Park.', 'c5', 'Volunteering', 8, '09:00', '12:00', 'Community Park', 35, 'published', 'Key Club', '#a68c45'],
    ['e20', 'Student voice forum', 'Share ideas about student life and hear what the council is planning.', 'c10', 'School', 10, '15:30', '16:30', 'Main commons', 80, 'published', 'Student Council', '#8b6588'],
    ['e21', 'School spirit run', 'An afternoon group run for students.', 'c11', 'Athletics', 11, '15:30', '16:30', 'Track', 60, 'published', 'Running Club', '#bc8056'],
    ['e22', 'Thank-you card studio', 'Create handwritten thank-you cards for volunteers and community helpers.', 'c4', 'Volunteering', 14, '10:00', '12:00', 'Art Studio', 20, 'published', 'Art Collective', '#b87962'],
    ['e23', 'Competition practice lab', 'A focused practice session with peer feedback and advisor coaching.', 'c1', 'Club', 14, '13:00', '15:00', 'Room 214', 25, 'published', 'DECA', '#365d4e'],
    ['e24', 'Robotics team planning', 'A draft planning session for our next team challenge.', 'c2', 'Club', 25, '15:30', '16:30', 'Engineering Lab', 25, 'draft', 'Robotics', '#657699'],
  ].map(([id, title, description, clubId, category, day, start, end, location, capacity, status, host, color]) => ({ id, title, description, ...(clubId ? { clubId } : {}), category, start: at(day, start), end: at(day, end), location, capacity, status, host, color }));
  events.find(e => e.id === 'e2').listingId = 'l1';
  events.find(e => e.id === 'e15').listingId = 'l2';
  const listings = [
    { id: 'l1', partnerId: 'p1', title: 'Food pantry packing', description: 'Pack grocery kits for local families during a three-hour shift. No experience needed; training provided.', type: 'volunteer', status: 'published', eventId: 'e2', location: 'Willow Community Pantry', hours: 3, benefit: '3 service hours · Ages 14+' },
    { id: 'l2', partnerId: 'p1', title: 'Winter coat sorting', description: 'Sort donated winter coats for distribution.', type: 'volunteer', status: 'pending', eventId: 'e15', location: 'Willow Community Pantry', hours: 3, benefit: '3 service hours · Training provided' },
    { id: 'l3', partnerId: 'p3', title: 'Design internship', description: 'Four-week after-school internship in design and creative careers.', type: 'internship', status: 'published', location: 'Brightside Design Studio', benefit: '4 weeks · Portfolio experience' },
    { id: 'l4', partnerId: 'p4', title: 'Student gear discount', description: 'Get 15% off outdoor essentials with a student ID.', type: 'discount', status: 'published', location: 'Trail & Field Outfitters', benefit: '15% student discount' },
    { id: 'l5', partnerId: 'p2', title: 'After-school library assistant', description: 'Part-time work shelving books and assisting with library programs.', type: 'job', status: 'published', location: 'Cedar Grove Library', benefit: 'Part time · Ages 16+' },
    { id: 'l6', partnerId: 'p3', title: 'Club project sponsorship', description: 'Design support and materials for approved club projects.', type: 'sponsorship', status: 'published', location: 'Brightside Design Studio', benefit: 'Club project support' },
    { id: 'l7', partnerId: 'p5', title: 'Weekend cafe team', description: 'Weekend cafe shifts. Awaiting partner and school review.', type: 'job', status: 'pending', location: 'Juniper Coffee House', benefit: 'Weekend shifts · Ages 16+' },
    { id: 'l8', partnerId: 'p6', title: 'Spring trail ambassadors', description: 'Plan community trail projects and learn conservation skills. Draft program.', type: 'internship', status: 'draft', location: 'Riverbend Conservation', benefit: 'Community leadership experience' },
  ];
  const memberships = [
    { id: 'm1', clubId: 'c1', studentId: 's1', status: 'active' },
    { id: 'm2', clubId: 'c2', studentId: 's1', status: 'active' },
    { id: 'm3', clubId: 'c3', studentId: 's1', status: 'active' },
    { id: 'm4', clubId: 'c8', studentId: 's1', status: 'pending' },
  ];
  for (let i = 2; i <= 40; i++) {
    const clubId = i <= 14 ? 'c1' : `c${2 + (i % 11)}`;
    memberships.push({ id: `m${memberships.length + 1}`, clubId, studentId: `s${i}`, status: i === 14 ? 'pending' : 'active' });
    const extra = `c${1 + ((i + 3) % 12)}`;
    if (i % 2 === 0 && extra !== clubId) memberships.push({ id: `m${memberships.length + 1}`, clubId: extra, studentId: `s${i}`, status: 'active' });
  }
  const rsvps = [];
  const addRsvp = (eventId, studentId) => { if (!rsvps.some(r => r.eventId === eventId && r.studentId === studentId)) rsvps.push({ id: `r${rsvps.length + 1}`, eventId, studentId }); };
  ['e2', 'e5', 'e6', 'e7', 'e9', 'e17', 'e23'].forEach(id => addRsvp(id, 's1'));
  for (let i = 2; i <= 15; i++) addRsvp('e1', `s${i}`);
  for (let i = 2; i <= 10; i++) addRsvp('e2', `s${i}`);
  for (let i = 2; i <= 9; i++) addRsvp('e4', `s${i}`);
  for (const event of events.filter(e => e.status === 'published' && new Date(e.end) < new Date(DEMO_NOW))) {
    for (let i = 2; i <= Math.min(event.capacity, 8 + Number(event.id.slice(1)) % 8); i++) addRsvp(event.id, `s${i}`);
  }
  for (const id of ['e3', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14', 'e16']) for (let i = 3; i <= 8; i++) addRsvp(id, `s${i}`);
  const attendance = rsvps.filter(r => new Date(events.find(e => e.id === r.eventId).end) < new Date(DEMO_NOW)).map((r, i) => ({ id: `a${i + 1}`, eventId: r.eventId, studentId: r.studentId, present: r.studentId === 's1' || Number(r.studentId.slice(1)) % 5 !== 0 }));
  const serviceLogs = [
    { id: 'h1', eventId: 'e5', studentId: 's1', hours: 3, notes: 'Sorted pantry donations and packed grocery kits with the volunteer team.', status: 'approved', reason: '', submittedAt: at(7, '13:00') },
    { id: 'h2', eventId: 'e6', studentId: 's1', hours: 2, notes: 'Read with younger students and prepared literacy kits.', status: 'pending', reason: '', submittedAt: at(12, '18:00') },
  ];
  for (const a of attendance.filter(a => a.present && a.studentId !== 's1' && ['e5', 'e6', 'e19', 'e22'].includes(a.eventId))) {
    const event = events.find(e => e.id === a.eventId);
    serviceLogs.push({ id: `h${serviceLogs.length + 1}`, eventId: a.eventId, studentId: a.studentId, hours: (new Date(event.end) - new Date(event.start)) / 3600000, notes: 'Completed the scheduled volunteer activity with the team.', status: Number(a.studentId.slice(1)) % 7 === 0 ? 'pending' : 'approved', reason: '', submittedAt: event.end });
  }
  const activity = [];
  for (let i = 1; i <= 34; i++) {
    for (const [offset, type] of [[0, 'app_open'], [1, 'event_view'], [2, 'opportunity_view']]) activity.push({ id: `ac${activity.length + 1}`, studentId: `s${i}`, type, createdAt: at(10 + ((i + offset) % 6), `${10 + offset}:00`) });
  }
  return {
    schemaVersion: 1,
    demoNow: DEMO_NOW,
    school: { name: 'Lightridge', fullName: 'Lightridge concept demo', enrollment: 60, timezone: 'America/New_York', demo: true },
    activePersonaId: 'student-maya',
    personas: [
      { id: 'student-maya', name: 'Maya Patel', role: 'student', initials: 'MP', title: 'Student · Grade 11', studentId: 's1', clubIds: [] },
      { id: 'leader-jordan', name: 'Jordan Brooks', role: 'leader', initials: 'JB', title: 'Student organizer', studentId: 's2', clubIds: ['c1', 'c2'] },
      { id: 'advisor-lee', name: 'Avery Lee', role: 'advisor', initials: 'AL', title: 'Faculty advisor', clubIds: ['c1', 'c2'] },
      { id: 'partner-morgan', name: 'Morgan Ellis', role: 'partner', initials: 'ME', title: 'Community partner', clubIds: [], partnerId: 'p1' },
      { id: 'admin-rivera', name: 'Sam Rivera', role: 'admin', initials: 'SR', title: 'School administrator', clubIds: [] },
    ], students, clubs, events, memberships, rsvps, attendance, partners, listings, serviceLogs, activity,
    announcements: [
      { id: 'an1', title: 'Fall club showcase', body: 'Meet club leaders Friday, 3:30–5:30 PM in the main commons.', author: 'Student Activities', createdAt: at(16, '08:30') },
      { id: 'an2', title: 'DECA workshop', body: 'Role-play practice Tuesday, 3:30–5:00 PM in Room 214. All experience levels welcome.', clubId: 'c1', author: 'Avery Lee', createdAt: at(15, '16:00') },
      { id: 'an3', title: 'Pantry volunteers needed', body: 'Volunteer Saturday, 9:00 AM–noon at Willow Community Pantry. Sign up in Opportunities.', author: 'Student Activities', createdAt: at(14, '09:00') },
    ],
    notifications: [
      { id: 'n1', studentId: 's1', title: 'Service hours approved', body: '3 hours approved for Neighborhood food drive.', href: '#/service', read: false, createdAt: at(9, '10:00') },
      { id: 'n2', studentId: 's1', title: 'Service hours in review', body: '2 hours from Library reading buddies are awaiting advisor review.', href: '#/service', read: false, createdAt: at(12, '18:00') },
      { id: 'n3', studentId: 's1', title: 'Pantry sign-up confirmed', body: 'Food pantry packing · Saturday, November 21 at 9:00 AM.', href: '#/event/e2', read: true, createdAt: at(13, '15:00') },
    ],
    saved: [{ studentId: 's1', listingId: 'l3' }, { studentId: 's1', listingId: 'l4' }],
    goals: { s1: 25, s2: 20 },
  };
}
