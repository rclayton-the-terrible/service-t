import { HttpProtocols } from './HttpProtocols';
import { Port } from '@service-t/api/dist/common';
import { SecureContextOptions } from 'tls';

export type WebServerConfig = {
  protocol: HttpProtocols,
  port: Port,
  tls?: SecureContextOptions,
}
