import {store} from './store.js?v=20261116b';
import {escape,icon,formatDate,formatTime} from './ui.js?v=20261116b';
import {renderStudent,bindStudent,setSearch,resetStudentView} from './student.js?v=20261116b';
import {renderStaff,bindStaff,resetStaffView} from './staff.js?v=20261116b';

const app=document.querySelector('#app');
const dialog=document.querySelector('#modal');
let present=new URLSearchParams(location.search).get('present')==='1';
let toastTimer;
let modalReturnFocus=null;
const roleRoutes={student:'/',leader:'/organizer',advisor:'/advisor',partner:'/partner',admin:'/admin'};
const navStudent=[['/','home','Home'],['/discover','compass','Discover'],['/calendar','calendar','Calendar'],['/service','heart','Service hours'],['/notifications','bell','Updates']];
const staffNav={
  leader:[['/organizer','calendar','Club management']],
  advisor:[['/advisor','shield','Service review'],['/organizer','calendar','Club management']],
  partner:[['/partner','briefcase','Opportunities']],
  admin:[['/admin','chart','Overview'],['/advisor','shield','Service review'],['/organizer','calendar','Club management']]
};
const schoolMark=`<span class="brand-mark">${icon('school',22)}</span>`;

function focusSelector(element){
  if(!element||!app.contains(element))return null;
  if(element.id)return `#${CSS.escape(element.id)}`;
  const attributes=[...element.attributes].filter(a=>a.name.startsWith('data-'));
  if(attributes.length)return element.tagName.toLowerCase()+attributes.map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join('');
  if(element.matches('a[href]'))return `a[href="${CSS.escape(element.getAttribute('href'))}"]`;
  if(element.matches('input[name]'))return `input[name="${CSS.escape(element.name)}"]`;
  return null;
}
function restoreFocus(selector){
  const target=selector&&[...app.querySelectorAll(selector)].find(el=>el.getClientRects().length&&!el.disabled);
  (target||document.querySelector('#main'))?.focus({preventScroll:true});
}

