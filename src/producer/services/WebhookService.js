import { publishToQueue } from '../utils/rabbitmq.js';

const CHAT_QUEUE = 'chat_queue';

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

const handleIncomingMessage = async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from;
    const text = message.text?.body;

    if (text && text.length >= 2) {
      await publishToQueue(CHAT_QUEUE, {
        message: text,
        phoneNumber: from,
      });
    }
  }

  return res.sendStatus(200);
};

export { verifyWebhook, handleIncomingMessage };
