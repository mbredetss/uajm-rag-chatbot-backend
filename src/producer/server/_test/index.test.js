import request from 'supertest';
import { describe, it } from 'vitest';
import app from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

describe('HTTP Server', () => {
    describe('when GET /', () => {
        it('should response 403 when whatsapp verify token is invalid', async () => {
            const apps = app;
            const payload = {
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'invalid-token',
                    'hub.challenge': '123456',
                }
            };
            const response = await request(apps).get('/').query(payload.query);

            expect(response.status).toBe(403);
        });

        it('should response 200 when whatsapp verify token is valid', async () => {
            const apps = app;
            const payload = {
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': process.env.VERIFY_TOKEN,
                    'hub.challenge': '123456',
                }
            };
            const response = await request(apps).get('/').query(payload.query);

            expect(response.status).toBe(200);
        });
    });

    describe('when POST /', () => {
        it('should response 200', async () => {
            const apps = app;
            const response = await request(apps).post('/').send({});

            expect(response.status).toBe(200);
        });
    });
});