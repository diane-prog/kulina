import {
    BadRequestException,
    Injectable,
    ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
    constructor() {
        super({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            exceptionFactory: (errors: ValidationError[]) => {
                return new BadRequestException(this.formatErrors(errors));
            },
        });
    }

    /**
     * Formats class-validator errors into a stable API payload.
     *
     * @param errors - Validation errors
     * @returns A message and field-level errors
     */
    private formatErrors(errors: ValidationError[]) {
        const result = {};

        for (const error of errors) {
            if (error.constraints) {
                result[error.property] = Object.values(error.constraints)
                    .filter((value) => typeof value === 'string')
                    .join(', ');
            }

            if (error.children && error.children.length > 0) {
                result[error.property] = this.formatErrors(error.children);
            }
        }

        return {
            message: 'Validation failed',
            errors: result,
        };
    }
}
