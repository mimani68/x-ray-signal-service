import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SignalsController } from './controllers/signals.controller';
import { SignalsService } from './services/signals.service';
import { SignalRepository } from './repositories/signal.repository';
import { SignalConsumer } from './consumers/signal.consumer';
import { Signal, SignalSchema } from './schemas/signal.schema';
import { RabbitMQService } from 'src/common/services/rabbitmq.service';

@Module({
    imports: [
        MongooseModule.forFeature([
        { name: Signal.name, schema: SignalSchema }
    ])],
    controllers: [SignalsController],
    providers: [SignalsService, SignalConsumer, SignalRepository, RabbitMQService],
})
export class SignalsModule { }