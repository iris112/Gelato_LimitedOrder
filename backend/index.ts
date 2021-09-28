import dotenv from "dotenv";
dotenv.config({});
import * as http from "http";
import { IUser } from "./User/user.interface";
import { createApp, debugLog } from "./Common/app";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const PORT = process.env.PORT || 8000;
const server: http.Server = http.createServer(createApp());
server.listen(PORT, () => {
  debugLog(`Server is running on ${PORT}`);  
});