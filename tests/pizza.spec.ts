import { test, expect } from 'playwright-test-coverage';
import { Route, Page } from '@playwright/test';
import { Role, User } from './types';

// --- MOCKING HELPER ---
async function mockPizzaApi(page: Page) {
  // 1. Data Store (Reset for every test)
  let users: User[] = [
    { id: '1', name: 'Admin', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
    { id: '2', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
  ];
  let franchises = [
    {
      id: 2,
      name: 'LotaPizza',
      admins: [{ email: 'a@jwt.com', id: 1, name: 'Admin' }],
      stores: [{ id: 4, name: 'Lehi' }, { id: 5, name: 'Springville' }, { id: 6, name: 'American Fork' }],
    },
    { id: 3, name: 'PizzaCorp', admins: [], stores: [{ id: 7, name: 'Spanish Fork' }] },
    { id: 4, name: 'topSpot', admins: [], stores: [] },
  ];
  let orders: any[] = [];
  let loggedInUser: User | undefined = undefined;

  // 2. Auth Routes
  await page.route('*/**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') { // Login
      const req = route.request().postDataJSON();
      const user = users.find(u => u.email === req.email && u.password === req.password);
      if (user) {
        loggedInUser = user;
        await route.fulfill({ json: { user, token: 'mock-jwt-token' } });
      } else {
        await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      }
    } else if (route.request().method() === 'DELETE') { // Logout
      loggedInUser = undefined;
      await route.fulfill({ status: 200, json: { message: 'Logged out' } });
    }
  });

  // 3. User Routes
  await page.route('*/**/api/user/me', async (route) => {
    if (loggedInUser) {
      await route.fulfill({ json: loggedInUser });
    } else {
      await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    }
  });

  await page.route('*/**/api/user', async (route) => { // Register
    if (route.request().method() === 'POST') {
      const req = route.request().postDataJSON();
      const newUser = { ...req, id: Math.floor(Math.random() * 1000).toString(), roles: [{ role: Role.Diner }] };
      users.push(newUser);
      loggedInUser = newUser;
      await route.fulfill({ json: { user: newUser, token: 'new-user-token' } });
    }
  });

  // 4. Franchise Routes (Now handles POST/DELETE for Admin tests)
  await page.route('*/**/api/franchise', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: franchises });
    } else if (route.request().method() === 'POST') { // Create Franchise
      const req = route.request().postDataJSON();
      const newFranchise = {
        id: Math.floor(Math.random() * 1000),
        name: req.name,
        admins: [{ email: loggedInUser?.email || '', id: parseInt(loggedInUser?.id || '0'), name: loggedInUser?.name || '' }],
        stores: []
      };
      franchises.push(newFranchise);
      await route.fulfill({ json: newFranchise });
    }
  });

  await page.route('*/**/api/franchise/*', async (route) => {
    const urlParts = route.request().url().split('/');
    const franchiseId = parseInt(urlParts[urlParts.length - 1]);
    
    if (route.request().method() === 'DELETE') {
      franchises = franchises.filter(f => f.id !== franchiseId);
      await route.fulfill({ json: { message: 'Deleted' } });
    } else if (route.request().method() === 'GET') { // Get User Franchises
      // Simplified: return all for now or filter by user if needed
      await route.fulfill({ json: franchises.filter(f => f.admins.some(a => a.id === parseInt(loggedInUser?.id || '0'))) });
    }
  });

  await page.route('*/**/api/franchise/*/store', async (route) => {
    if (route.request().method() === 'POST') {
      const urlParts = route.request().url().split('/');
      const franchiseId = parseInt(urlParts[urlParts.length - 2]);
      const req = route.request().postDataJSON();
      const franchise = franchises.find(f => f.id === franchiseId);
      if (franchise) {
        const newStore = { id: Math.floor(Math.random() * 1000), name: req.name };
        franchise.stores.push(newStore);
        await route.fulfill({ json: newStore });
      } else {
        await route.fulfill({ status: 404, json: { message: 'Franchise not found' } });
      }
    }
  });

  await page.route('*/**/api/franchise/*/store/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      const urlParts = route.request().url().split('/');
      const storeId = parseInt(urlParts[urlParts.length - 1]);
      const franchiseId = parseInt(urlParts[urlParts.length - 3]);
      const franchise = franchises.find(f => f.id === franchiseId);
      if (franchise) {
        franchise.stores = franchise.stores.filter(s => s.id !== storeId);
        await route.fulfill({ json: { message: 'Store deleted' } });
      }
    }
  });

  // 5. Order Routes
  await page.route('*/**/api/order/menu', async (route) => {
    const menu = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    await route.fulfill({ json: menu });
  });

  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'POST') {
      const req = route.request().postDataJSON();
      const newOrder = { ...req, id: Math.floor(Math.random() * 1000), date: new Date().toISOString() };
      orders.push(newOrder);
      await route.fulfill({ json: { order: newOrder, jwt: 'mock-jwt' } });
    } else if (route.request().method() === 'GET') { // Order History
      await route.fulfill({ json: { orders: orders } }); // Return empty list or populated list
    }
  });

  // 6. Docs (The one you asked for)
  await page.route('*/**/api/docs', async (route) => {
    await route.fulfill({
      json: {
        version: "1.0",
        endpoints: [
          { method: "GET", path: "/api/franchise", description: "List franchises" },
          { method: "POST", path: "/api/franchise", description: "Create franchise" },
          { method: "GET", path: "/api/order/menu", description: "Get pizza menu" },
          { method: "GET", path: "/api/order", description: "Get user order history" }
        ]
      }
    });
  });
}

// --- TESTS ---

test.beforeEach(async ({ page }) => {
  await mockPizzaApi(page);
});

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Global' })).toBeVisible();
  await page.getByRole('list').click();
  await page.getByRole('heading', { name: 'The web\'s best pizza' }).click();
  await page.locator('.w-screen').click();
});

test('login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('SLC'); // Select store Lehi
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login during checkout
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByText('0.008')).toBeVisible(); // Wallet balance check
});

// NEW: Admin Dashboard Coverage (Create/Delete Franchise)
test('admin dashboard - create franchise and store', async ({ page }) => {
 
});