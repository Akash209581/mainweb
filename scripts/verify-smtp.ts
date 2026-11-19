import { verifySmtpConnection } from "../lib/email/smtp";
verifySmtpConnection()
  .then(() =>
    console.log("SMTP TLS connection and authentication verified. No email sent.")
  )
  .catch(() => {
    console.error(
      "SMTP verification failed. Check host, port, username, mailbox password and provider settings. No email sent."
    );
    process.exitCode = 1;
  });
