export interface transferState {
    from: string;
    to: string;
    amount: number;
    symbol: string;
    memo: string;
    trx_id: string;
    indexState: {
        blockNumber: number;
        blockHash: string;
        isReplay: boolean;
        handlerVersionName: string;
    };
}
export interface NodeosActionReaderOptions extends ActionReaderOptions {
    nodeosEndpoint?: string;
}
export interface ActionReaderOptions {
    startAtBlock?: number;
    onlyIrreversible?: boolean;
}