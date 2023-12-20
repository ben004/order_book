import React, { useEffect, useState, useCallback } from 'react';
import { throttle } from 'lodash';
import { MdZoomIn, MdZoomOut } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';

import { wsconnect } from './services/socket';
import { add } from './store/appSlice';
import { numberWithCommas, calculateTotal, getMaxTotal, getPrecision } from './utils/lib'
import './App.scss';

const PRECISION = ['P0', 'P1'];

const App = () => {
  const book = useSelector((s) => s.app);
  const { asks, bids } = book;
  const dispatch = useDispatch();

  const saveBook = useCallback(throttle((b) => dispatch(add(b)), 500), [dispatch]);

  const [precision, setPrecision] = useState(0);
  const [scale, setScale] = useState(1.0);

  const incPrecision = () => setPrecision((prevPrecision) => (prevPrecision + 1) % PRECISION.length);
  const decScale = () => setScale((prevScale) => prevScale + 0.1);
  const incScale = () => setScale((prevScale) => prevScale - 0.1);

  const [connectionStatus, setConnectionStatus] = useState(true);

  const startConnection = () => !connectionStatus && setConnectionStatus(true);
  const stopConnection = () => connectionStatus && setConnectionStatus(false);

  useEffect(() => {
    wsconnect({ book, saveBook, setConnectionStatus, connectionStatus });
  }, [book, saveBook, setConnectionStatus, connectionStatus]);

  const _asks = asks && calculateTotal(asks);
  const maxAsksTotal = getMaxTotal(_asks);

  const _bids = bids && calculateTotal(bids);
  const maxBidsTotal = getMaxTotal(_bids);

  return (
    <div>
      <div className="panel">
        <div className="bar-div">
          <h3>
            Order Book <span>BTC/USD</span>
          </h3>
          <div className="tool-div">
            {!connectionStatus && <div className="icon-div" onClick={startConnection}>Connect</div>}
            {connectionStatus && <div className="icon-div" onClick={stopConnection}>Disconnect</div>}
            <div className="icon-div" onClick={incPrecision}>precision</div>
            <div className="icon-div" onClick={decScale}><MdZoomOut /></div>
            <div className="icon-div" onClick={incScale}><MdZoomIn /></div>
          </div>
        </div>
        <div className="sides">
          <table>
            <thead>
              <tr className="table-row">
                <td className="col-td count">Count</td>
                <td className="col-td">Amount</td>
                <td className="col-td total">Total</td>
                <td className="col-td">Price</td>
              </tr>
            </thead>
            <tbody>
              {_bids &&
                Object.keys(_bids).map((k, i) => {
                  const item = _bids[k];
                  const { cnt, amount, price, total } = item;
                  const percentage = ((total * 100) / (maxBidsTotal * scale)).toFixed(2);
                  return (
                    <tr
                      className="table-row"
                      key={`book-${cnt}${amount}${price}${total}`}
                      style={{
                        backgroundImage: `linear-gradient(to left, #314432 ${percentage}%, #1b262d 0%)`,
                      }}
                    >
                      <td className="col-td count">{cnt}</td>
                      <td className="col-td">{amount.toFixed(2)}</td>
                      <td className="col-td total">{total.toFixed(2)}</td>
                      <td className="col-td">{numberWithCommas(price.toFixed(getPrecision(precision)))}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <table>
            <thead>
              <tr className="table-row">
                <td className="col-td">Price</td>
                <td className="col-td total">Total</td>
                <td className="col-td">Amount</td>
                <td className="col-td count">Count</td>
              </tr>
            </thead>
            <tbody>
              {_asks &&
                Object.keys(_asks).map((k, i) => {
                  const item = _asks[k];
                  const { cnt, amount, price, total } = item;
                  const percentage = ((total * 100) / (maxAsksTotal * scale)).toFixed(2);
                  return (
                    <tr
                      key={i}
                      className="table-row"
                      style={{
                        backgroundImage: `linear-gradient(to right, #402c33 ${percentage}%, #1b262d 0%)`,
                      }}
                    >
                      <td className="col-td">{numberWithCommas(price.toFixed(getPrecision(precision)))}</td>
                      <td className="col-td total">{total.toFixed(2)}</td>
                      <td className="col-td">{amount.toFixed(2)}</td>
                      <td className="col-td count">{cnt}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;