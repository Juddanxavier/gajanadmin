/** @format */

import { z } from 'zod';

// Shipment creation schema
export const createShipmentSchema = z.object({
  carrierTrackingCode: z.string().min(1, 'Carrier tracking code is required'),
  carrierId: z.string().min(1, 'Carrier is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  destinationCountry: z.string().min(1, 'Destination country is required'),
  destinationCity: z.string().optional(),
  originCountry: z.string().optional(),
  originCity: z.string().optional(),
  packageWeight: z.number().positive().optional(),
  packageDimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['cm', 'inch']),
    })
    .optional(),
  notes: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

// Shipment update schema
export const updateShipmentSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  destinationCountry: z.string().optional(),
  destinationCity: z.string().optional(),
  originCountry: z.string().optional(),
  originCity: z.string().optional(),
  packageWeight: z.number().positive().optional(),
  packageDimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['cm', 'inch']),
    })
    .optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      'pending',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'exception',
      'expired',
      'failed',
    ])
    .optional(),
});

export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

// Shipment filters schema
export const shipmentFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  carrierId: z.array(z.string()).optional(),
  tenantId: z.string().uuid().optional(),
  destinationCountry: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ShipmentFilters = z.infer<typeof shipmentFiltersSchema>;
