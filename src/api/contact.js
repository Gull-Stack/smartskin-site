// Smart Skin Dermatology Contact Form API
// Handles form submissions via SendGrid

const sgMail = require('@sendgrid/mail');

// === SPAM PROTECTION ===
function isGibberish(text) {
  if (!text || text.length < 2) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length < 2) return false;
  const vowels = cleaned.match(/[aeiou]/g);
  if (!vowels || vowels.length < cleaned.length * 0.15) return true;
  if (/[^aeiou]{5,}/i.test(cleaned)) return true;
  return false;
}

function looksLikeSpam(data) {
  const { name, fax_number, _timestamp } = data;
  if (fax_number) return 'honeypot';
  if (_timestamp) {
    const elapsed = Date.now() - parseInt(_timestamp, 10);
    if (elapsed < 3000) return 'too_fast';
  }
  if (isGibberish(name)) return 'gibberish_name';
  if (name && name.trim().length < 2) return 'short_name';
  return false;
}
// === END SPAM PROTECTION ===

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  sgMail.setApiKey(apiKey);

  const { name, email, phone, service, message, fax_number, _timestamp } = req.body;

  // === SPAM CHECK ===
  const spamReason = looksLikeSpam({ name, fax_number, _timestamp });
  if (spamReason) {
    console.log(`[SPAM BLOCKED] reason=${spamReason} name="${name}" email="${email}"`);
    return res.status(200).json({ success: true, message: 'Thank you! Your message has been sent successfully.' });
  }
  // === END SPAM CHECK ===

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const businessEmail = 'info@smartskindermatology.com';
  const businessName = 'Smart Skin Dermatology';
  const businessPhone = '(385) 273-3376';

  try {
    const businessNotification = {
      to: businessEmail,
      from: { email: 'noreply@smartskindermatology.com', name: businessName },
      replyTo: email,
      subject: `New Contact Form Submission - ${service || 'General Inquiry'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Service Interest:</strong> ${service || 'Not specified'}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This message was sent from the Smart Skin Dermatology website contact form.</p>
      `
    };

    const autoReply = {
      to: email,
      from: { email: 'noreply@smartskindermatology.com', name: businessName },
      subject: 'Thank You for Contacting Smart Skin Dermatology',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1f424e; padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">Smart Skin Dermatology</h1>
          </div>
          <div style="padding: 30px; background: #fffcfa;">
            <p>Dear ${name},</p>
            <p>Thank you for contacting Smart Skin Dermatology! We have received your message and will get back to you within 1-2 business days.</p>
            <p>If you need immediate assistance, please call our office at <strong>${businessPhone}</strong>.</p>
            <h3 style="color: #1f424e;">Your Message:</h3>
            <div style="background: #e6e1d8; padding: 15px; border-radius: 4px;">
              <p><strong>Service Interest:</strong> ${service || 'Not specified'}</p>
              <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <h3 style="color: #1f424e;">Office Information</h3>
            <p><strong>Address:</strong> 3200 W Clubhouse Dr, Ste 100, Lehi, UT 84043<br><strong>Phone:</strong> ${businessPhone}<br><strong>Hours:</strong> Mon-Thu 8:30am-5pm, Wed 7am-5pm, Fri 8:30am-1pm</p>
            <p style="margin-top: 30px;">We look forward to caring for your skin!</p>
            <p>Warm regards,<br><strong>The Smart Skin Dermatology Team</strong></p>
          </div>
          <div style="background: #1f424e; padding: 20px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Smart Skin Dermatology. All rights reserved.</p>
            <p style="margin: 5px 0 0;">3200 W Clubhouse Dr, Ste 100, Lehi, UT 84043</p>
          </div>
        </div>
      `
    };

    await Promise.all([sgMail.send(businessNotification), sgMail.send(autoReply)]);
    return res.status(200).json({ success: true, message: 'Thank you! Your message has been sent successfully.' });
  } catch (error) {
    console.error('SendGrid Error:', error.response?.body || error.message);
    return res.status(500).json({ error: 'Failed to send message. Please call us directly.' });
  }
};
