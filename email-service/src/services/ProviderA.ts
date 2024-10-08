import { EmailProvider } from "../models/EmailProvider";

export class ProviderA implements EmailProvider {
    name = "ProviderA";

    async send(email: string): Promise<boolean> {
        const success = Math.random() > 0.5; // Simulate success or failure
        if (!success) {
            throw new Error("Send failed");
        }
        return success; // Return success status
    }
}

