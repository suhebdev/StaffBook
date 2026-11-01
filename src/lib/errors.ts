import { strings } from '@/strings/en';

export type AppErrorCode =
  | 'auth/invalid-credentials'
  | 'auth/email-in-use'
  | 'auth/weak-password'
  | 'auth/network'
  | 'auth/popup-closed'
  | 'auth/account-exists'
  | 'data/permission'
  | 'data/network'
  | 'unknown';

export interface ErrorDebugInfo {
  firestoreCode?: string;
  path?: string;
  operation?: string;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly firestoreCode?: string;
  readonly path?: string;
  readonly operation?: string;

  constructor(
    code: AppErrorCode,
    message?: string,
    debug?: ErrorDebugInfo
  ) {
    super(message || getErrorMessage(code));
    this.name = 'AppError';
    this.code = code;
    this.firestoreCode = debug?.firestoreCode;
    this.path = debug?.path;
    this.operation = debug?.operation;
  }
}

export function getErrorMessage(code: AppErrorCode | string): string {
  switch (code) {
    case 'auth/invalid-credentials':
      return strings.errors.invalidCredentials;
    case 'auth/email-in-use':
      return strings.errors.emailInUse;
    case 'auth/weak-password':
      return strings.errors.weakPassword;
    case 'auth/network':
      return strings.errors.network;
    case 'auth/popup-closed':
      return strings.errors.popupClosed;
    case 'auth/account-exists':
      return strings.errors.accountExists;
    case 'data/permission':
      return strings.errors.dataPermission;
    case 'data/network':
      return strings.errors.dataNetwork;
    default:
      return strings.errors.unknown;
  }
}
