import {WebServerConfig} from "@service-t/core/dist/config/WebServerConfig";
import {CompressionOptions} from "compression";

export type ExtendedWebServerConfig = WebServerConfig & {
    enabled?: {
        trustProxy?: boolean,
        removePoweredBy?: boolean,
        compression?: boolean,
        scopeDeps?: boolean,
    },
    compression?: CompressionOptions,
}