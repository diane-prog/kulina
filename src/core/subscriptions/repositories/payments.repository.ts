import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository extends AbstractRepository<Payment> {
    protected readonly logger = new Logger(PaymentsRepository.name);

    constructor(
        @InjectRepository(Payment)
        paymentsRepository: Repository<Payment>,
        entityManager: EntityManager,
    ) {
        super(paymentsRepository, entityManager);
    }
}
