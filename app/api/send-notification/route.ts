import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

interface NotificationPayload {
  shipment_id: string;
  tenant_id: string;
  old_status: string;
  new_status: string;
  carrier_tracking_code: string;
  white_label_code: string;
  customer_details: {
    email?: string;
    name?: string;
  };
  invoice_details?: {
    amount?: number;
    currency?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email notification triggered');

    const payload: NotificationPayload = await request.json();
    const { shipment_id, tenant_id, old_status, new_status, carrier_tracking_code, white_label_code, customer_details, invoice_details } = payload;

    console.log(`📦 Shipment ${shipment_id}: ${old_status} → ${new_status}`);

    const supabase = await createClient();

    // Check if email already sent (prevent duplicates)
    const { data: existingLog } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('shipment_id', shipment_id)
      .eq('type', 'email')
      .eq('status', 'sent')
      .ilike('subject', `%${new_status}%`)
      .single();

    if (existingLog) {
      console.log('✅ Email already sent, skipping');
      return NextResponse.json({ success: true, message: 'Already sent' });
    }

    // Get recipient
    const recipientEmail = customer_details?.email;
    const recipientName = customer_details?.name || 'Customer';

    if (!recipientEmail) {
      console.error('❌ No recipient email');
      await supabase.from('notification_logs').insert({
        tenant_id,
        shipment_id,
        type: 'email',
        recipient: 'unknown',
        subject: `Shipment ${new_status}`,
        body: 'No email',
        status: 'failed',
        error_message: 'No recipient email',
      });
      return NextResponse.json({ error: 'No recipient email' }, { status: 400 });
    }

    // Get tenant email config
    const { data: emailConfig, error: configError } = await supabase
      .from('tenant_notification_configs')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('channel', 'email')
      .eq('is_active', true)
      .single();

    if (configError || !emailConfig) {
      console.error('❌ No email config');
      await supabase.from('notification_logs').insert({
        tenant_id,
        shipment_id,
        type: 'email',
        recipient: recipientEmail,
        subject: `Shipment ${new_status}`,
        body: 'No config',
        status: 'failed',
        error_message: 'No active email configuration. Configure in Notification Settings.',
      });
      return NextResponse.json({ error: 'No email config' }, { status: 400 });
    }

    console.log(`⚙️ Using ${emailConfig.provider_id} for tenant ${tenant_id}`);

    // Generate QR code
    const trackingUrl = `${emailConfig.config.tracking_url || process.env.NEXT_PUBLIC_SITE_URL}/track/${white_label_code}`;
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 200,
      margin: 2,
    });

    // Build email subject and HTML
    const emailSubject = getEmailSubject(new_status);
    const emailHtml = buildEmailHtml({
      status: new_status,
      recipientName,
      carrier_tracking_code,
      white_label_code,
      trackingUrl,
      qrCodeDataUrl,
      invoice_details,
      companyName: emailConfig.config.company_name || 'Your Company',
    });

    // Send email based on provider
    if (emailConfig.provider_id === 'zeptomail') {
      await sendViaZeptoMail({
        apiKey: emailConfig.credentials.api_key,
        fromEmail: emailConfig.config.from_email,
        fromName: emailConfig.config.from_name || 'Shipment Tracking',
        toEmail: recipientEmail,
        toName: recipientName,
        subject: emailSubject,
        html: emailHtml,
      });
    } else if (emailConfig.provider_id === 'smtp') {
      await sendViaSMTP({
        host: emailConfig.credentials.host,
        port: emailConfig.credentials.port,
        user: emailConfig.credentials.user,
        pass: emailConfig.credentials.pass,
        fromEmail: emailConfig.config.from_email,
        fromName: emailConfig.config.from_name || 'Shipment Tracking',
        toEmail: recipientEmail,
        toName: recipientName,
        subject: emailSubject,
        html: emailHtml,
      });
    } else {
      throw new Error(`Unsupported provider: ${emailConfig.provider_id}`);
    }

    console.log('✅ Email sent successfully');

    // Log success
    await supabase.from('notification_logs').insert({
      tenant_id,
      shipment_id,
      type: 'email',
      recipient: recipientEmail,
      subject: emailSubject,
      body: emailSubject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent',
      recipient: recipientEmail,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Send via ZeptoMail API
async function sendViaZeptoMail(params: {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}) {
  const response = await fetch('https://api.zeptomail.com/v1.1/email', {
    method: 'POST',
    headers: {
      'Authorization': params.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        address: params.fromEmail,
        name: params.fromName,
      },
      to: [{
        email_address: {
          address: params.toEmail,
          name: params.toName,
        },
      }],
      subject: params.subject,
      htmlbody: params.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`ZeptoMail error: ${JSON.stringify(error)}`);
  }
}

// Send via SMTP (Nodemailer)
async function sendViaSMTP(params: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    host: params.host,
    port: params.port,
    secure: params.port === 465,
    auth: {
      user: params.user,
      pass: params.pass,
    },
  });

  await transporter.sendMail({
    from: `"${params.fromName}" <${params.fromEmail}>`,
    to: `"${params.toName}" <${params.toEmail}>`,
    subject: params.subject,
    html: params.html,
  });
}

// Get email subject based on status
function getEmailSubject(status: string): string {
  switch (status) {
    case 'info_received':
    case 'pending':
      return '📦 Your Shipment is Being Tracked!';
    case 'delivered':
      return '✅ Package Delivered Successfully!';
    case 'out_for_delivery':
      return '🚚 Out for Delivery!';
    case 'exception':
    case 'failed':
      return '⚠️ Action Required - Shipment Issue';
    default:
      return `📦 Shipment Update: ${status.replace(/_/g, ' ')}`;
  }
}

// Build email HTML
function buildEmailHtml(params: {
  status: string;
  recipientName: string;
  carrier_tracking_code: string;
  white_label_code: string;
  trackingUrl: string;
  qrCodeDataUrl: string;
  invoice_details?: { amount?: number; currency?: string };
  companyName: string;
}): string {
  const { status, recipientName, carrier_tracking_code, white_label_code, trackingUrl, qrCodeDataUrl, invoice_details, companyName } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${getEmailSubject(status)}</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${recipientName},</p>
        
        ${status === 'info_received' || status === 'pending' ? `
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Scan to Track</h3>
          <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
        </div>
        ` : ''}
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Tracking Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Tracking Number:</td>
              <td style="padding: 8px 0; font-weight: bold;">${carrier_tracking_code}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Reference Code:</td>
              <td style="padding: 8px 0; font-weight: bold;">${white_label_code}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Status:</td>
              <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${status.replace(/_/g, ' ')}</td>
            </tr>
            ${invoice_details?.amount ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Invoice Amount:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #667eea; font-size: 18px;">${invoice_details.currency || '$'}${invoice_details.amount.toFixed(2)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    display: inline-block;
                    font-weight: bold;">
            Track Your Shipment
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
