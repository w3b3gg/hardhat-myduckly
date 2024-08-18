import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('AppleTree', (m) => {
  const appleTree = m.contract('AppleTree', [m.getParameter('owner')])

  return { appleTree }
})