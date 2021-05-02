
import React from 'react';

import ttswap from '../ttswap.png';
import punch from '../punch.png';
import m2x from '../icon-2x.svg';

const Main = ({
  allowanceBalance,
 stakingBalance,
 lpStakingBalance,
  lpTokenBalance,
  stakePunchTokens,
  stakeLPTokens,
  punchTokenBalance,
  unstakePunchTokens,
  unstakeLPTokens,
}) => {
  const inputRef = React.useRef(null);
  const lpInputRef = React.useRef(null);

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

  return (
    <div id="content" className="mt-3 text-muted">
      <h4>Dividends</h4>
      {window.web3.utils.fromWei(allowanceBalance, 'Ether')}
      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg">
        WITHDRAW
      </button>

      <hr />
      <hr />
      <hr />
      <h4>$PUNCH <img src={punch} height='32' /> Staking</h4>
      <table className="table table-borderless text-muted text-center">
        <thead>
          <tr>
            <th scope="col">Wallet $PUNCH</th>
            <th scope="col">Staked $PUNCH</th>
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
      <h4><img src={ttswap} height='32' /> Liqudity Staking&nbsp;<img src={m2x} height='32'/>
      </h4>
      <table className="table table-borderless text-muted text-center">
        <thead>
          <tr>
            <th scope="col">Wallet $PUNCH LP</th>
            <th scope="col">Staked $PUNCH LP</th>
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
                  <img src={punch} height="32" />
                  <img src={ttswap} height='20' />
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
              <img src={m2x} />
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

    </div>
  );
};

export default Main;
