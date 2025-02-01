const {Pinecone:PineconeClient} = require('@pinecone-database/pinecone')

// Create a new PineconeClient instance



async function initPinecone() {
  const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY});
  
  return pinecone;
}

module.exports = { initPinecone };
