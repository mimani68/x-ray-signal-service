import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (configService: ConfigService) => ({
  uri: configService.get<string>('AMQP_URL', 'amqp://localhost:5672'),
  exchange: {
    signal: configService.get<string>('AMQP_EXCHANGE', 'development.signal.alert.trigger'),
  },
  queue: {
    signal: configService.get<string>('AMQP_QUEUE', 'development.signal.alert.trigger'),
  },
  routingKey: {
    signal: configService.get<string>('AMQP_ROUTING_KEY', 'signal-data'),
  }
});