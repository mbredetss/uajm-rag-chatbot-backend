import request from 'supertest';
import { describe, it, beforeAll, afterAll } from 'vitest';
import app from '../index.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
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

    describe('when POST /generate-answers', () => {
        it('should response 401 when secret code is invalid', async () => {
            const apps = app;
            const payload = {
                message: 'apa itu uajm?',
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', 'invalid-secret-code');

            expect(response.status).toBe(401);
            expect(response.body.status).toEqual('fail');
            expect(response.body.message).toEqual('Kode rahasia tidak valid');
        });

        it('should response 400 when user not sending message payload', async () => {
            const apps = app;
            const payload = {};
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', process.env.SECRET_CODE);

            expect(response.status).toBe(400);
            expect(response.body.status).toEqual('fail');
        });

        it('should response 200', async () => {
            const apps = app;
            const payload = {
                message: 'apa itu uajm?',
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', process.env.SECRET_CODE);

            expect(response.status).toBe(200);
            expect(response.body.status).toEqual('success');
            expect(response.body.data.answer).toBeDefined();
            expect(response.body.data.relevantDocs).toBeDefined();
        });
    });

    describe('when POST /users', () => {
        let superAdminToken = null;

        afterAll(async () => {
            await AuthenticationsTableTestHelper.cleanTable();
            await UsersTableTestHelper.cleanTable();
        });

        beforeAll(async () => {
            // Login sebagai super admin untuk mendapatkan token
            const loginRes = await request(app)
                .post('/authentications')
                .send({
                    username: 'super_admin',
                    password: 'sampurnasurya882@',
                });
            superAdminToken = loginRes.body.data?.accessToken;
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
                    .set('Authorization', `Bearer ${superAdminToken}`)
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
                await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .send({
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
                    .set('Authorization', `Bearer ${superAdminToken}`)
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
                        .set('Authorization', `Bearer ${superAdminToken}`)
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

        describe('Skenario 4: Adding User Without Access Token', () => {
            it('should response 401 when no token is provided', async () => {
                const response = await request(app)
                    .post('/users')
                    .send({
                        username: 'someuser',
                        password: 'pass123',
                        fullname: 'Some User',
                    });

                expect(response.status).toBe(401);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
            });
        });

        describe('Skenario 5: Adding User with Non-Super Admin Token', () => {
            let adminToken = null;

            beforeAll(async () => {
                // Buat user admin biasa terlebih dahulu
                const adminUsername = `admin_test_${Date.now()}`;
                await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .send({
                        username: adminUsername,
                        password: 'password123',
                        fullname: 'Admin Biasa',
                    });

                // Login sebagai admin biasa
                const loginRes = await request(app)
                    .post('/authentications')
                    .send({ username: adminUsername, password: 'password123' });
                adminToken = loginRes.body.data?.accessToken;
            });

            it('should response 403 when token role is not super admin', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        username: `blocked_user_${Date.now()}`,
                        password: 'pass123',
                        fullname: 'Blocked User',
                    });

                expect(response.status).toBe(403);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
            });
        });
    });

    describe('when /authentications', () => {
        const testCredential = {
            username: `auth_test_${Date.now()}`,
            password: 'password123',
            fullname: 'Auth Test User',
        };
        let validRefreshToken = null;

        beforeAll(async () => {
            // Buat user untuk keperluan test authentication — gunakan token super admin
            const loginRes = await request(app)
                .post('/authentications')
                .send({
                    username: 'super_admin',
                    password: 'sampurnasurya882@',
                });
            const superAdminToken = loginRes.body.data?.accessToken;

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(testCredential);
        });

        describe('Skenario 1: Post Authentication with Valid Credential', () => {
            it('should response 201 with accessToken and refreshToken', async () => {
                const response = await request(app)
                    .post('/authentications')
                    .send({
                        username: testCredential.username,
                        password: testCredential.password,
                    });

                expect(response.status).toBe(201);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'success');
                expect(response.body).toHaveProperty('data');
                expect(response.body.data).toHaveProperty('accessToken');
                expect(response.body.data).toHaveProperty('refreshToken');
                expect(response.body.data.accessToken).toBeTruthy();
                expect(response.body.data.refreshToken).toBeTruthy();

                // Simpan refreshToken untuk skenario berikutnya
                validRefreshToken = response.body.data.refreshToken;
            });
        });

        describe('Skenario 2: Post Authentication with Invalid Credential', () => {
            it('should response 401 when password is wrong', async () => {
                const response = await request(app)
                    .post('/authentications')
                    .send({
                        username: testCredential.username,
                        password: 'wrong_password',
                    });

                expect(response.status).toBe(401);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toBe('Username atau password salah!');
            });

            it('should response 401 when username does not exist', async () => {
                const response = await request(app)
                    .post('/authentications')
                    .send({
                        username: 'user_yang_tidak_ada',
                        password: 'password123',
                    });

                expect(response.status).toBe(401);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toBe('Username atau password salah!');
            });
        });

        describe('Skenario 4: Put Authentications with Valid Refresh Token', () => {
            it('should response 200 with new accessToken', async () => {
                // Pastikan validRefreshToken sudah terisi dari skenario 1
                expect(validRefreshToken).toBeTruthy();

                const response = await request(app)
                    .put('/authentications')
                    .send({ refreshToken: validRefreshToken });

                expect(response.status).toBe(200);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'success');
                expect(response.body).toHaveProperty('data');
                expect(response.body.data).toHaveProperty('accessToken');
                expect(response.body.data.accessToken).toBeTruthy();
                expect(typeof response.body.data.accessToken).toBe('string');
            });
        });

        describe('Skenario 5: Put Authentications with Invalid Refresh Token', () => {
            it('should response 400 when refresh token is invalid', async () => {
                const response = await request(app)
                    .put('/authentications')
                    .send({ refreshToken: 'invalid.refresh.token' });

                expect(response.status).toBe(400);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
            });
        });

        describe('Skenario 6: Delete Authentications with Valid Refresh Token', () => {
            it('should response 200 when logout with valid refresh token', async () => {
                expect(validRefreshToken).toBeTruthy();

                const response = await request(app)
                    .delete('/authentications')
                    .send({ refreshToken: validRefreshToken });

                expect(response.status).toBe(200);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'success');
                expect(response.body).toHaveProperty('message', 'Refresh token berhasil dihapus!');
            });
        });

        describe('Skenario 7: Delete Authentications with Invalid Refresh Token', () => {
            it('should response 400 when logout with invalid refresh token', async () => {
                const response = await request(app)
                    .delete('/authentications')
                    .send({ refreshToken: 'invalid.refresh.token' });

                expect(response.status).toBe(400);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
            });
        });
    });
});