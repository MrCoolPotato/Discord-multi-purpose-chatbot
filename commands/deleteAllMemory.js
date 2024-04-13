require("dotenv").config({ path: "../.env" });

const developerId = process.env.DEVELOPER_ID;

function deleteAllMemory(message, conversations) {
  try {
    if (message.author.id !== developerId) {
      message.reply("Developer only command.");
      return;
    }

    // Optionally, add confirmation logic here

    conversations.clear();
    message.reply("All conversation histories have been cleared.");
  } catch (error) {
    console.error(`Error deleting all memory: ${error}`);
    message.reply("Failed to clear conversation histories due to an error.");
  }
}

module.exports = deleteAllMemory;
