import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function produceSignal() {
  const amqpUrl = process.env.AMQP_URL;
  const exchange = process.env.AMQP_EXCHANGE;
  const routingKey = process.env.AMQP_ROUTING_KEY;

  if (!amqpUrl || !exchange || !routingKey) {
    console.error('Error: Missing required environment variables. Please check your .env file for AMQP_URL, AMQP_EXCHANGE, and AMQP_ROUTING_KEY.');
    process.exit(1);
  }

  let connection;
  try {
    // Connect to the RabbitMQ server
    connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();

    // Assert a topic exchange to ensure it exists
    await channel.assertExchange(exchange, 'topic', { durable: true });

    // Create a sample signal payload
    const signal: any = {
      "66bb584d4ae73e488c30a072": {
        "data": [
          [
            762,
            [
              51.339764,
              12.339223833333334,
              1.2038000000000002
            ]
          ],
          [
            1766,
            [
              51.33977733333333,
              12.339211833333334,
              1.531604
            ]
          ],
          [
            2763,
            [
              51.339782,
              12.339196166666667,
              2.13906
            ]
          ],
        ],
        "time": 1735683480000
      }
    };

    const message = Buffer.from(JSON.stringify(signal));

    // Publish the message
    channel.publish(exchange, routingKey, message, { persistent: true });

    console.log(`Sent message to exchange '${exchange}' with routing key '${routingKey}':`);
    // console.log(JSON.stringify(signal, null, 2));

    // Close the connection
    await channel.close();
    await connection.close();

  } catch (error) {
    console.error('Failed to publish message:', error);
    if (connection) {
      await connection.close();
    }
    process.exit(1);
  }
}

produceSignal();