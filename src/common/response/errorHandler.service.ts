import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ErrorHandlingService {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger) {}

    /**
     * Logs and throws a NotFoundException.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorOnNotFound(loggerMessage: string, errorMessage: string): never {
        this.logger.error(loggerMessage);
        throw new NotFoundException(errorMessage);
    }

    /**
     * Logs and throws a BadRequestException.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorOnBadRequest(
        loggerMessage: string,
        errorMessage: string,
    ): never {
        this.logger.error(loggerMessage);
        throw new BadRequestException(errorMessage);
    }

    /**
     * Logs and throws a TooManyRequests error.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorTooManyRequests(
        loggerMessage: string,
        errorMessage: string,
    ): never {
        this.logger.error(loggerMessage);
        throw new HttpException(errorMessage, HttpStatus.TOO_MANY_REQUESTS);
    }

    /**
     * Logs and throws an InternalServerErrorException.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorOnInternalServerError(
        loggerMessage: string,
        errorMessage: string,
    ): never {
        this.logger.error(loggerMessage);
        throw new InternalServerErrorException(errorMessage);
    }

    /**
     * Logs and throws a ForbiddenException.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorOnForbidden(loggerMessage: string, errorMessage: string): never {
        this.logger.error(loggerMessage);
        throw new ForbiddenException(errorMessage);
    }

    /**
     * Logs and throws a ConflictException.
     *
     * @param loggerMessage - Message written to the logger
     * @param errorMessage - Message returned to the client
     */
    returnErrorOnConflict(loggerMessage: string, errorMessage: string): never {
        this.logger.error(loggerMessage);
        throw new ConflictException(errorMessage);
    }
}
