import { HttpProtocols } from './HttpProtocols';
import { Port } from '@service-t/api/dist/common';
import { CompressionOptions } from 'compression';
import { SecureContextOptions } from 'tls';

export type ServerConfig = {
  protocol: HttpProtocols,
  port: Port,
  tls?: SecureContextOptions,
  enabled?: {
    trustProxy?: boolean,
    removePoweredBy?: boolean,
    compression?: boolean,
    scopeDeps?: boolean,
  },
  compression?: CompressionOptions,
}
