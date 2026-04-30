import User from '@/models/user';
import type { AuthService } from './authService';

export class MockAuthService implements AuthService {
  private readonly authUser: User = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Mock User',
    email: 'user@example.com',
    profilePictureUrl: 'https://example.com/profiles/mock-user.jpg',
    token: 'mock-token',
  };

  async signIn(email: string, password: string) {
    return {
      ...this.authUser,
      email,
    };
  }

  async register(name: string, email: string, password: string) {
    return {
      ...this.authUser,
      id: '00000000-0000-0000-0000-000000000000',
      name,
      email,
    };
  }
}
