import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import type { ModuleBuilder } from '@nomicfoundation/hardhat-ignition/types'
import Gueio from './Gueio'

export default buildModule('AppleTree', (m: ModuleBuilder) => {
  const signer = m.getAccount(0)
  const { gueio } = m.useModule(Gueio)

  const appleTree = m.contract('AppleTree', [signer, gueio], { dependsOn: [gueio] })

  return { appleTree }
})
