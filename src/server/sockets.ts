import { Server } from 'http';

import io from 'socket.io';


export default class Sockets {
  public socketIoServer: SocketIO.Server;
  /**
   *
   */
  constructor(httpServer: Server) {
    this.socketIoServer = io(httpServer);
  }
}
