import { DatabaseInstance, User } from '@pulumi/gcp/sql'

export function CreatePostgresUser (instance: DatabaseInstance): User {
  return new User('holmok-com-postgres-user', {
    instance: instance.id,
    name: 'holmok-com',
    project: 'holmok-com'
  }, { dependsOn: [instance] })
}

export function CreatePostgresInstance (): DatabaseInstance {
  return new DatabaseInstance('holmok-com-postgres', {
    databaseVersion: 'POSTGRES_14',
    name: 'holmok-com-postgres',
    project: 'holmok-com',
    region: 'us-central1',
    settings: {
      backupConfiguration: {
        backupRetentionSettings: {
          retainedBackups: 7
        },
        enabled: true,
        location: 'us',
        pointInTimeRecoveryEnabled: true,
        startTime: '04:00',
        transactionLogRetentionDays: 7
      },
      diskSize: 10,
      ipConfiguration: {
        authorizedNetworks: [{
          name: 'all',
          value: '0.0.0.0/0'
        }]
      },
      locationPreference: {
        zone: 'us-central1-b'
      },
      maintenanceWindow: {
        updateTrack: 'stable'
      },
      tier: 'db-custom-2-4096'
    }
  })
}
