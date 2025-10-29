
export type JwtUser = { id: string; email: string; name: string };
declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
