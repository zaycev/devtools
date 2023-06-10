import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY } from "../helpers/authentication";
import { addSourceCodeComment, deleteComment } from "../helpers/comments";
import { isPassportItemCompleted } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { resetTestUser, waitFor } from "../helpers/utils";

const url = "doc_rr_console.html";

test(`authenticated/passport-03: Multiplayer`, async ({ page }) => {
  await resetTestUser("frontende2e1@replay.io");

  await startTest(page, url, E2E_USER_1_API_KEY);

  await enablePassport(page);

  expect(await isPassportItemCompleted(page, "Add a comment")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Share")).toBeFalsy();

  await openDevToolsTab(page);

  const commentLocator = await addSourceCodeComment(page, {
    text: "This is a test comment",
    lineNumber: 3,
    url,
  });
  await deleteComment(page, commentLocator);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Add a comment")).toBeTruthy()
  );

  await page.locator('button:has-text("Share")').click();
  await page.locator('button:has-text("Copy URL")').click();
  await page.keyboard.press("Escape");

  await waitFor(async () => expect(await isPassportItemCompleted(page, "Share")).toBeTruthy());
});