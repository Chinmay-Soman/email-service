export class RateLimiter {
    private maxRequests: number;
    private windowMs: number;
    private requests: Map<string, number> = new Map();

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    public isRateLimited(email: string): boolean {
        const now = Date.now();
        const requestCount = this.requests.get(email) || 0;

        if (requestCount >= this.maxRequests) {
            return true;
        }

        if (now - (this.requests.get(email) || 0) > this.windowMs) {
            this.requests.set(email, now);
            return false;
        }

        this.requests.set(email, requestCount + 1);
        return false;
    }
}
