/** @format */

import { render } from '@react-email/components';
import { ShipmentNotificationEmail } from '../emails/shipment-notification';
import React from 'react';

async function testRender() {
  console.log('Rendering Nike Template...');
  try {
    const html = await render(
      React.createElement(ShipmentNotificationEmail, {
        recipientName: 'Test User',
        status: 'out_for_delivery',
        trackingNumber: 'TRACK123',
        referenceCode: 'REF123',
        trackingUrl: 'https://example.com',
        qrCodeDataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        invoiceAmount: 120.5,
        invoiceCurrency: 'USD',
        companyName: 'Nike Test',
        logoUrl:
          'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
        companyPhone: '1-800-TEST-NOW',
        deliveryDate: 'Monday, September 22nd',
      }),
    );
    console.log('✅ Render Successful!');
    console.log('Snippet:', html.substring(0, 500));
  } catch (error) {
    console.error('❌ Render Failed:', error);
    process.exit(1);
  }
}

testRender();
