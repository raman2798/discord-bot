const Sheets = require('node-sheets').default;
require('dotenv').config();

const discordBotDetailsSheet = async () => {
  try {
    const gs = new Sheets('1lJ1R4fPgeOBqYXvkly466iYHOJRURNN03msrrkVICeg');
    await gs.authorizeApiKey(process.env.GOOGLE_SHEET_KEY);

    const table = await gs.tables('Discord bot details!A:E');

    return table.rows[0];
  } catch (err) {
    console.error(err);
  }
};

const userDetailsSheet = async () => {
  try {
    let discordBotDetails = await discordBotDetailsSheet();

    const gs = new Sheets(discordBotDetails['Sheet Id'].value);
    await gs.authorizeApiKey(process.env.GOOGLE_SHEET_KEY);

    const table = await gs.tables('User Details!A:C');

    return table.rows;
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  discordBotDetailsSheet,
  userDetailsSheet,
};
