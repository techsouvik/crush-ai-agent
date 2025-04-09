import { StateGraph, END } from "@langchain/langgraph"; // END is sufficient
import type { AgentState } from "./state";
import { agentStateDefinition } from "./state";
import { routerNode, callAgentExecutorNode } from "./nodes";

// Define the workflow
const workflow = new StateGraph<AgentState>({
    channels: agentStateDefinition,
});

// Define node names
const ROUTER_NODE = "router";
const AGENT_EXECUTOR_NODE = "agent_executor";

// Add nodes
workflow.addNode(ROUTER_NODE, routerNode, { ends: [AGENT_EXECUTOR_NODE] });
workflow.addNode(AGENT_EXECUTOR_NODE, callAgentExecutorNode, { ends: ["__end__"] });

// Set entry point to router
workflow.setEntryPoint(ROUTER_NODE as any);

// Chain router → agent executor → END
workflow.addEdge(ROUTER_NODE as any, AGENT_EXECUTOR_NODE as any);
workflow.addEdge(AGENT_EXECUTOR_NODE as any, END);

// Compile the workflow into a runnable app
export const app = workflow.compile();
