import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;

const getPineconeClient = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX, process.env.PINECONE_HOST);
};

export default getPineconeClient;
