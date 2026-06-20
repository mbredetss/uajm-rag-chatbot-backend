/* istanbul ignore file */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llmQueryRewrite } from "../llm/index.js";
import { queryRewritePrompt } from "../llm/prompt.js";

const queryReWriting = async (question, historyChat) => {
  return await llm.invoke([
    new SystemMessage(queryRewritePrompt),
    ...(historyChat ?? []),
    new HumanMessage(`here is the user queries: ${question}`),
  ]);
};

export default queryReWriting;