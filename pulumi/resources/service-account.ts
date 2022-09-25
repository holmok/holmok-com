import { Account } from '@pulumi/gcp/serviceaccount'

export function CreateServiceAccount (name: string): Account {
  return new Account(`${name}-sa`, {
    accountId: name,
    displayName: name
  })
}
