import { z } from 'zod';
import { StructuredTool } from '@langchain/core/tools';
import { browserManager } from '../core/browser';
import type { Page } from '@playwright/test';

// Helper function to get the current page
async function getPage(): Promise<Page> {
    return browserManager.getCurrentPage();
}

// --- Navigate Tool ---
const NavigateInputSchema = z.object({
    url: z.string().url().describe("The full URL to navigate to."),
});

class NavigateTool extends StructuredTool<typeof NavigateInputSchema> {
    name = "navigate_to_url";
    description = "Navigates the browser to the specified URL.";
    schema = NavigateInputSchema;

    protected async _call(input: z.infer<typeof NavigateInputSchema>): Promise<string> {
        try {
            const page = await getPage();
            const response = await page.goto(input.url, { waitUntil: 'domcontentloaded' });
            if (!response) {
                return `Failed to navigate to ${input.url}. No response received.`;
            }
            if (!response.ok()) {
                return `Failed to navigate to ${input.url}. Status: ${response.status()} ${response.statusText()}`;
            }
            // After navigation, attempt to auto-remove overlays
            await browserManager.autoRemoveOverlays();

            return `Successfully navigated to ${input.url}. Current URL is ${page.url()}`;
        } catch (error: any) {
            console.error("Navigation error:", error);
            return `Error navigating to ${input.url}: ${error.message}`;
        }
    }
}

// --- Click Tool ---
const ClickInputSchema = z.object({
    selector: z.string().describe("A CSS selector or XPath for the element to click."),
    description: z.string().optional().describe("A description of the element to click (e.g., 'Login button', 'Search input'). Helps locate the element if the selector fails."),
});

class ClickTool extends StructuredTool<typeof ClickInputSchema> {
    name = "click_element";
    description = "Clicks an element on the current web page specified by a selector.";
    schema = ClickInputSchema;

    protected async _call(input: z.infer<typeof ClickInputSchema>): Promise<string> {
        try {
            const page = await getPage();
            const locator = page.locator(input.selector);
            try {
                await locator.click({ timeout: 5000 });
                return `Successfully clicked element with selector: "${input.selector}".`;
            } catch (clickError: any) {
                console.warn("Click failed, trying Enter key:", clickError);
                try {
                    await locator.press('Enter', { timeout: 3000 });
                    return `Click failed, but successfully pressed Enter on element with selector: "${input.selector}".`;
                } catch (enterError: any) {
                    console.error("Click and Enter both failed:", enterError);
                    return `Error clicking or pressing Enter on element "${input.selector}": ${enterError.message}. Check if the selector is correct and the element is visible/interactable.`;
                }
            }
        } catch (error: any) {
            console.error("Unexpected error in ClickTool:", error);
            return `Unexpected error clicking element "${input.selector}": ${error.message}`;
        }
    }
}

// --- Type Text Tool ---
const TypeTextInputSchema = z.object({
    selector: z.string().describe("A CSS selector or XPath for the input field."),
    text: z.string().describe("The text to type into the input field."),
    description: z.string().optional().describe("A description of the input field (e.g., 'Username field', 'Search box')."),
});

class TypeTextTool extends StructuredTool<typeof TypeTextInputSchema> {
    name = "type_text";
    description = "Types text into an input field specified by a selector.";
    schema = TypeTextInputSchema;

    protected async _call(input: z.infer<typeof TypeTextInputSchema>): Promise<string> {
        try {
            const page = await getPage();
            await page.locator(input.selector).fill(input.text);
            return `Successfully typed text into element with selector: "${input.selector}".`;
        } catch (error: any) {
            console.error("Typing error:", error);
            return `Error typing into element with selector "${input.selector}": ${error.message}. Check if the selector is correct and the element is visible/editable.`;
        }
    }
}

const LoginWithGoogleInputSchema = z.object({
    email: z.string().email().describe("Google account email address"),
    password: z.string().optional().describe("Google account password (if required)"),
    loginPageUrl: z.string().url().describe("URL of the website login page"),
    googleButtonSelector: z.string().describe("CSS selector for the 'Login with Google' button"),
});

