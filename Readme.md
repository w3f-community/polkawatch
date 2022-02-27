# About Polkawatch

## Decentralization Analytics for Sustrate/Polkadot.

Polkawatch provides decentralization analytics about Polkadot. Allows all stake-holders to gain insights about where network activity is taking place (regional, network provider, validator group, nominator segment, etc).

With Decentralization insights the community can act to improve decentralization regardless of their 
role: Adjust Nomination, Start Validation in new Networks / Geographies, etc.

Polkawatch is built on top of Substrate Block Explorer (currently SubQuery) adding an extra analytic layer.

Polkawatch crosses chain data with external datasources and traces weak on-chain relations in a second-pass indexing. 
External data-sources may be "live" datasets that require regular updates. This is the case with location data, where
data changes everyday and license requires for it to be updated.

Initially for Polkadot, Polkawatch could be used for any substrate blockchain.

## Components

Polkawatch is setup as a yarn workspace project with multiple packages (components) that can be managed from the project 
root and also from its project directory, the components are:

- [Archive](./packages/archive/Readme.md): Subquery Project that extracts and archives canonical chain data, in an unique
first pass event archiving.
- [Indexer](./packages/indexer/Readme.md): Crosses archived data with external datasources and resolvers weak relationships 
between on-chain events, builds and inverted index with the resulting dataset. The indexing process runs on start and on
daily schedule.
- [Live Query Server](./packages/lqs/Readme.md): Provides access to the inverted index to the DDPP and the DAPP.
- Distributed Data Pack Publisher (Coming Soon): Publishes the dataset on IPFS ready for consumption by the DAPP.
- DAPP (Coming Soon): Presents the data to users, mainly from IPFS may also access directly the LQS for advanced queries.

# Testing Guide

## Unit Testing

Polkawatch is a workspace project with multiple packages, however, testing can be triggered from the root of the project.
Yarn commands are delegated to the child packages.

In order to run the unit tests run:

- ```yarn test``` to run all unit tests
- ```yarn test:e2e``` tp run end-to-end tests in packages that provide them

## Test Run of the System

All modules deliver docker containers, and a docker-compopose, with multiple profiles, allow to run all or certain 
components depending on the desired activity

### Setting up the environment

From the root of the project do:

1. Build the containers for all components with ```yarn docker:build```
2. Download some chain data with ``yarn docker:getdata`` or run the archive for 12-24hours to get a decent data sample
with ```yarn docker:archive```. You can also do both. Getting data will simply download a postgres backup from IPFS with about 1M
blocks of chain data already archived (first pass only).
3. You can run all the components with ``yarn docker:testdeploy`` 

### Available playgrounds

You can access the following playgrouds / UIs to monitor de indexing process and/or test your development.

1. [Archive GraphQL](http://localhost:3000) Provided by Subquery, during the 1st pass archive.
2. [Elasticsearch Kibana](http://localhost:5601) Used to compose complex queries that can be used to create LQS templates.
3. [LQS API UI](http://localhost:7000/lqs) Used to test the Live Query Server API methods and test query templates.

### Developing locally

In order to develop locally you can use: 

1. Build all components from root with `` yarn build``
2. You can run packages locally, i.e in your IDE, and run all other dependencies with ```yarn docker:dev```. The Indexer and LQS servers
will not be started. If you want to release more resources for development you can optionally stop the Archive and 
Kibana too.
3. Additionally ``yarn docker:clean`` will clean up all containers and data volumes.

### Deployment 

For deployment instructions check the [deployment tutorial](./deploy/Readme.md). 

## License and Copyright

Polkawatch is Open Source, Apache License Version 2.0. 

©2022 [Valletech AB](https://valletech.eu), Authors and Contributors.
