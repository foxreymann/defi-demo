const Tkn = artifacts.require('Tkn');
const PunchFarm = artifacts.require('PunchFarm');
const LPFarm = artifacts.require('LPFarm');

let punchAddress, lpAddress

module.exports = async function(deployer, network, accounts) {
  console.log(`deploying Punch Farms to ${deployer.network_id} - ${deployer.network}`)

  if(108 === deployer.network_id) {
    punchAddress = '0x8c2eeccd83752db11594e699bbc8f756c4d03cb9'
    lpAddress = '0xbf1754ba478267e88b40a488acf78e56a7deba6e'
  } else {
    await deployer.deploy(Tkn);
    const  tkn = await Tkn.deployed();
    punchAddress = tkn.address
    lpAddress = tkn.address
  }


  await deployer.deploy(PunchFarm, punchAddress);
  const pucnhFarm = await PunchFarm.deployed();

  await deployer.deploy(LPFarm, lpAddress);
  const lpFarm = await LPFarm.deployed();
};
