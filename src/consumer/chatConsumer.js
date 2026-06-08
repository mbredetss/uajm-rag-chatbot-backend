import axios from 'axios';
import pool from '../producer/utils/database.js';

const saveConversation = async (question, answer, relevantContext) => {
  await pool.query(
    'INSERT INTO conversations (question, answer, relevant_context) VALUES ($1, $2, $3)',
    [question, answer, JSON.stringify(relevantContext)],
  );
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.BUSINESS_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SYSTEM_USER_ACCESS_TOKEN}`,
      },
    },
  );
};

const processChat = async ({ message, phoneNumber }) => {
  const result = await axios.post(`http://localhost:${process.env.PORT}/generate-answers`, {
    message,
  }, {
    headers: {
      'secret-code': process.env.SECRET_CODE,
    },
  });

  const { answer, relevantDocs } = result.data.data;

  await saveConversation(message, answer, relevantDocs);

  await sendWhatsAppMessage(phoneNumber, answer);

  console.log(`Chat diproses untuk ${phoneNumber}: ${message}`);
};

export default processChat;
