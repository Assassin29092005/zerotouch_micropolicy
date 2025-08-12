const nodemailer = require('nodemailer');
const config = require('../config/config');

// Email templates
const templates = {
  welcome: (username) => ({
    subject: 'Welcome to ZeroTouch MicroPolicy!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #218396;">Welcome, ${username}!</h1>
        <p>Thank you for joining ZeroTouch MicroPolicy. You can now:</p>
        <ul>
          <li>Purchase instant micro-policies</li>
          <li>Get zero-touch payouts</li>
          <li>Experience fraud-resistant claims</li>
        </ul>
        <p>Start by browsing our available policies in the app.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">ZeroTouch MicroPolicy - Buy in seconds. Get paid without pressing a button.</p>
      </div>
    `
  }),
  
  policyPurchased: (username, policyName, price, blockchainHash) => ({
    subject: `Policy Purchased: ${policyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #218396;">Policy Purchased Successfully!</h1>
        <p>Hi ${username},</p>
        <p>Your <strong>${policyName}</strong> policy has been activated.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Policy:</strong> ${policyName}</p>
          <p><strong>Price:</strong> ₹${price}</p>
          <p><strong>Blockchain Hash:</strong> <code>${blockchainHash}</code></p>
          <p><strong>Status:</strong> Active</p>
        </div>
        <p>Your policy is now monitoring for events and will automatically pay out if conditions are met.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">ZeroTouch MicroPolicy</p>
      </div>
    `
  }),
  
  payoutReceived: (username, policyName, amount, eventDescription) => ({
    subject: `🎉 Payout Received: ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22c55e;">🎉 Payout Received!</h1>
        <p>Hi ${username},</p>
        <p>Great news! You've received an automatic payout.</p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #218396;">
          <h2 style="color: #218396; margin: 0 0 10px 0;">₹${amount}</h2>
          <p><strong>Policy:</strong> ${policyName}</p>
          <p><strong>Event:</strong> ${eventDescription}</p>
          <p><strong>Status:</strong> Paid automatically</p>
        </div>
        <p>The payout has been processed instantly with zero-touch technology. No forms, no waiting!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">ZeroTouch MicroPolicy</p>
      </div>
    `
  })
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!config.EMAIL.HOST) {
      console.warn('⚠️ Email service not configured');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: config.EMAIL.HOST,
        port: config.EMAIL.PORT,
        secure: config.EMAIL.PORT === 465,
        auth: {
          user: config.EMAIL.USER,
          pass: config.EMAIL.PASS
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
    }
  }

  async sendEmail(to, template, data) {
    if (!this.transporter) {
      console.warn('Email service not available, skipping email to:', to);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const emailContent = templates[template](data);
      
      const mailOptions = {
        from: `"ZeroTouch MicroPolicy" <${config.EMAIL.USER}>`,
        to: to,
        subject: emailContent.subject,
        html: emailContent.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Convenience methods
  async sendWelcomeEmail(email, username) {
    return this.sendEmail(email, 'welcome', username);
  }

  async sendPolicyPurchaseEmail(email, username, policyName, price, blockchainHash) {
    return this.sendEmail(email, 'policyPurchased', { username, policyName, price, blockchainHash });
  }

  async sendPayoutEmail(email, username, policyName, amount, eventDescription) {
    return this.sendEmail(email, 'payoutReceived', { username, policyName, amount, eventDescription });
  }

  // Batch email sending
  async sendBulkEmails(recipients, template, data) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail(recipient.email, template, { ...data, username: recipient.username });
      results.push({ email: recipient.email, ...result });
      
      // Add delay to prevent overwhelming email service
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

module.exports = new EmailService();
