import dotenv from "dotenv";
dotenv.config({});
import request from 'supertest';
import jwt from "jsonwebtoken";
import { Express } from 'express-serve-static-core';
import { createApp } from '../Common/app';
import User from "../User/user.model";

let app: Express;
const jwtSecret: string = process.env.JWT_SECRET || "123456";
const tokenExpirationInSeconds = 36000;
const userData = {
  email: 'abc@abc.com', 
  password: '123456', 
  username: 'abc'
};
const token = jwt.sign(userData, jwtSecret, { expiresIn: tokenExpirationInSeconds });

jest.setTimeout(30000);

beforeAll(() => {
  app = createApp();
})

afterEach(async () => {
  await User.deleteMany();
});

describe('GET /user', () => {
  it('should redirect /login because of authentication failture', done => {
    request(app)
      .get(`/user`)
      .set('Cookie', [`token=Fake.token`])
      .expect(302)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.header.location).toBe('/login');
        done();
      })
  })

  it('should return 200 & user data after pass authentication', async () => {
    await User.build(userData).save();
    const res = await request(app)
                        .get(`/user`)
                        .set('Cookie', [`token=${token}`])
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('abc@abc.com');
    expect(res.body.data.username).toBe('abc');
  })
})