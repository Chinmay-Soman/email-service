export class CircuitBreaker {
    private failureThreshold: number;
    private resetTimeout: number;
    private failures: number = 0;
    private lastFailureTime: number | null = null;

    constructor(failureThreshold: number, resetTimeout: number) {
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
    }

    public canAttempt(): boolean {
        if (this.failures >= this.failureThreshold) {
            if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
                this.failures = 0;
                return true;
            }
            return false;
        }
        return true;
    }

    public recordFailure(): void {
        this.failures += 1;
        this.lastFailureTime = Date.now();
    }

    public recordSuccess(): void {
        this.failures = 0;
    }
}
