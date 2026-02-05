/** @format */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface ShipmentNotificationEmailProps {
  recipientName: string;
  status: string;
  trackingNumber: string;
  referenceCode: string;
  trackingUrl: string;
  qrCodeDataUrl: string;
  invoiceAmount?: number;
  invoiceCurrency?: string;
  companyName: string;
  // New customizable props
  logoUrl?: string;
  companyAddress?: string;
  invoiceAmount?: number;
  invoiceCurrency?: string;
  customHeading?: string;
  customMessage?: string;
  deliveryDate?: string;
  companyPhone?: string;
  companyAddress?: string;
  brandColor?: string;
}

export const ShipmentNotificationEmail = ({
  recipientName = 'Valued Customer',
  status = 'in_transit',
  trackingNumber = '1234567890',
  referenceCode = 'ORD-123',
  trackingUrl = 'https://track123.com/ORD-123',
  qrCodeDataUrl = '',
  invoiceAmount,
  invoiceCurrency = 'USD',
  companyName = 'Acme Logistics',
  logoUrl,
  companyAddress,
  companyPhone,
  customHeading,
  customMessage,
  deliveryDate,
  brandColor = '#2563EB', // Default Blue
}: ShipmentNotificationEmailProps) => {
  const previewText = `${getPreviewText(status)}${invoiceAmount ? ` - Amount: ${invoiceCurrency} ${invoiceAmount.toFixed(2)}` : ''}`;
  const {
    title: defaultTitle,
    message: defaultMessage,
    color,
  } = getStatusContent(status);

  // Use custom content if provided, otherwise default to status-based content
  const title = customHeading || defaultTitle;
  const message = customMessage || defaultMessage;

  // Dynamic Styles
  const dynamicButton = { ...button, backgroundColor: brandColor };
  const dynamicPill = {
    ...statusPill,
    backgroundColor: '#EFF6FF',
    color: brandColor,
  }; // Keep light blue bg for pill
  const dynamicValueLink = { ...valueLink, color: brandColor };
  const dynamicSectionHeading = {
    ...sectionHeading,
    borderLeft: `3px solid ${brandColor}`,
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header: Logo Alignment */}
          <Section style={header}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                width='120' // Moderate size, professionally sized
                alt={companyName}
                style={logo}
              />
            ) : (
              <Text style={logoText}>{companyName}</Text>
            )}
          </Section>

          {/* Main Card */}
          <Section style={card}>
            {/* Status Pill & Headline */}
            <Section style={{ marginBottom: '24px' }}>
              <div style={dynamicPill}>{status.replace(/_/g, ' ')}</div>
              <Heading style={h1}>{title}</Heading>
              <Text style={paragraph}>{message}</Text>

              <Text style={paragraph}>
                Hi{' '}
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {recipientName}
                </span>
                , your order has been updated.
              </Text>
            </Section>

            {/* Primary Action */}
            <Section style={{ marginBottom: '32px' }}>
              <Link href={trackingUrl} style={dynamicButton}>
                Track Package
              </Link>
            </Section>

            <Hr style={divider} />

            {/* Shipment Details Grid */}
            <Section style={detailsSection}>
              <Heading as='h3' style={dynamicSectionHeading}>
                Shipment Details
              </Heading>

              <Row style={row}>
                <Column style={column}>
                  <Text style={label}>Tracking Number</Text>
                  <Link href={trackingUrl} style={dynamicValueLink}>
                    {trackingNumber}
                  </Link>
                </Column>
                <Column style={column}>
                  <Text style={label}>Carrier</Text>
                  <Text style={value}>FedEx</Text>
                </Column>
              </Row>

              <Row style={row}>
                <Column style={column}>
                  <Text style={label}>Est. Delivery</Text>
                  <Text style={value}>{deliveryDate || 'Pending'}</Text>
                </Column>
                <Column style={column}>
                  <Text style={label}>Reference</Text>
                  <Text style={value}>{referenceCode}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Clean Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Sent by {companyName} • {companyAddress || '123 Business St, CA'}
            </Text>
            <Text style={footerText}>
              <Link href='#' style={footerLink}>
                Unsubscribe
              </Link>{' '}
              •{' '}
              <Link href='#' style={footerLink}>
                Contact Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ShipmentNotificationEmail;

// Helper functions (Unchanged)
function getPreviewText(status: string): string {
  return `Shipment Update: ${status.replace(/_/g, ' ')}`;
}

function getStatusContent(status: string) {
  // Neutral/Professional Copy
  return {
    title: `Shipment ${status.replace(/_/g, ' ')}`,
    message: `The current status of your shipment is ${status.replace(/_/g, ' ')}. Use the link below to track the progress.`,
    color: '#000000',
  };
}

// Modern Vercel-esque Styles
const main = {
  backgroundColor: '#F3F4F6', // Slight gray bg
  fontFamily:
    '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  maxWidth: '580px',
  width: '100%',
};

const header = {
  marginBottom: '24px',
  padding: '0 8px',
};

const logo = {
  display: 'block',
  maxWidth: '140px',
  maxHeight: '50px',
  objectFit: 'contain' as const,
};

const logoText = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#111827',
  margin: '0',
  letterSpacing: '-0.5px',
};

const card = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '40px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  border: '1px solid #E5E7EB',
};

const statusPill = {
  display: 'inline-block',
  backgroundColor: '#EFF6FF', // Very light blue bg
  color: '#2563EB', // Default Fallback if dynamic fails
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  marginBottom: '16px',
  letterSpacing: '0.5px',
};

const h1 = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 16px',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4B5563',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#2563EB', // Default fallback
  color: '#ffffff',
  borderRadius: '6px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

const divider = {
  borderColor: '#E5E7EB',
  margin: '32px 0',
};

const detailsSection = {
  marginTop: '24px',
};

const sectionHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#111827',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '16px',
  borderLeft: `3px solid #2563EB`, // Fallback
  paddingLeft: '12px',
};

const row = {
  marginBottom: '12px',
};

const column = {
  width: '50%',
  verticalAlign: 'top' as const,
};

const label = {
  fontSize: '12px',
  color: '#6B7280',
  textTransform: 'uppercase' as const,
  marginBottom: '4px',
  letterSpacing: '0.5px',
};

const value = {
  fontSize: '14px',
  color: '#111827',
  fontWeight: '500',
  margin: '0',
};

const valueLink = {
  fontSize: '14px',
  color: '#2563EB',
  fontWeight: '500',
  textDecoration: 'none',
  margin: '0',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  fontSize: '12px',
  color: '#9CA3AF',
  marginBottom: '8px',
};

const footerLink = {
  color: '#6B7280',
  textDecoration: 'underline',
};
