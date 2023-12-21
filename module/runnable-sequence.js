import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { RunnableSequence, RunnablePassthrough } from 'langchain/schema/runnable';

import dotenv from 'dotenv';

dotenv.config();

const openAIApiKey = process.env.OPENAI_API_KEY
const llm = new ChatOpenAI({ openAIApiKey })

// punctuation
const punctuationTemplate = `Given a sentence, add punctuation where needed. 
    sentence: {sentence}
    sentence with punctuation:  
    `
const punctuationPrompt = PromptTemplate.fromTemplate(punctuationTemplate)

// grammar
const grammarTemplate = `Given a sentence correct the grammar.
    sentence: {punctuated_sentence}
    sentence with correct grammar: 
    `
const grammarPrompt = PromptTemplate.fromTemplate(grammarTemplate)

// translation
const translationTemplate = `Given a sentence, translate that sentence into {language}.
Sentence: {grammatically_correct_sentence}.
Translated sentence:
`
const translationPrompt = PromptTemplate.fromTemplate(translationTemplate)

//chains
const punctuationChain = RunnableSequence.from([
    punctuationPrompt,
    llm,
    new StringOutputParser()
]);
const grammarChain = RunnableSequence.from([
    grammarPrompt,
    llm,
    new StringOutputParser()
]);
const translationChain = RunnableSequence.from([
    translationPrompt,
    llm,
    new StringOutputParser()
])

// main chain
const chain = RunnableSequence.from([
    { 
        punctuated_sentence: punctuationChain,
        original_input: new RunnablePassthrough() 
    },
    // prevResult => console.log(prevResult),
    { 
        grammatically_correct_sentence: grammarChain,
        language: ({ original_input }) => original_input.language 
    },
    translationChain
]);

const response = await chain.invoke({
    sentence: 'i dont liked mondays',
    language: 'french'
})

console.log(response)
