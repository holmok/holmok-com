import { IAMMember } from '@pulumi/gcp/projects'
import { Account } from '@pulumi/gcp/serviceaccount'
import { interpolate } from '@pulumi/pulumi'

export function CreateServiceAccount (name: string): {sa: Account, access: IAMMember} {
  const sa = new Account(`${name}-sa`, {
    accountId: name,
    displayName: name
  })

  const access = new IAMMember(`${name}-sa-access`, {
    member: interpolate`serviceAccount:${sa.email}`,
    role: 'roles/serviceusage.serviceUsageConsumer',
    project: sa.project
  })

  return { sa, access }
}
