const Allowances = artifacts.require('Allowances');

module.exports = function(deployer) {
  deployer.deploy(Allowances);
};
