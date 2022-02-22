
import {getCachedPayout, cachePayout} from "../src/mappings/Payout";

describe("Will test the Payout Cache functions", ()=>{

    it("Will Create Test Entries", ()=>{
        cachePayout({
            id: "1-10",
            blockNumber: BigInt(1),
            eventIndex: 10,
            era: BigInt(1),
            validatorId: "v1"
        });
        cachePayout({
            id: "1-20",
            blockNumber: BigInt(1),
            eventIndex: 20,
            era: BigInt(2),
            validatorId: "v2"
        })
        cachePayout({
            id: "1-30",
            blockNumber: BigInt(1),
            eventIndex: 30,
            era: BigInt(3),
            validatorId: "v3"
        })
        cachePayout({
            id: "1-40",
            blockNumber: BigInt(1),
            eventIndex: 40,
            era: BigInt(4),
            validatorId: "v4"
        })
        cachePayout({
            id: "2-31",
            blockNumber: BigInt(1),
            eventIndex: 31,
            era: BigInt(5),
            validatorId: "v2"
        })

        cachePayout({
            id: "2-50",
            blockNumber: BigInt(2),
            eventIndex: 50,
            era: BigInt(5),
            validatorId: "v2"
        })

        let p = getCachedPayout(BigInt(1),35, console)

        // The Payout right before eventIndex 35 in Block 1
        expect(p.eventIndex==30);

    });


});