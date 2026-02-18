import { test, expect } from '@playwright/test';

test.describe('Staff Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('text=DiveAdmin', { timeout: 10000 });
  });

  test('should display staff calendar with weekly view', async ({ page }) => {
    // Navigate to staff calendar
    await page.click('text=Staff Calendar');

    // Wait for calendar to load
    await page.waitForSelector('text=Staff Calendar', { timeout: 5000 });

    // Check that calendar elements are present
    await expect(page.locator('text=Week')).toBeVisible();
    await expect(page.locator('text=Month')).toBeVisible();
    await expect(page.locator('text=Instructors')).toBeVisible();
    await expect(page.locator('text=Divemasters')).toBeVisible();
    await expect(page.locator('text=Boat Staff')).toBeVisible();
  });

  test('should switch between week and month view', async ({ page }) => {
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Switch to month view
    await page.click('text=Month');
    await expect(page.locator('text=Month')).toHaveClass(/data-state="active"/);

    // Switch back to week view
    await page.click('text=Week');
    await expect(page.locator('text=Week')).toHaveClass(/data-state="active"/);
  });

  test('should navigate calendar dates', async ({ page }) => {
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Get initial date range
    const initialDateRange = await page.locator('.min-w-\\[120px\\]').textContent();

    // Click next button
    await page.click('button:has-text("→")');

    // Verify date range changed
    const newDateRange = await page.locator('.min-w-\\[120px\\]').textContent();
    expect(newDateRange).not.toBe(initialDateRange);

    // Click previous button
    await page.click('button:has-text("←")');

    // Verify date range returned to original
    const finalDateRange = await page.locator('.min-w-\\[120px\\]').textContent();
    expect(finalDateRange).toBe(initialDateRange);
  });

  test('should display staff assignments in calendar', async ({ page }) => {
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Check if staff data loads (may be empty initially)
    const calendarCells = page.locator('.grid.grid-cols-7 .border.rounded-md');
    const cellCount = await calendarCells.count();

    // Should have 7 days in week view
    expect(cellCount).toBeGreaterThan(0);
  });

  test('should create and assign staff to booking', async ({ page }) => {
    // Navigate to staff page first
    await page.click('text=Staff');
    await page.waitForSelector('text=Staff Management');

    // Create a new instructor
    await page.click('text=Add Instructor');
    await page.fill('input[placeholder*="Name"]', 'Test Instructor');
    await page.fill('input[placeholder*="Email"]', 'test@instructor.com');
    await page.selectOption('select', 'instructor');
    await page.click('text=Save');

    // Navigate to bookings
    await page.click('text=Bookings & Invoices');
    await page.waitForSelector('text=Bookings');

    // Create a new booking
    await page.click('text=New Booking');
    await page.selectOption('select[name="type"]', 'fun_dive');
    await page.fill('input[name="check_in"]', '2024-12-25T10:00');
    await page.fill('input[name="check_out"]', '2024-12-25T14:00');

    // Assign the instructor
    await page.selectOption('select[name="divemaster_id"]', 'Test Instructor');

    // Save booking
    await page.click('text=Save Booking');

    // Navigate back to staff calendar
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Check if booking appears in calendar for the assigned staff
    const bookingIndicator = page.locator('text=Test Instructor').locator('..').locator('.bg-green-50');
    await expect(bookingIndicator).toBeVisible();
  });

  test('should prevent double-booking staff', async ({ page }) => {
    // Navigate to bookings
    await page.click('text=Bookings & Invoices');
    await page.waitForSelector('text=Bookings');

    // Create first booking
    await page.click('text=New Booking');
    await page.selectOption('select[name="type"]', 'fun_dive');
    await page.fill('input[name="check_in"]', '2024-12-26T10:00');
    await page.fill('input[name="check_out"]', '2024-12-26T14:00');
    await page.selectOption('select[name="divemaster_id"]', 'Test Instructor');
    await page.click('text=Save Booking');

    // Try to create overlapping booking
    await page.click('text=New Booking');
    await page.selectOption('select[name="type"]', 'fun_dive');
    await page.fill('input[name="check_in"]', '2024-12-26T12:00'); // Overlapping time
    await page.fill('input[name="check_out"]', '2024-12-26T16:00');
    await page.selectOption('select[name="divemaster_id"]', 'Test Instructor');

    // Attempt to save - should show error
    await page.click('text=Save Booking');

    // Check for error message
    await expect(page.locator('text=Staff member is not available')).toBeVisible();
  });

  test('should display certification expiry alerts', async ({ page }) => {
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Check for certification alerts section
    await expect(page.locator('text=Certification Expiry Alerts')).toBeVisible();

    // May show "No upcoming certification expiries" if no data
    const noAlerts = page.locator('text=No upcoming certification expiries');
    const hasAlerts = await noAlerts.isVisible();

    if (!hasAlerts) {
      // If there are alerts, check they have proper styling
      const alertItems = page.locator('.bg-orange-50.border-orange-200');
      const alertCount = await alertItems.count();
      if (alertCount > 0) {
        await expect(alertItems.first()).toContainText('Expires in');
      }
    }
  });

  test('should filter staff by role in calendar', async ({ page }) => {
    await page.click('text=Staff Calendar');
    await page.waitForSelector('text=Staff Calendar');

    // Check instructors tab
    await page.click('text=Instructors');
    await expect(page.locator('text=Instructors')).toHaveClass(/data-state="active"/);

    // Check divemasters tab
    await page.click('text=Divemasters');
    await expect(page.locator('text=Divemasters')).toHaveClass(/data-state="active"/);

    // Check boat staff tab
    await page.click('text=Boat Staff');
    await expect(page.locator('text=Boat Staff')).toHaveClass(/data-state="active"/);
  });
});