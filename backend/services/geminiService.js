const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API
let genAI = null;

const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
    return false;
  }
};

/**
 * Generate a response from Gemini AI
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} messages[].role - Either 'user' or 'assistant'
 * @param {string} messages[].content - The message content
 * @param {Array} messages[].images - Optional array of image objects with data (base64) and type
 * @returns {Promise<string>} - The AI response
 */
const generateResponse = async (messages) => {
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please check your API key.');
  }

  try {
    // Use gemini-3-flash-preview for all requests (including images)
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Convert messages to Gemini format
    const chatHistory = messages.slice(0, -1).map(msg => {
      const parts = [{ text: msg.content }];
      
      // Add images if present
      if (msg.images && msg.images.length > 0) {
        msg.images.forEach(image => {
          // Extract base64 data and mime type
          const base64Data = image.data.split(',')[1] || image.data;
          const mimeType = image.type || 'image/jpeg';
          
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        });
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });

    // Get the last message (current user message)
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Prepare the last message parts
    const lastMessageParts = [{ text: lastMessage.content }];
    
    // Add images to last message if present
    if (lastMessage.images && lastMessage.images.length > 0) {
      lastMessage.images.forEach(image => {
        const base64Data = image.data.split(',')[1] || image.data;
        const mimeType = image.type || 'image/jpeg';
        
        lastMessageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      });
    }

    // If we have chat history, use chat session
    if (chatHistory.length > 0) {
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      const result = await chat.sendMessage(lastMessageParts);
      const response = await result.response;
      return response.text();
    } else {
      // First message, no history
      const result = await model.generateContent(lastMessageParts);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw new Error(`Gemini AI Error: ${error.message}`);
  }
};

/**
 * Generate a streaming response from Gemini AI
 * @param {Array} messages - Array of message objects
 * @param {Function} onChunk - Callback for each chunk of text
 * @returns {Promise<void>}
 */
const generateStreamingResponse = async (messages, onChunk) => {
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please check your API key.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    // Process stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  } catch (error) {
    console.error('Error generating streaming Gemini response:', error);
    throw new Error(`Gemini AI Error: ${error.message}`);
  }
};

module.exports = {
  initializeGemini,
  generateResponse,
  generateStreamingResponse
};
