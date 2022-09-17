import { Service } from '@pulumi/gcp/cloudrun'
import { Config } from '@pulumi/pulumi'

export function CreateService(config: Config): Service {
  const revisionString = process.env.CIRCLE_BUILD_NUM ?? (new Date()).toISOString().replace('T', '-').replace(/:/g, '-').replace('.', '-').replace('Z', '')
  return new Service('holmok-com-app', {
    location: 'us-central1',
    name: 'holmok-com-app',
    template: {
      metadata: {
        annotations: {
          'autoscaling.knative.dev/maxScale': '3',
          'autoscaling.knative.dev/minScale': '1'
        },
        name: `holmok-com-app-${revisionString}`
      },
      spec: {
        containers: [{
          image: 'us.gcr.io/holmok-com/holmok-com:latest',
          envs: [
            { name: 'PG_USER', value: 'holmok-com' },
            { name: 'PG_PASSWORD', value: config.requireSecret('pg_password') },
            { name: 'PG_HOST', value: config.requireSecret('pg_host') },
            { name: 'PG_DATABASE', value: 'holmok-com' },
            { name: 'PG_SCHEMA', value: 'holmok-com' },
            { name: 'PG_PORT', value: '5432' },
          ],
          ports: [{
            containerPort: 3000,
            name: 'http1'
          }],
          resources: {
            limits: {
              cpu: '1000m',
              memory: '512Mi'
            }
          }
        }],
        timeoutSeconds: 300
      }
    },
    traffics: [{
      latestRevision: true,
      percent: 100
    }]
  })
}
