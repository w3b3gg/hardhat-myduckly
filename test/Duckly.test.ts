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

    const [owner, client, client1, client2, client3, client4, client5] = await hre.ethers.getSigners()
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
      client,
      client1,
      client2,
      client3,
      client4,
      client5
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
    it('Should not mint when the Gueio batch is close and Open batch is close too', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('16.0') }
      const optionsDuckly = { value: hre.ethers.parseEther('16.0') }

      await gueio.openBatch0()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch0Mint(optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(1)
      expect(await duckly.isBatchGueioHolders()).to.false

      try {
        await duckly.connect(client).mint(1, optionsDuckly)

        expect.fail('You minted a Duckly by price Gueio with the Gueio batch close')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Batch open is close')
      }
    })

    it('Should mint a Duckly by price to Gueio holder with the Gueio batch open', async () => {
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

    it('Should mint 10 Duckly by price to Gueio holder with the Gueio batch open', async () => {
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

    it('Should not mint 20 Ducklys by price to Gueio holder with the client have 5 Gueios', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('200.00') }
      const optionsDuckly = { value: hre.ethers.parseEther('320.00') }

      await gueio.openBatch4()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch4Mint(5, optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(5)

      await duckly.openBatchGueioHolders()
      await duckly.openBatchOpen()
      expect(await duckly.isBatchGueioHolders()).to.true

      try {
        await duckly.connect(client).mint(20, optionsDuckly)

        expect.fail('You minted 20 Ducklys by price Gueio holders using only 5 Gueios')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Not enough founds')
      }
    })

    it('Should not mint the third Duckly by price Gueio holder using a Gueio', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('16.0') }
      const optionsDuckly2 = { value: hre.ethers.parseEther('32.0') }
      const optionsDuckly1 = { value: hre.ethers.parseEther('16.0') }

      await gueio.openBatch0()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch0Mint(optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(1)

      await duckly.openBatchGueioHolders()
      await duckly.openBatchOpen()
      await duckly.connect(client).mint(2, optionsDuckly2)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(2)
      expect(await duckly.mintedWithGueio()).to.equal(2)

      try {
        await duckly.connect(client).mint(1, optionsDuckly1)
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Not enough founds')
      }
    })

    it('Should mint a 1024 Duckly by price Gueio holder', async () => {
      const { duckly, gueio, client, client1, client2, client3, client4, client5 } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('4000.00') }
      const optionsGueio12 = { value: hre.ethers.parseEther('480.00') }
      const optionsDuckly = { value: hre.ethers.parseEther('3200.00') }
      const optionsDuckly24 = { value: hre.ethers.parseEther('384.00') }

      await gueio.openBatch4()
      await gueio.addAddressOnWhitelist([
        await client.getAddress(),
        await client1.getAddress(),
        await client2.getAddress(),
        await client3.getAddress(),
        await client4.getAddress(),
        await client5.getAddress()
      ])
      await gueio.connect(client).batch4Mint(100, optionsGueio)
      await gueio.connect(client1).batch4Mint(100, optionsGueio)
      await gueio.connect(client2).batch4Mint(100, optionsGueio)
      await gueio.connect(client3).batch4Mint(100, optionsGueio)
      await gueio.connect(client4).batch4Mint(100, optionsGueio)
      await gueio.connect(client5).batch4Mint(12, optionsGueio12)
      expect(await gueio.balanceOf(await client.getAddress())).to.equal(100)
      expect(await gueio.balanceOf(await client1.getAddress())).to.equal(100)
      expect(await gueio.balanceOf(await client2.getAddress())).to.equal(100)
      expect(await gueio.balanceOf(await client3.getAddress())).to.equal(100)
      expect(await gueio.balanceOf(await client4.getAddress())).to.equal(100)
      expect(await gueio.balanceOf(await client5.getAddress())).to.equal(12)

      await duckly.openBatchGueioHolders()
      expect(await duckly.isBatchGueioHolders()).to.true

      await duckly.connect(client).mint(200, optionsDuckly)
      await duckly.connect(client1).mint(200, optionsDuckly)
      await duckly.connect(client2).mint(200, optionsDuckly)
      await duckly.connect(client3).mint(200, optionsDuckly)
      await duckly.connect(client4).mint(200, optionsDuckly)
      await duckly.connect(client5).mint(24, optionsDuckly24)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(200)
      expect(await duckly.balanceOf(await client1.getAddress())).to.equal(200)
      expect(await duckly.balanceOf(await client2.getAddress())).to.equal(200)
      expect(await duckly.balanceOf(await client3.getAddress())).to.equal(200)
      expect(await duckly.balanceOf(await client4.getAddress())).to.equal(200)
      expect(await duckly.balanceOf(await client5.getAddress())).to.equal(24)
    })
  })

  describe('Apple tree mint', () => {
    it('Should not mint a Duckly when isBatchAppleTree is false and isBatchOpen is false too', async () => {
      const { duckly, appleTree, client } = await loadFixture(deployDuckly)
      const optionsAppleTree = { value: hre.ethers.parseEther('1.00') }

      expect(await duckly.isBatchAppleTreeHolders()).to.false
      expect(await duckly.isBatchOpen()).to.false

      await appleTree.mint(await client.getAddress(), 1);
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(1)

      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(1)

      try {
        await duckly.connect(client).mint(1, optionsAppleTree)

        expect.fail('Minted a Duckly by price Apple Tree holder')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Batch open is close')
      }
    })

    it('Should mint a Duckly by price AppleTree holder when isBatchAppleTree is tree', async () => {
      const { duckly, appleTree, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('18.0') }

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await appleTree.mint(await client.getAddress(), 1)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(1)

      await duckly.connect(client).mint(1, options)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(1)
      expect(await duckly.mintedWithAppleTree()).to.equal(1)
    })

    it('Should not mint 2 Duckly by price Apple Tree holder with only 1 Apple Tree on clinet wallet', async () => {
      const { duckly, appleTree, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('36.0') }

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await appleTree.mint(await client.getAddress(), 1)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(1)

      try {
        await duckly.connect(client).mint(2, options)

        expect.fail('Minted 2 Duckly with 1 Apple Tree')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Batch open is close')
      }
    })

    it('Should mint 5 Duckly by price Apple Tree holder with 5 Apple Tree on clinet walllet', async () => {
      const { duckly, appleTree, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('90.0') }

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await appleTree.mint(await client.getAddress(), 5)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(5)

      await duckly.connect(client).mint(5, options)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(5)
      expect(await duckly.mintedWithAppleTree()).to.equal(5)
    })

    it('Should mint 2048 Duckly by price Apple Tree', async () => {
      const { duckly, appleTree } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('2304.00') }
      const clients = await hre.ethers.getSigners()

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      for (let index = 1; index <= 16; index++) {
        await appleTree.mint(await clients[index].getAddress(), 128)
        expect(await appleTree.balanceOf(await clients[index].getAddress())).to.equal(128)

        await duckly.connect(clients[index]).mint(128, options)
        expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(128)
      }

      expect(await duckly.totalSupply()).to.equal(2048)
    })

    it('Should not mint 2049 Duckly by price Apple Tree', async () => {
      const { duckly, appleTree } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('2304.00') }
      const clients = await hre.ethers.getSigners()

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      for (let index = 1; index <= 16; index++) {
        await appleTree.mint(await clients[index].getAddress(), 128)
        expect(await appleTree.balanceOf(await clients[index].getAddress())).to.equal(128)

        await duckly.connect(clients[index]).mint(128, options)
        expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(128)
      }
      await appleTree.mint(await clients[1].getAddress(), 1)
      expect(await appleTree.balanceOf(await clients[1])).to.equal(129)

      try {
        await duckly.connect(clients[1]).mint(1, { value: hre.ethers.parseEther('18.00') })

        expect.fail('Minted 2049 Duckly by price Apple Tree')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Sold out')
      }
    })

    it('Should not mint 3000 Duckly by price Apple Tree', async () => {
      const { duckly, appleTree } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('3600.00') }
      const clients = await hre.ethers.getSigners()

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      for (let index = 1; index <= 15; index++) {
        if (index === 11) {
          try {
            await appleTree.mint(await clients[index].getAddress(), 200)
            expect(await appleTree.balanceOf(await clients[index].getAddress())).to.equal(200)

            await duckly.connect(clients[index]).mint(200, options)

            expect.fail('Minted more than maxSupply')
          } catch (err) {
            const error: Error = err as Error

            expect(error.message).to.include('Sold out')
          }

          return false;
        }

        await appleTree.mint(await clients[index].getAddress(), 200)
        expect(await appleTree.balanceOf(await clients[index].getAddress())).to.equal(200)

        await duckly.connect(clients[index]).mint(200, options)
        expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(200)
      }
    })
  })

  describe('Public mint', () => {
    it('Should not mint a Duckly when isBatchOpen is false', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('20.0') }

      expect(await duckly.isBatchOpen()).to.false

      try {
        await duckly.connect(client).mint(1, options)

        expect.fail('You minted with the isBatchOpen close')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Batch open is close')
      }
    })

    it('Should mint a Duckly on batchOpen', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('20.0') }

      await duckly.openBatchOpen()
      await duckly.connect(client).mint(1, options)

      expect(await duckly.balanceOf(client.getAddress())).to.equal(1n)
      expect(await duckly.ownerOf(0)).to.equal(await client.getAddress())
    })

    it('Should mint 5 Ducklys when isBatchOpen is true', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('100.0') }

      await duckly.openBatchOpen();
      expect(await duckly.isBatchOpen()).to.equal(true)

      await duckly.connect(client).mint(5, options);

      expect(await duckly.balanceOf(await client.getAddress())).to.equal(5n);
    })

    it('Should not mint 20 Ducklys when isBatchOpen is true', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('400.00') }

      await duckly.openBatchOpen()
      expect(await duckly.isBatchOpen()).to.true

      try {
        await duckly.connect(client).mint(20, options)

        expect.fail('You minted 20 Duckly with only a client')
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include("Minted 10 Ducklys, you can't mint any more")
      }
    })

    it('Should not mint 1 more Duckly when the client have 10 Ducklys and isBatchOpen is true', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options10 = { value: hre.ethers.parseEther('200.00') }
      const options1 = { value: hre.ethers.parseEther('20.00') }

      await duckly.openBatchOpen()
      expect(await duckly.isBatchOpen()).to.true

      await duckly.connect(client).mint(10, options10)

      try {
        await duckly.connect(client).mint(1, options1)

        expect.fail('Mined 1 Duckly more when the client had 10 Ducklys')
      } catch (err) {
        const error: Error = err as Error;

        expect(error.message).to.include("Minted 10 Ducklys, you can't mint any more")
      }
    })

    it('Should a user mint 10 Ducklys when isBatchOpen is true', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('200.00') }

      await duckly.openBatchOpen()
      await duckly.connect(client).mint(10, options)

      expect(await duckly.balanceOf(await client.getAddress())).to.equal(10n)
      expect(await duckly.mintedOpen()).to.equal(10n)
    })

    it('Should not mint when client send wrong price and isBatchOpen is true', async () => {
      const { duckly, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('19.99') }

      await duckly.openBatchOpen()

      try {

        await duckly.connect(client).mint(1, options)
      } catch (err) {
        const error: Error = err as Error

        expect(error.message).to.include('Not enough founds')
      }
    })

    it('Should mint 2048 Duckly by price open', async () => {
      const { duckly } = await loadFixture(deployDuckly)
      const clients = await hre.ethers.getSigners()
      const options = { value: hre.ethers.parseEther('200.0') }
      const options8 = { value: hre.ethers.parseEther('160.0') }

      await duckly.openBatchOpen()
      expect(await duckly.isBatchOpen()).to.true

      for (let index = 1; index <= 10; index++) {
        await duckly.mintTo(await clients[index], 200)
        expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(200)
      }

      expect(await duckly.totalSupply()).to.equal(2000)

      for (let index = 11; index <= 15; index++) {
        if (index === 15) {
          await duckly.connect(clients[index]).mint(8, options8)
          expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(8)
          return;
        }

        await duckly.connect(clients[index]).mint(10, options)
        expect(await duckly.balanceOf(await clients[index].getAddress())).to.equal(10)
      }

      expect(await duckly.totalSupply()).to.equal(2048)
      expect(await duckly.mintedOpen()).to.equal(2048)
    })
  })

  describe('Mint mixed - Gueio, Apple Tree and Open', () => {
    it('Should mint 4 Duckly with Gueio and 10 with Apple Tree', async () => {
      const { duckly, gueio, appleTree, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('80.0') }
      const optionsDuckly = { value: hre.ethers.parseEther('244.0') }

      await gueio.openBatch4()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch4Mint(2, optionsGueio)
      expect(await gueio.balanceOf(await client.getAddress())).to.equal(2)

      await appleTree.mint(await client.getAddress(), 10)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(10)

      await duckly.openBatchGueioHolders()
      expect(await duckly.isBatchGueioHolders()).to.true

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await duckly.connect(client).mint(14, optionsDuckly)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(14)
      expect(await duckly.mintedWithGueio()).to.equal(4)
      expect(await duckly.mintedWithAppleTree()).to.equal(10)
    })

    it('Should mint 5 Duckly so 2 Duckly by price Gueio holder and 3 open price', async () => {
      const { duckly, gueio, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('16.0') }
      const optionsDuckly = { value: hre.ethers.parseEther('92.0') }

      await gueio.openBatch0()
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch0Mint(optionsGueio)

      expect(await gueio.balanceOf(await client.getAddress())).to.equal(1)

      await duckly.openBatchGueioHolders()
      await duckly.openBatchOpen()
      await duckly.connect(client).mint(5, optionsDuckly)

      expect(await duckly.balanceOf(await client.getAddress())).to.equal(5)
      expect(await duckly.mintedWithGueio()).to.equal(2)
      expect(await duckly.mintedOpen()).to.equal(3)
    })

    it('Should mint 10 Duckly so 5 Duckly by price Apple Tree holder and 5 open price', async () => {
      const { duckly, appleTree, client } = await loadFixture(deployDuckly)
      const options = { value: hre.ethers.parseEther('190.0') }

      await appleTree.mint(await client.getAddress(), 5)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(5)

      await duckly.openBatchAppleTreeHolders()
      await duckly.openBatchOpen()
      expect(await duckly.isBatchAppleTreeHolders()).to.true
      expect(await duckly.isBatchOpen()).to.true

      await duckly.connect(client).mint(10, options)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(10)
      expect(await duckly.mintedWithAppleTree()).to.equal(5)
      expect(await duckly.mintedOpen()).to.equal(5)
    })

    it('Should mint 20 Duckly so 10 Duckly by price Gueio holder, 5 Apple Tree and 5 open', async () => {
      const { duckly, gueio, appleTree, client } = await loadFixture(deployDuckly)
      const optionsGueio = { value: hre.ethers.parseEther('200.0') }
      const options = { value: hre.ethers.parseEther('350.0') }

      await gueio.openBatch4()
      expect(await gueio.isBatch4()).to.true
      await gueio.addAddressOnWhitelist([await client.getAddress()])
      await gueio.connect(client).batch4Mint(5, optionsGueio)
      expect(await gueio.balanceOf(await client.getAddress())).to.equal(5)

      await appleTree.mint(await client.getAddress(), 5)
      expect(await appleTree.balanceOf(await client.getAddress())).to.equal(5)

      await duckly.openBatchGueioHolders()
      expect(await duckly.isBatchGueioHolders()).to.true

      await duckly.openBatchAppleTreeHolders()
      expect(await duckly.isBatchAppleTreeHolders()).to.true

      await duckly.openBatchOpen()
      expect(await duckly.isBatchOpen()).to.true

      await duckly.connect(client).mint(20, options)
      expect(await duckly.balanceOf(await client.getAddress())).to.equal(20)
      expect(await duckly.mintedWithGueio()).to.equal(10)
      expect(await duckly.mintedWithAppleTree()).to.equal(5)
      expect(await duckly.mintedOpen()).to.equal(5)
    })
  })
})
