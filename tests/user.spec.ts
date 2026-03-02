import { test, expect } from "playwright-test-coverage";
import { mockPizzaApi } from "./mock-api";

test.beforeEach(async ({ page }) => {
  await mockPizzaApi(page);
});

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  const originalName = "pizza diner";
  const updatedName = "pizza diner pro";

  // 1. Register a new user.
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(originalName);
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  // 2. Go to the user dashboard and update the name.
  // The nav link is the user's initials, "pd" for "pizza diner".
  await page.getByRole("link", { name: "pd" }).click();
  await expect(page.getByRole("main")).toContainText(originalName);
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox").first().fill(updatedName);
  await page.getByRole("button", { name: "Update" }).click();

  // Wait for the update to complete and the modal to close before asserting.
  await expect(page.getByRole("dialog", { name: "Edit user" })).toBeHidden();

  // 3. Verify the name is updated on the page.
  await expect(page.getByRole("main")).toContainText(updatedName);
  // The initials for "pizza diner pro" are still "pd".
  await expect(page.getByRole("link", { name: "pd" })).toBeVisible();

  // 4. Logout and log back in to verify the change is persistent in the mock.
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  // 5. Verify the updated name is still present after logging back in.
  await expect(page.getByRole("link", { name: "pd" })).toBeVisible();
  await page.getByRole("link", { name: "pd" }).click();
  await expect(page.getByRole("main")).toContainText(updatedName);
});

test("diner dashboard", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("link", { name: "Order" }).click();
  await page.getByRole("link", { name: "Image Description Veggie A" }).click();
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await page.getByRole("combobox").selectOption("4");
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.locator("h3")).toContainText("valid");
  await page.getByRole("button", { name: "Close" }).click();
});

test("admin delete user", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  const userName = "pizza diner";

  // 1. Register a new user that we can delete.
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(userName);
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("link", { name: "pd" })).toBeVisible();

  // 2. Logout from the new user's session.
  await page.getByRole("link", { name: "Logout" }).click();

  // 3. Login as an administrator.
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

  // 4. Navigate to the admin dashboard and delete the user.
  await page.getByRole("link", { name: "Admin" }).click();

  // Filter for the user to ensure they are visible on the page
  await page.getByPlaceholder("Filter by name or email").fill(email);

  const filterResponsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/user") && resp.request().method() === "GET",
  );
  await page
    .locator('td:has(input[placeholder="Filter by name or email"])')
    .getByRole("button", { name: "Submit" })
    .click();

  // Wait for the filter to complete
  await filterResponsePromise;

  const userRow = page
    .locator("tbody")
    .getByRole("row", { name: new RegExp(email) });
  await expect(userRow).toBeVisible();

  // Prepare to handle the confirmation dialog
  page.on("dialog", (dialog) => dialog.accept());

  // Create a promise that resolves when the user list is refetched after deletion
  const deleteResponsePromise = page.waitForResponse(
    (resp) =>
      resp.url().includes("/api/user") && resp.request().method() === "GET",
  );

  await userRow.getByRole("button", { name: "Delete" }).click();

  // Wait for the refetch to complete
  await deleteResponsePromise;

  // 5. Verify that the user has been deleted.
  await expect(userRow).not.toBeVisible();
});
