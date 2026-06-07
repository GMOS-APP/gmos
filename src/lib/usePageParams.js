import { useLocation } from 'react-router-dom';

// Reads the query params of the *current router* — which, inside a window's
// MemoryRouter, is that window's own URL. Pages use this instead of reading
// window.location.search directly so multiple windows can show different
// records (e.g. two EntityDetail windows) at the same time.
export function usePageParams() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}
