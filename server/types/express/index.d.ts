import { IUser } from "../../models/users.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};