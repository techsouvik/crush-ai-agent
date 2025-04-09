import readline from 'readline/promises';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { app } from './src/graph/workflow';
import { browserManager } from './src/core/browser';
import type { AgentState } from './src/graph/state';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function runSession() {
    console.log("AI Agent Initialized.");
    const conversationHistory: BaseMessage[] = [];
    let keepRunning = true;

    while (keepRunning) {
        const command = await rl.question("Enter your command (or type 'exit' to quit): ");

        if (!command || command.trim().toLowerCase() === 'exit') {
            keepRunning = false;
            break;
        }

        console.log(`Executing command: "${command}"`);

        conversationHistory.push(new HumanMessage(command));

        const initialState: AgentState = {
            input: command,
            messages: conversationHistory,
        };

        try {
            const finalState = await app.invoke(initialState);

            console.log("\n--- Final Agent Response ---");
            console.log(finalState.response ?? "No final response generated.");

            if (finalState.response) {
                conversationHistory.push(new AIMessage(finalState.response));
            }
        } catch (error) {
            console.error("\n--- An error occurred during execution ---");
            console.error(error);
        }
    }

    console.log("Closing browser...");
    await browserManager.close();
    rl.close();
    console.log("Session ended.");
}

runSession();
