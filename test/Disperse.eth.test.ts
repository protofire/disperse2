import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ETH_AMOUNT } from "./helpers/constants";

describe("Disperse - ETH Tests", function () {
  let disperse: Contract;
  let owner: SignerWithAddress;
  let recipients: SignerWithAddress[];
  let values: string[];

  beforeEach(async function () {
    [owner, ...recipients] = await ethers.getSigners();
    const Disperse = await ethers.getContractFactory("Disperse");
    disperse = await Disperse.deploy();
    await disperse.waitForDeployment();

    // Setup test values
    values = recipients.slice(0, 3).map(() => ETH_AMOUNT);
  });

  describe("disperseEther", function () {
    it("should disperse ETH correctly to multiple recipients", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(ETH_AMOUNT) * BigInt(3);

      // Record initial balances
      const initialBalances = await Promise.all(
        testRecipients.map((recipient) => ethers.provider.getBalance(recipient.address))
      );

      // Disperse ETH
      await disperse.disperseEther(
        testRecipients.map((r) => r.address),
        values,
        { value: totalAmount }
      );

      // Check final balances
      for (let i = 0; i < testRecipients.length; i++) {
        const finalBalance = await ethers.provider.getBalance(testRecipients[i].address);
        expect(finalBalance).to.equal(initialBalances[i] + BigInt(ETH_AMOUNT));
      }
    });

    it("should revert if insufficient ETH is sent", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(ETH_AMOUNT) * BigInt(3);
      const insufficientAmount = totalAmount - BigInt(ETH_AMOUNT); // Less than required amount

      await expect(
        disperse.disperseEther(
          testRecipients.map((r) => r.address),
          values,
          { value: insufficientAmount }
        )
      ).to.be.revertedWithoutReason();
    });

    it("should revert if recipients and values arrays have different lengths", async function () {
      const testRecipients = recipients.slice(0, 3);
      const invalidValues = values.slice(0, 2); // One less value than recipients
      const totalAmount = BigInt(ETH_AMOUNT) * BigInt(3);

      await expect(
        disperse.disperseEther(
          testRecipients.map((r) => r.address),
          invalidValues,
          { value: totalAmount }
        )
      ).to.be.revertedWith("Array lengths must match");
    });

    it("should return excess ETH to sender", async function () {
      const testRecipients = recipients.slice(0, 2);
      const testValues = values.slice(0, 2);
      const totalNeeded = BigInt(ETH_AMOUNT) * BigInt(2);
      const excessAmount = totalNeeded + BigInt(ETH_AMOUNT); // Send 1 extra ETH_AMOUNT

      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await disperse.disperseEther(
        testRecipients.map((r) => r.address),
        testValues,
        { value: excessAmount }
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      const expectedBalance = initialBalance - gasUsed - totalNeeded;
      
      expect(finalBalance).to.equal(expectedBalance);
    });
  });
}); 