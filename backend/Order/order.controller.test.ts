import dotenv from "dotenv";
dotenv.config({});
import request from 'supertest';
import jwt from "jsonwebtoken";
import { Express } from 'express-serve-static-core';
import { createApp } from '../Common/app';

let app: Express;
const userData = {
  email: 'abc@abc.com', 
  password: '123456', 
  username: 'abc'
};

jest.setTimeout(30000);

beforeAll(() => {
  app = createApp();
})

describe('Post /order', () => {
  it('should return 200 & make order transaction', async () => {
    const res = await request(app)
                        .post(`/order`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('abc@abc.com');
    expect(res.body.data.username).toBe('abc');
  })
})