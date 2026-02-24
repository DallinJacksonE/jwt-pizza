import { test, expect } from "playwright-test-coverage";

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("textbox").first().fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();

  // Wait for the dialog to close before continuing.
  await expect(page.getByRole("dialog", { name: "Edit user" })).toBeHidden();
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
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
  await page.getByRole("link", { name: "Image Description Margarita" }).click();
  await page.getByRole("link", { name: "Image Description Crusty A" }).click();
  await page.getByRole("link", { name: "Image Description Charred" }).click();
  await page.getByRole("combobox").selectOption("1");
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
