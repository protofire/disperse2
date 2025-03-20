import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  USDT_ADDRESS,
  USDC_ADDRESS,
  USDT_USDC_WHALE,
  AMOUNT,
} from "./helpers/constants";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
];

describe("Disperse - Token Tests", function () {
  let disperse: any;
  let owner: SignerWithAddress;
  let recipients: SignerWithAddress[];
  let whale: SignerWithAddress;
  let usdt: Contract;
  let usdc: Contract;
  let values: string[];

  before(async function () {
    [owner, ...recipients] = await ethers.getSigners();

    // Get whale signer
    await ethers.provider.send("hardhat_impersonateAccount", [USDT_USDC_WHALE]);
    whale = await ethers.getSigner(USDT_USDC_WHALE);

    // Fund the whale with some ETH for gas
    await owner.sendTransaction({
      to: whale.address,
      value: ethers.parseEther("1.0")
    });

    // Setup contracts
    usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, whale);
    usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, whale);

    // Deploy Disperse
    const Disperse = await ethers.getContractFactory("Disperse");
    disperse = await Disperse.deploy();
    await disperse.waitForDeployment();

    // Setup test values
    values = recipients.slice(0, 3).map(() => AMOUNT);
  });

  describe("disperseToken", function () {
    it("should disperse USDT correctly", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(AMOUNT) * BigInt(3);
      const disperseAddress = await disperse.getAddress();

      // Record initial balances
      const initialBalances = await Promise.all(
        testRecipients.map((recipient) => usdt.balanceOf(recipient.address))
      );

      // Approve spending
      const approveTx = await usdt.approve(disperseAddress, totalAmount);
      await approveTx.wait();

      // Disperse tokens
      await disperse
        .connect(whale)
        .disperseToken(
          USDT_ADDRESS,
          testRecipients.map((r) => r.address),
          values
        );

      // Check final balances
      for (let i = 0; i < testRecipients.length; i++) {
        const finalBalance = await usdt.balanceOf(testRecipients[i].address);
        expect(finalBalance).to.equal(initialBalances[i] + BigInt(AMOUNT));
      }
    });

    it("should disperse USDC correctly", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(AMOUNT) * BigInt(3);
      const disperseAddress = await disperse.getAddress();

      // Record initial balances
      const initialBalances = await Promise.all(
        testRecipients.map((recipient) => usdc.balanceOf(recipient.address))
      );

      // Approve spending
      const approveTx = await usdc.approve(disperseAddress, totalAmount);
      await approveTx.wait();

      // Disperse tokens
      await disperse
        .connect(whale)
        .disperseToken(
          USDC_ADDRESS,
          testRecipients.map((r) => r.address),
          values
        );

      // Check final balances
      for (let i = 0; i < testRecipients.length; i++) {
        const finalBalance = await usdc.balanceOf(testRecipients[i].address);
        expect(finalBalance).to.equal(initialBalances[i] + BigInt(AMOUNT));
      }
    });
  });

  describe("disperseTokenSimple", function () {
    it("should disperse USDT correctly using simple method", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(AMOUNT) * BigInt(3);
      const disperseAddress = await disperse.getAddress();

      // Record initial balances
      const initialBalances = await Promise.all(
        testRecipients.map((recipient) => usdt.balanceOf(recipient.address))
      );

      // Approve spending
      const approveTx = await usdt.approve(disperseAddress, totalAmount);
      await approveTx.wait();

      // Disperse tokens
      await disperse
        .connect(whale)
        .disperseTokenSimple(
          USDT_ADDRESS,
          testRecipients.map((r) => r.address),
          values
        );

      // Check final balances
      for (let i = 0; i < testRecipients.length; i++) {
        const finalBalance = await usdt.balanceOf(testRecipients[i].address);
        expect(finalBalance).to.equal(initialBalances[i] + BigInt(AMOUNT));
      }
    });

    it("should disperse USDC correctly using simple method", async function () {
      const testRecipients = recipients.slice(0, 3);
      const totalAmount = BigInt(AMOUNT) * BigInt(3);
      const disperseAddress = await disperse.getAddress();

      // Record initial balances
      const initialBalances = await Promise.all(
        testRecipients.map((recipient) => usdc.balanceOf(recipient.address))
      );

      // Approve spending
      const approveTx = await usdc.approve(disperseAddress, totalAmount);
      await approveTx.wait();

      // Disperse tokens
      await disperse
        .connect(whale)
        .disperseTokenSimple(
          USDC_ADDRESS,
          testRecipients.map((r) => r.address),
          values
        );

      // Check final balances
      for (let i = 0; i < testRecipients.length; i++) {
        const finalBalance = await usdc.balanceOf(testRecipients[i].address);
        expect(finalBalance).to.equal(initialBalances[i] + BigInt(AMOUNT));
      }
    });
  });
}); 