import request from 'supertest';
import { describe, it, beforeAll, afterAll } from 'vitest';
import app from '../index.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';

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

    describe('when POST /users', () => {
        afterAll(async () => {
            await UsersTableTestHelper.cleanTable();
        });

        const existUsername = `user_exist_${Date.now()}`;

        describe('Skenario 1: Adding User', () => {
            it('should response 201 and return userId when payload is valid', async () => {
                const payload = {
                    username: `user_test_${Date.now()}`,
                    password: 'password123',
                    fullname: 'User Test',
                };

                const response = await request(app)
                    .post('/users')
                    .send(payload);

                expect(response.status).toBe(201);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'success');
                expect(response.body).toHaveProperty('data');
                expect(response.body.data).toHaveProperty('userId');
                expect(response.body.data.userId).not.toBe('');
                expect(response.body.data.userId).not.toBeNull();
            });
        });

        describe('Skenario 2: Adding User with Exist Username', () => {
            beforeAll(async () => {
                await request(app).post('/users').send({
                    username: existUsername,
                    password: 'password123',
                    fullname: 'Existing User',
                });
            });

            it('should response 400 when username already exists', async () => {
                const payload = {
                    username: existUsername,
                    password: 'anotherpassword',
                    fullname: 'Another User',
                };

                const response = await request(app)
                    .post('/users')
                    .send(payload);

                expect(response.status).toBe(400);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toBe('Gagal menambahkan user. Username sudah di gunakan!');
            });
        });

        describe('Skenario 3: Adding User with Bad User Payload', () => {
            const badPayloads = [
                { desc: 'missing username', payload: { password: 'pass123', fullname: 'Test' } },
                { desc: 'missing password', payload: { username: 'testuser', fullname: 'Test' } },
                { desc: 'missing fullname', payload: { username: 'testuser', password: 'pass123' } },
                { desc: 'empty body', payload: {} },
            ];

            badPayloads.forEach(({ desc, payload }) => {
                it(`should response 400 when ${desc}`, async () => {
                    const response = await request(app)
                        .post('/users')
                        .send(payload);

                    expect(response.status).toBe(400);
                    expect(response.headers['content-type']).toMatch(/application\/json/);
                    expect(response.body).toBeTypeOf('object');
                    expect(response.body).toHaveProperty('status', 'fail');
                    expect(response.body).toHaveProperty('message');
                    expect(response.body.message).not.toBe('');
                });
            });
        });
    });
});