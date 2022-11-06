import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {SantaCoin} from "../typechain-types";

describe("SantaCoin", function () {
  let santaCoin: SantaCoin;
  let deployer: SignerWithAddress;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    const santaCoinFactory = await ethers.getContractFactory("SantaCoin");
    santaCoin = await santaCoinFactory.deploy();
  });


  describe("should mint coins equal to ether sent", function () {
    it("should mint 1 coin", async () => {
      await santaCoin.buyCoins({value: ethers.utils.parseEther("1")});
      expect(await santaCoin.balanceOf(deployer.address)).to.be.eq(
        ethers.utils.parseEther("1")
      );
      expect(await santaCoin.totalSupply()).to.be.eq(
        ethers.utils.parseEther("1")
      );
    });

    it("should mint 0.001 coin", async () => {
      await santaCoin.buyCoins({value: ethers.utils.parseEther("0.001")});
      expect(await santaCoin.balanceOf(deployer.address)).to.be.eq(
        ethers.utils.parseEther("0.001")
      );
      expect(await santaCoin.totalSupply()).to.be.eq(
        ethers.utils.parseEther("0.001")
      );
    });
  });

  it("should burn sold coins", async () => {
    await santaCoin.buyCoins({value: ethers.utils.parseEther("10")});
    expect(await santaCoin.totalSupply()).to.be.eq(
      ethers.utils.parseEther("10")
    );
    let balanceBefore = await ethers.provider.getBalance(deployer.address);
    await santaCoin.sellCoins(ethers.utils.parseEther("2"));

    let balanceAfter = await ethers.provider.getBalance(deployer.address);

    expect(balanceBefore.lt(balanceAfter)).to.be.eq(true);
    expect(await ethers.provider.getBalance(santaCoin.address)).to.be.eq(
      ethers.utils.parseEther("8")
    );
    expect(await santaCoin.totalSupply()).to.be.eq(
      ethers.utils.parseEther("8")
    );
  });
});
