import {
    AbstractActionHandler,
    IndexState,
    NotInitializedError,
    Block,
    NextBlock,
    VersionedAction
} from "demux";
import mongoose from "mongoose";
import { transferState } from "./types/types";

const STOP_AT = parseInt(process.env.STOP_AT);

const stopAt = (blockNumber: number) => {
    // Function stop the service when meet the STOP_AT block number
    if (blockNumber >= STOP_AT) {
        console.log("\n####################\n# STOP AT: ", blockNumber);
        console.log("####################\n");
        process.exit(1);
    }
};

export class ObjectActionHandler extends AbstractActionHandler {
    constructor(
        [handleVersion]: any,
        uri: string,
        username: string,
        password: string
    ) {
        super([handleVersion]);
        let options = {
            useNewUrlParser: true,
            useCreateIndex: true,
            user: username,
            pass: password
        };
        console.log(uri);
        mongoose.connect(uri, options);
        mongoose.set("debug", true);
        mongoose.connection.on("connected", () => {
            console.info(`Mongoose default connection open to ${uri}`);
        });
        mongoose.connection.on(
            "error",
            console.error.bind(console, "Mongoose default connection error:")
        );
        mongoose.connection.on("disconnected", () => {
            console.info("Mongoose default connection disconnected");
        });
        process.on("SIGINT", () => {
            mongoose.connection.close(() => {
                console.info(
                    "Mongoose default connection disconnected through app termination"
                );
                process.exit(0);
            });
        });
    }

    public state: transferState = {
        from: "",
        to: "",
        amount: 0,
        symbol: "",
        memo: "",
        trx_id: "",
        indexState: {
            blockNumber: 0,
            blockHash: "",
            isReplay: false,
            handlerVersionName: "v1"
        }
    };

    private hashHistory: { [key: number]: string } = { 0: "" };

    get _handlerVersionName() {
        return this.handlerVersionName;
    }

    // tslint:disable-next-line
    public async handleWithState(handle: (state: any) => void) {
        try {
            await handle(this.state);
        } catch (err) {
            console.log(err);
        }
    }

    public async rollbackTo(blockNumber: number) {
        this.setLastProcessedBlockNumber(blockNumber);
        this.setLastProcessedBlockHash(this.hashHistory[blockNumber]);
        this.state.indexState = {
            ...this.state.indexState,
            blockNumber,
            blockHash: this.hashHistory[blockNumber]
        };
    }

    public setLastProcessedBlockHash(hash: string) {
        this.lastProcessedBlockHash = hash;
    }

    public setLastProcessedBlockNumber(num: number) {
        this.lastProcessedBlockNumber = num;
    }

    public async _applyUpdaters(
        state: any,
        block: Block,
        context: any,
        isReplay: boolean
    ): Promise<VersionedAction[]> {
        return this.applyUpdaters(state, block, context, isReplay);
    }

    public _runEffects(
        versionedActions: VersionedAction[],
        context: any,
        nextBlock: NextBlock
    ) {
        this.runEffects(versionedActions, context, nextBlock);
    }

    protected async loadIndexState(): Promise<IndexState> {
        return this.state.indexState;
    }

    public async handleBlock(
        nextBlock: NextBlock,
        isReplay: boolean
    ): Promise<number | null> {
        const { blockNumber, blockHash } = nextBlock.block.blockInfo;
        this.hashHistory[blockNumber] = blockHash;
        return super.handleBlock(nextBlock, isReplay);
    }

    protected async updateIndexState(
        state: any,
        block: Block,
        isReplay: boolean,
        handlerVersionName: string
    ) {
        // console.log("Processing block: ", block.blockInfo.blockNumber);
        const { blockNumber, blockHash } = block.blockInfo;

        state.indexState = {
            blockNumber,
            blockHash,
            isReplay,
            handlerVersionName
        };
        if (STOP_AT) {
            stopAt(blockNumber);
        }
    }

    protected async setup(): Promise<void> {}
}
