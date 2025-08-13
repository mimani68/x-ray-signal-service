import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageBrokerConsumerException, MissingContentException } from 'src/common/errors';

import { RabbitMQService } from 'src/common/services/rabbitmq.service';
import { getRabbitMQConfig } from 'src/configs/rabbitmq.config';
import { Signal } from 'src/signals/schemas/signal.schema';

@Injectable()
export class SignalConsumer implements OnModuleInit {

  private config: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMQService: RabbitMQService,
    @InjectModel(Signal.name) private signalModel: Model<Signal>
  ) {
    this.config = getRabbitMQConfig(this.configService)
  }

  async onModuleInit() {
    setTimeout(async () => {
      const channel = this.rabbitMQService.getChannel();

      await channel.consume(
        this.config.queue.signal,
        async (msg) => {
          console.log(msg)
          if (!msg) {
            console.error('Received empty message from queue');
            return;
          }

          try {
            let content = JSON.parse(msg.content.toString());

            if (!content && Object.keys(content).length <= 0) {
              throw new MissingContentException();
            }

            const deviceId = Object.keys(content)[0]
            const signal = new this.signalModel({
              deviceId: deviceId,
              data: content[deviceId].data,
              time: content[deviceId].time
            });
            await signal.save();
            channel.ack(msg);
            console.log(`Successfully processed signal, DeviceID=${ deviceId }`);
          } catch (error) {
            console.error(`Error processing message`, {
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
            channel.nack(msg, false, false);
            throw new MessageBrokerConsumerException()
          }
        }
      );
    }, 5000)

  }
}