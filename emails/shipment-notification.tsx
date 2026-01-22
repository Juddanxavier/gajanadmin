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
  companyPhone?: string;
  customHeading?: string;
  customMessage?: string;
  deliveryDate?: string;
}

export const ShipmentNotificationEmail = ({
  recipientName = 'Customer',
  status = 'in_transit',
  trackingNumber = 'TRACK123456',
  referenceCode = 'REF123',
  trackingUrl = 'https://example.com/track/REF123',
  qrCodeDataUrl = '',
  invoiceAmount,
  invoiceCurrency = 'USD',
  companyName = 'Your Company',
  logoUrl,
  companyAddress,
  companyPhone,
  customHeading,
  customMessage,
  deliveryDate,
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

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Company Logo - Centered at top */}
          {logoUrl && (
            <Section style={logoSection}>
              <Img
                src={logoUrl}
                width='150'
                height='50'
                alt={companyName}
                style={logo}
              />
            </Section>
          )}

          {/* Header with gradient */}
          <Section style={{ ...header, background: color }}>
            <Heading style={h1}>{title}</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={paragraph}>{message}</Text>

            {/* Invoice Amount Highlight - Show first for visibility */}
            {invoiceAmount && (
              <Section style={invoiceHighlight}>
                <Text style={invoiceLabel}>Total Amount</Text>
                <Heading style={invoiceAmountStyle}>
                  <span
                    style={{
                      fontSize: '20px',
                      marginRight: '6px',
                      fontWeight: '600',
                    }}>
                    {invoiceCurrency}
                  </span>
                  {invoiceAmount.toFixed(2)}
                </Heading>
              </Section>
            )}

            {/* QR Code for initial tracking */}
            {(status === 'info_received' || status === 'pending') &&
              qrCodeDataUrl && (
                <Section style={qrSection}>
                  <Text style={qrTitle}>Scan to Track Your Package</Text>
                  <Img
                    src={qrCodeDataUrl}
                    alt='QR Code for Tracking'
                    width='180'
                    height='180'
                    style={qrCode}
                  />
                  <Text style={qrHint}>Use your phone camera to scan</Text>
                </Section>
              )}

            {/* Tracking Details Card */}
            <Section style={trackingCard}>
              <Heading as='h3' style={cardTitle}>
                Shipment Details
              </Heading>

              <Section style={detailsGrid}>
                <Row style={detailRow}>
                  <Column style={detailLabel}>
                    <Text style={labelText}>Tracking Number</Text>
                  </Column>
                  <Column style={detailValue}>
                    <Text style={valueText}>{referenceCode}</Text>
                  </Column>
                </Row>

                <Row style={detailRow}>
                  <Column style={detailLabel}>
                    <Text style={labelText}>Status</Text>
                  </Column>
                  <Column style={detailValue}>
                    <Text
                      style={{
                        ...valueText,
                        textTransform: 'capitalize',
                        color: '#667eea',
                        fontWeight: '700',
                      }}>
                      {status.replace(/_/g, ' ')}
                    </Text>
                  </Column>
                </Row>

                {deliveryDate && (
                  <Row style={detailRow}>
                    <Column style={detailLabel}>
                      <Text style={labelText}>Delivery Date</Text>
                    </Column>
                    <Column style={detailValue}>
                      <Text style={valueText}>{deliveryDate}</Text>
                    </Column>
                  </Row>
                )}
              </Section>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link href={trackingUrl} style={button}>
                Track Your Package →
              </Link>
            </Section>

            {/* Help Text */}
            <Text style={helpText}>
              Need help? Contact our support team anytime.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ShipmentNotificationEmail;

// Helper functions
function getPreviewText(status: string): string {
  switch (status) {
    case 'info_received':
    case 'pending':
      return 'Your shipment is being tracked!';
    case 'delivered':
      return 'Package delivered successfully!';
    case 'out_for_delivery':
      return 'Your package is out for delivery!';
    case 'exception':
    case 'failed':
      return 'Action required - Shipment issue';
    default:
      return `Shipment update: ${status.replace(/_/g, ' ')}`;
  }
}

function getStatusContent(status: string): {
  title: string;
  message: string;
  color: string;
} {
  switch (status) {
    case 'info_received':
    case 'pending':
      return {
        title: '📦 Your Shipment is Being Tracked!',
        message:
          "Great news! We've received your shipment information and it's now being tracked. You can monitor its progress using the tracking link below.",
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
    case 'delivered':
      return {
        title: '✅ Package Delivered Successfully!',
        message:
          'Your package has been delivered! We hope you enjoy your purchase.',
        color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      };
    case 'out_for_delivery':
      return {
        title: '🚚 Out for Delivery!',
        message: 'Your package is out for delivery and should arrive soon!',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      };
    case 'exception':
    case 'failed':
      return {
        title: '⚠️ Action Required - Shipment Issue',
        message:
          "There's an issue with your shipment that requires attention. Please contact our support team for assistance.",
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      };
    default:
      return {
        title: `📦 Shipment Update: ${status.replace(/_/g, ' ')}`,
        message:
          'Your shipment status has been updated. Check the details below for more information.',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
  }
}

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  objectFit: 'contain' as const,
};

const header = {
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '10px 10px 0 0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h3 = {
  color: '#667eea',
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
};

const content = {
  padding: '40px 30px',
};

const greeting = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  marginTop: '0',
  marginBottom: '24px',
};

const qrSection = {
  backgroundColor: '#f7fafc',
  padding: '32px',
  borderRadius: '12px',
  textAlign: 'center' as const,
  margin: '24px 0',
  border: '1px solid #e2e8f0',
};

const qrTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2d3748',
  marginBottom: '16px',
};

const qrCode = {
  margin: '16px auto',
  display: 'block',
  borderRadius: '8px',
};

const qrHint = {
  fontSize: '13px',
  color: '#718096',
  marginTop: '12px',
};

const trackingCard = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '12px',
  margin: '24px 0',
  border: '2px solid #e2e8f0',
};

const cardTitle = {
  color: '#2d3748',
  fontSize: '18px',
  fontWeight: '700',
  marginTop: '0',
  marginBottom: '20px',
};

const detailsGrid = {
  width: '100%',
};

const detailRow = {
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f7fafc',
};

const detailLabel = {
  width: '40%',
  verticalAlign: 'top' as const,
};

const labelText = {
  fontSize: '14px',
  color: '#718096',
  fontWeight: '500',
  margin: '0',
};

const detailValue = {
  width: '60%',
  verticalAlign: 'top' as const,
  textAlign: 'right' as const,
};

const valueText = {
  fontSize: '15px',
  color: '#2d3748',
  fontWeight: '600',
  margin: '0',
};

const invoiceHighlight = {
  backgroundColor: '#f0f4ff',
  padding: '24px',
  borderRadius: '12px',
  border: '2px solid #667eea',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const invoiceLabel = {
  fontSize: '14px',
  color: '#4a5568',
  fontWeight: '500',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const invoiceAmountStyle = {
  margin: '0',
  fontSize: '36px',
  color: '#667eea',
  fontWeight: '800',
  lineHeight: '1',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)',
};

const helpText = {
  fontSize: '14px',
  color: '#718096',
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
};

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '16px',
};
