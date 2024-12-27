import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"

describe("MYDLY Token", function () {
  async function deployMYDLYFixture() {
    const [owner, otherAccount] = await ethers.getSigners()
    const MYDLY = await ethers.getContractFactory("MYDLY")
    const mydly = await MYDLY.deploy(owner.address)
    return { mydly, owner, otherAccount }
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      expect(await mydly.owner()).to.equal(owner.address)
    })

    it("Should have correct name and symbol", async function () {
      const { mydly } = await loadFixture(deployMYDLYFixture)
      expect(await mydly.name()).to.equal("MYDLY")
      expect(await mydly.symbol()).to.equal("MYDLY")
    })

    it("Should mint initial supply to owner", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      const expectedSupply = ethers.parseUnits("10000000", 18)
      expect(await mydly.totalSupply()).to.equal(expectedSupply)
      expect(await mydly.balanceOf(owner.address)).to.equal(expectedSupply)
    })
  })

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { mydly, otherAccount } = await loadFixture(deployMYDLYFixture)
      
      const transferAmount = ethers.parseUnits("50", 18)
      await mydly.transfer(otherAccount.address, transferAmount)

      expect(await mydly.balanceOf(otherAccount.address)).to.equal(transferAmount)
    })

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { mydly, owner, otherAccount } = await loadFixture(deployMYDLYFixture)
      const initialOwnerBalance = await mydly.balanceOf(owner.address)

      await expect(
        mydly.connect(otherAccount).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(mydly, "ERC20InsufficientBalance")

      expect(await mydly.balanceOf(owner.address)).to.equal(initialOwnerBalance)
    })
  })

  describe("Burning", function () {
    it("Should allow token burning", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      const burnAmount = ethers.parseUnits("100", 18)
      const initialSupply = await mydly.totalSupply()
      
      await mydly.burn(burnAmount)
      
      expect(await mydly.totalSupply()).to.equal(initialSupply - burnAmount)
      expect(await mydly.balanceOf(owner.address)).to.equal(initialSupply - burnAmount)
    })

    it("Should fail if trying to burn more than balance", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      const totalSupply = await mydly.totalSupply()
      
      await expect(
        mydly.burn(totalSupply + 1n)
      ).to.be.revertedWithCustomError(mydly, "ERC20InsufficientBalance")
    })
  })

  describe("Pausable", function () {
    it("Should start unpaused", async function () {
      const { mydly } = await loadFixture(deployMYDLYFixture)
      expect(await mydly.paused()).to.be.false
    })

    it("Should allow owner to pause", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      
      await mydly.pause()
      expect(await mydly.paused()).to.be.true
    })

    it("Should allow owner to unpause", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      
      await mydly.pause()
      await mydly.unpause()
      expect(await mydly.paused()).to.be.false
    })

    it("Should prevent non-owner from pausing", async function () {
      const { mydly, otherAccount } = await loadFixture(deployMYDLYFixture)
      
      await expect(
        mydly.connect(otherAccount).pause()
      ).to.be.revertedWithCustomError(mydly, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address)
    })

    it("Should prevent non-owner from unpausing", async function () {
      const { mydly, otherAccount, owner } = await loadFixture(deployMYDLYFixture)
      
      await mydly.pause()
      await expect(
        mydly.connect(otherAccount).unpause()
      ).to.be.revertedWithCustomError(mydly, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address)
    })

    it("Should prevent transfers while paused", async function () {
      const { mydly, owner, otherAccount } = await loadFixture(deployMYDLYFixture)
      const amount = ethers.parseUnits("100", 18)
      
      await mydly.pause()
      
      await expect(
        mydly.transfer(otherAccount.address, amount)
      ).to.be.revertedWithCustomError(mydly, "EnforcedPause")
    })

    it("Should prevent transferFrom while paused", async function () {
      const { mydly, owner, otherAccount } = await loadFixture(deployMYDLYFixture)
      const amount = ethers.parseUnits("100", 18)
      
      await mydly.approve(otherAccount.address, amount)
      await mydly.pause()
      
      await expect(
        mydly.connect(otherAccount).transferFrom(owner.address, otherAccount.address, amount)
      ).to.be.revertedWithCustomError(mydly, "EnforcedPause")
    })

    it("Should prevent burning while paused", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      const amount = ethers.parseUnits("100", 18)
      
      await mydly.pause()
      
      await expect(
        mydly.burn(amount)
      ).to.be.revertedWithCustomError(mydly, "EnforcedPause")
    })

    it("Should allow transfers after unpausing", async function () {
      const { mydly, owner, otherAccount } = await loadFixture(deployMYDLYFixture)
      const amount = ethers.parseUnits("100", 18)
      
      await mydly.pause()
      await mydly.unpause()
      
      await expect(
        mydly.transfer(otherAccount.address, amount)
      ).to.not.be.reverted
      
      expect(await mydly.balanceOf(otherAccount.address)).to.equal(amount)
    })

    it("Should emit Paused event", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      
      await expect(mydly.pause())
        .to.emit(mydly, "Paused")
        .withArgs(owner.address)
    })

    it("Should emit Unpaused event", async function () {
      const { mydly, owner } = await loadFixture(deployMYDLYFixture)
      
      await mydly.pause()
      await expect(mydly.unpause())
        .to.emit(mydly, "Unpaused")
        .withArgs(owner.address)
    })
  })
  
  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { mydly, owner, otherAccount } = await loadFixture(deployMYDLYFixture)
      
      await mydly.transferOwnership(otherAccount.address)
      expect(await mydly.owner()).to.equal(otherAccount.address)
    })

    it("Should prevent non-owners from transferring ownership", async function () {
      const { mydly, otherAccount } = await loadFixture(deployMYDLYFixture)
      
      await expect(
        mydly.connect(otherAccount).transferOwnership(otherAccount.address)
      ).to.be.revertedWithCustomError(mydly, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address)
    })
  })
})
