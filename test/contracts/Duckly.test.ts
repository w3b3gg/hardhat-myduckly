import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"

describe("Duckly NFT", function () {
  async function deployDucklyFixture() {
    const [owner, otherAccount] = await ethers.getSigners()

    const MYDLY = await ethers.getContractFactory("MYDLY")
    const mydly = await MYDLY.deploy(owner.address)
    await mydly.waitForDeployment()

    const Duckly = await ethers.getContractFactory("Duckly")
    const duckly = await Duckly.deploy(owner.address, await mydly.getAddress())
    await duckly.waitForDeployment()

    const initialMint = ethers.parseUnits("1000000", 18)
    await mydly.transfer(otherAccount.address, initialMint)

    return { duckly, mydly, owner, otherAccount }
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { duckly, owner } = await loadFixture(deployDucklyFixture)
      expect(await duckly.owner()).to.equal(owner.address)
    })

    it("Should have correct name and symbol", async function () {
      const { duckly } = await loadFixture(deployDucklyFixture)
      expect(await duckly.name()).to.equal("Duckly")
      expect(await duckly.symbol()).to.equal("DKY")
    })

    it("Should have correct base URI", async function () {
      const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        await duckly.PUBLIC_MINT_PRICE()
      )
      await duckly.connect(otherAccount).safeMint(otherAccount.address)

      expect(await duckly.tokenURI(0)).to.equal(
        "https://dev.myduckly.com/api/nft/duckly/0"
      )
    })
  })

  describe("Minting", function () {
    it("Should allow minting with correct payment", async function () {
      const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        await duckly.PUBLIC_MINT_PRICE()
      )

      await duckly.connect(otherAccount).safeMint(otherAccount.address)

      expect(await duckly.balanceOf(otherAccount.address)).to.equal(1)
      expect(await duckly.tokenURI(0)).to.equal("https://dev.myduckly.com/api/nft/duckly/0")
    })

    it("Should fail if insufficient allowance", async function () {
      const { duckly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await expect(
        duckly.connect(otherAccount).safeMint(otherAccount.address)
      ).to.be.revertedWithCustomError(duckly, "InsufficientPayment")
    })

    it("Should fail if trying to mint beyond MAX_SUPPLY_GENESIS", async function () {
      const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      const mintPrice = await duckly.PUBLIC_MINT_PRICE()
      const maxSupply = await duckly.MAX_SUPPLY_GENESIS()
      
      const totalNeeded = mintPrice * BigInt(maxSupply)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        totalNeeded
      )

      for (let i = 0; i < Number(maxSupply); i++) {
        await duckly.connect(otherAccount).safeMint(otherAccount.address)
      }

      await expect(
        duckly.connect(otherAccount).safeMint(otherAccount.address)
      ).to.be.revertedWithCustomError(duckly, "ExceedsMaxSupply")
    })

    it("Should increment token IDs correctly", async function () {
      const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      const mintPrice = await duckly.PUBLIC_MINT_PRICE()
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        mintPrice * 3n
      )

      await duckly.connect(otherAccount).safeMint(otherAccount.address)
      await duckly.connect(otherAccount).safeMint(otherAccount.address)
      await duckly.connect(otherAccount).safeMint(otherAccount.address)

      expect(await duckly.tokenURI(0)).to.equal("https://dev.myduckly.com/api/nft/duckly/0")
      expect(await duckly.tokenURI(1)).to.equal("https://dev.myduckly.com/api/nft/duckly/1")
      expect(await duckly.tokenURI(2)).to.equal("https://dev.myduckly.com/api/nft/duckly/2")
    })
  })

  describe("Bulk Minting Functions", function () {
    describe("mintThree", function () {
      it("Should mint 3 tokens with 10% discount", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const mintPrice = await duckly.PUBLIC_MINT_PRICE()
        const discountedPrice = (mintPrice * 3n * 90n) / 100n // 10% discount
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          discountedPrice
        )
  
        await duckly.connect(otherAccount).mintThree(otherAccount.address)
        
        expect(await duckly.balanceOf(otherAccount.address)).to.equal(3)
        expect(await mydly.balanceOf(await duckly.getAddress())).to.equal(discountedPrice)
      })
  
      it("Should fail if insufficient allowance for mintThree", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const insufficientAmount = (await duckly.PUBLIC_MINT_PRICE()) * 2n // Only approve for 2 tokens
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          insufficientAmount
        )
  
        await expect(
          duckly.connect(otherAccount).mintThree(otherAccount.address)
        ).to.be.revertedWithCustomError(duckly, "InsufficientPayment")
      })
    })
  
    describe("mintFive", function () {
      it("Should mint 5 tokens with 15% discount", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const mintPrice = await duckly.PUBLIC_MINT_PRICE()
        const discountedPrice = (mintPrice * 5n * 85n) / 100n // 15% discount
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          discountedPrice
        )
  
        await duckly.connect(otherAccount).mintFive(otherAccount.address)
        
        expect(await duckly.balanceOf(otherAccount.address)).to.equal(5)
        expect(await mydly.balanceOf(await duckly.getAddress())).to.equal(discountedPrice)
      })
  
      it("Should fail if insufficient allowance for mintFive", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const insufficientAmount = (await duckly.PUBLIC_MINT_PRICE()) * 4n // Only approve for 4 tokens
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          insufficientAmount
        )
  
        await expect(
          duckly.connect(otherAccount).mintFive(otherAccount.address)
        ).to.be.revertedWithCustomError(duckly, "InsufficientPayment")
      })
    })
  
    describe("mintBulk", function () {
      it("Should mint requested number of tokens with 15% discount", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const quantity = 10n
        const mintPrice = await duckly.PUBLIC_MINT_PRICE()
        const discountedPrice = (mintPrice * quantity * 85n) / 100n // 15% discount
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          discountedPrice
        )
  
        await duckly.connect(otherAccount).mintBulk(otherAccount.address, quantity)
        
        expect(await duckly.balanceOf(otherAccount.address)).to.equal(quantity)
        expect(await mydly.balanceOf(await duckly.getAddress())).to.equal(discountedPrice)
      })
  
      it("Should fail if quantity is zero", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        await expect(
          duckly.connect(otherAccount).mintBulk(otherAccount.address, 0)
        ).to.be.revertedWithCustomError(duckly, "InvalidQuantity")
          .withArgs(0)
      })
  
      it("Should fail if minting to zero address", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        await expect(
          duckly.connect(otherAccount).mintBulk(ethers.ZeroAddress, 1)
        ).to.be.revertedWithCustomError(duckly, "ZeroAddress")
      })
    })
  
    describe("Events", function () {
      it("Should emit BatchMint event for single mint", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          await duckly.PUBLIC_MINT_PRICE()
        )
  
        await expect(duckly.connect(otherAccount).safeMint(otherAccount.address))
          .to.emit(duckly, "BatchMint")
          .withArgs(otherAccount.address, 0, 1)
      })
  
      it("Should emit PaymentProcessed event", async function () {
        const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
        
        const mintPrice = await duckly.PUBLIC_MINT_PRICE()
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          mintPrice
        )
  
        await expect(duckly.connect(otherAccount).safeMint(otherAccount.address))
          .to.emit(duckly, "PaymentProcessed")
          .withArgs(otherAccount.address, mintPrice)
      })
  
      it("Should emit WithdrawProcessed event", async function () {
        const { duckly, mydly, owner, otherAccount } = await loadFixture(deployDucklyFixture)
        
        await mydly.connect(otherAccount).approve(
          await duckly.getAddress(),
          await duckly.PUBLIC_MINT_PRICE()
        )
        await duckly.connect(otherAccount).safeMint(otherAccount.address)
  
        const contractBalance = await mydly.balanceOf(await duckly.getAddress())
  
        await expect(duckly.connect(owner).withdraw())
          .to.emit(duckly, "WithdrawProcessed")
          .withArgs(owner.address, contractBalance)
      })
    })
  
    describe("Token URI", function () {
      it("Should revert for non-existent token", async function () {
        const { duckly } = await loadFixture(deployDucklyFixture)
        
        await expect(duckly.tokenURI(999))
          .to.be.revertedWithCustomError(duckly, "ERC721NonexistentToken")
          .withArgs(999)
      })
    })
  })

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { duckly, owner } = await loadFixture(deployDucklyFixture)
      
      await duckly.connect(owner).pause()
      expect(await duckly.paused()).to.be.true

      await duckly.connect(owner).unpause()
      expect(await duckly.paused()).to.be.false
    })

    it("Should prevent non-owner from pausing", async function () {
      const { duckly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await expect(
        duckly.connect(otherAccount).pause()
      ).to.be.revertedWithCustomError(duckly, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address)
    })

    it("Should prevent minting while paused", async function () {
      const { duckly, mydly, owner, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        await duckly.PUBLIC_MINT_PRICE()
      )
      await duckly.connect(owner).pause()

      await expect(
        duckly.connect(otherAccount).safeMint(otherAccount.address)
      ).to.be.revertedWithCustomError(duckly, "ContractPaused")
    })
  })

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw collected MYDLY", async function () {
      const { duckly, mydly, owner, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        await duckly.PUBLIC_MINT_PRICE()
      )
      await duckly.connect(otherAccount).safeMint(otherAccount.address)

      const initialBalance = await mydly.balanceOf(owner.address)
      const contractBalance = await mydly.balanceOf(await duckly.getAddress())

      await duckly.connect(owner).withdraw()

      expect(await mydly.balanceOf(owner.address)).to.equal(
        initialBalance + contractBalance
      )
      expect(await mydly.balanceOf(await duckly.getAddress())).to.equal(0)
    })

    it("Should prevent withdraw when contract has no balance", async function () {
      const { duckly, owner } = await loadFixture(deployDucklyFixture)
      
      await expect(
        duckly.connect(owner).withdraw()
      ).to.be.revertedWithCustomError(duckly, "WithdrawFailed")
    })

    it("Should prevent non-owner from withdrawing", async function () {
      const { duckly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await expect(
        duckly.connect(otherAccount).withdraw()
      ).to.be.revertedWithCustomError(duckly, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address)
    })
  })

  describe("Burning", function () {
    it("Should allow token owner to burn their token", async function () {
      const { duckly, mydly, otherAccount } = await loadFixture(deployDucklyFixture)
      
      await mydly.connect(otherAccount).approve(
        await duckly.getAddress(),
        await duckly.PUBLIC_MINT_PRICE()
      )
      await duckly.connect(otherAccount).safeMint(otherAccount.address)

      await duckly.connect(otherAccount).burn(0)
      
      await expect(duckly.ownerOf(0)).to.be.revertedWithCustomError(
        duckly,
        "ERC721NonexistentToken"
      )
    })
  })
})
