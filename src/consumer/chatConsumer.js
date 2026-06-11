import axios from 'axios';

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
    userId: phoneNumber, 
  }, {
    headers: {
      'secret-code': process.env.SECRET_CODE,
    },
  });

  const { answer } = result.data.data;

  await sendWhatsAppMessage(phoneNumber, answer);

  console.log(`Chat diproses untuk ${phoneNumber}: ${message}`);
};

export default processChat;
