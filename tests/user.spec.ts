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

	await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

	await expect(page.getByRole("main")).toContainText("pizza diner");
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
	await page
		.getByLabel("Global")
		.getByRole("link", { name: "Franchise" })
		.click();
	await page.getByRole("link", { name: "Logout" }).click();
});
