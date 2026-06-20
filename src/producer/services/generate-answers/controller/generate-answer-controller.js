import { llmGenerateAnswer } from "../llm/index.js";
import vectorStore from "../../../utils/vectorStore.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import queryReWriting from "../query-rewrite/queryReWriting.js";
import { response } from "../../../utils/index.js";
import { traceable } from "langsmith/traceable";
import generateAnswerRepositories from "../repositories/generate-answer-repositories.js";
import { generateAnswerPrompt } from "../llm/prompt.js";
import PostgresDocstore from "../doc-store/PostgresDocStore.js";
import pool from "../../../utils/database.js";

const _runLLMChain = async (question, relevantDocs, historyChat) => {

    const sortedDocs = [...relevantDocs].sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateB - dateA;
    });

    const context = sortedDocs.map((doc) => `
    Content: ${doc.pageContent}, 
    CreatedAt: ${doc.metadata.createdAt}.
  `).join('\n\n');

    const llmAnswer = await llmGenerateAnswer.invoke([
        new SystemMessage(generateAnswerPrompt),
        ...(historyChat ?? []),
        new HumanMessage(`question: ${question}, documents: ${context}`),
    ]);

    return llmAnswer.content;
}

const runLLMChain = traceable(
    _runLLMChain,
    {
        name: "generateAnswerChain",
        run_type: "chain",
        tags: ["generate-answer"],
        metadata: { project: "uajm-rag-chatbot" },
    }
);

const generateAnswer = async (req, res) => {
    const { message, userId } = req.validated;

    const resultHistory = await generateAnswerRepositories.getChatHistory(userId);

    const historyChat = resultHistory.reverse().flatMap(hc => [
        new HumanMessage(hc.question),
        new AIMessage(hc.answer),
    ]);

    const rewrittenQuery = await queryReWriting(message, historyChat);
    const childDocs = await vectorStore.similaritySearch(rewrittenQuery.content, 5);
    const postgresDocStore = new PostgresDocstore(pool);
    const relevantDocs = await postgresDocStore.mget(childDocs.map(doc => doc.metadata.doc_id));
    const parentDocs = [...new Set(relevantDocs)];

    const result = await runLLMChain(message, parentDocs, historyChat);

    await generateAnswerRepositories.addChatHistory(userId, message, result);

    return response(res, 200, null, {
        answer: result,
    });
};

export default generateAnswer;