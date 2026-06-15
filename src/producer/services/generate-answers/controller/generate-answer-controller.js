import llm from "../llm/index.js";
import vectorStore from "../../../utils/vectorStore.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import queryReWriting from "../query-rewrite/queryReWriting.js";
import { response } from "../../../utils/index.js";
import { traceable } from "langsmith/traceable";
import generateAnswerRepositories from "../repositories/generate-answer-repositories.js";
import { generateAnswerPrompt } from "../llm/prompt.js";

const _runLLMChain = async (question, relevantDocs, historyChat) => {
    const THRESHOLD = 0.6;
    const filteredDocsWithScore = relevantDocs.filter(
        ([_doc, score]) => score <= THRESHOLD
    );

    const filteredDocs = filteredDocsWithScore.map(([doc, _score]) => doc);

    const sortedDocs = [...filteredDocs].sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateB - dateA;
    });

    const context = sortedDocs.map((doc) => `
    Content: ${doc.pageContent}, 
    CreatedAt: ${doc.metadata.createdAt}.
  `).join('\n\n');

    const llmAnswer = await llm.invoke([
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
    const relevantDocs = await vectorStore.similaritySearchWithScore(rewrittenQuery.content, 5);

    const result = await runLLMChain(message, relevantDocs, historyChat);

    await generateAnswerRepositories.addChatHistory(userId, rewrittenQuery.content, result);

    return response(res, 200, null, {
        answer: result,
    });
};

export default generateAnswer;