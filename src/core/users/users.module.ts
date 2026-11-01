import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '../../common/guards/jwt.strategy.service';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { PasswordHashModule } from '../../helpers/password_hash/passwordHash.module';
import { DatabaseModule } from '../../libs/database/database.module';
import { MailerModule } from '../../libs/mailer/mailer.module';
import { Media } from '../media/entities/media.entity';
import { MediaModule } from '../media/media.module';
import { Roles } from '../roles/entities/roles.entity';
import { RolesModule } from '../roles/roles.module';
import { Users } from './entities/users.entity';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Users, Media, Roles]),
        ConfigModule,
        RolesModule,
        MediaModule,
        PasswordHashModule,
        MailerModule,
    ],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, AuthService, JwtStrategy],
    exports: [UsersService, UsersRepository, AuthService],
})
export class UsersModule {}
