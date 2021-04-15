
import React from 'react';

import dai from '../dai.png';
import punch from '../punch.png';

const Main = ({
 stakingBalance,
  lpTokenBalance,
  stakePunchTokens,
  punchTokenBalance,
  unstakePunchTokens
}) => {
  const inputRef = React.useRef(null);

  const handleSubmit = event => {
    event.preventDefault();

    let amount;
    amount = inputRef.current.value.toString();
    amount = window.web3.utils.toWei(amount, 'Ether');
    stakePunchTokens(amount);
  };

  const handleUnstakeClick = () => {
    unstakePunchTokens();
  };

  return (
    <div
      id="content"
      className="mt-3">
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
              <img src={punch} height="32"/>
              {window.web3.utils.fromWei(punchTokenBalance, 'Ether')}
            </td>
            <td>
              <img src={punch} height="32"/>
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
              <input
                type="text"
                ref={inputRef}
                className="form-control form-control-lg"
                placeholder="0"
                required />
              <div className="input-group-append">
                <div className="input-group-text">
                  $PUNCH
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg">
              STAKE!
            </button>
          </form>
          <button
            className="btn btn-link btn-block btn-sm"
            onClick={handleUnstakeClick}>
            UN-STAKE...
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main;
