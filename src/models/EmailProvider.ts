// src/models/EmailProvider.ts

export interface EmailProvider {
    name: string;
    send(email: string): Promise<boolean>;
}
