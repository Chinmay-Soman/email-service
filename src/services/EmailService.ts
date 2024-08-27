import { ProviderA } from "./ProviderA";
import { ProviderB } from "./ProviderB";
import { RateLimiter } from "./RateLimiter";
import { CircuitBreaker } from "./CircuitBreaker";
import { Logger } from "../utils/Logger";
import { EmailStatus } from "../models/EmailStatus";

export class EmailService {
    private providerA: ProviderA;
    private providerB: ProviderB;
    private rateLimiter: RateLimiter;
    private circuitBreaker: CircuitBreaker;

    private emailStatus: Map<string, EmailStatus> = new Map();

    constructor() {
        this.providerA = new ProviderA();
        this.providerB = new ProviderB();
        this.rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
        this.circuitBreaker = new CircuitBreaker(3, 30000); // 3 failures before open, 30 seconds reset
    }

    private async trySendWithRetry(
        sendFn: () => Promise<boolean>,
        retries: number = 3,
        backoff: number = 1000
    ): Promise<void> {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const success = await sendFn();
                if (success) {
                    return;
                }
                throw new Error("Send failed");
            } catch (err) {
                Logger.log(`Attempt ${attempt + 1} failed: ${err}`);
                if (attempt < retries - 1) {
                    await this.delay(backoff * Math.pow(2, attempt));
                }
            }
        }
        throw new Error("Max retries reached.");
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public async sendEmail(email: string): Promise<void> {
        if (this.emailStatus.get(email) === EmailStatus.Sent) {
            Logger.log(`Email to ${email} already sent.`);
            return;
        }

        if (this.rateLimiter.isRateLimited(email)) {
            Logger.log(`Email to ${email} rate-limited.`);
            this.emailStatus.set(email, EmailStatus.RateLimited);
            return;
        }

        if (!this.circuitBreaker.canAttempt()) {
            Logger.log("Circuit breaker is open, aborting email send.");
            this.emailStatus.set(email, EmailStatus.Failed);
            return;
        }

        this.emailStatus.set(email, EmailStatus.Pending);

        try {
            await this.trySendWithRetry(() => this.providerA.send(email));
            this.circuitBreaker.recordSuccess();
            this.emailStatus.set(email, EmailStatus.Sent);
            Logger.log(`Email to ${email} sent via Provider A.`);
        } catch (error) {
            Logger.log(`Provider A failed, trying Provider B: ${error}`);
            this.circuitBreaker.recordFailure();

            try {
                await this.trySendWithRetry(() => this.providerB.send(email));
                this.circuitBreaker.recordSuccess();
                this.emailStatus.set(email, EmailStatus.Sent);
                Logger.log(`Email to ${email} sent via Provider B.`);
            } catch (error) {
                Logger.log(`Provider B also failed: ${error}`);
                this.circuitBreaker.recordFailure();
                this.emailStatus.set(email, EmailStatus.Failed);
            }
        }
    }

    public getEmailStatus(email: string): EmailStatus | undefined {
        return this.emailStatus.get(email);
    }
}
