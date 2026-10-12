import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskDto {
  @ApiProperty({ example: 'Who owns agent memory, and what is blocked on it?' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;
}
