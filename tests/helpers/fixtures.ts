// tests/helpers/fixtures.ts
//
// Drop-in replacement for `import { test, expect } from '@playwright/test'`.
// Every spec that drives the UI should import from here instead.
//
// The app loads Nunito and Inter from Google Fonts with `display=swap`
// (styles.js), so the page first paints in a fallback font and reflows when
// the real fonts arrive. On the vertically centred login card that reflow
// moves the "Sign in" button. When it landed between a click's mousedown and
// mouseup the browser never fired `click`: the form stayed filled in, no
// request was sent, and the test timed out waiting for the next screen.
// That was the scattered Firefox/WebKit "get started not visible" /
// "validation error not visible" flake in the daily run (trace: font
// responses at +35ms into a 48ms click).
//
// The `page` fixture below makes goto() and reload() resolve only once the
// fonts have settled, so nothing is clicked on a page that is about to move.

import { test as base, expect, type Page } from '@playwright/test';

async function waitForFontsToSettle(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const faces = [...document.fonts];
        const loaded = (family: string) =>
          faces.some((f) => f.family.replace(/["']/g, '') === family && f.status === 'loaded');
        return loaded('Nunito') && loaded('Inter') && !faces.some((f) => f.status === 'loading');
      },
      undefined,
      { timeout: 10_000 },
    )
    // Fonts unreachable (offline, blocked): the fallback font stays and
    // nothing will reflow, so carry on rather than fail the test here.
    .catch(() => {});
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (...args) => {
      const response = await goto(...args);
      await waitForFontsToSettle(page);
      return response;
    };
    page.reload = async (...args) => {
      const response = await reload(...args);
      await waitForFontsToSettle(page);
      return response;
    };
    await use(page);
  },
});

export { expect };
