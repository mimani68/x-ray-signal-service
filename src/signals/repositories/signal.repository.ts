
import { BaseRepository } from 'src/common/repositories/base.repository';
import { SignalEntity } from 'src/signals/entities/signal';

export class SignalRepository extends BaseRepository<SignalEntity> {
  constructor(
    @InjectRepository(SignalEntity)
    private readonly signalRepository: SignalRepository,
  ) {
    super(signalRepository);
  }

  async findOne(where: FindOneOptions<SignalEntity>): Promise<SignalEntity> {
    return this.signalRepository.findOne(where);
  }

  async findAndCount(options?: FindManyOptions<SignalEntity>): 
    Promise<{ total: number; data: SignalEntity[] }> {
    const [data, total] = await this.signalRepository.findAndCount(options);
    return { total, data };
  }
}
