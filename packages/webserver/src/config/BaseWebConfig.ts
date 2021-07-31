import { CorsOptions } from 'cors';
import {WebServerConfig} from "@service-t/core/dist/config/WebServerConfig";
import {CompressionOptions} from "compression";

export type BaseWebConfig = {
    http: WebServerConfig,
    cors?: CorsOptions,
    compression?: CompressionOptions,
}
