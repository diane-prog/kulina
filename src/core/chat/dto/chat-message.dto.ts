import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatMessageDto {
    @IsNotEmpty()
    @IsString()
    sessionId: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(300)
    text: string;
}
