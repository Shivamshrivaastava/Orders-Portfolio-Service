
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../app/server';
import { prisma } from '../core/db/prisma';
import { resetDb } from './helpers';

describe('Order idempotency', () => {
  beforeAll(async () => { await prisma.$connect(); });
  afterAll(async () => { await prisma.$disconnect(); });
  beforeEach(resetDb);

  it('returns same order for same Idempotency-Key', async () => {
    const payload = { symbol: 'BND', side: 'buy', qty: 120, clientOrderId: 'cli-20251010-0001' };
    const key = 'idem-1';
    const r1 = await request(app).post('/orders').set('Idempotency-Key', key).send(payload).expect(201);
    const r2 = await request(app).post('/orders').set('Idempotency-Key', key).send(payload).expect(201);
    expect(r1.body.id).toEqual(r2.body.id);
  });

  it('conflicts when same key but different payload', async () => {
    const key = 'idem-2';
    await request(app).post('/orders').set('Idempotency-Key', key).send({ symbol: 'BND', side: 'buy', qty: 100 }).expect(201);
    const r2 = await request(app).post('/orders').set('Idempotency-Key', key).send({ symbol: 'BND', side: 'buy', qty: 200 });
    expect(r2.status).toBe(409);
  });
});
