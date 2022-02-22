# Polkawatch

## Decentralization Analytics for Sustrate/Polkadot.

Polkawatch provides decentralization analytics about Polkadot. Allows all stake-holders to gain insights about where network activity is taking place (regional, network provider, validator group, nominator segment, etc).

With Decentralization insights the community can act to improve decentralization regardless of their role: Adjust Nomination, Start Validation in new Networks / Geographies, etc.

Polkawatch is built on top of Substrate Block Explorers (currently SubQuery) adding an extra analytic layer.

Polkawatch crosses chain data with external datasources and traces weak on-chain relations in a second-pass indexing. Initially for Polkadot, Polkawatch could be used for any substrate blockchain.

## Componets

- [Archive](./packages/archive/Readme.md): Subquery Project that extracts and archives canonical chain data.
- Indexer: Crosses archived data with external datasources and resolvers weak relationships between on-chain events, builds and inverted index with the resulting dataset.
- Live Query Server: Provicess access to the inverted index to the DDPP and the DAPP.
- Distributed Data Pack Publisher: Publishes the dataset on IPFS ready for consumption by the DAPP.
- DAPP: Presents the data to users, mainly from IPFS may also access directly the LQS for advanced queries.

## License and Copyright

Polkawatch is Open Source, Apache License Version 2.0. 

©2022 [Valletech AB](https://valletech.eu), Authors and Contributors.
