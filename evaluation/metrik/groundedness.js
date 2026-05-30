import { z } from "zod";
import 'dotenv/config';
import { ChatGroq } from '@langchain/groq';

// Grade prompt
const groundedInstructions = `You are a teacher grading a quiz. You will be given FACTS and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is grounded in the FACTS. (2) Ensure the STUDENT ANSWER does not contain "hallucinated" information outside the scope of the FACTS.

Grounded:
A grounded value of True means that the student's answer meets all of the criteria.
A grounded value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    maxRetries: 15
}).withStructuredOutput(
    z
        .object({
            explanation: z
                .string()
                .describe("Explain your reasoning for the score"),
            grounded: z
                .boolean()
                .describe("Provide the score on if the answer hallucinates from the documents")
        })
        .describe("Grounded score for the answer from the retrieved documents.")
);

async function groundedness({
    inputs,
    outputs,
}) {
    const docString = outputs.documents.map((doc) => doc.pageContent).join("");
    const answer = `FACTS: ${docString}
        STUDENT ANSWER: ${outputs.answer}`;

    // Run evaluator
    const grade = await llm.invoke([{ role: "system", content: groundedInstructions }, { role: "user", content: answer }]);
    return { key: "groundedness", score: grade.grounded };
};

export default groundedness;