/**
 * @module tracing
 * Browser-side OpenTelemetry tracing.
 *
 * Initialises a WebTracerProvider that:
 *  - Tags spans with service name + deployment environment.
 *  - Exports OTLP payloads to /api/v1/traces (trace proxy created in Task 17).
 *  - Auto-instruments document load, fetch, XHR, and click interactions so
 *    every API call carries a `traceparent` header for end-to-end correlation
 *    with the Phoenix backend's TraceContext plug.
 *
 * Call once after app hydration — safe to call multiple times (idempotent).
 */
import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

let initialized = false;

/**
 * Initialize OpenTelemetry browser tracing.
 * Call once after app hydration — non-blocking.
 */
export function initTracing(): void {
  if (initialized || import.meta.env.SSR) return;
  // Only enable tracing when a collector endpoint is configured
  // Without this, traces POST to /api/v1/traces which returns 502 and spams the console
  const traceEndpoint = import.meta.env.VITE_OTEL_TRACE_ENDPOINT;
  if (!traceEndpoint) return;
  initialized = true;

  const environment = import.meta.env.MODE;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'cgraph-web',
    'deployment.environment': environment,
  });

  const exporter = new OTLPTraceExporter({
    url: traceEndpoint,
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-document-load': {},
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: [/.*/],
          clearTimingResources: true,
        },
        '@opentelemetry/instrumentation-user-interaction': {
          eventNames: ['click'],
        },
        '@opentelemetry/instrumentation-xml-http-request': {
          propagateTraceHeaderCorsUrls: [/.*/],
        },
      }),
    ],
  });
}
