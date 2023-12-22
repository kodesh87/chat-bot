import express from 'express';
import path from 'path'; // Tambahkan ini
import { ChatOpenAI } from 'langchain/chat_models/openai'
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
} from "langchain/prompts";
import { ConversationChain } from 'langchain/chains';
import { ChatMessageHistory } from "langchain/memory";
import { StringOutputParser } from 'langchain/schema/output_parser'
import { retriever } from './utils/retriever.js'
import { combineDocuments } from './utils/document.js'
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"
import bodyParser from 'body-parser';
import { request } from 'http';
import { createRetrieverTool, createConversationalRetrievalAgent, OpenAIAgentTokenBufferMemory } from "langchain/agents/toolkits";
import { initializeAgentExecutorWithOptions } from 'langchain/agents';

const openAIApiKey = process.env.OPENAI_API_KEY
const llm = new ChatOpenAI({ modelName: 'gpt-3.5-turbo-1106', openAIApiKey });

// const chatPromptMemory = new ConversationSummaryBufferMemory({
//     llm: new ChatOpenAI({ openAIApiKey, modelName: "gpt-3.5-turbo", temperature: 0 }),
//     maxTokenLimit: 10,
//     returnMessages: true,
// });

// const chatPromptMemory = new OpenAIAgentTokenBufferMemory({
//     llm: llm,
//     memoryKey: "chat_history",
//     outputKey: "output",
// });


const chatHistory = new ChatMessageHistory();

const chatPromptMemory = new OpenAIAgentTokenBufferMemory({
  llm: new ChatOpenAI({ modelName: 'gpt-3.5-turbo-1106', openAIApiKey }),
  memoryKey: "chat_history",
  outputKey: "output",
  chatHistory,
});


// standalone prompt template
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:'
const standaloneQuestionPrompt = ChatPromptTemplate.fromTemplate(standaloneQuestionTemplate)

// Q&A prompt template
const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Social VPS based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@socialvps.net. Don't try to make up an answer. Always speak as you are Social VPS agent and you were chatting to a friend and speak according the language of the question.
context: {context}
question: {question}
answer: `
// const answerPrompt = ChatPromptTemplate.fromTemplate(answerTemplate)

const answerPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a helpful and enthusiastic support bot who can answer a given question about Social VPS based on the context provided. Try to find the answer in the context. If you really don't know the answer, don't try to make up an answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@socialvps.net. Always speak as you are Social VPS agent and you were chatting to a friend and speak according the language of the question.`
  ),
  new MessagesPlaceholder("history"),
  HumanMessagePromptTemplate.fromTemplate("{question}"),
]);

/**
 * Super Challenge:
 * 
 * Set up a RunnableSequence so that the standaloneQuestionPrompt 
 * passes the standalone question to the retriever, and the retriever
 * passes the combined docs as context to the answerPrompt. Remember, 
 * the answerPrompt should also have access to the original question. 
 * 
 * When you have finished the challenge, you should see a 
 * conversational answer to our question in the console.
 * 
**/

// kb
const tool = createRetrieverTool(retriever, {
    name: "faq_social_vps",
    description:
      "Frequently Asked Question Social VPS.",
  });

// chains
const standaloneQuestionChain = RunnableSequence.from([
    standaloneQuestionPrompt,
    llm,
    new StringOutputParser()
]);
const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retriever,
    combineDocuments
]);
const answerChain = await initializeAgentExecutorWithOptions(
    [tool],
    llm,
    {
        agentType: "openai-functions",
        memory: chatPromptMemory,
        returnIntermediateSteps: true,
        agentArgs: {
          prefix:
            `You are a helpful and enthusiastic support bot who can answer a given question about Social VPS based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@socialvps.net. Don't try to make up an answer, don't talk about other VPS provider. Always speak as you are Social VPS agent and as you were chatting to a friend and speak fully according the language of the question.`,
        },
    }
);

// const answerChain = RunnableSequence.from([
//     answerPrompt,
//     llm,
//     new StringOutputParser()
// ]);

// main chain
const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    }, 
    {
        // context: retrieverChain,
        input: ({ original_input }) => original_input.question 
    },
    // prevResult => console.log(prevResult),
    answerChain
]);
// standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retriever).pipe(combineDocuments).pipe(answerPrompt);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const PORT = 3000;

// Menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/chat', async (req, res) => {
  const requestData = req.body;
  console.log(requestData);

  // Lakukan sesuatu dengan data (contoh: tampilkan di console)
  console.log('Received POST request with data: ', requestData);

  // const response = 'helo';
  const response = await chain.invoke({
      question: requestData.question
  })

  console.log(response.output);

  // Kirim respons ke client
  res.status(200).json({ message: 'Data received successfully', data: { question: requestData.question, answer: response.output } });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});