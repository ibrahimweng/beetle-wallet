/* The services this build runs on. Swap the mocks for the real ones here and
   nothing else changes. */
import { MockAuthService, type AuthService } from './auth';
import { MockIdentityService, type IdentityService } from './identity';

export const auth: AuthService = new MockAuthService();
export const identity: IdentityService = new MockIdentityService();
export const MOCK = true;

export * from './auth';
export * from './identity';
export * from './storage';
export * from './crypto';
