import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RabbitMQService } from './rabbitmq.service';
import { rabbitMQConfig } from '../../configs/rabbitmq.config';
import { Sample } from '../../schemas/sample.schema';

@Injectable()
export class SignalConsumer implements OnModuleInit {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @InjectModel(Sample.name) private sampleModel: Model<Sample>
  ) {}

  async onModuleInit() {
    const channel = this.rabbitMQService.getChannel();
    
    await channel.consume(
      rabbitMQConfig.queue, 
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            
            // Save to MongoDB
            const newSample = new this.sampleModel({
              content: content.message,
              timestamp: new Date()
            });
            
            await newSample.save();
            
            channel.ack(msg);
          } catch (error) {
            console.error('Processing error', error);
            channel.nack(msg);
          }
        }
      }
    );
  }
}