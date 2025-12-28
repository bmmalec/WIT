/**
 * Email Service
 * Handles sending emails for notifications, password resets, etc.
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.fromAddress = process.env.EMAIL_FROM || 'WIT Inventory <noreply@wit.app>';
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    if (this.initialized) return;

    // Check if email is configured
    if (!process.env.EMAIL_HOST && !process.env.SENDGRID_API_KEY) {
      console.log('Email service not configured - emails will be logged only');
      this.initialized = true;
      return;
    }

    try {
      // Use SendGrid if API key is provided
      if (process.env.SENDGRID_API_KEY) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY,
          },
        });
      } else {
        // Use custom SMTP settings
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      }

      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      this.transporter = null;
      this.initialized = true;
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    await this.initialize();

    const { to, subject, html, text } = options;

    // If no transporter, log email instead
    if (!this.transporter) {
      console.log('Email (not sent - no transporter configured):');
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body: ${text || html?.substring(0, 200)}...`);
      return { messageId: 'logged-only', logged: true };
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      console.log(`Email sent to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<script[^>]*>.*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send expiration alert email
   * @param {Object} user - User object
   * @param {Array} items - Expiring items
   */
  async sendExpirationAlert(user, items) {
    const urgentItems = items.filter(i => {
      const daysUntil = Math.ceil((new Date(i.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 1;
    });

    const subject = urgentItems.length > 0
      ? `Urgent: ${urgentItems.length} item${urgentItems.length > 1 ? 's' : ''} expiring today!`
      : `${items.length} item${items.length > 1 ? 's' : ''} expiring soon`;

    const html = this.generateExpirationEmail(user, items, urgentItems);

    return this.send({
      to: user.email,
      subject: `[WIT] ${subject}`,
      html,
    });
  }

  /**
   * Send low stock alert email
   * @param {Object} user - User object
   * @param {Array} items - Low stock items
   */
  async sendLowStockAlert(user, items) {
    const subject = `${items.length} item${items.length > 1 ? 's' : ''} running low`;

    const html = this.generateLowStockEmail(user, items);

    return this.send({
      to: user.email,
      subject: `[WIT] ${subject}`,
      html,
    });
  }

  /**
   * Send daily/weekly digest email
   * @param {Object} user - User object
   * @param {Object} data - Digest data
   */
  async sendDigest(user, data) {
    const { expiringItems, lowStockItems, frequency } = data;

    if (expiringItems.length === 0 && lowStockItems.length === 0) {
      return null; // Nothing to report
    }

    const subject = frequency === 'weekly'
      ? 'Your Weekly Inventory Summary'
      : 'Your Daily Inventory Summary';

    const html = this.generateDigestEmail(user, data);

    return this.send({
      to: user.email,
      subject: `[WIT] ${subject}`,
      html,
    });
  }

  /**
   * Generate expiration alert email HTML
   */
  generateExpirationEmail(user, items, urgentItems) {
    const urgentSection = urgentItems.length > 0 ? `
      <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="color: #DC2626; margin: 0 0 12px 0;">Expiring Today</h3>
        ${urgentItems.map(item => `
          <div style="padding: 8px 0; border-bottom: 1px solid #FECACA;">
            <strong>${this.escapeHtml(item.name)}</strong>
            <span style="color: #6B7280; font-size: 14px;"> in ${this.escapeHtml(item.locationId?.name || 'Unknown')}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    const otherItems = items.filter(i => !urgentItems.includes(i));
    const otherSection = otherItems.length > 0 ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="color: #D97706; margin: 0 0 12px 0;">Expiring Soon</h3>
        ${otherItems.slice(0, 10).map(item => {
          const daysUntil = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
          return `
            <div style="padding: 8px 0; border-bottom: 1px solid #FDE68A;">
              <strong>${this.escapeHtml(item.name)}</strong>
              <span style="color: #6B7280; font-size: 14px;"> - expires in ${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>
              <span style="color: #9CA3AF; font-size: 12px;"> (${this.escapeHtml(item.locationId?.name || 'Unknown')})</span>
            </div>
          `;
        }).join('')}
        ${otherItems.length > 10 ? `<p style="color: #6B7280; font-style: italic;">...and ${otherItems.length - 10} more items</p>` : ''}
      </div>
    ` : '';

    return this.wrapEmail(`
      <h2 style="color: #1F2937; margin-bottom: 20px;">Hi ${this.escapeHtml(user.name)},</h2>
      <p style="color: #4B5563; margin-bottom: 20px;">
        You have items in your inventory that need attention:
      </p>
      ${urgentSection}
      ${otherSection}
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard"
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; font-weight: 600;">
        View in Dashboard
      </a>
    `);
  }

  /**
   * Generate low stock alert email HTML
   */
  generateLowStockEmail(user, items) {
    return this.wrapEmail(`
      <h2 style="color: #1F2937; margin-bottom: 20px;">Hi ${this.escapeHtml(user.name)},</h2>
      <p style="color: #4B5563; margin-bottom: 20px;">
        The following items are running low and may need to be restocked:
      </p>
      <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
        ${items.slice(0, 10).map(item => `
          <div style="padding: 8px 0; border-bottom: 1px solid #FDBA74;">
            <strong>${this.escapeHtml(item.name)}</strong>
            <span style="color: #EA580C; font-size: 14px;"> - ${item.quantity?.value || 0} remaining</span>
            <span style="color: #9CA3AF; font-size: 12px;"> (min: ${item.quantity?.minimum || 0})</span>
          </div>
        `).join('')}
        ${items.length > 10 ? `<p style="color: #6B7280; font-style: italic;">...and ${items.length - 10} more items</p>` : ''}
      </div>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard"
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Shopping List
      </a>
    `);
  }

  /**
   * Generate digest email HTML
   */
  generateDigestEmail(user, data) {
    const { expiringItems, lowStockItems, frequency } = data;

    let content = `
      <h2 style="color: #1F2937; margin-bottom: 20px;">Hi ${this.escapeHtml(user.name)},</h2>
      <p style="color: #4B5563; margin-bottom: 20px;">
        Here's your ${frequency} inventory summary:
      </p>
    `;

    if (expiringItems.length > 0) {
      content += `
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="color: #D97706; margin: 0 0 12px 0;">
            ${expiringItems.length} Item${expiringItems.length > 1 ? 's' : ''} Expiring Soon
          </h3>
          ${expiringItems.slice(0, 5).map(item => {
            const daysUntil = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
            const urgency = daysUntil <= 1 ? 'color: #DC2626; font-weight: bold;' : '';
            return `
              <div style="padding: 6px 0;">
                <span style="${urgency}">${this.escapeHtml(item.name)}</span>
                <span style="color: #6B7280; font-size: 14px;"> - ${daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}</span>
              </div>
            `;
          }).join('')}
          ${expiringItems.length > 5 ? `<p style="color: #6B7280; font-style: italic; margin: 8px 0 0 0;">...and ${expiringItems.length - 5} more</p>` : ''}
        </div>
      `;
    }

    if (lowStockItems.length > 0) {
      content += `
        <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="color: #EA580C; margin: 0 0 12px 0;">
            ${lowStockItems.length} Item${lowStockItems.length > 1 ? 's' : ''} Running Low
          </h3>
          ${lowStockItems.slice(0, 5).map(item => `
            <div style="padding: 6px 0;">
              ${this.escapeHtml(item.name)}
              <span style="color: #6B7280; font-size: 14px;"> - ${item.quantity?.value || 0} left</span>
            </div>
          `).join('')}
          ${lowStockItems.length > 5 ? `<p style="color: #6B7280; font-style: italic; margin: 8px 0 0 0;">...and ${lowStockItems.length - 5} more</p>` : ''}
        </div>
      `;
    }

    content += `
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard"
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; font-weight: 600;">
        Open Dashboard
      </a>
    `;

    return this.wrapEmail(content);
  }

  /**
   * Wrap email content in base template
   */
  wrapEmail(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                   background-color: #F3F4F6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">WIT</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 14px;">Where Is It?</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            ${content}
          </div>

          <!-- Footer -->
          <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">
              You're receiving this because you have notifications enabled in your WIT account.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/settings" style="color: #6B7280;">
                Manage notification settings
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = new EmailService();
