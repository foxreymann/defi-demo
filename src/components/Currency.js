import React from 'react';
import Web3 from "web3";

const Currency = ({ amount }) => {
  if(amount) {
    amount = Web3.utils.fromWei(amount)

    if(amount.includes('.')) {
      amount = amount.substring(0, amount.indexOf('.') + 5)
    }

    if('0.0000' === amount) {
      amount = '0'
    }

    return (
      <span className={`currency`}>
        { (+amount).toLocaleString(navigator.language) }
      </span>
    )
  }
}

export default Currency;
