import { ChatOpenAI } from "@langchain/openai";
// Switch to createOpenAIToolsAgent
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import type { BaseMessage } from "@langchain/core/messages"; // Use type import
// Remove unused imports
// import { RunnableSequence } from "@langchain/core/runnables";
// import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
// import { formatToOpenAIFunctionMessages } from "@langchain/openai/agents";
// import { OpenAIFunctionsAgentOutputParser } from "@langchain/openai/output_parsers";
import { browserTools } from "../tools/browser_tools"; // Import our browser tools
import { askUserTool } from "../tools/interaction_tools"; // Import the ask user tool

// Combine all tools
const allTools = [...browserTools, askUserTool];

// Initialize the OpenAI model using environment variables
// Ensure OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL are set in your .env file
const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Use the key from .env
    modelName: process.env.OPENAI_MODEL, // Use the model from .env, fallback to gpt-4o
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL, // Pass baseURL inside configuration
        defaultHeaders: {
            'HTTP-Referer': 'https://yourapp.com',
            'X-Title': 'My AI Agent',
        },
    },
});

// Define the prompt template
// Input must include `agent_scratchpad` and `input` variables.
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are an autonomous AI agent that controls a web browser. When given a complex command, break it down into smaller steps. Use the available tools to navigate, click, type, login, and search as needed. After completing the task, provide a clear final response summarizing what you did."],
    new MessagesPlaceholder("chat_history"), // Placeholder for conversation history (ensure this matches AgentExecutor input)
    ["human", "{input}"], // Placeholder for the user's current input
    new MessagesPlaceholder("agent_scratchpad"), // Placeholder for intermediate agent steps (function calls/responses)
]);


// Create the agent using the tools agent helper function
const agent = await createOpenAIToolsAgent({
    llm,
    tools: allTools, // Use the combined list of tools
    prompt,
});

// Create the Agent Executor
// This runs the agent loop, executing tools and feeding results back
export const agentExecutor = new AgentExecutor({
    agent: agent,
    tools: allTools, // Use the combined list of tools
    verbose: true, // Set to true for debugging
});
