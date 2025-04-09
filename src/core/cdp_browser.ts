import CDP from 'chrome-remote-interface';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

export class CDPBrowserManager {
    private chromeProcess: ChildProcess | null = null;
    private client: any = null;

    async launch(): Promise<void> {
        if (this.client) return; // Already connected

        const port = 9222;
        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // macOS default

        this.chromeProcess = spawn(chromePath, [
            '--remote-debugging-port=' + port,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-popup-blocking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-device-discovery-notifications',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-web-resources',
            '--disable-notifications',
            '--disable-desktop-notifications',
            '--disable-software-rasterizer',
            '--disable-gpu',
            '--window-size=1280,800',
            'about:blank',
        ], { stdio: 'ignore' });

        // Wait for Chrome to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        const browserClient = await CDP({ port });

        const { targetId } = await browserClient.Target.createTarget({ url: 'about:blank' });

        const tabClient = await CDP({ target: targetId, port });

        await tabClient.Page.enable();
        await tabClient.Runtime.enable();

        this.client = tabClient;

        console.log('Launched new Chrome window and created new tab');
    }

    async navigate(url: string): Promise<void> {
        if (!this.client) throw new Error('CDP client not connected');
        await this.client.Page.navigate({ url });
        await this.client.Page.loadEventFired();
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        if (this.chromeProcess) {
            this.chromeProcess.kill();
            this.chromeProcess = null;
        }
    }
}

export const cdpBrowserManager = new CDPBrowserManager();
