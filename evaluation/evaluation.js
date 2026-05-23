import { evaluate } from "langsmith/evaluation";
import { traceable } from "langsmith/traceable";
import contextRelevance from "./metrik/contextRelevance.js";
import groundedness from "./metrik/Groundedness.js";
import answerRelevance from "./metrik/answerRelevance.js";
import { getVectorStore } from "../src/consumer/indexingConsumer.js";
import 'dotenv/config';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq"

const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b:free',
    maxRetries: 10
});

const ragBot = traceable(async (question) => {
    const vectorStore = await getVectorStore();
    const retrievedDocs = await vectorStore.similaritySearch(question, 5);
    const docsContent = retrievedDocs.map((doc) => doc.pageContent).join('\n\n');

    const systemPrompt = `You are a helpful assistant who is good at analyzing source information and answering questions.
        Use the following source documents to answer the user's questions.
        If you don't know the answer, just say that you don't know.
        Keep the answer concise.
        Documents:
        ${docsContent}`;

    const aiMsg = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(question),
    ]);

    return { "answer": aiMsg.content, "documents": retrievedDocs }
});

const targetFunc = (inputs) => {
    return ragBot(inputs.question);
};

const experimentResults = await evaluate(targetFunc, {
    data: "UAJM Chatbot Evaluation",
    evaluators: [contextRelevance, groundedness, answerRelevance],
    experimentPrefix: "rag-doc-relevance",
    metadata: { version: "LCEL context, gpt-4-0125-preview" },
});

export default  llm;