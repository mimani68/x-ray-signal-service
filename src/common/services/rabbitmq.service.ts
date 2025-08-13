import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

import { getRabbitMQConfig } from '../../configs/rabbitmq.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQService implements OnModuleInit {
    
    private readonly logger = new Logger(RabbitMQService.name);
    private connection: amqp.ChannelModel;
    private channel: amqp.Channel;
    private config: any;
    private readonly MAX_RETRIES = 5;

    constructor(private readonly configService: ConfigService) {
        this.config = getRabbitMQConfig(this.configService);
    }

    async onModuleInit() {
        let retries = 0;
        while (retries < this.MAX_RETRIES) {
            try {
                this.connection = await amqp.connect(this.config.uri);
                this.channel = await this.connection.createChannel();

                await this.channel.assertExchange(
                    this.config.exchange.signal,
                    'topic',
                    { durable: true }
                );

                await this.channel.assertQueue(
                    this.config.queue.signal,
                    { durable: true }
                );

                await this.channel.bindQueue(
                    this.config.queue.signal,
                    this.config.exchange.signal,
                    this.config.routingKey.signal
                );
                this.logger.log('RabbitMQ connected successfully');
                return;
            } catch (error) {
                this.logger.error(`RabbitMQ connection attempt ${retries + 1} failed`, error);
                retries++;
                await new Promise((res) => setTimeout(res, 2000));
            }
        }
        this.logger.error('Failed to connect to RabbitMQ after maximum retries. Exiting application.');
        process.exit(1);
    }

    getChannel() {
        return this.channel;
    }
}
