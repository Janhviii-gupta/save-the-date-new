import { expect, test } from "@playwright/test";

async function mockFirstTimeApi(page: import("@playwright/test").Page) {
  await page.route("**/api/invitation", (route) =>
    route.fulfill({ json: { mode: "first_time", currentRsvp: null } })
  );
  await page.route("**/api/events", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/rsvp", async (route) => {
    const body = route.request().postDataJSON() as {
      response: string;
      submittedName: string;
      attendanceCount: number | null;
    };
    await route.fulfill({ json: { response: body.response, changed: true } });
  });
}

test("universal root / loads first-time experience and completes YES flow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockFirstTimeApi(page);

  await page.goto("/");
  await expect(page.getByText("19", { exact: true })).toBeVisible({ timeout: 4_000 });

  // Information request continue button
  const continueBtn = page.getByRole("button", { name: "CONTINUE" });
  await continueBtn.click({ timeout: 15_000 });

  // Application detected view installation button
  const viewInstallBtn = page.getByRole("button", { name: "VIEW INSTALLATION" });
  await viewInstallBtn.click({ timeout: 15_000 });

  // Warning screen: select YES
  const yesBtn = page.getByRole("button", { name: /YES/ });
  await yesBtn.click({ timeout: 15_000 });

  // Name screen: enter name
  await expect(page.getByText("WHO'S MAKING THIS DECISION?")).toBeVisible();
  const nameInput = page.getByPlaceholder("Rahul Sharma");
  await nameInput.fill("Rahul Sharma");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  // Attendance count screen: select 2 PEOPLE
  await expect(page.getByText("HOW MANY PEOPLE WILL BE ATTENDING?")).toBeVisible();
  await page.getByRole("button", { name: "2 PEOPLE" }).click();

  // Outcome screen
  await expect(page.getByText("INSTALLATION COMPLETE")).toBeVisible();
  await expect(page.getByText("You are now officially part of the problem.")).toBeVisible();
  await expect(page.getByText("19th & 20th November 2026")).toBeVisible();
  await expect(page.getByText("Jaipur")).toBeVisible();
});

test("MAYBE flow with MORE THAN 5 custom attendee selector", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockFirstTimeApi(page);

  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUE" }).click({ timeout: 15_000 });
  await page.getByRole("button", { name: "VIEW INSTALLATION" }).click({ timeout: 15_000 });

  // Warning screen: select MAYBE
  await page.getByRole("button", { name: /MAYBE/ }).click({ timeout: 15_000 });

  // Name screen
  await page.getByPlaceholder("Rahul Sharma").fill("Priya Sharma");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  // Count screen: select MORE THAN 5
  await page.getByRole("button", { name: "MORE THAN 5" }).click();

  // Custom count screen: enter 7
  await expect(page.getByText("HOW MANY PEOPLE?")).toBeVisible();
  const numInput = page.locator("input[type='number']");
  await numInput.fill("7");
  await page.getByRole("button", { name: "CONFIRM" }).click();

  // Outcome screen
  await expect(page.getByText("INSTALLATION PAUSED")).toBeVisible();
  await expect(page.getByText("We'll wait.")).toBeVisible();
});

test("NO flow collects name and skips attendance count", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockFirstTimeApi(page);

  await page.goto("/");
  await page.getByRole("button", { name: "CONTINUE" }).click({ timeout: 15_000 });
  await page.getByRole("button", { name: "VIEW INSTALLATION" }).click({ timeout: 15_000 });

  // Warning screen: select NO
  await page.getByRole("button", { name: /NO/ }).click({ timeout: 15_000 });

  // Name screen
  await page.getByPlaceholder("Rahul Sharma").fill("Neha Sharma");
  await page.getByRole("button", { name: "CONTINUE" }).click();

  // Attendance count must be skipped directly to outcome
  await expect(page.getByText("INSTALLATION CANCELLED")).toBeVisible();
  await expect(page.getByText("The wedding will proceed anyway.")).toBeVisible();
  await expect(page.getByText("19th & 20th November 2026")).toBeVisible();
});

test("sound is disabled until interaction and opt-in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockFirstTimeApi(page);

  await page.goto("/");
  await expect(page.getByRole("button", { name: /SOUND:/ })).toHaveCount(0);
  await page.getByRole("button", { name: "CONTINUE" }).click({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "SOUND: OFF" })).toBeVisible();
  await page.getByRole("button", { name: "SOUND: OFF" }).click();
  await expect(page.getByRole("button", { name: "SOUND: ON" })).toBeVisible();
});

test("returning guest view displays prior decision and allows editing RSVP", async ({ page }) => {
  await page.route("**/api/invitation", (route) =>
    route.fulfill({
      json: {
        mode: "returning",
        currentRsvp: "yes",
        submittedName: "Rahul Sharma",
        attendanceCount: 2
      }
    })
  );
  await page.route("**/api/events", (route) => route.fulfill({ json: { ok: true } }));

  await page.goto("/");
  await expect(page.getByText("WELCOME BACK.")).toBeVisible();
  await expect(page.getByText("Rahul Sharma")).toBeVisible();
  await expect(page.getByText("STATUS: INSTALLED")).toBeVisible();

  await page.getByRole("button", { name: "CHANGE RSVP" }).click();
  await expect(page.getByRole("button", { name: /YES/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /MAYBE/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /NO/ })).toBeVisible();
});

