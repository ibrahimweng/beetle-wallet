/* The services this build runs on. Swap the mocks for the real ones here and
   nothing else changes. */
import { MockAuthService, type AuthService } from './auth';
import { MockIdentityService, type IdentityService } from './identity';
import { MlKitReader, type ReaderService } from './reader';
import { ScriptedAgent, type AgentService } from './agent';

export const auth: AuthService = new MockAuthService();
export const identity: IdentityService = new MockIdentityService();
/* the reader is the device's own where the build has it, a stand-in elsewhere */
export const reader: ReaderService = new MlKitReader();
export const agent: AgentService = new ScriptedAgent(reader);
export const MOCK = true;

export * from './auth';
export * from './identity';
export * from './storage';
export * from './crypto';
export * from './reader';
export * from './agent';
