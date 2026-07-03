import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls the window back to the top on every route change.
// Without this, React Router keeps the previous page's scroll position,
// so navigating from the footer opens the next page scrolled to the bottom.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
