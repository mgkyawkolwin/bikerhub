import User from "@/models/user";

export const AuthServiceToken = Symbol('AuthService');

export interface AuthService {
  signIn(email: string, password: string): Promise<User>;
  register(name: string, email: string, password: string): Promise<User>;
}
