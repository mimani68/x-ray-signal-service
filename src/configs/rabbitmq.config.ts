export const rabbitMQConfig = {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    exchange: 'sample_exchange',
    queue: 'sample_queue',
    routingKey: 'sample_routing_key'
};