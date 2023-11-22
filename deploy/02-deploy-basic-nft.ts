import { network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { developmentChains } from '../const';
import verify from '../utils/verify';

const deploy: DeployFunction = async ({
  deployments: { deploy, log },
  getNamedAccounts,
}) => {
  const { deployer } = await getNamedAccounts();
  log('----------------------------------------------------');
  const NftMarketplace = await deploy('BasicNFT', {
    from: deployer,
    log: true,
  });
  if (!developmentChains.includes(network.name)) {
    log('Verifying...');
    await verify(NftMarketplace.address, []);
  }
  log('----------------------------------------------------');
};

deploy.tags = ['all', 'nftMarketplace'];

export default deploy;
