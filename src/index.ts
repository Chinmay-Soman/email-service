import { EmailService } from "./services/EmailService";
import { Logger } from "./utils/Logger";

async function main() {
    const emailService = new EmailService();
    const email = "test@example.com";

    await emailService.sendEmail(email);
    const status = emailService.getEmailStatus(email);
    Logger.log(`Final status for ${email}: ${status}`);
}

main().catch(err => {
    Logger.log(`Error: ${err}`);
});
