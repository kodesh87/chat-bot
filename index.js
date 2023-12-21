import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { RunnableSequence } from 'langchain/schema/runnable';

import dotenv from 'dotenv';

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY
const llm = new ChatOpenAI({ openAIApiKey })

const punctuationTemplate = `Given a sentence, add punctuation where needed. 
    sentence: {sentence}
    sentence with punctuation:  
    `
const punctuationPrompt = PromptTemplate.fromTemplate(punctuationTemplate)

const grammarTemplate = `Given a sentence correct the grammar.
    sentence: {punctuated_sentence}
    sentence with correct grammar: 
    `
const grammarPrompt = PromptTemplate.fromTemplate(grammarTemplate)

const chain = RunnableSequence.from([
    punctuationPrompt,
    llm,
    new StringOutputParser(),
    { punctuated_sentence: prevResult => prevResult },
    // prevResult => console.log(prevResult),
    grammarPrompt,
    llm,
    new StringOutputParser()
]);

const response = await chain.invoke({
    sentence: 'i dont liked mondays',
    language: 'french'
})

console.log(response)
