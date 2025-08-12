export const rabbitMQConfig = {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    exchange: {
        signal: 'development/signal/read',
    },
    queue: {
        signal: 'development/signal/read',
    },
    routingKey: 'sample_routing_key'
};