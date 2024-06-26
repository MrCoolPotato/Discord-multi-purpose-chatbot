const OpenAI = require("openai");
const { chunkMessage } = require("../utils");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_HISTORY = 200;
const THINKING_DELAY = 3000;

async function handleMessageCreate(message, client, conversations) {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user.id)) return;

  const userId = message.author.id;
  let conversation = conversations.get(userId) || [];

  if (conversation.length === 0) {
    conversation.push({
      role: "system",
      content:
        "You are a helpful assistant powered by a LLM. You communicate through a BOT on Discord which is maintained by a developer named 'A' under the company NIS.",
    });
  }

  conversation.push({
    role: "user",
    content: message.content,
  });

  while (conversation.length > MAX_HISTORY) conversation.shift();

  let thinkingMessageSent = false;
  const thinkingTimeout = setTimeout(async () => {
    const tempMessage = await message.reply("Thinking...");
    thinkingMessageSent = tempMessage;
  }, THINKING_DELAY);

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversation,
    });

    const responseContent = chatCompletion.choices[0].message.content;
    conversation.push({
      role: "assistant",
      content: responseContent,
    });

    while (conversation.length > MAX_HISTORY) conversation.shift();

    const responseChunks = chunkMessage(responseContent);

    clearTimeout(thinkingTimeout);

    if (thinkingMessageSent) {
      await thinkingMessageSent.edit(responseChunks[0]);
      for (const chunk of responseChunks.slice(1)) {
        await message.reply(chunk);
      }
    } else {
      for (const chunk of responseChunks) {
        await message.reply(chunk);
      }
    }

    conversations.set(userId, conversation);
  } catch (error) {
    console.error(`Error while fetching response from OpenAI: ${error}`);
    clearTimeout(thinkingTimeout);
    if (thinkingMessageSent) {
      await thinkingMessageSent.edit(
        "Sorry, I encountered an error trying to process your request."
      );
    } else {
      await message.reply(
        "Sorry, I encountered an error trying to process your request."
      );
    }
  }
}

module.exports = { handleMessageCreate };
