
import React from 'react';
import Web3 from 'web3';

import PunchToken from '../built-contracts/Punch.json';
import LPToken from '../built-contracts/LP.json';
import PunchFarm from '../built-contracts/PunchFarm.json';
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

  const [daiToken, setPunchToken] = React.useState(null);
  const [dappToken, setLPToken] = React.useState(null);
  const [tokenFarm, setPunchFarm] = React.useState(null);

  const [daiTokenBalance, setPunchTokenBalance] = React.useState('0');
  const [dappTokenBalance, setLPTokenBalance] = React.useState('0');
  const [stakingBalance, setStakingBalance] = React.useState('0');

  const [loading, setLoading] = React.useState(true);

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

      // Load PunchToken
      const daiTokenData = PunchToken.networks[networkId];
      if(daiTokenData) {
        const thePunchToken = new web3.eth.Contract(PunchToken.abi, daiTokenData.address);
        setPunchToken(thePunchToken);
        const thePunchTokenBalance = await thePunchToken.methods.balanceOf(firstAccount).call();
        setPunchTokenBalance(thePunchTokenBalance.toString());
      } else {
        window.alert('PunchToken contract not deployed to detected network.');
      }

      // Load LPToken
      const dappTokenData = LPToken.networks[networkId];
      if(dappTokenData) {
        const theLPToken = new web3.eth.Contract(LPToken.abi, dappTokenData.address);
        setLPToken(theLPToken);
        const theLPTokenBalance = await theLPToken.methods.balanceOf(firstAccount).call();
        setLPTokenBalance(theLPTokenBalance);
      } else {
        window.alert('LPToken contract not deployed to detected network.');
      }

      // Load PunchFarm
      const tokenFarmData = PunchFarm.networks[networkId];
      if(tokenFarmData) {
        const thePunchFarm = new web3.eth.Contract(PunchFarm.abi, tokenFarmData.address);
        setPunchFarm(thePunchFarm);
        const theStakingBalance = await thePunchFarm.methods.stakingBalance(firstAccount).call();
        setStakingBalance(theStakingBalance);
      } else {
        window.alert('PunchFarm contract not deployed to detected network.');
      }
    } catch (error) {
      console.log('[handleLoadBlockchainData] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStakePunchTokens = async amount => {
    try {
      setLoading(true);
      await daiToken.methods
        .approve(tokenFarm._address, amount)
        .send({ from: account });
      await tokenFarm.methods
        .stakePunchTokens(amount)
        .send({ from: account });

      handlePunchTokenDataChange();
      handleLPTokenDataChange();
      handlePunchFarmDataChange();
    } catch (error) {
      console.log('[handleStakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakePunchTokens = async () => {
    try {
      setLoading(true);
      await tokenFarm.methods
        .unstakePunchTokens()
        .send({ from: account });
      
      handlePunchTokenDataChange();
      handleLPTokenDataChange();
      handlePunchFarmDataChange();
    } catch (error) {
      console.log('[handleUnstakeTokens] error.message => ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchTokenDataChange = async () => {
    try {
      const thePunchTokenBalance = await daiToken.methods.balanceOf(account).call();
      setPunchTokenBalance(thePunchTokenBalance.toString());
    } catch (error) {
      console.log('[handlePunchTokenDataChange] error.message => ', error.message);
    }
  };

  const handleLPTokenDataChange = async () => {
    try {
      const theLPTokenBalance = await dappToken.methods.balanceOf(account).call();
      setLPTokenBalance(theLPTokenBalance.toString());
    } catch (error) {
      console.log('[handleLPTokenDataChange] error.message => ', error.message);
    }
  };

  const handlePunchFarmDataChange = async () => {
    try {
      const theStakingBalance = await tokenFarm.methods.stakingBalance(account).call();
      setStakingBalance(theStakingBalance.toString());
    } catch (error) {
      console.log('[handlePunchFarmDataChange] error.message => ', error.message);
    }
  };

  let content;
  if(loading) {
    content = <p id="loader" className="text-center">Loading...</p>;
  } else {
    content = (
      <Main
        daiTokenBalance={daiTokenBalance}
        dappTokenBalance={dappTokenBalance}
        stakingBalance={stakingBalance}
        stakePunchTokens={handleStakePunchTokens}
        unstakePunchTokens={handleUnstakePunchTokens} />
    );
  }

  return (
    <div>
      <Navbar account={account} />
      <div className="container-fluid mt-5">
        <div className="row">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
            <div className="content mr-auto ml-auto">
              <a
                href="http://www.dappuniversity.com/bootcamp"
                target="_blank"
                rel="noopener noreferrer">
              </a>
              {content}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
