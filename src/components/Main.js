
import React from 'react';

import ttswap from '../ttswap.png';
import punch from '../punch.png';
import lp from '../lp.png';
import m8x from '../icon-8x.png';
import Currency from './Currency';

const round = amount => {
    amount = amount + ''
    if(amount && amount.includes &&  amount.includes('.')) {
      amount = amount.substring(0, amount.indexOf('.') + 3)
    }
    return amount
}

const Main = ({
  allowanceBalance,
  masterHarvestBalance,
 stakingBalance,
  masterStakingBalance,
 lpStakingBalance,
  lpTokenBalance,
  stakePunchTokens,
  stakeLPTokens,
  stakeMasterTokens,
  punchTokenBalance,
  unstakePunchTokens,
  unstakeLPTokens,
  unstakeMasterTokens,
  withdraw,
  masterHarvest,
  apy
}) => {
  const inputRef = React.useRef(null);
  const lpInputRef = React.useRef(null);
  const masterInputRef = React.useRef(null);

  const handleSubmit = event => {
    event.preventDefault();

    let amount;
    amount = inputRef.current.value.toString();
    amount = window.web3.utils.toWei(amount, 'Ether');
    stakePunchTokens(amount);
  };

  const handleLPSubmit = event => {
    event.preventDefault();

    let amount;
    amount = lpInputRef.current.value.toString();
    amount = window.web3.utils.toWei(amount, 'Ether');
    stakeLPTokens(amount);
  };

  const handleMasterSubmit = event => {
    event.preventDefault();

    let amount;
    amount = masterInputRef.current.value.toString();
    amount = window.web3.utils.toWei(amount, 'Ether');
    stakeMasterTokens(amount);
  };

  return (
    <div id="content" className="mt-3 text-muted">

      <h4>Farming Profit</h4>
      <h4><Currency amount={masterHarvestBalance} currency={'punch'} /></h4>
      <button
        className="btn btn-primary btn-block btn-lg"
        onClick={masterHarvest}>
        HARVEST
      </button>

      <hr />
      <hr />
      <hr />

      <h4>Dividends Profit</h4>
      <h4><Currency amount={allowanceBalance}/></h4>
      <button
        className="btn btn-primary btn-block btn-lg"
        onClick={withdraw}>
        WITHDRAW
      </button>

      <hr />
      <hr />
      <hr />

      <h4>PUNCH-TT <img src={lp} height='32' /> Farm</h4>
      <h4 className="apy">APY: {round(apy)}%</h4>
      <table className="table table-borderless text-muted text-center">
        <thead>
          <tr>
            <th scope="col">Wallet PUNCH-TT LP</th>
            <th scope="col">Staked PUNCH-TT LP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {window.web3.utils.fromWei(lpTokenBalance, 'Ether')}
            </td>
            <td>
              {window.web3.utils.fromWei(masterStakingBalance, 'Ether')}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="card mb-4" >
        <div className="card-body">
          <form
            className="mb-3"
            onSubmit={handleMasterSubmit}>
            <div className="input-group mb-4">
              <div className="input-group-prepend">
                <div className="input-group-text">
                  <img src={lp} height="32" />
                </div>
              </div>
              <input
                type="text"
                ref={masterInputRef}
                className="form-control form-control-lg"
                defaultValue={window.web3.utils.fromWei(lpTokenBalance, 'Ether')}
                required />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg multibutton">
              STAKE!
            </button>
          </form>
          <button
            className="btn btn-link btn-block btn-sm"
            onClick={() => unstakeMasterTokens(masterStakingBalance)}>
            UN-STAKE...
          </button>
        </div>
      </div>

      <hr />
      <hr />
      <hr />
      <h4>PUNCH <img src={punch} height='32' /> Dividends</h4>
      <table className="table table-borderless text-muted text-center">
        <thead>
          <tr>
            <th scope="col">Wallet PUNCH</th>
            <th scope="col">Staked PUNCH</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {window.web3.utils.fromWei(punchTokenBalance, 'Ether')}
            </td>
            <td>
              {window.web3.utils.fromWei(stakingBalance, 'Ether')}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="card mb-4" >
        <div className="card-body">
          <form
            className="mb-3"
            onSubmit={handleSubmit}>
            <div className="input-group mb-4">
              <div className="input-group-prepend">
                <div className="input-group-text">
                  <img src={punch} height="32" />
                </div>
              </div>
              <input
                type="text"
                ref={inputRef}
                className="form-control form-control-lg"
                placeholder="0"
                required />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg">
              STAKE!
            </button>
          </form>
          <button
            className="btn btn-link btn-block btn-sm"
            onClick={unstakePunchTokens}>
            UN-STAKE...
          </button>
        </div>
      </div>
      <hr />
      <hr />
      <hr />
      <h4>PUNCH-TT <img src={lp} height='32' /> Dividends</h4>
      <table className="table table-borderless text-muted text-center">
        <thead>
          <tr>
            <th scope="col">Wallet PUNCH-TT LP</th>
            <th scope="col">Staked PUNCH-TT LP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {window.web3.utils.fromWei(lpTokenBalance, 'Ether')}
            </td>
            <td>
              {window.web3.utils.fromWei(lpStakingBalance, 'Ether')}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="card mb-4" >
        <div className="card-body">
          <form
            className="mb-3"
            onSubmit={handleLPSubmit}>
            <div className="input-group mb-4">
              <div className="input-group-prepend">
                <div className="input-group-text">
                  <img src={lp} height='32' />
                </div>
              </div>
              <input
                type="text"
                ref={lpInputRef}
                className="form-control form-control-lg"
                placeholder="0"
                required />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg multibutton">
              STAKE!
            </button>
          </form>
          <button
            className="btn btn-link btn-block btn-sm"
            onClick={unstakeLPTokens}>
            UN-STAKE...
          </button>
        </div>
      </div>

      <a className='float-right' href='https://ttswap.space/#/add-liquidity'>
        <button>
          Add <img src={punch} height="32" /> <img src={ttswap} height='20' /> Liqudity
        </button>
      </a>

      <hr/>
      <hr/>
      <hr/>
      <div className="alert alert-secondary" role="alert">
<h4>ℹ️ How dividends work ℹ️</h4>

<p>Everytime someone takes over in Punchline (pays 21TT) 18TT goes to the prize pool, 3TT goes to dividends pool. The dividends will be shared and distributed few times per week (at random) to $PUNCH and $PUNCH LP holders who have those staked.</p>

<p>So think of owning $PUNCH just like owning company stocks whereas you get a share of the sites profits propotionally to your staked holdings.</p>
      </div>

      <div className="alert alert-secondary tokenomics" role="alert">
        <h4>🔥 Tokenomics 🔥</h4>
        <div className="mt-2">
          <h5>Tokenomics:</h5>
          <div className="progress">
            <div className="progress-bar progress-bar-striped bg-info" role="progressbar" style={{width: '53%'}}>
              Circulating<br/>supply<br/>15300
            </div>
            <div className="progress-bar progress-bar-striped bg-warning" role="progressbar" style={{width: '47%'}}>
              Farming<br/>13300
            </div>
          </div>
          <p>Total supply: 28600 $PUNCH</p>
        </div>

        <div className="mt-2">
          <h5>Maximum supply:</h5>
          <p>
            No more $PUNCH tokens can be minted, so Total Supply equals Maximum Supply so there will always be only 28600 $PUNCH
          </p>
        </div>

        <div className="mt-2">
          <h5>Token burn process:</h5>
          <p>
            Burnt tokens have been sent to a smart contract located at <a href='https://viewblock.io/thundercore/address/0x87298c4cf47bc12af5c31ad669da966afd33b109'>0x87298c4cf47bc12af5c31ad669da966afd33b109</a>. This contract has <a href='https://viewblock.io/thundercore/tx/0xb508caf19ca210ab4a0e058de123f7e6de41c65d2911b82e05644f2a1de415c3'>self destruct</a> what means no tokens can ever be withdrawn from it!
          </p>
        </div>
      </div>


    </div>
  );
};

export default Main;
