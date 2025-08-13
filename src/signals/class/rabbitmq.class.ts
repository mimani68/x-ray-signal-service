import { MessageBrokerConsumerException, MissingContentException } from "src/common/errors";
import { MessageHandler } from "../interfaces/message_handler.interface";
import { MessageBroker } from "./message_broker.abstract";

export class RabbitMQBroker extends MessageBroker {
    private channel: any;

    constructor(channel: any) {
        super();
        this.channel = channel;
    }

    async consume(queueName: string, handler: MessageHandler): Promise<void> {
        return await this.channel.consume(
            queueName,
            async (msg: any) => {
                if (!msg) {
                    console.error('Received empty message from queue');
                    throw new MissingContentException();
                }

                try {
                    await handler.handleMessage(msg);
                    this.channel.ack(msg);
                } catch (error) {
                    console.error(`Error processing message`, {
                        error: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    });
                    this.channel.nack(msg, false, false);
                    throw new MessageBrokerConsumerException()
                }
            }
        );
    }
}