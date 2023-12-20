import { socket_url } from "../utils/config";

const conf = {
  wshost: socket_url,
};

let BOOK = {};
let connected = false;
let connecting = false;
let cli;
let seq = null;
let channels = {};

const wsconnect = ({ saveBook, setConnectionStatus, connectionStatus }) => {
  if (!connecting && !connected) cli = new WebSocket(conf.wshost, 'protocolOne');

  if (!connectionStatus) {
    if (cli) {
      cli.close();
    }
    return;
  }

  if (connecting || connected) return;

  connecting = true;

  cli.onopen = function open() {
    console.log('WS open');
    connecting = false;
    connected = true;
    setConnectionStatus(true);
    BOOK.bids = {};
    BOOK.asks = {};
    BOOK.psnap = {};
    BOOK.mcnt = 0;

    // Sending configuration and subscription messages
    cli.send(JSON.stringify({ event: 'conf', flags: 65536 + 131072 }));
    cli.send(
      JSON.stringify({
        event: 'subscribe',
        channel: 'book',
        symbol: 'tBTCUSD',
      })
    );
  };

  cli.onclose = function close() {
    seq = null;
    console.log('WS close');
    connecting = false;
    connected = false;
    setConnectionStatus(false);
  };

  cli.onmessage = function (message_event) {
    const msg = JSON.parse(message_event.data);

    if (msg.event === 'subscribed') {
      channels[msg.channel] = msg.chanId;
      return;
    }

    if (msg.event) return;

    if (msg[0] === channels['book']) {
      if (msg[1] === 'hb') {
        seq = +msg[2];
        return;
      } else if (msg[1] === 'cs') {
        seq = +msg[3];

        const csdata = [];
        const { bids, asks } = BOOK.psnap;

        for (let i = 0; i < 25; i++) {
          if (bids[i]) {
            const price = bids[i];
            const pp = BOOK.bids[price];
            csdata.push(pp.price, pp.amount);
          }
          if (asks[i]) {
            const price = asks[i];
            const pp = BOOK.asks[price];
            csdata.push(pp.price, -pp.amount);
          }
        }
        return;
      }

      if (BOOK.mcnt === 0) {
        const pps = msg[1];
        for (let pp of pps) {
          pp = { price: pp[0], cnt: pp[1], amount: pp[2] };
          const side = pp.amount >= 0 ? 'bids' : 'asks';
          pp.amount = Math.abs(pp.amount);
          BOOK[side][pp.price] = pp;
        }
      } else {
        const cseq = +msg[2];
        const pp = { price: msg[1][0], cnt: msg[1][1], amount: msg[1][2] };

        if (!seq) {
          seq = cseq - 1;
        } else if (cseq - seq !== 1) {
          console.error('OUT OF SEQUENCE', seq, cseq);
        }

        seq = cseq;

        if (!pp.cnt) {
          const side = pp.amount > 0 ? 'bids' : 'asks';
          if (BOOK[side][pp.price]) {
            BOOK[side] = Object.fromEntries(
              Object.entries(BOOK[side]).filter(([key]) => key !== pp.price)
            );;
          }
        } else {
          const side = pp.amount >= 0 ? 'bids' : 'asks';
          pp.amount = Math.abs(pp.amount);
          BOOK = {
            ...BOOK,
            [side]: { ...BOOK[side],[pp.price]: pp}
          }
        }
      }

      for (let side of ['bids', 'asks']) {
        const sbook = BOOK[side];
        const prices = Object.keys(sbook).sort((a, b) => {
          return side === 'bids' ? +a >= +b ? -1 : 1 : +a <= +b ? -1 : 1;
        });
      
        const updatedBook = JSON.parse(JSON.stringify(BOOK))
        updatedBook.psnap[side] = prices;
        BOOK = updatedBook;
      }

      BOOK.mcnt++;
      saveBook(BOOK);
    }
  };
}

export { connected, wsconnect };
