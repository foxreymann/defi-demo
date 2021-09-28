import React from 'react';
import Web3 from 'web3';

import PunchToken from '../built-contracts/Punch.json';
import LPToken from '../built-contracts/LP.json';
import PunchFarm from '../built-contracts/PunchFarm.json';
import LPFarm from '../built-contracts/LPFarm.json';
import Allowances from '../built-contracts/Allowances.json';
import MasterThunder from '../built-contracts/MasterThunder.json';
import Navbar from './Navbar';
import Main from './Main';
import './App.css';

const loadWeb3 = async () => {
  try {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  } catch (error) {
    console.log('[loadWeb3] error.message => ', error.message);
  }
};

const App = () => {
  const [account, setAccount] = React.useState('0x0');


  const [punchToken, setPunchToken] = React.useState(null);
  const [lpToken, setLPToken] = React.useState(null);
  const [punchFarm, setPunchFarm] = React.useState(null);
  const [lpFarm, setLPFarm] = React.useState(null);
  const [masterThunder, setMasterThunder] = React.useState(null);
  const [allowances, setAllowances] = React.useState(null);

  const [apy, setApy] = React.useState(null);

  const [punchTokenBalance, setPunchTokenBalance] = React.useState('0');
  const [lpTokenBalance, setLPTokenBalance] = React.useState('0');
  const [stakingBalance, setStakingBalance] = React.useState('0');
  const [lpStakingBalance, setLPStakingBalance] = React.useState('0');
  const [masterStakingBalance, setMasterStakingBalance] = React.useState('0');

  const [allowanceBalance, setAllowanceBalance] = React.useState('0');
  const [masterHarvestBalance, setMasterHarvestBalance] = React.useState('0');

  const [loading, setLoading] = React.useState(true);

  const [toFarm, setToFarm] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      await loadWeb3();
      await handleLoadBlockchainData();
    })();
  }, []);

  const handleLoadBlockchainData = async () => {
    try {
      const web3 = window.web3;

      const accounts = await web3.eth.getAccounts();
      const firstAccount = accounts[0];
      setAccount(firstAccount);

      const networkId = await web3.eth.net.getId();

      const allowanceData = Allowances.networks[networkId]
      if(allowanceData) {
        const theAllowances = new web3.eth.Contract(Allowances.abi, allowanceData.address);
        setAllowances(theAllowances)
        const theAllowanceBalance = (await theAllowances.methods.addressToAllowance(firstAccount).call()).value
        setAllowanceBalance(theAllowanceBalance.toString());
      }

      // Load PunchToken
      const punchTokenData = PunchToken.networks[networkId];
      if(punchTokenData) {
        const thePunchToken = new web3.eth.Contract(PunchToken.abi, punchTokenData.address);
        setPunchToken(thePunchToken);
        const thePunchTokenBalance = await thePunchToken.methods.balanceOf(firstAccount).call();
        setPunchTokenBalance(thePunchTokenBalance.toString());

        const toFarm = web3.utils.fromWei(
          await thePunchToken.methods.balanceOf('0x1b4399A7c97ae092fB4CCDc1598b2767ECB79652').call()
        )
        setToFarm(toFarm)
      } else {
        window.alert('PunchToken contract not deployed to detected network.');
      }

      // Load LPToken
      const lpTokenData = LPToken.networks[networkId];
      if(lpTokenData) {
        const theLPToken = new web3.eth.Contract(LPToken.abi, lpTokenData.address);
        setLPToken(theLPToken);
        const theLPTokenBalance = await theLPToken.methods.balanceOf(firstAccount).call();
        setLPTokenBalance(theLPTokenBalance);
      } else {
        window.alert('LPToken contract not deployed to detected network.');
      }

      // Load PunchFarm
      const punchFarmData = PunchFarm.networks[networkId];
      if(punchFarmData) {
        const thePunchFarm = new web3.eth.Contract(PunchFarm.abi, punchFarmData.address);
        setPunchFarm(thePunchFarm);
        const theStakingBalance = await thePunchFarm.methods.stakingBalance(firstAccount).call();
        setStakingBalance(theStakingBalance);
      } else {
        window.alert('PunchFarm contract not deployed to detected network.');
      }

      // Load LPFarm
      const lpFarmData = LPFarm.networks[networkId];
      if(lpFarmData) {
        const theLPFarm = new web3.eth.Contract(LPFarm.abi, lpFarmData.address);
        const theLPToken = new web3.eth.Contract(LPToken.abi, lpTokenData.address);
        setLPFarm(theLPFarm);
        const theLPStakingBalance = await theLPFarm.methods.stakingBalance(firstAccount).call();
        setLPStakingBalance(theLPStakingBalance);
        const lpFarmStaked = web3.utils.fromWei(await theLPToken.methods.balanceOf(theLPFarm._address).call())
        console.log({lpFarmStaked})
      } else {
        window.alert('LPFarm contract not deployed to detected network.');
      }

      // Load MasterThunder
      const masterThunderData = MasterThunder.networks[networkId];
      if(masterThunderData) {
        const theMasterThunder = new web3.eth.Contract(MasterThunder.abi, masterThunderData.address);
        setMasterThunder(theMasterThunder);
        const theMasterStakingBalance = (await theMasterThunder.methods.userInfo('0', firstAccount).call()).amount;
        setMasterStakingBalance(theMasterStakingBalance);

        const theMasterHarvestBalance = (await theMasterThunder.methods.pendingPunch('0', firstAccount).call())
        setMasterHarvestBalance(theMasterHarvestBalance.toString());

        // calculate apy
        const punchPerBlock = web3.utils.fromWei(await theMasterThunder.methods.punchPerBlock().call())
        const punchPerYear = punchPerBlock * 3600 * 24 * 365
        const theLPToken = new web3.eth.Contract(LPToken.abi, lpTokenData.address);
        const masterStaked = web3.utils.fromWei(
          await theLPToken.methods.balanceOf(theMasterThunder._address).call()
        )
        console.log({masterStaked})

        const apy = punchPerYear / masterStaked * 50
        setApy(apy)



      } else {
        window.alert('MasterThunder contract not deployed to detected network.');
      }


    } catch (error) {
      console.log('[handleLoadBlockchainData] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async amount => {
    try {
      setLoading(true);
      await allowances.methods
        .withdraw()
        .send({ from: account });
      handleAllowanceDataChange();
    } catch (error) {
      console.log('[handleStakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterHarvest = async () => {
    try {
      setLoading(true);
      await masterThunder.methods
        .deposit('0', '0')
        .send({ from: account });
      handleMasterHarvestDataChange();
    } catch (error) {
      console.log('[handleStakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakePunchTokens = async amount => {
    try {
      setLoading(true);
      await punchToken.methods
        .approve(punchFarm._address, amount)
        .send({ from: account });
      await punchFarm.methods
        .stakeTokens(amount)
        .send({ from: account });

      handlePunchTokenDataChange();
      handlePunchFarmDataChange();
    } catch (error) {
      console.log('[handleStakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeLPTokens = async amount => {
    try {
      setLoading(true);
      await lpToken.methods
        .approve(lpFarm._address, amount)
        .send({ from: account });
      await lpFarm.methods
        .stakeTokens(amount)
        .send({ from: account });

      handleLPTokenDataChange();
      handleLPFarmDataChange();
    } catch (error) {
      console.log('[handleStakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeMasterTokens = async amount => {
    try {
      setLoading(true);
      await lpToken.methods
        .approve(masterThunder._address, amount)
        .send({ from: account });
      await masterThunder.methods
        .deposit('0', amount)
        .send({ from: account });

      handleLPTokenDataChange();
      handleMasterThunderDataChange();
    } catch (error) {
      console.log('[handleStakeMasterTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakePunchTokens = async () => {
    try {
      setLoading(true);
      await punchFarm.methods
        .unstakeTokens()
        .send({ from: account });

      handlePunchTokenDataChange();
      handlePunchFarmDataChange();
    } catch (error) {
      console.log('[handleUnstakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakeLPTokens = async () => {
    try {
      setLoading(true);
      await lpFarm.methods
        .unstakeTokens()
        .send({ from: account });

      handleLPTokenDataChange();
      handleLPFarmDataChange();
    } catch (error) {
      console.log('[handleUnstakeLPTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakeMasterTokens = async amount => {
    try {
      setLoading(true);
      await masterThunder.methods
        .withdraw('0', amount)
        .send({ from: account });

      handleMasterThunderDataChange();
      handleLPTokenDataChange();
    } catch (error) {
      console.log('[handleUnstakeMasterTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchTokenDataChange = async () => {
    try {
      const thePunchTokenBalance = await punchToken.methods.balanceOf(account).call();
      setPunchTokenBalance(thePunchTokenBalance.toString());
    } catch (error) {
      console.log('[handlePunchTokenDataChange] error.message => ', error.message);
    }
  };

  const handlePunchFarmDataChange = async () => {
    try {
      const theStakingBalance = await punchFarm.methods.stakingBalance(account).call();
      setStakingBalance(theStakingBalance.toString());
    } catch (error) {
      console.log('[handlePunchFarmDataChange] error.message => ', error.message);
    }
  };

  const handleMasterThunderDataChange = async () => {
    try {
      const theMasterStakingBalance = (await masterThunder.methods.userInfo('0', account).call()).amount;
      setMasterStakingBalance(theMasterStakingBalance.toString());
    } catch (error) {
      console.log('[handleMasterThunderDataChange] error.message => ', error.message);
    }
  };

  const handleLPFarmDataChange = async () => {
    try {
      const theLPStakingBalance = await lpFarm.methods.stakingBalance(account).call();
      setLPStakingBalance(theLPStakingBalance.toString());
    } catch (error) {
      console.log('[handleLPFarmDataChange] error.message => ', error.message);
    }
  };

  const handleLPTokenDataChange = async () => {
    try {
      const theLPTokenBalance = await lpToken.methods.balanceOf(account).call();
      setLPTokenBalance(theLPTokenBalance.toString());
    } catch (error) {
      console.log('[handleLPTokenDataChange] error.message => ', error.message);
    }
  };

  const handleAllowanceDataChange = async () => {
    try {
      const theAllowanceBalance = (await allowances.methods.addressToAllowance(account).call()).value
      setAllowanceBalance(theAllowanceBalance.toString());
    } catch (error) {
      console.log('[handleLPTokenDataChange] error.message => ', error.message);
    }
  };

  const handleMasterHarvestDataChange = async () => {
    try {
      const theMasterHarvestBalance = (await masterThunder.methods.pendingPunch('0', account).call())
      setMasterHarvestBalance(theMasterHarvestBalance.toString());
    } catch (error) {
      console.log('[handleMasterHarvestDataChange] error.message => ', error.message);
    }
  };

  let content;
  if(loading) {
    content = <p id="loader" className="text-center">Loading...</p>;
  } else {
    content = (
      <Main
        punchTokenBalance={punchTokenBalance}
        lpTokenBalance={lpTokenBalance}

        withdraw={handleWithdraw}
        masterHarvest={handleMasterHarvest}

        allowanceBalance={allowanceBalance}
        masterHarvestBalance={masterHarvestBalance}

        stakingBalance={stakingBalance}
        lpStakingBalance={lpStakingBalance}
        masterStakingBalance={masterStakingBalance}

        stakePunchTokens={handleStakePunchTokens}
        stakeLPTokens={handleStakeLPTokens}
        stakeMasterTokens={handleStakeMasterTokens}

        apy={apy}
        toFarm={toFarm}

        unstakePunchTokens={handleUnstakePunchTokens}
        unstakeMasterTokens={handleUnstakeMasterTokens}
        unstakeLPTokens={handleUnstakeLPTokens} />

    );
  }

  return (
    <div>
      <Navbar account={account} />
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
            <div className="content mr-auto ml-auto">
              {content}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
