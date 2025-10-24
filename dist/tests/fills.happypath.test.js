/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../app/server.js';
import { prisma } from '../core/db/prisma.js';
import { resetDb } from './helpers.js';
describe('Happy path: create order -> partial fill -> full fill -> portfolio', () => {
    beforeAll(async () => { await prisma.$connect(); });
    afterAll(async () => { await prisma.$disconnect(); });
    beforeEach(resetDb);
    it('flows correctly', async () => {
        const order = await request(app).post('/orders').send({ symbol: 'BND', side: 'buy', qty: 120, clientOrderId: 'c1' }).expect(201).then(r => r.body);
        expect(order.status).toBe('pending');
        await request(app).post('/fills').send({ orderId: order.id, price: 73.5, qty: 100, timestamp: new Date().toISOString() }).expect(201);
        const r2 = await request(app).post('/fills').send({ orderId: order.id, price: 74.1, qty: 20, timestamp: new Date().toISOString() }).expect(201);
        expect(r2.body.status).toBe('filled');
        const portfolio = await request(app).get('/portfolio').expect(200).then(r => r.body);
        const pos = portfolio.positions.find((p) => p.symbol === 'BND');
        expect(pos.qty).toBe(120);
    });
});
