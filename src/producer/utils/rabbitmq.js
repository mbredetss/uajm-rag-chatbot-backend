/* istanbul ignore file */
import amqplib from 'amqplib';

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  connection = await amqplib.connect(process.env.RABBITMQ_SERVER);
  channel = await connection.createChannel();
  return channel;
};

const publishToQueue = async (queue, message) => {
  if (!channel) {
    await connectRabbitMQ();
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

const consumeFromQueue = async (queue, callback) => {
  if (!channel) {
    await connectRabbitMQ();
  }
  await channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (msg) {
      const content = JSON.parse(msg.content.toString());
      await callback(content);
      channel.ack(msg);
    }
  });
};

const closeRabbitMQ = async () => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
};

export { connectRabbitMQ, publishToQueue, consumeFromQueue, closeRabbitMQ };
