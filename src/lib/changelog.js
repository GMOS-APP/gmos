export const CURRENT_VERSION = '2026-05-07d';

// Entries are shown for all versions newer than what the user last acknowledged.
// version must be a YYYY-MM-DD string so string comparison works for ordering.
export const CHANGELOG = [
  {
    version: '2026-05-07d',
    date: 'May 7, 2026',
    entries: [
      { type: 'new',      text: 'Import session prep from Obsidian or any markdown file — paste a note and headers like ## Strong Start map to the right fields automatically' },
      { type: 'new',      text: 'Export session prep as a markdown file — includes YAML frontmatter and Obsidian-compatible wikilinks' },
      { type: 'new',      text: 'D&D Beyond PC sheets now auto-sync on load (if stale) and every 5 minutes while viewing' },
      { type: 'new',      text: 'Bulk D&D Beyond import — paste multiple character IDs separated by commas' },
      { type: 'fixed',    text: 'PC sheet Sync button now works correctly (was silently failing due to a missing entity ID)' },
      { type: 'fixed',    text: 'Footer no longer overlaps the last prep fields on the session page' },
    ],
  },
  {
    version: '2026-05-07c',
    date: 'May 7, 2026',
    entries: [
      { type: 'improved', text: 'Linked map now shows as a thumbnail at the top of the entity view — click it to preview the full map in a modal' },
    ],
  },
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
