// HTML-escape user-controlled content before it's written into the print window.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function printSessionPrep(session, formData, entities) {
  const getEntities = (ids) =>
    (ids || []).map(id => entities.find(e => e.id === id)).filter(Boolean);

  const npcs      = getEntities(formData.npc_ids);
  const locations = getEntities(formData.planned_locations);
  const encounters = getEntities(formData.planned_encounters);
  const creatures  = getEntities(formData.creature_ids);

  const section = (title, content) => content ? `
    <div class="section">
      <h2>${esc(title)}</h2>
      <div class="content">${esc(content)}</div>
    </div>` : '';

  const entityList = (items) => items.length
    ? `<ul>${items.map(e => `<li><strong>${esc(e.name)}</strong>${e.summary ? ` — ${esc(e.summary)}` : ''}</li>`).join('')}</ul>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Session ${esc(session?.session_number || '')} Prep — ${esc(formData.title || 'Untitled')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 12pt; color: #111; padding: 1.5cm 2cm; line-height: 1.5; }
    h1 { font-size: 20pt; margin-bottom: 4pt; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 20pt; }
    h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;
         border-bottom: 1px solid #ccc; padding-bottom: 3pt; margin-bottom: 8pt; margin-top: 16pt; color: #333; }
    .section { margin-bottom: 12pt; page-break-inside: avoid; }
    .content { white-space: pre-wrap; font-size: 11pt; }
    ul { padding-left: 18pt; }
    li { margin-bottom: 3pt; }
    .strong-start { background: #fffbeb; border-left: 3px solid #f59e0b;
                    padding: 8pt 12pt; font-style: italic; }
    @media print { body { padding: 1cm; } }
  </style>
</head>
<body>
  <h1>Session ${esc(session?.session_number || '?')}: ${esc(formData.title || 'Untitled')}</h1>
  <div class="meta">${session?.date ? esc(new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) : ''}</div>

  ${formData.previous_session_recap ? section('Previously On…', formData.previous_session_recap) : ''}

  ${formData.strong_start ? `
  <div class="section">
    <h2>Strong Start</h2>
    <div class="strong-start">${esc(formData.strong_start)}</div>
  </div>` : ''}

  ${encounters.length || creatures.length || formData.monster_notes ? `
  <div class="section">
    <h2>Encounters & Monsters</h2>
    ${entityList([...encounters, ...creatures])}
    ${formData.monster_notes ? `<div class="content" style="margin-top:6pt">${esc(formData.monster_notes)}</div>` : ''}
  </div>` : ''}

  ${locations.length || formData.location_notes ? `
  <div class="section">
    <h2>Locations</h2>
    ${entityList(locations)}
    ${formData.location_notes ? `<div class="content" style="margin-top:6pt">${esc(formData.location_notes)}</div>` : ''}
  </div>` : ''}

  ${npcs.length || formData.npc_notes ? `
  <div class="section">
    <h2>NPCs</h2>
    ${entityList(npcs)}
    ${formData.npc_notes ? `<div class="content" style="margin-top:6pt">${esc(formData.npc_notes)}</div>` : ''}
  </div>` : ''}

  ${section('Rumors', formData.rumors)}
  ${section('Treasure & Loot', formData.treasure_notes)}
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 250);
}
