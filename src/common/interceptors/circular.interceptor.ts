import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { parse, stringify } from 'flatted';

@Injectable()
export class CircularInterceptor implements NestInterceptor {
    /**
     * Serializes responses to protect against circular references.
     *
     * @param _context - Nest execution context
     * @param next - Next handler in the chain
     * @returns The safely serialized response
     */
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                const safeJson = stringify(data);
                return parse(safeJson);
            }),
        );
    }
}
