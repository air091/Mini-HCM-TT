import { AccessPayload } from "../libs/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}
