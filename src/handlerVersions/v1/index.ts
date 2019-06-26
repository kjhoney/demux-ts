/* Updaters
 * When the Action Handler receives new blocks, for each action in that block, we loop over all updaters and check if
 * the actionType matches. If it does, we run the corresponding updater's `apply` function. The order of the updaters
 * is significant, and each `apply` function is run synchronously in order to maintain determinism.
 *
 * All updater functions have the following parameters:
 *   - `state`:     This is the API provided by the ActionHandler to accumulate state. In this example, it's a simple
 *                  javascript object.
 *
 *   - `payload`:   This object contains all relevant information associated with the current action. Its contents
 *                  are completely determined by the ActionReader implementation. Since we're using demux-eos in this
 *                  example, you can see the `EosPayload` type here:
 *                  https://github.com/EOSIO/demux-js-eos/blob/develop/src/interfaces.ts
 *
 *   - `blockInfo`: Object containing information about the current block. See `BlockInfo` type here:
 *                  https://github.com/EOSIO/demux-js/blob/develop/src/interfaces.ts
 *
 *   - `context`:   This object's purpose is to provide access to temporary data between different Updaters' `apply`
 *                  (and Effects' `run`) functions of the same block. A new `context` object is created by the
 *                  ActionHandler every block. It may be pre-loaded with information by the ActionHandler, and/or may
 *                  be modified by `apply` functions themselves. This is separate from `state` because not all relevant
 *                  data may need to be permanently stored. In this way, it can be used as a fast cache (instead of
 *                  writing/reading/deleting temporary data using `state`), and is also useful for passing accumulated
 *                  or processed data to the Effects' `run` functions in a way that is safe from race conditions.
 *
 * In this example, we're watching the "eosio.token::transfer" action type and accumulating a running total using the
 * provided `state` object. Refer to the ObjectActionHandler implementation for `state`:
 * https://github.com/EOSIO/demux-js/blob/develop/examples/eos-transfers/ObjectActionHandler.js
 */

import { model } from "../../models";
import { transferState } from "../../types/types";
import { BlockInfo } from "demux";

const account = process.env.CONTRACT;

const parseTokenString = (
    tokenString: string
): { amount: number; symbol: string } => {
    const [amountString, symbol] = tokenString.split(" ");
    const amount = parseFloat(amountString);
    return { amount, symbol };
};

const updateTransferData = (
    state: transferState,
    payload: any,
    blockInfo: BlockInfo,
    context: any
): void => {
    const { amount, symbol } = parseTokenString(payload.data.quantity);
    console.log(amount);
    state.from = payload.data.from;
    state.to = payload.data.to;
    state.amount = amount;
    state.symbol = symbol;
    state.memo = payload.data.memo;
    state.trx_id = payload.transactionId;
    state.indexState.blockNumber = blockInfo.blockNumber;
    state.indexState.blockHash = blockInfo.blockHash;
    try {
        let transaction = new model({
            from: state.from,
            to: state.to,
            amount: state.amount,
            symbol: state.symbol,
            memo: state.memo,
            trx_id: state.trx_id,
            blockNumber: state.indexState.blockNumber,
            blockHash: state.indexState.blockHash,
            handlerVersionName: state.indexState.handlerVersionName
        });
        transaction.save(function(err) {
            if (err) console.log("Can not save into transfer collection");
        });
    } catch (err) {
        console.error(err);
    }

    context.stateCopy = JSON.parse(JSON.stringify(state));
};

const updaters = [
    {
        actionType: `${account}::transfer`,
        apply: updateTransferData
    }
];

const logUpdate = (payload: any, blockInfo: BlockInfo, context: any): void => {
    console.info(
        "State updated:\n",
        JSON.stringify(context.stateCopy, null, 2)
    );
};

const effects = [
    {
        actionType: `${account}::transfer`,
        run: logUpdate
    }
];

const handlerVersion = {
    versionName: "v1",
    updaters,
    effects
};

export { handlerVersion };
