import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import type { Page } from "@playwright/test";
import { browserManager } from "../core/browser";

async function getPage(): Promise<Page> {
    return browserManager.getCurrentPage();
}

export const SmartExtractInputSchema = z.object({
    query: z.string().describe("Natural language description of the data to extract, e.g., 'list all shoes under 1000'"),
    selector: z.string().optional().describe("Optional CSS selector or XPath to scope the extraction"),
});

export class SmartExtractTool extends StructuredTool<typeof SmartExtractInputSchema> {
    name = "smart_extract";
    description = "Uses an LLM to extract structured data from the current web page based on a natural language query.";
    schema = SmartExtractInputSchema;

    protected async _call(input: z.infer<typeof SmartExtractInputSchema>): Promise<string> {
        try {
            const page = await getPage();
            let content: string;

            if (input.selector) {
                const locator = page.locator(input.selector);
                const count = await locator.count();
                if (count === 0) {
                    return `No element found matching selector "${input.selector}".`;
                }
                content = await locator.first().innerHTML();
            } else {
                content = await page.content();
            }

            const llm = new ChatOpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                modelName: process.env.OPENAI_MODEL ?? "gpt-4o",
                temperature: 0,
            });

            const prompt = `
You are an expert data extractor. Given the following HTML content, extract the information requested.

Request: ${input.query}

HTML Content:
${content}

Return the extracted data in a clean, structured JSON format.
`;

            const response = await llm.invoke(prompt);
            return typeof response === "string" ? response : JSON.stringify(response, null, 2);
        } catch (error: any) {
            console.error("Smart extract error:", error);
            return `Error during smart extraction: ${error.message}`;
        }
    }
}
