import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import type { ModuleBuilder } from '@nomicfoundation/hardhat-ignition/types'
import MYDLY from "./MYDLY"

export default buildModule("DucklyDeployment", (m: ModuleBuilder) => {
  const {
    LEDGER_ACCOUNT,
  } = process.env as {
    LEDGER_ACCOUNT: string
  };

  const { mydly } = m.useModule(MYDLY)

  const duckly = m.contract(
    "Duckly",
    [LEDGER_ACCOUNT, mydly],
    { dependsOn: [mydly] }
  )

  return { mydly, duckly }
})
