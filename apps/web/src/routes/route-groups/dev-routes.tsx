/**
 * Dev/Test route definitions
 *
 */

import { Route } from 'react-router-dom';
import { ThemeApplicationTest } from '../lazyPages';

/** Dev/test routes — only accessible in non-production */
export function DevRoutes() {
  return (
    <>
      {/* ARCHIVED: MatrixTest, EnhancedDemo routes removed */}
      <Route path="/test/theme" element={<ThemeApplicationTest />} />
    </>
  );
}
