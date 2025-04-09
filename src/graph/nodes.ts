import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import type { AgentState } from "./state";
import { agentExecutor } from "../agent/agent"; // Import the executor
import { ExtractTextFromPDFTool } from "../tools/file_tools";

/**
 * Router node: always route directly to agent executor.
 */
export const routerNode = async (state: AgentState) => {
    console.log("Router: Routing directly to agent_executor node");
    return { type: "command", target: "agent_executor" };
};

/**
 * Calls the agent executor with the current input and message history.
 * The executor handles the internal agent loop (agent calls, tool execution).
 * @param state The current graph state.
 * @returns A partial state object with the agent's final response.
 */
export const callAgentExecutorNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("--- Calling Agent Executor Node ---");
    const { input, messages } = state;

    // Prepare the input for the agent executor
    // Exclude the last message from history if it's the current human input,
    // as it will be added by the prompt template's "{input}" placeholder.
    const historyForAgent = messages.slice(0, -1);

    const agentExecutorInput = {
        input: input,
        chat_history: historyForAgent.filter(msg => msg._getType() === "human" || msg._getType() === "ai"),
    };

    console.log("Invoking AgentExecutor with:", JSON.stringify(agentExecutorInput, null, 2));

    // Invoke the agent executor
    const agentResponse = await agentExecutor.invoke(agentExecutorInput);

    // console.log("--- AgentExecutor Response ---");
    // console.log(agentResponse);

    // The agentExecutor returns the final 'output' in the response object
    const responseMessage = new AIMessage(agentResponse.output);

    return {
        // Update messages with the final response
        // Note: AgentExecutor doesn't return intermediate messages,
        // so we only add the final output here.
        // If full history including tool calls is needed in the state,
        // a more complex graph structure is required.
        messages: [responseMessage],
        response: agentResponse.output, // Store the final response string
    };
};
