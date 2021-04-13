const Tkn = artifacts.require('Tkn');
const PunchFarm = artifacts.require('PunchFarm');
const LPFarm = artifacts.require('LPFarm');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(Tkn);
  const  tkn = await Tkn.deployed();

  await deployer.deploy(PunchFarm, tkn.address);
  const pucnhFarm = await PunchFarm.deployed();

  await deployer.deploy(LPFarm, tkn.address);
  const lpFarm = await LPFarm.deployed();
};
