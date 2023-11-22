import { run } from 'hardhat';

export default async (contractAddress: string, args?: any[]) => {
  run('verify:verify', {
    address: contractAddress,
    constructorArguments: args,
  });
};
