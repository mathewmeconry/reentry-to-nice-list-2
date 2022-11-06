import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {NiceListV2, SantaCoin} from "../typechain-types";

describe("niceListV2", function () {
  let niceListV2: NiceListV2;
  let santaCoin: SantaCoin;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    const niceListV2Factory = await ethers.getContractFactory("NiceListV2");
    const santaCoinFactory = await ethers.getContractFactory("SantaCoin");

    santaCoin = await santaCoinFactory.deploy();
    niceListV2 = await niceListV2Factory.deploy(
      5,
      ethers.utils.parseEther("10"),
      santaCoin.address
    );

    const signers = await ethers.getSigners();
    deployer = signers[0];
    user = signers[1];
  });

  it("should only set new christmas by owner", async () => {
    await expect(niceListV2.setNewChristmas(10)).to.be.not.rejected;
    await expect(niceListV2.connect(user).setNewChristmas(10)).to.be.rejected;
  });

  it("should only set new stanaCoin by owner", async () => {
    await expect(niceListV2.setSantaCoin(user.address)).to.be.not.rejected;
    await expect(niceListV2.connect(user).setSantaCoin(user.address)).to.be
      .rejected;
  });

  it("should only set new buyInAmount by owner", async () => {
    await expect(niceListV2.setNewBuyInAmount(5)).to.be.not.rejected;
    await expect(niceListV2.connect(user).setNewBuyInAmount(5)).to.be.rejected;
  });

  describe("withdrawOwner", function () {
    beforeEach(async () => {
      await santaCoin
        .connect(user)
        .buyCoins({value: ethers.utils.parseEther("10")});
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("10"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("10"));
    });

    it("should be only callable by owner", async () => {
      await expect(niceListV2.withdrawOwner(user.address, 1)).to.be.not.rejected;
      await expect(niceListV2.connect(user).withdrawOwner(user.address, 1)).to.be
        .rejected;
    });

    it("should send the coins", async () => {
      await niceListV2.withdrawOwner(user.address, ethers.utils.parseEther("1"));
      expect(await santaCoin.balanceOf(user.address)).to.be.eq(
        ethers.utils.parseEther("1")
      );
    });
  });

  describe("buyIn", function () {
    beforeEach(async () => {
      await santaCoin
        .connect(user)
        .buyCoins({value: ethers.utils.parseEther("20")});
    });

    it("should put user on nice list", async () => {
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("15"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("15"));

      expect(await niceListV2.isNice(user.address)).to.be.eq(true);
    });

    it("should put user on nice list with partial buyIns", async () => {
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("15"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("5"));
      expect(await niceListV2.isNice(user.address)).to.be.eq(false);
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("5"));
      expect(await niceListV2.isNice(user.address)).to.be.eq(true);
    });

    it("should track left funds", async () => {
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("15"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("15"));

      expect(await niceListV2.buyIns(user.address)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("should detuct buyIn after entering niceListV2", async () => {
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("15"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("5"));
      expect(await niceListV2.buyIns(user.address)).to.be.eq(
        ethers.utils.parseEther("5")
      );
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("5"));
      expect(await niceListV2.buyIns(user.address)).to.be.eq(
        ethers.utils.parseEther("0")
      );
    });
  });

  describe("withdrawAsCoins", function () {
    beforeEach(async () => {
      await santaCoin
        .connect(user)
        .buyCoins({value: ethers.utils.parseEther("15")});
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("8"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("8"));
    });

    it("should send coins back", async () => {
      const previosBalance = await santaCoin.balanceOf(user.address);
      await niceListV2.connect(user).withdrawAsCoins(ethers.utils.parseEther("5"));
      const afterBalance = await santaCoin.balanceOf(user.address);
      expect(afterBalance.sub(previosBalance)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("should not allow to withdraw more than deposited", async () => {
      await expect(
        niceListV2.connect(user).withdrawAsCoins(ethers.utils.parseEther("9"))
      ).to.be.reverted;
    });

    it("should update balance", async () => {
      const previousBalance = await niceListV2.buyIns(user.address);
      await niceListV2.connect(user).withdrawAsCoins(ethers.utils.parseEther("5"));
      const afterBalance = await niceListV2.buyIns(user.address);
      expect(previousBalance.sub(afterBalance)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });
  });

  describe("withdrawEther", function () {
    beforeEach(async () => {
      await santaCoin
        .connect(user)
        .buyCoins({value: ethers.utils.parseEther("15")});
      await santaCoin
        .connect(user)
        .increaseAllowance(niceListV2.address, ethers.utils.parseEther("8"));
      await niceListV2.connect(user).buyIn(ethers.utils.parseEther("8"));
    });

    it("should withdraw as ether", async () => {
      const previousBalance = await ethers.provider.getBalance(user.address);
      const tx = await niceListV2
        .connect(user)
        .withdrawAsEther(ethers.utils.parseEther("5"));
      const receipt = await tx.wait();
      const afterBalance = await ethers.provider.getBalance(user.address);
      expect(
        afterBalance
          .add(receipt.effectiveGasPrice.mul(receipt.gasUsed))
          .sub(previousBalance)
      ).to.be.eq(ethers.utils.parseEther("5"));
    });

    it("should burn coins", async () => {
      const previousBalance = await santaCoin.totalSupply();
      await niceListV2
        .connect(user)
        .withdrawAsEther(ethers.utils.parseEther("5"));
      const afterBalance = await santaCoin.totalSupply();
      expect(previousBalance.sub(afterBalance)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("should transfer from niceListV2", async () => {
      const previousBalance = await santaCoin.balanceOf(niceListV2.address);
      await niceListV2
        .connect(user)
        .withdrawAsEther(ethers.utils.parseEther("5"));
      const afterBalance = await santaCoin.balanceOf(niceListV2.address);
      expect(previousBalance.sub(afterBalance)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("should update balance", async () => {
      const previousBalance = await niceListV2.buyIns(user.address);
      await niceListV2
        .connect(user)
        .withdrawAsEther(ethers.utils.parseEther("5"));
      const afterBalance = await niceListV2.buyIns(user.address);
      expect(previousBalance.sub(afterBalance)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("should block reentry", async () => {
      const testReentryFactory = await ethers.getContractFactory("TestReentry");
      const testReentry = await testReentryFactory.deploy(niceListV2.address, santaCoin.address);

      await testReentry
        .connect(user)
        .buyIn({value: ethers.utils.parseEther("5")});

      await expect(
        testReentry.connect(user).attack(ethers.utils.parseEther("5"))
      ).to.be.reverted;
    });
  });
});
