import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

import { rabbitMQConfig } from '../../configs/rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit {
    private connection: amqp.ChannelModel;
    private channel: amqp.Channel;

    async onModuleInit() {
        try {
            this.connection = await amqp.connect(rabbitMQConfig.uri);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(
                rabbitMQConfig.exchange.signal,
                'topic',
                { durable: true }
            );

            await this.channel.assertQueue(
                rabbitMQConfig.queue.signal,
                { durable: true }
            );

            await this.channel.bindQueue(
                rabbitMQConfig.queue.signal,
                rabbitMQConfig.exchange.signal,
                rabbitMQConfig.routingKey
            );
        } catch (error) {
            console.error('RabbitMQ connection error', error);
        }
    }

    getChannel() {
        return this.channel;
    }
}