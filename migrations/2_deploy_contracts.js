const Tkn = artifacts.require('Tkn');
const PunchFarm = artifacts.require('PunchFarm');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(Tkn);
  const  tkn = await Tkn.deployed();

  await deployer.deploy(PunchFarm, tkn.address);
  const pucnhFarm = await PunchFarm.deployed();
};
