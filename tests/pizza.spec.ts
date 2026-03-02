import { test, expect } from "playwright-test-coverage";
import { mockPizzaApi } from "./mockPizzaService";

// --- TESTS ---

test.beforeEach(async ({ page }) => {
	await mockPizzaApi(page);
});

test("home page loads", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("navigation", { name: "Global" })).toBeVisible();
	await page.getByRole("list").click();
	await page.getByRole("heading", { name: "The web's best pizza" }).click();
	await page.locator(".w-screen").click();
});

test("login", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
	await page.getByRole("textbox", { name: "Password" }).fill("diner");
	await page.getByRole("button", { name: "Login" }).click();
	await expect(page.getByRole("link", { name: "KC" })).toBeVisible();
});

test("purchase with login", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Order now" }).click();
	await expect(page.locator("h2")).toContainText("Awesome is a click away");
	await page.getByRole("combobox").selectOption("4");
	await page.getByRole("link", { name: "Image Description Veggie A" }).click();
	await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
	await expect(page.locator("form")).toContainText("Selected pizzas: 2");
	await page.getByRole("button", { name: "Checkout" }).click();

	await page.getByPlaceholder("Email address").fill("d@jwt.com");
	await page.getByPlaceholder("Password").fill("diner");
	await page.getByRole("button", { name: "Login" }).click();

	await expect(page.getByRole("main")).toContainText(
		"Send me those 2 pizzas right now!",
	);
	await page.getByRole("button", { name: "Pay now" }).click();
	await expect(page.getByText("0.008")).toBeVisible();
});

test("admin dashboard - create franchise", async ({ page }) => {
	await page.goto("http://localhost:5173/");
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
	await page.getByRole("textbox", { name: "Email address" }).press("Tab");
	await page.getByRole("textbox", { name: "Password" }).fill("admin");
	await page.getByRole("textbox", { name: "Password" }).press("Enter");
	await page.getByRole("link", { name: "Admin" }).click();
	await page.getByRole("button", { name: "Add Franchise" }).click();
	await page.getByRole("textbox", { name: "franchise name" }).click();
	await page.getByRole("textbox", { name: "franchise name" }).fill("PizzaOne");
	await page.getByRole("textbox", { name: "franchisee admin email" }).click();
	await page
		.getByRole("textbox", { name: "franchisee admin email" })
		.fill("f@jwt.com");
	await page.getByRole("button", { name: "Create" }).click();
	await page.getByRole("row", { name: "topSpot" }).getByRole("button").click();
	await page.getByRole("button", { name: "Close" }).click();
});

test("franchisee dashboard", async ({ page }) => {
	await page.goto("/");
	await page.goto("http://localhost:5173/");
	await page.getByRole("link", { name: "Login" }).click();
	await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
	await page.getByRole("textbox", { name: "Email address" }).press("Tab");
	await page.getByRole("textbox", { name: "Password" }).fill("franchisee");
	await page.getByRole("button", { name: "Login" }).click();
	await page
		.getByLabel("Global")
		.getByRole("link", { name: "Franchise" })
		.click();
	await page.getByRole("button", { name: "Create store" }).click();
	await page.getByRole("textbox", { name: "store name" }).click();
	await page.getByRole("textbox", { name: "store name" }).fill("Papi's");
	await page.getByRole("button", { name: "Create" }).click();
	await expect(page.locator("tbody")).toContainText("Papi's");
	await page
		.getByRole("row", { name: "Papi's 0 ₿ Close" })
		.getByRole("button")
		.click();
	await page.getByRole("button", { name: "Close" }).click();
	await page.getByRole("link", { name: "Logout" }).click();
});

test("detail pages", async ({ page }) => {
	await page.goto("http://localhost:5173/");
	await page
		.getByRole("contentinfo")
		.getByRole("link", { name: "Franchise" })
		.click();
	await expect(page.getByRole("main")).toContainText(
		"So you want a piece of the pie?",
	);
	await page.getByRole("link", { name: "About" }).click();
	await page.getByRole("link", { name: "History" }).click();
	await expect(page.getByRole("heading")).toContainText("Mama Rucci, my my");
});
