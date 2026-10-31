import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHashService {
    private readonly saltRounds = 10;

    /**
     * Hashes a plaintext password.
     *
     * @param password - Plaintext password
     * @returns The hashed password
     */
    hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compares a plaintext password with a hash.
     *
     * @param password - Plaintext password
     * @param hash - Stored hash
     * @returns Whether the password matches
     */
    comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
