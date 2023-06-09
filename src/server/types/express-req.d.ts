import io from 'socket.io';
// Note: Extend Express Request Object using TypeScript: https://stackoverflow.com/questions/37377731/extend-express-request-object-using-typescript

declare module 'express-serve-static-core' {
  export interface Request {
     socketServer?: io.Server;
  }
}
