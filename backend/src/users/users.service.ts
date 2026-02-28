import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      console.log('No users found. Seeding admin user...');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@sementetoken.com';
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const admin = this.usersRepository.create({
        name: 'Admin',
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      });
      
      await this.usersRepository.save(admin);
      console.log(`Admin user created: ${adminEmail} / admin123`);
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  create(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