class LoginWithGoogleTool extends StructuredTool<typeof LoginWithGoogleInputSchema> {
    name = "login_with_google";
    description = "Logs into a website using Google authentication with provided email (and password if needed).";
    schema = LoginWithGoogleInputSchema;

    protected async _call(input: z.infer<typeof LoginWithGoogleInputSchema>): Promise<string> {
        try {
            const page = await getPage();

            // Navigate to login page
            await page.goto(input.loginPageUrl, { waitUntil: 'domcontentloaded' });

            // Click "Login with Google" button
            await page.locator(input.googleButtonSelector).click();

            // Wait for popup
            const [popup] = await Promise.all([
                page.context().waitForEvent('page'),
            ]);

            // Wait for Google's login page to load
            await popup.waitForLoadState('domcontentloaded');

            // Type email
            await popup.locator('input[type="email"]').fill(input.email);
            await popup.locator('button:has-text("Next")').click();

            // Wait for password input if password is provided
            if (input.password) {
                await popup.waitForSelector('input[type="password"]', { timeout: 5000 });
                await popup.locator('input[type="password"]').fill(input.password);
                await popup.locator('button:has-text("Next")').click();
            }

            // Wait for redirect back to the app
            await popup.waitForLoadState('load', { timeout: 15000 });
            await popup.close();

            return `Successfully logged in with Google account ${input.email}`;
        } catch (error: any) {
            console.error("Login with Google error:", error);
            return `Error during Google login: ${error.message}`;
        }
    }
}

const LoginInputSchema = z.object({
    loginPageUrl: z.string().url().describe("URL of the website login page"),
    loginMethod: z.enum(["google", "facebook", "github", "username_password"]).describe("Login method to use"),
    emailOrUsername: z.string().describe("Email or username for login"),
    password: z.string().optional().describe("Password for login (required for username/password, optional for OAuth)"),
    oauthButtonSelector: z.string().optional().describe("CSS selector for the OAuth login button (Google, Facebook, GitHub)"),
    usernameSelector: z.string().optional().describe("CSS selector for the username/email input field"),
    passwordSelector: z.string().optional().describe("CSS selector for the password input field"),
    submitSelector: z.string().optional().describe("CSS selector for the submit/login button"),
});

class LoginTool extends StructuredTool<typeof LoginInputSchema> {
    name = "login_to_website";
    description = "Logs into a website using OAuth (Google, Facebook, GitHub) or username/password.";
    schema = LoginInputSchema;

    protected async _call(input: z.infer<typeof LoginInputSchema>): Promise<string> {
        try {
            const page = await getPage();

            // Navigate to login page
            await page.goto(input.loginPageUrl, { waitUntil: 'domcontentloaded' });

            if (input.loginMethod === "username_password") {
                if (!input.usernameSelector || !input.passwordSelector || !input.submitSelector) {
                    return "Missing selectors for username/password login.";
                }
                await page.locator(input.usernameSelector).fill(input.emailOrUsername);
                if (input.password) {
                    await page.locator(input.passwordSelector).fill(input.password);
                }
                await page.locator(input.submitSelector).click();
                await page.waitForLoadState('load', { timeout: 10000 });
                return `Successfully logged in with username/password for ${input.emailOrUsername}`;
            } else {
                if (!input.oauthButtonSelector) {
                    return "Missing OAuth button selector.";
                }
                await page.locator(input.oauthButtonSelector).click();

                const [popup] = await Promise.all([
                    page.context().waitForEvent('page'),
                ]);

                await popup.waitForLoadState('domcontentloaded');

                await popup.locator('input[type="email"]').fill(input.emailOrUsername);
                await popup.locator('button:has-text("Next")').click();

                if (input.password) {
                    await popup.waitForSelector('input[type="password"]', { timeout: 5000 });
                    await popup.locator('input[type="password"]').fill(input.password);
                    await popup.locator('button:has-text("Next")').click();
                }

                await popup.waitForLoadState('load', { timeout: 15000 });
                await popup.close();

                return `Successfully logged in with ${input.loginMethod} account ${input.emailOrUsername}`;
            }
        } catch (error: any) {
            console.error("Login error:", error);
            return `Error during login: ${error.message}`;
        }
    }
}

