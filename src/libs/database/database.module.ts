import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const database = configService.get('database');

                return {
                    type: database.type,
                    host: database.host,
                    port: database.port,
                    database: database.name,
                    username: database.user,
                    password: database.password,
                    autoLoadEntities: true,
                    synchronize: database.synchronize,
                    logging: database.logging,
                    ssl: database.ssl ? { rejectUnauthorized: false } : false,
                };
            },
        }),
    ],
})
export class DatabaseModule {
    /**
     * Registers TypeORM repositories for the provided entities.
     *
     * @param models - Entities to register
     * @returns A dynamic TypeORM feature module
     */
    static forFeature(models: EntityClassOrSchema[]) {
        return TypeOrmModule.forFeature(models);
    }
}
