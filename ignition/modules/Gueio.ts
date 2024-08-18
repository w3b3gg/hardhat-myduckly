import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('Gueio', (m) => {
  const gueio = m.contract('Gueio', [m.getParameter('owner')])

  return { gueio }
})