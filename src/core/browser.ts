import { chromium, firefox, webkit, type Browser, type Page, type BrowserContext, type BrowserType } from '@playwright/test';

type SupportedBrowser = "chromium" | "firefox" | "webkit";

class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private browserType: SupportedBrowser;

    constructor() {
        const envBrowser = process.env.AGENT_BROWSER?.toLowerCase();
        if (envBrowser === "firefox" || envBrowser === "webkit" || envBrowser === "chromium") {
            this.browserType = envBrowser;
            console.log(`Agent will use browser: ${this.browserType} (from AGENT_BROWSER env)`);
        } else {
            this.browserType = "chromium";
            console.log("Agent defaulting to Chromium browser");
        }
    }

    async autoRemoveOverlays(): Promise<void> {
        const page = await this.getCurrentPage();
        try {
            await page.evaluate(() => {
                const selectors = [
                    '.modal',
                    '.popup',
                    '.overlay',
                    '[role=dialog]',
                    '[aria-modal="true"]',
                    '.backdrop',
                    '.lightbox',
                    '.newsletter-popup',
                    '.cookie-consent',
                    '.cookie-banner',
                    '.subscribe-modal',
                    '.interstitial',
                    '.ui-dialog',
                    '.fancybox-container',
                    '.mfp-wrap',
                    '.modal-backdrop',
                    '.modal-open',
                    '.modal-dialog',
                    '.modal-content',
                    '.modal-footer',
                    '.modal-header',
                    '.modal-body',
                    '.close',
                    '.close-button',
                    '.close-btn',
                    '.dismiss',
                    '.exit-intent',
                    '.popup-close',
                    '.popup-dismiss',
                    '.newsletter-close',
                    '.cookie-close',
                    '.cookie-dismiss',
                    '.overlay-close',
                    '.lightbox-close',
                    '.fancybox-close',
                    '.mfp-close',
                ];

                for (const selector of selectors) {
                    document.querySelectorAll(selector).forEach((el) => {
                        try {
                            // Try clicking close buttons inside overlays
                            const closeBtn = el.querySelector('button.close, .close, .close-button, .close-btn, .dismiss, .popup-close, .popup-dismiss, .newsletter-close, .cookie-close, .cookie-dismiss, .overlay-close, .lightbox-close, .fancybox-close, .mfp-close');
                            if (closeBtn) {
                                (closeBtn as HTMLElement).click();
                            } else {
                                // Otherwise, remove the overlay element
                                el.remove();
                            }
                        } catch (e) {
                            console.warn('Error removing overlay:', e);
                        }
                    });
                }
            });
            console.log("Auto overlay removal executed.");
        } catch (error) {
            console.error("Error during auto overlay removal:", error);
        }
    }

    setBrowserType(type: SupportedBrowser) {
        this.browserType = type;
    }

    async launch(): Promise<Page> {
        if (!this.browser) {
            let launcher: BrowserType;
            switch (this.browserType) {
                case "firefox":
                    launcher = firefox;
                    break;
                case "webkit":
                    launcher = webkit;
                    break;
                case "chromium":
                default:
                    launcher = chromium;
            }
            this.browser = await launcher.launch({ headless: false });
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 800 },
                locale: 'en-US',
            });
            this.page = await this.context.newPage();

            // Stealth evasions
            await this.page.addInitScript(() => {
                // Pass the Webdriver test
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });

                // Pass Chrome test
                (window as any).chrome = {
                    runtime: {},
                    // Add more if needed
                };

                // Pass Permissions test
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => {
                    if (parameters.name === 'notifications') {
                        return originalQuery(parameters);
                    }
                    return originalQuery(parameters);
                };

                // Pass Plugins Length test
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });

                // Pass Languages test
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
            });
        }
        if (!this.page) {
            throw new Error("Failed to create a new page.");
        }
        return this.page;
    }

    async getCurrentPage(): Promise<Page> {
        if (!this.page) {
            return this.launch();
        }
        return this.page;
    }

    async close(): Promise<void> {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        console.log("Browser closed.");
    }
}

// Export a singleton instance
export const browserManager = new BrowserManager();
