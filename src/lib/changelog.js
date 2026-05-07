export const CURRENT_VERSION = '2026-05-07b';

// Entries are shown for all versions newer than what the user last acknowledged.
// version must be a YYYY-MM-DD string so string comparison works for ordering.
export const CHANGELOG = [
  {
    version: '2026-05-07b',
    date: 'May 7, 2026',
    entries: [
      { type: 'new',      text: 'Campaign Maps is now a gallery — see all imported maps at a glance with thumbnails, linked entities, and pin counts' },
      { type: 'new',      text: 'Link any entity to a campaign map — edit the entity and pick a map; view mode shows a direct link back to it' },
    ],
  },
  {
    version: '2026-05-07',
    date: 'May 7, 2026',
    entries: [
      { type: 'new',      text: 'Demo campaign replaced with the Village of Whitesparrow (Sly Flourish LGMRD)' },
      { type: 'new',      text: 'Changelog popup — you are reading it right now' },
      { type: 'improved', text: 'Open5e import now covers magic items and spells, not just creatures' },
      { type: 'improved', text: 'Open5e search supports type and CR filters' },
      { type: 'fixed',    text: 'Open5e search now filters by name instead of full-text (much faster results)' },
    ],
  },
];
