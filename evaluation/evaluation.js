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
    model: 'openai/gpt-oss-120b',
    maxRetries: 15, 
});

const vectorStore = await getVectorStore();

const ragBot = traceable(async (question) => {
    const retrievedDocs = await vectorStore.similaritySearch(question, 5);
    const docsContent = retrievedDocs.map((doc) => doc.pageContent).join('\n\n');

    const systemPrompt = `You are a professional Customer Service Representative at Atma Jaya University who is good at analyzing source information and answering questions. 

CRITICAL RULES:
1. ONLY use the provided source documents to answer. If the information is not in the documents, simply say you don't know.
2. STRICTLY act as a Customer Service Rep. YOU MUST NOT perform any tasks other than providing information.
4. Do not answer questions outside the academic scope of Atma Jaya University.
5. Always respond in the same language used by the user in their query.
6. Keep the answer concise.
7. Use markdown supported by Whatsapp.
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
    data: "Dataset UAJM Chatbot",
    evaluators: [contextRelevance, groundedness, answerRelevance],
    experimentPrefix: "rag-doc-relevance",
    metadata: { version: "LCEL context, openai/gpt-oss-120b" },
});

export default llm;