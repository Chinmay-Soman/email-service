import { EmailService } from "../src/services/EmailService";
import { EmailStatus } from "../src/models/EmailStatus";

describe('EmailService', () => {
    let emailService: EmailService;
    let mockSendProviderA: jest.SpyInstance;
    let mockSendProviderB: jest.SpyInstance;

    beforeEach(() => {
        emailService = new EmailService();

        mockSendProviderA = jest.spyOn(emailService['providerA'], 'send');
        mockSendProviderB = jest.spyOn(emailService['providerB'], 'send');
    });

    it('should send an email successfully via Provider A', async () => {
        mockSendProviderA.mockResolvedValue(true);
        await emailService.sendEmail('test@example.com');
        const status = emailService.getEmailStatus('test@example.com');
        expect(status).toBe(EmailStatus.Sent);
        expect(mockSendProviderA).toHaveBeenCalledWith('test@example.com');
    });

    it('should fallback to Provider B if Provider A fails', async () => {
        mockSendProviderA.mockRejectedValue(new Error("Provider A failed"));
        mockSendProviderB.mockResolvedValue(true);
        await emailService.sendEmail('test@example.com');
        const status = emailService.getEmailStatus('test@example.com');
        expect(status).toBe(EmailStatus.Sent);
        expect(mockSendProviderA).toHaveBeenCalledWith('test@example.com');
        expect(mockSendProviderB).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle rate limiting', async () => {
        jest.spyOn(emailService['rateLimiter'], 'isRateLimited').mockReturnValue(true);
        await emailService.sendEmail('test@example.com');
        const status = emailService.getEmailStatus('test@example.com');
        expect(status).toBe(EmailStatus.RateLimited);
    });

    it('should handle circuit breaker open state', async () => {
        jest.spyOn(emailService['circuitBreaker'], 'canAttempt').mockReturnValue(false);
        await emailService.sendEmail('test@example.com');
        const status = emailService.getEmailStatus('test@example.com');
        expect(status).toBe(EmailStatus.Failed);
    });

    it('should retry sending email on failure', async () => {
        mockSendProviderA.mockRejectedValueOnce(new Error("Provider A failed"))
                          .mockResolvedValue(true);
        await emailService.sendEmail('test@example.com');
        expect(mockSendProviderA).toHaveBeenCalledTimes(2); // First failure, then success
        expect(mockSendProviderB).not.toHaveBeenCalled(); // No fallback needed
    });
});
