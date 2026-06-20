import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { describe, it, beforeAll, afterAll } from 'vitest';
import app from '../index.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import DocumentsTableTestHelper from '../../../../tests/DocumentsTableTestHelper.js';
import { uploadDir } from '../../middlewares/uploadMiddleware.js';

vi.mock('../../utils/rabbitmq.js', () => ({
    publishToQueue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/generate-answers/llm/index.js', () => ({
    llmGenerateAnswer: {
        invoke: vi.fn().mockResolvedValue({
            content: 'Ini adalah jawaban mock dari LLM',
        }),
    },
}));

vi.mock('../../utils/vectorStore.js', () => ({
    default: {
        similaritySearch: vi.fn().mockResolvedValue([
            {
                pageContent: 'Konten dokumen mock',
                metadata: { createdAt: '2024-01-01', doc_id: 'doc-123' },
            },
        ]),
    },
}));

vi.mock('../../services/generate-answers/query-rewrite/queryReWriting.js', () => ({
    default: vi.fn().mockResolvedValue({
        content: 'apa itu uajm?',
    }),
}));

vi.mock('../../services/generate-answers/doc-store/PostgresDocStore.js', () => {
    return {
        default: class MockPostgresDocstore {
            async mget() {
                return [
                    {
                        pageContent: 'Konten parent dokumen mock',
                        metadata: { createdAt: '2024-01-01' },
                    },
                ];
            }
        },
    };
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            const payload = {
                "object": "whatsapp_business_account",
                "entry": [
                    {
                        "id": "215589313241560883",
                        "changes": [
                            {
                                "value": {
                                    "messaging_product": "whatsapp",
                                    "metadata": {
                                        "display_phone_number": "15551797781",
                                        "phone_number_id": "7794189252778687"
                                    },
                                    "contacts": [
                                        {
                                            "profile": {
                                                "name": "Jessica Laverdetman"
                                            },
                                            "wa_id": "13557825698"
                                        }
                                    ],
                                    "messages": [
                                        {
                                            "from": "17863559966",
                                            "id": "wamid.HBgLMTc4NjM1NTk5NjYVAGHAYWYET688aASGNTI1QzZFQjhEMDk2QQA=",
                                            "timestamp": "1758254144",
                                            "text": {
                                                "body": "Hi!"
                                            },
                                            "type": "text"
                                        }
                                    ]
                                },
                                "field": "messages"
                            }
                        ]
                    }
                ]
            };
            const response = await request(apps).post('/').send(payload);

            expect(response.status).toBe(200);
        });
    });

    describe('when POST /generate-answers', () => {
        it('should response 401 when secret code is invalid', async () => {
            const apps = app;
            const payload = {
                message: 'apa itu uajm?',
                userId: 'user-123'
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', 'invalid-secret-code');

            expect(response.status).toBe(401);
            expect(response.body.status).toEqual('fail');
            expect(response.body.message).toEqual('Kode rahasia tidak valid');
        });

        it('should response 400 when user not sending message payload', async () => {
            const apps = app;
            const payload = {
                userId: 'user-123'
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', process.env.SECRET_CODE);

            expect(response.status).toBe(400);
            expect(response.body.status).toEqual('fail');
        });

        it('should response 400 when user not sending userId payload', async () => {
            const apps = app;
            const payload = {
                question: "apa itu atma jaya?"
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', process.env.SECRET_CODE);

            expect(response.status).toBe(400);
            expect(response.body.status).toEqual('fail');
        });

        it('should response 200', async () => {
            const apps = app;
            const payload = {
                message: 'apa itu uajm?',
                userId: 'users-123'
            };
            const response = await request(apps).post('/generate-answers').send(payload).set('secret-code', process.env.SECRET_CODE);

            expect(response.status).toBe(200);
            expect(response.body.status).toEqual('success');
            expect(response.body.data.answer).toBeDefined();
        });
    });

    describe('when POST /users', () => {
        let superAdminToken = null;

        afterAll(async () => {
            await AuthenticationsTableTestHelper.cleanTable();
            await UsersTableTestHelper.cleanTable();
        });

        beforeAll(async () => {
            const loginRes = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
                });
            superAdminToken = loginRes.body.data?.accessToken;
        });

        const existUsername = `user_exist_${Date.now()}`;

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

            it('should response 401 when sending invalid token', async () => {
                const payload = {
                    username: existUsername,
                    password: 'anotherpassword',
                    fullname: 'Another User',
                };

                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer invalid.token.123`)
                    .send(payload);

                expect(response.status).toBe(401);
                expect(response.headers['content-type']).toMatch(/application\/json/);
                expect(response.body).toBeTypeOf('object');
                expect(response.body).toHaveProperty('status', 'fail');
                expect(response.body).toHaveProperty('message');
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

    describe('when POST /authentications', () => {
        it('should response 201 with accessToken and refreshToken', async () => {
            const response = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
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

            await AuthenticationsTableTestHelper.cleanTable();
        });

        it('should response 401 when password is wrong', async () => {
            const response = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
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

    describe('when PUT /authentications', () => {
        it('should response 200 with new accessToken', async () => {
            const refreshTokenResponse = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
                });

            const validRefreshToken = refreshTokenResponse.body.data.refreshToken;

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

            await AuthenticationsTableTestHelper.cleanTable();
        });

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

    describe('when DELETE /authentications', () => {
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

        it('should response 200 when logout with valid refresh token', async () => {
            const refreshTokenResponse = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
                });

            const validRefreshToken = refreshTokenResponse.body.data.refreshToken;

            const response = await request(app)
                .delete('/authentications')
                .send({ refreshToken: validRefreshToken });

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('message', 'Refresh token berhasil dihapus!');

            await AuthenticationsTableTestHelper.cleanTable();
        });
    });

    describe('when POST /documents', () => {
        let accessToken = null;
        const testFilePath = path.join(__dirname, 'test-document.pdf');
        const largeFilePath = path.join(__dirname, 'large-test-document.pdf');
        const txtFilePath = path.join(__dirname, 'test-document.txt');

        beforeAll(async () => {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const loginRes = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
                });
            accessToken = loginRes.body.data?.accessToken;

            fs.writeFileSync(testFilePath, 'dummy pdf content for testing');
        });

        afterAll(async () => {
            fs.rmSync(testFilePath, { force: true });
            fs.rmSync(largeFilePath, { force: true });
            fs.rmSync(txtFilePath, { force: true });
            fs.rmSync(uploadDir, { force: true, recursive: true });

            await DocumentsTableTestHelper.cleanTable();
            await AuthenticationsTableTestHelper.cleanTable();
        });

        it('should response 401 when no token is provided', async () => {
            const response = await request(app)
                .post('/documents')
                .send({});

            expect(response.status).toBe(401);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
        });

        it('should reponse 400 when isLongDocument payload is not provided', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('document', testFilePath);

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body).toHaveProperty('message', '"isLongDocument" is required');
        });

        it('should reponse 400 when isLongDocument payload is not boolean', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('isLongDocument', 'not a boolean')
                .attach('document', testFilePath);

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body).toHaveProperty('message', '"isLongDocument" must be a boolean');
        });

        it('should response 400 when no document file is attached', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    isLongDocument: false,
                });

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body).toHaveProperty('message', 'Dokumen harus dikirim');
        });

        it('should response 400 when document file size is more than 10MB', async () => {
            const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1);
            fs.writeFileSync(largeFilePath, largeContent);

            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('document', largeFilePath);

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body).toHaveProperty('message', 'Ukuran dokumen melebihi batas maksimum 10MB');
        });

        it('should response 400 when document format is not allowed', async () => {
            fs.writeFileSync(txtFilePath, 'dummy text content for testing');

            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('document', txtFilePath);

            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body).toHaveProperty('message', 'Format dokumen tidak diizinkan. Format yang diizinkan: .pdf, .csv, .docx, .doc, .jpg, .jpeg, .png, .webp');
        });

        it('should response 400 when file field name is wrong', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('wrongFieldName', testFilePath);

            expect(response.status).toBe(400);
        });

        it('should response 201 when document is uploaded successfully', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('isLongDocument', false)
                .attach('document', testFilePath);

            expect(response.status).toBe(201);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('source');
            expect(response.body.data).toHaveProperty('type', 'docs');
            expect(response.body.data).toHaveProperty('status', 'in progress');
        });

        it('should response 201 when document is uploaded with desiredInformation', async () => {
            const response = await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .field({
                    desiredInformation: 'Informasi tentang UAJM',
                    isLongDocument: false
                })
                .attach('document', testFilePath);

            expect(response.status).toBe(201);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('type', 'docs');
        });
    });

    describe('when GET /documents', () => {
        let accessToken = null;
        const testFilePath = path.join(__dirname, 'test-document.pdf');

        beforeAll(async () => {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const loginRes = await request(app)
                .post('/authentications')
                .send({
                    username: process.env.USERNAME_SUPER_ADMIN,
                    password: process.env.PASSWORD_SUPER_ADMIN,
                });
            accessToken = loginRes.body.data?.accessToken;
        });

        afterAll(async () => {
            fs.rmSync(testFilePath, { force: true });
            fs.rmSync(uploadDir, { force: true, recursive: true });
            await DocumentsTableTestHelper.cleanTable();
            await AuthenticationsTableTestHelper.cleanTable();
        });

        it('should response 401 when no token is provided', async () => {
            const response = await request(app)
                .get('/documents');

            expect(response.status).toBe(401);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'fail');
        });

        it('should response 200 and return array of documents', async () => {
            // Tambahkan document terlebih dahulu via POST /urls
            fs.writeFileSync(testFilePath, 'dummy text content for testing');

            await request(app)
                .post('/documents')
                .set('Authorization', `Bearer ${accessToken}`)
                .field({
                    desiredInformation: 'Informasi tentang UAJM',
                    isLongDocument: false
                })
                .attach('document', testFilePath);

            const response = await request(app)
                .get('/documents')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toBeTypeOf('object');
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        });

        it('should response 200 and return empty array when no documents', async () => {
            // Bersihkan semua dokumen terlebih dahulu
            await DocumentsTableTestHelper.cleanTable();

            const response = await request(app)
                .get('/documents')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });
    });
});
