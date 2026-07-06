import { z } from 'zod';
import type { LeadSource, LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Validation for an inbound lead from any customer-facing form. */
export const leadInputSchema = z.object({
  name: z.string().trim().min(2, 'Emri është i shkurtër').max(120),
  phone: z
    .string()
    .trim()
    .min(6, 'Numri i telefonit nuk është i vlefshëm')
    .max(30),
  email: z.string().trim().email('Email-i nuk është i vlefshëm').optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional(),
  source: z
    .enum(['VEHICLE_INQUIRY', 'FINANCING', 'CONTACT_FORM', 'ASSISTANT', 'CALLBACK'])
    .default('CONTACT_FORM'),
  vehicleId: z.string().cuid().optional(),
  vehicleSlug: z.string().optional(),
  downPayment: z.coerce.number().int().nonnegative().optional(),
  termMonths: z.coerce.number().int().positive().optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export async function createLead(input: LeadInput) {
  // Resolve a vehicle reference from either id or slug.
  let vehicleId = input.vehicleId ?? null;
  if (!vehicleId && input.vehicleSlug) {
    const v = await prisma.vehicle.findUnique({
      where: { slug: input.vehicleSlug },
      select: { id: true },
    });
    vehicleId = v?.id ?? null;
  }

  return prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email ? input.email : null,
      message: input.message ?? null,
      source: input.source as LeadSource,
      vehicleId,
      downPayment: input.downPayment ?? null,
      termMonths: input.termMonths ?? null,
    },
  });
}

export async function listLeads(status?: LeadStatus) {
  return prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: {
        select: { slug: true, brand: true, model: true, year: true, price: true },
      },
    },
    take: 200,
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus, notes?: string) {
  return prisma.lead.update({
    where: { id },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });
}

export async function getLeadStats() {
  const grouped = await prisma.lead.groupBy({
    by: ['status'],
    _count: true,
  });
  const total = grouped.reduce((sum, g) => sum + g._count, 0);
  const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count]));
  return { total, byStatus };
}
