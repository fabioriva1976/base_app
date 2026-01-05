/// <reference types="astro/client" />

type UserRole = 'superuser' | 'admin' | 'operatore';

declare namespace App {
  interface Locals {
    user?: {
      uid: string;
      email?: string;
      emailVerified?: boolean;
      ruolo?: UserRole;
    };
  }
}