const CloseOverlayInputSchema = z.object({
    selector: z.string().describe("CSS selector for the overlay or close button to remove"),
});

class CloseOverlayTool extends StructuredTool<typeof CloseOverlayInputSchema> {
    name = "close_overlay";
    description = "Attempts to close or remove an overlay, popup, or modal dialog by clicking a close button or removing the element.";
    schema = CloseOverlayInputSchema;

    protected async _call(input: z.infer<typeof CloseOverlayInputSchema>): Promise<string> {
        try {
            const page = await getPage();

            const overlay = page.locator(input.selector);
            const count = await overlay.count();

            if (count === 0) {
                return `No overlay found matching selector "${input.selector}".`;
            }

            // Try clicking the overlay (close button or overlay itself)
            try {
                await overlay.click({ timeout: 3000 });
                return `Clicked overlay or close button matching selector "${input.selector}".`;
            } catch {
                // If clicking fails, try removing from DOM
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) el.remove();
                }, input.selector);
                return `Removed overlay element matching selector "${input.selector}" from DOM.`;
            }
        } catch (error: any) {
            console.error("Close overlay error:", error);
            return `Error closing overlay: ${error.message}`;
        }
    }
}

class CloseBrowserTool extends StructuredTool<z.ZodUndefined> {
    name = "close_browser";
    description = "Closes the browser window and ends the session.";
    schema = z.undefined();

    protected async _call(): Promise<string> {
        try {
            await browserManager.close();
            return "Browser closed successfully.";
        } catch (error: any) {
            console.error("Error closing browser:", error);
            return `Error closing browser: ${error.message}`;
        }
    }
}

const ExtractInputSchema = z.object({
    selector: z.string().describe("CSS selector or XPath of the element(s) to extract data from."),
    attribute: z.string().optional().describe("Optional attribute to extract (e.g., 'href', 'src'). If omitted, extracts text content."),
    multiple: z.boolean().optional().describe("Whether to extract multiple elements matching the selector. Defaults to false."),
    description: z.string().optional().describe("Optional description of the data to extract."),
});

class ExtractDataTool extends StructuredTool<typeof ExtractInputSchema> {
    name = "extract_data";
    description = "Extracts structured data from the current web page using a selector.";
    schema = ExtractInputSchema;

    protected async _call(input: z.infer<typeof ExtractInputSchema>): Promise<string> {
        try {
            const page = await getPage();
            const multiple = input.multiple ?? false;

            if (multiple) {
                const elements = await page.locator(input.selector).elementHandles();
                if (elements.length === 0) {
                    return `No elements found matching selector "${input.selector}".`;
                }

                const results = [];
                for (const el of elements) {
                    const data = input.attribute
                        ? await el.getAttribute(input.attribute)
                        : await el.textContent();
                    results.push(data?.trim() ?? null);
                }
                return JSON.stringify(results, null, 2);
            } else {
                const locator = page.locator(input.selector).first();
                const count = await locator.count();
                if (count === 0) {
                    return `No element found matching selector "${input.selector}".`;
                }
                const el = await locator.elementHandle();
                if (!el) {
                    return `No element handle found for selector "${input.selector}".`;
                }
                const data = input.attribute
                    ? await el.getAttribute(input.attribute)
                    : await el.textContent();
                return data?.trim() ?? `No data extracted from selector "${input.selector}".`;
            }
        } catch (error: any) {
            console.error("Extract data error:", error);
            return `Error extracting data: ${error.message}`;
        }
    }
}

import { SmartExtractTool } from "./smart_extract_tool";

export const browserTools = [
    new NavigateTool(),
    new ClickTool(),
    new TypeTextTool(),
    new LoginWithGoogleTool(),
    new LoginTool(),
    new CloseOverlayTool(),
    new ExtractDataTool(),
    new SmartExtractTool(),
];
