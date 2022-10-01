import { Service } from '@pulumi/gcp/cloudrun'
import { Account } from '@pulumi/gcp/serviceaccount'
import { Config } from '@pulumi/pulumi'

export function CreateService (config: Config, sa: Account): Service {
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
        serviceAccountName: sa.email,
        containers: [{
          image: 'us.gcr.io/holmok-com/holmok-com:latest',
          envs: [
            { name: 'PG_USER', value: config.requireSecret('pg_user') },
            { name: 'PG_PASSWORD', value: config.requireSecret('pg_password') },
            { name: 'PG_HOST', value: config.requireSecret('pg_host') },
            { name: 'PG_DATABASE', value: config.requireSecret('pg_database') },
            { name: 'PG_SCHEMA', value: config.requireSecret('pg_schema') },
            { name: 'PG_PORT', value: '5432' }
          ],
          ports: [{
            containerPort: 3000,
            name: 'http1'
          }],
          resources: {
            limits: {
              cpu: '1000m',
              memory: '1024Mi'
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
