import mongoose from "mongoose";

let model = null; // model name

try {
    const schema = new mongoose.Schema({
        from: String,
        to: String,
        amount: Number,
        symbol: String,
        memo: String,
        trx_id: { type: String, unique: true },
        blockNumber: Number,
        blockHash: String,
        handlerVersionName: String
    });
    schema.index({ from: 1, blockNumber: -1 });
    schema.index({ to: 1, blockNumber: -1 });

    console.log("Schema for transfer collection created");
    model = mongoose.model("transfer", schema);
    
    model.listIndexes()
        .then(indexes => {
            console.log("transfer indexes:", indexes);
        })
        .catch(console.error);
} catch (e) {
    console.log(e);
    console.log("transfer Schema in use");
    model = mongoose.model("transfer");
}

export { model };
