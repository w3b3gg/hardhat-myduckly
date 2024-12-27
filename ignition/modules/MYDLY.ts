import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ModuleBuilder } from '@nomicfoundation/hardhat-ignition/types'

export default buildModule('MYDLY', (m: ModuleBuilder) => {
  const {
    LEDGER_ACCOUNT,
  } = process.env as {
    LEDGER_ACCOUNT: string
  };
  const mydly = m.contract('MYDLY', [LEDGER_ACCOUNT])

  return { mydly }
})
