import User from '@/models/user';
import type { AuthService } from './authService';

export class MockAuthService implements AuthService {
  private readonly authUser: User = {
    id: 'user-1',
    name: 'Khin Zaw',
    email: 'demo@bikerhub.app',
    profilePictureUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    token: 'demo-token',
  };

  async signIn(username: string, password: string) {
    return {
      ...this.authUser,
      name: username,
    };
  }

  async register(name: string, password: string, email?: string, phone?: string) {
    return {
      ...this.authUser,
      id: '00000000-0000-0000-0000-000000000000',
      name,
      email: email || this.authUser.email,
    };
  }

  async signInWithGoogle(idToken: string) {
    return {
      ...this.authUser,
      email: `googleuser+${idToken.slice(0, 8)}@example.com`,
      token: 'google-demo-token',
    };
  }
}
