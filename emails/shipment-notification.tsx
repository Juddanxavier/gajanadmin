/** @format */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface ShipmentNotificationProps {
  customerName?: string;
  trackingCode: string;
  status: string;
  trackingUrl?: string;
  message?: string;
  destinationCity?: string;
  destinationCountry?: string;
  companyName?: string;
  brandColor?: string;
  amount?: string;
  companyLogo?: string;
}

export const ShipmentNotification = ({
  customerName = 'Valued Customer',
  trackingCode = 'TRK123456789',
  status = 'In Transit',
  trackingUrl = '#',
  message,
  destinationCity,
  destinationCountry,
  companyName = 'Gajan Traders',
  brandColor = '#000000',
  amount,
  companyLogo,
  customHeading,
  customBody,
}: ShipmentNotificationProps & {
  customHeading?: string;
  customBody?: string;
}) => {
  const previewText = `Update on your shipment ${trackingCode}`;

  // Format destination string
  const destination = [destinationCity, destinationCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className='bg-white my-auto mx-auto font-sans'>
          <Container className='border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]'>
            {companyLogo ? (
              <Section className='mt-[20px] mb-[20px]'>
                <Img
                  src={companyLogo}
                  alt={companyName}
                  width='150'
                  height='50'
                  className='mx-auto object-contain'
                />
              </Section>
            ) : (
              <Heading className='text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0'>
                {customHeading || `${companyName} Shipment Update`}
              </Heading>
            )}
            {companyLogo && (
              <Heading className='text-black text-[24px] font-normal text-center p-0 my-[10px] mx-0'>
                {customHeading || `Shipment Update`}
              </Heading>
            )}

            {customBody ? (
              <Text className='text-black text-[14px] leading-[24px] whitespace-pre-wrap'>
                {customBody}
              </Text>
            ) : (
              <>
                <Text className='text-black text-[14px] leading-[24px]'>
                  Hello {customerName},
                </Text>
                <Text className='text-black text-[14px] leading-[24px]'>
                  Your shipment <strong>{trackingCode}</strong>
                  {destination ? ` headed to ${destination}` : ''} has a new
                  status update:
                </Text>
                {amount && (
                  <Text className='text-black text-[14px] leading-[24px] font-bold'>
                    Amount: {amount}
                  </Text>
                )}
              </>
            )}

            <Section className='text-center mt-[32px] mb-[32px]'>
              <Button
                className='rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3'
                style={{ backgroundColor: brandColor }}
                href={trackingUrl}>
                Track Package ({status})
              </Button>
            </Section>
            {message && !customBody && (
              <Text className='text-black text-[14px] leading-[24px]'>
                Note: {message}
              </Text>
            )}
            <Text className='text-black text-[14px] leading-[24px]'>
              or copy and paste this link into your browser: <br />
              <a href={trackingUrl} className='text-blue-600 no-underline'>
                {trackingUrl}
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ShipmentNotification;
