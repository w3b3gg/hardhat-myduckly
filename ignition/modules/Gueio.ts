import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ModuleBuilder } from '@nomicfoundation/hardhat-ignition/types'

export default buildModule('Gueio', (m: ModuleBuilder) => {
  const signer = m.getAccount(0)
  const gueio = m.contract('Gueio', [signer])

  return { gueio }
})
