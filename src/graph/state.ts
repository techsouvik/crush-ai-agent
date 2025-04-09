import type { BaseMessage } from "@langchain/core/messages";
import type { StateGraphArgs } from "@langchain/langgraph";
import type { AgentAction, AgentFinish } from "@langchain/core/agents"; // Import agent action/finish types

/**
 * Represents the state of our graph.
 */
export interface AgentState {
    /**
     * The input prompt/command.
     */
    input: string;
    /**
     * The list of previous messages in the conversation.
     */
    messages: BaseMessage[];
    /**
     * The final response from the agent.
     */
    response?: string;
    /**
     * The outcome of the last agent invocation (Action(s) or Finish).
     */
    agent_outcome?: AgentAction[] | AgentFinish; // Allow array of actions

    /**
     * The extracted CV text content.
     */
    cvText?: string;

    /**
     * The routing decision for the workflow.
     */
    route?: string;
}

// The state definition uses a dictionary mapping node names to their state types
export const agentStateDefinition: StateGraphArgs<AgentState>["channels"] = {
    input: {
        // Define a reducer to overwrite the input value
        value: (x: string, y: string) => y,
    },
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y), // Append new messages
        default: () => [], // Start with an empty list
    },
    response: {
        // Define a reducer to overwrite the response value
        value: (x?: string, y?: string) => y,
    },
    // Add channel for agent outcome
    agent_outcome: {
        value: (x?: AgentAction[] | AgentFinish, y?: AgentAction[] | AgentFinish) => y,
    }
};
