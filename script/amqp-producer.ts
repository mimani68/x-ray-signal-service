
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config();

interface Signal {
  [key: string]: {
    data: any;
    time: number;
  };
}

class RabbitMQProducer {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  constructor(
    private readonly amqpUrl: string,
    private readonly exchange: string,
    private readonly queue: string,
    private readonly routingKey: string
  ) {}

  async init(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.amqpUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);
    } catch (error) {
      console.error('Error initializing RabbitMQ producer:', error);
      throw error;
    }
  }

  async publish(signal: Signal): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    try {
      const message = Buffer.from(JSON.stringify(signal));
      this.channel.publish(this.exchange, this.routingKey, message, {
        persistent: true,
      });
      console.log(`Published message to exchange ${this.exchange} with routing key ${this.routingKey}`);
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

async function main() {
  const amqpUrl = process.env.AMQP_URL;
  const exchange = process.env.AMQP_EXCHANGE;
  const routingKey = process.env.AMQP_ROUTING_KEY;
  const queue = process.env.AMQP_QUEUE;
  

  if (!amqpUrl || !exchange || !routingKey) {
    console.error('Missing environment variables');
    return;
  }

  const producer = new RabbitMQProducer(amqpUrl, exchange, queue, routingKey);
  await producer.init();

  const signal: Signal = {
    '66bb584d4ae73e488c30a072': {
      data: [
        [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
        [1766, [51.33977733333333, 12.339211833333334, 1.531604]],
        [2763, [51.339782, 12.339196166666667, 2.13906]],
      ],
      time: 1735683480000,
    },
  };

  await producer.publish(signal);
  await producer.close();
}

main().catch((error) => console.error('Error in main:', error));