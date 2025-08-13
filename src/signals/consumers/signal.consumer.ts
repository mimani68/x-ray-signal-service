import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
    const channel = this.rabbitMQService.getChannel();
    
    await channel.consume(
      this.config.queue.signal, 
      async (msg) => {
        if (!msg) {
          console.error('Received empty message from queue');
          return;
        }

        try {
          let content = JSON.parse(msg.content.toString());
          
          if (!content.message && Object.keys(content.message).length <= 0) {
            throw new Error('Message content is missing required "message" field');
          }

          const deviceId = Object.keys(content.message)[0]
          const signal = new this.signalModel({
            deviceId: deviceId,
            data: content.message[deviceId].data,
            time: content.message[deviceId].time
          });
          await signal.save();
          channel.ack(msg);
          console.log(`Successfully processed signal: ${content.message.substring(0, 50)}...`);
        } catch (error) {
          console.error(`Error processing message [${msg.content.toString().substring(0, 100)}...]`, {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
          
          // Reject message without requeue to avoid infinite loops
          channel.nack(msg, false, false);
        }
      }
    );
  }
}