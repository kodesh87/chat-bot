import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import fs from 'fs/promises';

try {
    const filePath = '/Users/kodesh87/Developer/nodejs-fe-application/chat-bot/faq.txt';
    const text = await fs.readFile(filePath, 'utf-8');

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        separators: ['\n\n', '\n', ' ', ''],
        chunkOverlap: 50
    });

    const output = await splitter.createDocuments([text]);
    for (const o of output) {
        console.log(o);
    }
} catch (err) {
    console.log(err);
}