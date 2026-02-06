/** @format */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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
}

export const ShipmentNotification = ({
  customerName = 'Valued Customer',
  trackingCode = 'TRK123456789',
  status = 'In Transit',
  trackingUrl = '#',
  message,
}: ShipmentNotificationProps) => {
  const previewText = `Update on your shipment ${trackingCode}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className='bg-white my-auto mx-auto font-sans'>
          <Container className='border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]'>
            <Heading className='text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0'>
              Shipment Update
            </Heading>
            <Text className='text-black text-[14px] leading-[24px]'>
              Hello {customerName},
            </Text>
            <Text className='text-black text-[14px] leading-[24px]'>
              Your shipment <strong>{trackingCode}</strong> has a new status
              update:
            </Text>
            <Section className='text-center mt-[32px] mb-[32px]'>
              <Button
                className='bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3'
                href={trackingUrl}>
                Track Package ({status})
              </Button>
            </Section>
            {message && (
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
