import 'dotenv/config'
import hre from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'

describe('Duckly', () => {
  const deployAppleTree = async (name: string) => {
    const [owner] = await hre.ethers.getSigners()
    const AppleTree = await hre.ethers.getContractFactory('AppleTree')
    const appleTree = await AppleTree.deploy(await owner.getAddress())
    await appleTree.waitForDeployment()

    return {
      appleTree
    }
  }

  const deployGueio = async () => {
    const [owner] = await hre.ethers.getSigners()
    const Gueio = await hre.ethers.getContractFactory('Gueio')
    const gueio = await Gueio.deploy(await owner.getAddress())
    await gueio.waitForDeployment()

    return {
      gueio
    }
  }

  const deployDuckly = async () => {
    const { gueio } = await deployGueio()
    const { appleTree } = await deployAppleTree('AppleTree')

    const [owner, client] = await hre.ethers.getSigners()
    const Duckly = await hre.ethers.getContractFactory('Duckly')
    const ownerAddress = await owner.getAddress()
    const gueioAddress = await gueio.getAddress()
    const appleTreeAddress = await appleTree.getAddress()

    const duckly = await Duckly.deploy(ownerAddress, gueioAddress, appleTreeAddress)
    await duckly.waitForDeployment()

    return {
      duckly,
      gueio,
      appleTree,
      owner,
      client
    }
  }


  describe('Deploy', () => {
    it('Should be the right owner', async () => {
      const { duckly, owner } = await loadFixture(deployDuckly)

      expect(await duckly.owner()).to.equal(await owner.getAddress())
    })
  })

  describe('Mint configurations', () => {
    it('Should open the batchGueioHolders', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      expect(await duckly.isBatchGueioHolders()).to.false

      await duckly.openBatchGueioHolders()

      expect(await duckly.isBatchGueioHolders()).to.true
    })

    it('Should open the batchAppleTreeHolders', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      expect(await duckly.isBatchAppleTreeHolders()).to.false

      await duckly.openBatchAppleTreeHolders()

      expect(await duckly.isBatchAppleTreeHolders()).to.true
    })

    it('Should open the openBatchOpen', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      expect(await duckly.isBatchOpen()).to.false

      await duckly.openBatchOpen()

      expect(await duckly.isBatchOpen()).to.true
    })

    it('Should close the batchGueioHolders', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      await duckly.openBatchGueioHolders()
      expect(await duckly.isBatchGueioHolders()).to.true

      await duckly.closeBatchGueioHolders()
      expect(await duckly.isBatchGueioHolders()).to.false
    })

    it('Should close the batchAppleTreeHolders', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await duckly.closeBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.false
    })

    it('Should close the batchOpen', async () => {
      const { duckly } = await loadFixture(deployDuckly)

      await duckly.openBatchOpen()
      expect(await duckly.isBatchOpen()).to.true

      await duckly.closeBatchOpen()
      expect(await duckly.isBatchOpen()).to.false
    })
  })

  describe('Mint to Gueio holders', () => {
    it('Should mint a Duckly by price to Gueio holder', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('16.0') }
      const optionsDuckly = { value: hre.ethers.parseEther('16.0') }

      await gueio.openBatch0()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch0Mint(optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(1)

      await duckly.openBatchGueioHolders()
      await duckly.connect(client).mint(1, optionsDuckly)

      expect(await duckly.balanceOf(await client.getAddress())).to.equal(1)
      expect(await duckly.mintedWithGueio()).to.equal(1)
    })

    it('Should mint 10 Duckly by price to Gueio holder', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('200.0') }
      const optionsDuckly = { value: hre.ethers.parseEther('160.0') }

      await gueio.openBatch4()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch4Mint(5, optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(5)

      await duckly.openBatchGueioHolders()
      await duckly.connect(client).mint(10, optionsDuckly)

      expect(await duckly.balanceOf(await client.getAddress())).to.equal(10)
      expect(await duckly.mintedWithGueio()).to.equal(10)
    })
  })

  // describe('Public mint', () => {
  //   it('Should mint 5 Ducklys when isBatchOpen is true', async () => {
  //     const { duckly, client } = await loadFixture(deployDuckly)

  //     await duckly.openBatchOpen();
  //     await duckly.connect(client).mint(5);

  //     expect(await duckly.balanceOf(await client.getAddress())).to.equal(5n);
  //   })

  //   it('Should not mint a Duckly when isBatchOpen is false', async () => {
  //     const { duckly, client } = await loadFixture(deployDuckly)

  //     expect(await duckly.isBatchOpen()).to.false

  //     try {
  //       await duckly.connect(client).mint(1)

  //       expect.fail('You minted with the isBatchOpen close')
  //     } catch (err) {
  //       const error: Error = err as Error

  //       expect(error.message).to.include('Batch open is close')
  //     }
  //   })

  //   it('Should mint a Duckly on batchOpen', async () => {
  //     const { duckly, client } = await loadFixture(deployDuckly)

  //     await duckly.openBatchOpen()
  //     await duckly.connect(client).mint(1)

  //     expect(await duckly.balanceOf(client.getAddress())).to.equal(1n)
  //     expect(await duckly.ownerOf(0)).to.equal(await client.getAddress())
  //   })
  // })
})