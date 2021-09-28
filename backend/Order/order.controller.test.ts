import dotenv from "dotenv";
dotenv.config({});
import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { ethers } from 'ethers';
import { createApp } from '../Common/app';

let app: Express;
const userData = {
  amount: ethers.utils.parseEther("0.5"),
  secret: "0x1234567812345678123456781234567812345678123456781234567812345678",
  module: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  inputToken: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  owner: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  witness: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
  data: "0xFFFFFFFFFFFFFFFFFFFFFF",
  signature: {
    sigR: "0xe99d7c335e3715526f1ba7821be0e1da90db7e08ea5cdbb9e5d7191bb949e1ee",
    sigS: "0x779e234e64f3fd8c78969b558220ba5d9c4ae496c1f8d85031b1fe47ec0018fb",
    sigV: 28
  }
};

jest.setTimeout(30000);

beforeAll(() => {
  app = createApp();
})

describe('one time post /api/order', () => {
  it('should return 200 & make order transaction only one time', async () => {
    const res = await request(app)
                        .post(`/api/order`)
                        .send({ ...userData });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  })
})