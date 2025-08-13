export const rabbitMQConfig = {
    uri: process.env.AMQP_URL || 'amqp://localhost:5672',
    exchange: {
        signal: process.env.AMQP_EXCHANGE || 'development/signal/read',
    },
    queue: {
        signal: process.env.AMQP_SIGNAL_TOPIC || 'development/signal/read',
    },
    routingKey: process.env.AMQP_ROUTING_KEY ||  'sample_routing_key'
};