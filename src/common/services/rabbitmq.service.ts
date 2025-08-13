import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

import { getRabbitMQConfig } from '../../configs/rabbitmq.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQService implements OnModuleInit {
    private connection: amqp.ChannelModel;
    private channel: amqp.Channel;
    private config: any

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.config = getRabbitMQConfig(this.configService)
    }

    async onModuleInit() {
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
                this.config.routingKey
            );
        } catch (error) {
            console.error('RabbitMQ connection error', error);
        }
    }

    getChannel() {
        return this.channel;
    }
}