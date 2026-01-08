'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ActionResponse } from '@/lib/types';
import { env } from '@/lib/env';

export async function signInWithMagicLinkAction(
  email: string
): Promise<ActionResponse<{ message: string }>> {
  console.log('[signInWithMagicLinkAction] Starting for:', email);

  try {
    // 1. Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const adminClient = createAdminClient();
    
    // 2. Determine Redirect URL
    // Use the site URL from env or default to localhost
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/dashboard`;
    
    console.log('[signInWithMagicLinkAction] Redirect URL:', redirectUrl);

    // 3. Generate Magic Link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError) {
      console.error('[signInWithMagicLinkAction] Generate link error:', linkError);
      return { success: false, error: 'Failed to generate login link' };
    }

    const { action_link } = linkData.properties;
    console.log('[signInWithMagicLinkAction] Link generated successfully');

    // 4. Send Email via Edge Function
    // We use a custom template here
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login to Gajan Tracking</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 700; color: #111827; }
          .title { font-size: 20px; color: #374151; margin-bottom: 16px; text-align: center; }
          .text { color: #6b7280; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px; }
          .button-container { text-align: center; margin-bottom: 32px; }
          .button { display: inline-block; background-color: #000000; color: #ffffff; font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; transition: background-color 0.2s; }
          .button:hover { background-color: #333333; }
          .footer { margin-top: 32px; text-align: center; color: #9ca3af; font-size: 12px; }
          .link-text { margin-top: 24px; font-size: 14px; color: #6b7280; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">Gajan Tracking</div>
            </div>
            <h1 class="title">Sign in to your account</h1>
            <p class="text">Click the button below to securely sign in to your dashboard. This link will expire in 24 hours.</p>
            <div class="button-container">
              <a href="${action_link}" class="button">Sign In</a>
            </div>
            <p class="text" style="font-size: 14px; margin-bottom: 0;">or copy and paste this link into your browser:</p>
            <div class="link-text">
              <a href="${action_link}" style="color: #6b7280;">${action_link}</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Gajan Tracking. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const { error: sendError } = await adminClient.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Sign in to Gajan Tracking',
        html: emailHtml,
      },
    });

    if (sendError) {
      console.error('[signInWithMagicLinkAction] Send email error:', sendError);
      return { success: false, error: 'Failed to send login email' };
    }

    return { 
      success: true, 
      data: { message: 'Login link sent to your email' }
    };

  } catch (error) {
    console.error('[signInWithMagicLinkAction] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
