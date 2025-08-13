import { MessageHandler } from "../interfaces/message_handler.interface";

export abstract class MessageBroker {
  abstract consume(queueName: string, handler: MessageHandler): Promise<void>;
}