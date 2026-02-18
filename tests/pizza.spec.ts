import { test, expect } from "playwright-test-coverage";
import { Route, Page } from "@playwright/test";
import { Role, User } from "./types";

async function mockPizzaApi(page: Page) {
	let users: User[] = [
		{
			id: "1",
			name: "Admin",
			email: "a@jwt.com",
			password: "admin",
			roles: [{ role: Role.Admin }],
		},
		{
			id: "2",
			name: "Kai Chen",
			email: "d@jwt.com",
			password: "diner",
			roles: [{ role: Role.Diner }],
		},
		{
			id: "4",
			name: "Franchisee",
			email: "f@jwt.com",
			password: "franchisee",
			roles: [{ role: Role.Diner }],
		},
	];

	let franchises = [
		{
			id: 2,
			name: "LotaPizza",
			admins: [{ id: 4, name: "Franchisee", email: "f@jwt.com" }],
			stores: [
				{ id: 4, name: "Provo", totalRevenue: 0 },
				{ id: 5, name: "Springville", totalRevenue: 0 },
				{ id: 6, name: "American Fork", totalRevenue: 0 },
			],
		},
		{
			id: 3,
			name: "PizzaCorp",
			admins: [],
			stores: [{ id: 7, name: "Spanish Fork", totalRevenue: 0 }],
		},
		{ id: 4, name: "topSpot", admins: [], stores: [] },
	];

	let orders: any[] = [];
	let loggedInUser: User | undefined = undefined;

	// 2. Auth Routes
	await page.route("*/**/api/auth", async (route) => {
		const method = route.request().method();

		if (method === "POST") {
			// Register
			const req = route.request().postDataJSON();
			const newUser = {
				...req,
				id: Math.floor(Math.random() * 1000).toString(),
				roles: [{ role: Role.Diner }],
			};
			users.push(newUser);
			loggedInUser = newUser;
			await route.fulfill({ json: { user: newUser, token: "mock-jwt-token" } });
		} else if (method === "PUT") {
			// Login
			const req = route.request().postDataJSON();
			const user = users.find(
				(u) => u.email === req.email && u.password === req.password,
			);
			if (user) {
				loggedInUser = user;
				await route.fulfill({ json: { user, token: "mock-jwt-token" } });
			} else {
				await route.fulfill({ status: 401, json: { message: "Unauthorized" } });
			}
		} else if (method === "DELETE") {
			// Logout
			loggedInUser = undefined;
			await route.fulfill({
				status: 200,
				json: { message: "logout successful" },
			});
		}
	});

	// 3. User Routes
	await page.route("*/**/api/user/me", async (route) => {
		if (loggedInUser) {
			await route.fulfill({ json: loggedInUser });
		} else {
			await route.fulfill({ status: 401, json: { message: "Unauthorized" } });
		}
	});

	// 4. Franchise Routes

	// General Franchise List (GET) and Create (POST)
	await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({ json: { franchises: franchises, more: false } });
		} else if (route.request().method() === "POST") {
			const req = route.request().postDataJSON();
			const newFranchise = {
				id: Math.floor(Math.random() * 1000),
				name: req.name,
				admins: req.admins,
				stores: [],
			};
			franchises.push(newFranchise);
			await route.fulfill({ json: newFranchise });
		}
	});

	// User Specific Franchises (GET) & Delete Franchise (DELETE)
	await page.route(/\/api\/franchise\/\d+/, async (route) => {
		const method = route.request().method();
		const urlParts = route.request().url().split("/");
		const idParam = parseInt(urlParts[urlParts.length - 1]);

		if (method === "GET") {
			// Logic: If the ID matches the logged-in user, return their franchises
			const userFranchises = franchises.filter((f) =>
				f.admins.some((a) => a.id === idParam),
			);
			await route.fulfill({ json: userFranchises });
		} else if (method === "DELETE") {
			franchises = franchises.filter((f) => f.id !== idParam);
			await route.fulfill({ json: { message: "franchise deleted" } });
		}
	});

	// Create Store
	await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
		if (route.request().method() === "POST") {
			const urlParts = route.request().url().split("/");
			const franchiseId = parseInt(urlParts[urlParts.length - 2]);
			const req = route.request().postDataJSON();
			const franchise = franchises.find((f) => f.id === franchiseId);
			if (franchise) {
				const newStore = {
					id: Math.floor(Math.random() * 1000),
					name: req.name,
					totalRevenue: 0,
				};
				franchise.stores.push(newStore);
				await route.fulfill({ json: newStore });
			} else {
				await route.fulfill({
					status: 404,
					json: { message: "Franchise not found" },
				});
			}
		}
	});

	// Delete Store
	await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
		if (route.request().method() === "DELETE") {
			const urlParts = route.request().url().split("/");
			const storeId = parseInt(urlParts[urlParts.length - 1]);
			const franchiseId = parseInt(urlParts[urlParts.length - 3]);
			const franchise = franchises.find((f) => f.id === franchiseId);
			if (franchise) {
				franchise.stores = franchise.stores.filter((s) => s.id !== storeId);
				await route.fulfill({ json: { message: "store deleted" } });
			}
		}
	});

	// 5. Order Routes
	await page.route("*/**/api/order/menu", async (route) => {
		const menu = [
			{
				id: 1,
				title: "Veggie",
				image: "pizza1.png",
				price: 0.0038,
				description: "A garden of delight",
			},
			{
				id: 2,
				title: "Pepperoni",
				image: "pizza2.png",
				price: 0.0042,
				description: "Spicy treat",
			},
		];
		await route.fulfill({ json: menu });
	});

	await page.route(/\/api\/order$/, async (route) => {
		if (route.request().method() === "POST") {
			const req = route.request().postDataJSON();
			const newOrder = {
				...req,
				id: Math.floor(Math.random() * 1000),
				date: new Date().toISOString(),
			};
			orders.push(newOrder);
			await route.fulfill({ json: { order: newOrder, jwt: "1111111111" } });
		} else if (route.request().method() === "GET") {
			await route.fulfill({
				json: { dinerId: loggedInUser?.id, orders: orders, page: 1 },
			});
		}
	});
}

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
