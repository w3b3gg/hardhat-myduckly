import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('Duckly', (m) => {
  const duckly = m.contract('Duckly', [m.getParameter('owner'), m.getParameter('gueio'), m.getParameter('appleTree')])

  return { duckly }
})