import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

export type HttpBasedServer = HttpServer | HttpsServer;
