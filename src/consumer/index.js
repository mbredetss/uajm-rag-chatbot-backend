import 'dotenv/config';
import { consumeFromQueue } from '../producer/utils/rabbitmq.js';
import processIndexing from './indexingConsumer.js';
import processChat from './chatConsumer.js';

const INDEXING_QUEUE = 'indexing_queue';
const CHAT_QUEUE = 'chat_queue';

const startConsumer = async () => {
  try {
    await consumeFromQueue(INDEXING_QUEUE, processIndexing);
    console.log(`Consumer mendengarkan queue: ${INDEXING_QUEUE}`);

    await consumeFromQueue(CHAT_QUEUE, processChat);
    console.log(`Consumer mendengarkan queue: ${CHAT_QUEUE}`);
  } catch (error) {
    console.error('Gagal memulai consumer:', error);
    process.exit(1);
  }
};

startConsumer();
