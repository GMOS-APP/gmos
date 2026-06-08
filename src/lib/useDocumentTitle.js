import { useEffect } from 'react';

export const APP_NAME = 'GM/OS';
const DEFAULT_TITLE = 'GM/OS — One place to run your campaigns';

// Friendly labels for top-level (non-window) pages. Campaign-window pages get
// their labels from titleOf() in WindowManager instead.
const PAGE_TITLES = {
  CampaignList: 'Campaigns',
  AccountSettings: 'Account settings',
  About: 'About',
  AdminConsole: 'Admin',
};

export function pageLabel(pageName) {
  return PAGE_TITLES[pageName] || pageName || '';
}

export function formatTitle(title) {
  return title ? `${title} · ${APP_NAME}` : DEFAULT_TITLE;
}

// Sets document.title to "<title> · GM/OS" (or a branded default when falsy).
// Pass `undefined` to opt out entirely — used when another component owns the
// title (e.g. the desktop derives it from the focused window).
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title === undefined) return;
    document.title = formatTitle(title);
  }, [title]);
}
