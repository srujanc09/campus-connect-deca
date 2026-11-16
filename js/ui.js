export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.8l-1.1-1.2a5.4 5.4 0 0 0-7.7 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-11 12a2 2 0 0 0 4 0"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  left:'<path d="m15 5-7 7 7 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M15 3.2a4 4 0 0 1 0 7.6"/><circle cx="9" cy="7" r="4"/>',
  school:'<path d="m3 10 9-6 9 6M5 10v11h14V10M10 21v-7h4v7M12 4V1m-4 9h.01m8 0h.01"/>',
  leaf:'<path d="M20 3C7 1 2 9 5 16s16 6 15-13ZM4 21l12-13"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  chart:'<path d="M4 3v18h17M8 17v-4m5 4V8m5 9V5"/>',
  briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c5 3 13 3 18 0m-9 0v4"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  logout:'<path d="M9 21H3V3h6m6 4 5 5-5 5M8 12h12"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  reset:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  edit:'<path d="m16 3 5 5L8 21H3v-5zM13 6l5 5"/>',
  trophy:'<path d="M8 3h8v8a4 4 0 0 1-8 0zM8 5H3v3a4 4 0 0 0 5 4m8-7h5v3a4 4 0 0 1-5 4m-4 3v6m-4 0h8"/>',
  print:'<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6z"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5M10 10h4v4h-4z"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4 2 2 0 0 1 0-4h4a4 4 0 0 0 4-4c0-3.3-4-6-9-6Z"/><path d="M7 8h.01M11 6h.01M16 7h.01M6 13h.01"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  camera:'<path d="M8 6 9 3h6l1 3h4a1 1 0 0 1 1 1v13H3V7a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
  activity:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  book:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
};
export function icon(name,size=20){return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;}
export function formatDate(value, options={month:'short',day:'numeric'}) {return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',...options}).format(new Date(value));}
export function formatTime(value){return formatDate(value,{hour:'numeric',minute:'2-digit'});}
export function dateParts(value){return {month:formatDate(value,{month:'short'}),day:formatDate(value,{day:'numeric'}),weekday:formatDate(value,{weekday:'short'})};}
export const initials = name => String(name).split(' ').map(x=>x[0]).slice(0,2).join('');
export function download(name,content,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const csvCell = value => {const text=String(value??'');return '"'+(/^[\s]*[=+@-]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"';};
export function empty(title,description,iconName='compass'){return `<div class="empty-state">${icon(iconName,32)}<h3>${escape(title)}</h3><p>${escape(description)}</p></div>`;}
export const campusArt = `<svg class="campus-art" viewBox="0 0 360 240" fill="none" aria-hidden="true"><circle cx="246" cy="70" r="49" fill="#D8F3A2" opacity=".16"/><path d="M15 206h325" stroke="#A8C3A6" stroke-width="2"/><path d="M85 205V105l88-45 86 45v100" fill="#346450" stroke="#B5D5A0" stroke-width="2"/><path d="m67 109 106-56 105 56" stroke="#D5F98B" stroke-width="4" stroke-linecap="round"/><path d="M173 51V19m0 0 40 8-40 9" stroke="#D5F98B" stroke-width="3"/><path d="M128 205v-57h88v57" fill="#244C40" stroke="#C1D9AC" stroke-width="2"/><path d="M162 205v-37a11 11 0 0 1 22 0v37" fill="#D5F98B"/><path d="M145 109h12v19h-12zm42 0h12v19h-12z" fill="#D5F98B" opacity=".8"/><path d="M40 205v-54h45m174 0h53v54" stroke="#B5D5A0" stroke-width="2"/><path d="M56 166h13v17H56zm220 0h14v17h-14z" fill="#D5F98B" opacity=".6"/><path d="M29 204v-43m-10-5c-5-13 6-24 11-32 6 10 16 22 10 33-6 7-15 7-21-1Z" fill="#78A97B"/><path d="M322 205v-44m-14-7c-6-17 8-32 14-42 8 14 19 28 13 42-8 8-19 8-27 0Z" fill="#87B67C"/><path d="m39 61 3 7 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#D5F98B"/><circle cx="307" cy="76" r="3" fill="#D5F98B"/><path d="m129 222 20-17h47l22 17" stroke="#719A7E" stroke-width="2"/></svg>`;
