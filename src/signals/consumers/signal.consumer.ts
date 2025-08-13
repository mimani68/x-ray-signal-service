import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MessageBrokerConsumerException, MissingContentException } from 'src/common/errors';
import { RabbitMQService } from 'src/common/services/rabbitmq.service';
import { getRabbitMQConfig } from 'src/configs/rabbitmq.config';
import { Signal } from 'src/signals/schemas/signal.schema';
import { RabbitMQBroker } from '../class/rabbitmq.class';
import { SignalMessageHandler } from '../class/signal_message.class';

@Injectable()
export class SignalConsumer implements OnModuleInit {
  private config: any;
  private INITIAL_DELAY: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQService: RabbitMQService,
    @InjectModel(Signal.name) private signalModel: Model<Signal>
  ) {
    this.config = getRabbitMQConfig(this.configService);
    this.INITIAL_DELAY = 5000;
  }

  async onModuleInit() {
    setTimeout(async () => {
      try {
        const channel = this.rabbitMQService.getChannel();
        const rabbitMQBroker = new RabbitMQBroker(channel);
        const signalHandler = new SignalMessageHandler(this.signalModel);
        await rabbitMQBroker.consume(this.config.queue.signal, signalHandler);
      } catch (error) {
        if (error instanceof MissingContentException) {
          console.error("Error: Missing content in the message", {
            errorMessage: error.message,
            timestamp: new Date().toISOString()
          });
        } else if (error instanceof MessageBrokerConsumerException) {
          console.error("Error: Failed to process message from RabbitMQ", {
            errorMessage: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error("Unexpected error occurred during message consumption", {
            errorMessage: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, this.INITIAL_DELAY);
  }
}
