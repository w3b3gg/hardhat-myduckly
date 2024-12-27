import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ModuleBuilder } from '@nomicfoundation/hardhat-ignition/types'
import Gueio from './Gueio'
import AppleTree from './AppleTree'

export default buildModule('Land', (m: ModuleBuilder) => {
  const signer = m.getAccount(0)
  const { gueio } = m.useModule(Gueio)
  const { appleTree } = m.useModule(AppleTree)

  const land = m.contract('Land', [signer, gueio, appleTree], { dependsOn: [gueio, appleTree] })

  return { land }
});
