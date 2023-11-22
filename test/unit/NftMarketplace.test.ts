import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../const';
import { BasicNFT, NftMarketplace } from '../../typechain-types';
import { assert, expect } from 'chai';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('NftMarketplace', () => {
      const TOEKN_ID = 0;
      const PRICE = ethers.parseEther('0.01');
      let NftMarketplace: NftMarketplace;
      let BasicNFT: BasicNFT;
      let deployer: string;
      let user: string;
      let nftAddress: string;
      let marketAddress: string;
      beforeEach(async () => {
        await deployments.fixture('nftMarketplace');
        ({ deployer, user } = await getNamedAccounts());
        NftMarketplace = await ethers.getContract('NftMarketplace', deployer);
        BasicNFT = await ethers.getContract('BasicNFT', deployer);
        nftAddress = await BasicNFT.getAddress();
        marketAddress = await NftMarketplace.getAddress();
        await BasicNFT.mintNft();
        await BasicNFT.approve(marketAddress, TOEKN_ID);
      });
      describe('list item test', () => {
        it('revert if not owner', async () => {
          const NftMarketplace: NftMarketplace = await ethers.getContract(
            'NftMarketplace',
            user
          );
          await expect(
            NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_NotOwner'
          );
        });
        it('revert if nft already listed', async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
          await expect(
            NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_AlreadyListed'
          );
        });
        it('revert if price is less than 0', async () => {
          await expect(
            NftMarketplace.listItem(nftAddress, TOEKN_ID, 0)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_PriceMustBeAboveZero'
          );
        });
        it('revert if market place is not approved by nft', async () => {
          await BasicNFT.approve(ethers.ZeroAddress, TOEKN_ID);
          await expect(
            NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_NotApprovedForMarketplace'
          );
        });
        it('list item successfully when all requirements met', async () => {
          await expect(NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE))
            .to.emit(NftMarketplace, 'ItemListed')
            .withArgs(deployer, nftAddress, TOEKN_ID, PRICE);
        });
        it('update listing after list item', async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
          const listItem: NftMarketplace.ListingStruct =
            await NftMarketplace.getListing(nftAddress, TOEKN_ID);
          assert(listItem.price === PRICE);
          assert(listItem.seller === deployer);
        });
      });
      describe('cancelListing', () => {
        it('revert if nft not listed', async () => {
          await expect(
            NftMarketplace.cancelListing(nftAddress, TOEKN_ID)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_NotListed'
          );
        });
        it('cancel successfully if all requirments met', async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
          await expect(NftMarketplace.cancelListing(nftAddress, TOEKN_ID))
            .to.emit(NftMarketplace, 'ItemCanceled')
            .withArgs(deployer, nftAddress, TOEKN_ID);
          const listItem: NftMarketplace.ListingStruct =
            await NftMarketplace.getListing(nftAddress, TOEKN_ID);
          assert(listItem.price.toString() === '0');
        });
      });
      describe('buyItem', () => {
        beforeEach(async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
          NftMarketplace = await ethers.getContract('NftMarketplace', user);
        });
        it('revert if value is less than the price', async () => {
          const price = PRICE - 1n;
          await expect(
            NftMarketplace.buyItem(nftAddress, TOEKN_ID, { value: price })
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_PriceNotMet'
          );
        });
        it('transfers the nft to the buyer and update the proceeds record', async () => {
          await expect(
            NftMarketplace.buyItem(nftAddress, TOEKN_ID, { value: PRICE })
          )
            .to.emit(NftMarketplace, 'ItemBought')
            .withArgs(user, nftAddress, TOEKN_ID, PRICE);
          const sellerProceed = await NftMarketplace.getProceeds(deployer);
          assert(sellerProceed === PRICE);
          const currentOwner = await BasicNFT.ownerOf(TOEKN_ID);
          assert(currentOwner === user);
          const listItem: NftMarketplace.ListingStruct =
            await NftMarketplace.getListing(nftAddress, TOEKN_ID);
          assert(listItem.price.toString() === '0');
        });
      });
      describe('updateListing', () => {
        beforeEach(async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
        });
        it('revert if new price < 0', async () => {
          await expect(
            NftMarketplace.updateListing(nftAddress, TOEKN_ID, 0)
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_PriceMustBeAboveZero'
          );
        });
        it('update the price of the nft if all requirements met', async () => {
          const newPrice = ethers.parseEther('0.02');
          await expect(
            NftMarketplace.updateListing(nftAddress, TOEKN_ID, newPrice)
          )
            .to.emit(NftMarketplace, 'ItemListed')
            .withArgs(deployer, nftAddress, TOEKN_ID, newPrice);
          const listItem: NftMarketplace.ListingStruct =
            await NftMarketplace.getListing(nftAddress, TOEKN_ID);
          assert(listItem.price === newPrice);
        });
      });
      describe('withdraw proceeds', () => {
        beforeEach(async () => {
          await NftMarketplace.listItem(nftAddress, TOEKN_ID, PRICE);
        });
        it('revert if no proceeds', async () => {
          await expect(
            NftMarketplace.withdrawProceeds()
          ).to.be.revertedWithCustomError(
            NftMarketplace,
            'NftMarketplace_NoProceeds'
          );
        });
        it('withdraw successfully, update owner balance and proceeds record', async () => {
          const preBalance = await ethers.provider.getBalance(deployer);
          const NftMarketplaceConnectToBuyer: NftMarketplace =
            NftMarketplace.connect((await ethers.getSigners())[1]);
          await NftMarketplaceConnectToBuyer.buyItem(nftAddress, TOEKN_ID, {
            value: PRICE,
          });
          const proceed = await NftMarketplace.getProceeds(deployer);
          assert(proceed === PRICE);
          const tx = await NftMarketplace.withdrawProceeds();
          const receipt = await tx.wait();
          //@ts-ignore
          const { gasUsed, gasPrice }: { gasUsed: bigint; gasPrice: bigint } =
            receipt;
          const gasBurned = gasUsed * gasPrice;
          const curBalance = await ethers.provider.getBalance(deployer);
          assert(curBalance + gasBurned === preBalance + PRICE);
        });
      });
    });
