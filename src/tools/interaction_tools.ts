import { z } from 'zod';
import { StructuredTool } from '@langchain/core/tools';
import readline from 'readline/promises'; // Import readline for interaction

// Define the input schema for the AskUserTool
const AskUserInputSchema = z.object({
    question: z.string().describe("The question to ask the user."),
});

// Create the readline interface (can be reused)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

class AskUserTool extends StructuredTool<typeof AskUserInputSchema> {
    name = "ask_user";
    description = "Asks the user a question and returns their answer. Use this when you need clarification or additional information from the user to proceed.";
    schema = AskUserInputSchema;

    // This tool needs to be synchronous within the graph execution context,
    // but readline.question is async. LangGraph handles async node execution.
    protected async _call(input: z.infer<typeof AskUserInputSchema>): Promise<string> {
        console.log(`\n🤖 Agent asks: ${input.question}`);
        // Use the existing readline interface to ask the question
        const answer = await rl.question("Your answer: ");
        return answer || "User provided no answer."; // Return the user's answer
    }
}

// Export the tool instance
export const askUserTool = new AskUserTool();

// Close readline when the process exits (important!)
// We might need a more robust way to handle this, perhaps in index.ts cleanup
process.on('exit', () => {
    console.log("Closing readline interface.");
    rl.close();
});
process.on('SIGINT', () => {
    console.log("Caught interrupt signal, closing readline.");
    rl.close();
    process.exit();
});