export function toast(message,type='success'){
  if(present&&type!=='error')return;
  const el=document.querySelector('#toast');
  el.className=`visible ${type}`;
  el.innerHTML=`${icon(type==='error'?'info':'check',18)}<span>${escape(message)}</span>`;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('visible'),4500);
}
export function closeModal(){if(dialog.open)dialog.close();}
export function modal(title,html,onSubmit){
  if(!dialog.open)modalReturnFocus=focusSelector(document.activeElement);
  document.querySelector('#modal-title').textContent=title;
  document.querySelector('#modal-body').innerHTML=html;
  dialog.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=closeModal);
  if(onSubmit)dialog.querySelector('form')?.addEventListener('submit',e=>{
    e.preventDefault();onSubmit(new FormData(e.target),e.target);
  });
  if(!dialog.open)dialog.showModal();
}
document.querySelector('#modal-close').onclick=closeModal;
dialog.addEventListener('close',()=>{
  if(modalReturnFocus)restoreFocus(modalReturnFocus);
  modalReturnFocus=null;
});
document.querySelector('.skip-link').addEventListener('click',e=>{
  e.preventDefault();document.querySelector('#main')?.focus();
});
dialog.addEventListener('click',e=>{
  if(e.target===dialog){
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();
  }
});
window.addEventListener('hashchange',()=>{closeModal();render();document.querySelector('#main')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
function route(){return location.hash.slice(1).split('?')[0]||'/';}
function activeNav(r,path){
  if(path==='/')return r==='/';
  if(path==='/discover')return ['/discover','/club/','/opportunity/'].some(x=>r.startsWith(x));
  if(path==='/calendar')return r==='/calendar'||r.startsWith('/event/');
  return r.startsWith(path);
}
function pageTitle(r,s){
  const names={'/':'Home','/discover':'Discover','/calendar':'Calendar','/service':'Service hours','/notifications':'Updates','/organizer':'Club management','/advisor':'Service review','/partner':'Opportunities','/admin':'Overview'};
  if(names[r])return names[r];
  const id=r.split('/')[2];
  return (r.startsWith('/club/')?s.clubs.find(c=>c.id===id)?.name:r.startsWith('/event/')?s.events.find(e=>e.id===id)?.title:r.startsWith('/opportunity/')?s.listings.find(l=>l.id===id)?.title:null)||'Campus Connect';
}
function setPresentation(value){
  present=value;
  const url=new URL(location);
  if(present)url.searchParams.set('present','1');else url.searchParams.delete('present');
  history.replaceState({},'',url);
  render();
}
function resetDialog(){
  modal('Reset demo?',`<p class="body-copy">Restore the sample data? This replaces changes saved in this browser.</p><div class="modal-actions"><button class="btn secondary" data-dismiss>Cancel</button><button class="btn primary" id="confirm-reset">Reset demo</button></div>`);
  document.querySelector('#confirm-reset').onclick=()=>{
    resetStudentView();resetStaffView();store.reset();location.hash='#/';closeModal();render();toast('Demo reset.');
  };
}
function renderAccount(){
  const s=store.get();
  modal('Account',`<p class="account-section-label">Demo accounts</p><div class="persona-options">${s.personas.map(p=>`<button class="persona-option ${p.id===s.activePersonaId?'selected':''}" data-welcome-persona="${p.id}" aria-pressed="${p.id===s.activePersonaId}"><span class="avatar">${escape(p.initials)}</span><span><strong>${escape(p.name)}</strong><small>${escape(p.title)}</small></span>${icon(p.id===s.activePersonaId?'check':'chevron',18)}</button>`).join('')}</div><div class="account-settings"><button id="presentation-toggle" class="account-setting">${icon('settings',18)}<span>Presentation mode</span><span class="setting-value">${present?'On':'Off'}</span></button><button id="reset-demo" class="account-setting">${icon('reset',18)}<span>Reset demo data</span>${icon('chevron',16)}</button></div><p class="account-note">Sample accounts and activity. Changes stay in this browser.</p>`);
  dialog.querySelectorAll('[data-welcome-persona]').forEach(b=>b.onclick=()=>{
    const p=store.get().personas.find(x=>x.id===b.dataset.welcomePersona);
    store.setPersona(p.id);location.hash='#'+roleRoutes[p.role];closeModal();render();
  });
  document.querySelector('#presentation-toggle').onclick=()=>{setPresentation(!present);renderAccount();};
  document.querySelector('#reset-demo').onclick=resetDialog;
}
export function render(){
  const focused=focusSelector(document.activeElement);
  const s=store.get();
  const p=s.personas.find(x=>x.id===s.activePersonaId)||s.personas[0];
  if(route()==='/'&&p.role!=='student'){
    const url=new URL(location);url.hash=roleRoutes[p.role];history.replaceState({},'',url);
  }
  const r=route();
  const isStaff=['/organizer','/advisor','/partner','/admin'].includes(r);
  const nav=p.role==='student'?navStudent:staffNav[p.role]||navStudent;
  const unread=s.notifications.filter(n=>n.studentId===p.studentId&&!n.read).length;
  const navHtml=nav.map(([path,name,label])=>`<a class="nav-item ${activeNav(r,path)?'active':''}" href="#${path}" ${activeNav(r,path)?'aria-current="page"':''}>${icon(name,20)}<span>${label}</span>${path==='/notifications'&&unread?`<span class="nav-badge">${unread}</span>`:''}</a>`).join('');
  document.body.classList.toggle('presentation-mode',present);
  app.innerHTML=`<aside class="sidebar">
    <a class="brand" href="#${roleRoutes[p.role]}">${schoolMark}<span>Campus Connect</span></a>
    <div class="school-switch"><span class="school-initials">LH</span><div><strong>Lightridge</strong><span>High School</span></div></div>
    <nav class="desktop-nav" aria-label="Main navigation">${navHtml}</nav>
    <div class="sidebar-spacer"></div>
    <button class="sidebar-persona" id="welcome-personas" aria-label="Account and demo settings"><span class="avatar">${escape(p.initials)}</span><span><strong>${escape(p.name)}</strong><small>${escape(p.title)}</small></span>${icon('settings',18)}</button>
  </aside>
  <div class="workspace"><header class="topbar">
    <a class="mobile-brand" href="#${roleRoutes[p.role]}">${schoolMark}<strong>Campus Connect</strong></a>
    <div class="breadcrumb"><span>Lightridge High School</span></div>
    ${p.role==='student'?`<form class="search-box global-search" id="global-search">${icon('search',18)}<input name="query" placeholder="Search clubs" aria-label="Search clubs" autocomplete="off"><button type="submit" class="search-submit" aria-label="Submit club search">${icon('arrow',16)}</button></form>`:''}
    <div class="topbar-actions"><span class="demo-indicator" title="Fictional sample data">Demo</span>${p.role==='student'?`<a class="notification-button icon-btn" href="#/notifications" aria-label="Notifications, ${unread} unread">${icon('bell',21)}${unread?'<i></i>':''}</a>`:''}<button class="avatar top-avatar" id="top-personas" aria-label="Account and demo settings">${escape(p.initials)}</button></div>
  </header>${!store.storageAvailable?'<div class="storage-warning">Changes will be saved for this session only.</div>':''}
  <main id="main" tabindex="-1">${isStaff?renderStaff(r,s,p):renderStudent(r,s,p)}</main></div>
  <nav class="mobile-nav" aria-label="Mobile navigation">${navHtml}</nav>`;
  document.title=`${pageTitle(r,s)} · Campus Connect`;
  const api={store,toast,modal,closeModal,render,icon,escape,formatDate,formatTime};
  if(isStaff)bindStaff(document.querySelector('#main'),api);else bindStudent(document.querySelector('#main'),api);
  document.querySelector('#welcome-personas')?.addEventListener('click',renderAccount);
  document.querySelector('#top-personas')?.addEventListener('click',renderAccount);
  document.querySelector('#global-search')?.addEventListener('submit',e=>{
    e.preventDefault();setSearch(String(new FormData(e.target).get('query')||''));
    location.hash='#/discover';render();
  });
  if(focused&&!dialog.open)restoreFocus(focused);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&present&&!dialog.open)setPresentation(false);});
store.subscribe(()=>render());
render();
