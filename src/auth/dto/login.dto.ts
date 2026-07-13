import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Invalid email address' })
    @MinLength(5, { message: 'Email must be at least 5 characters long' })
    @MaxLength(50, { message: 'Email must be at most 50 characters long' })
    email!: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(20, { message: 'Password must be at most 20 characters long' })
    password!: string;
}
