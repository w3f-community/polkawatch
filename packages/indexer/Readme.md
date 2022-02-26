# Polkawatch Indexer

## Introduction

Polkawatch Indexing process takes place in 2 stages. In a first stage Polkawatch Archive extracts the
events from the blockchain as they are stored.

In the second stage, Polkawatch Indexer, performs the following tasks:

- Traces events that could not be properly traced during the Archive phase, in particular Heartbeats that could not be
matched to their validator using the session api are matched by using the PeerId as an intermediate key.
- Crosses the archived events with external datasources, in particular Geographic IP information and Network Provider
  (ASN) information.
- Without this architecture, the Indexer treats Substrate's History Depth API as an external datasource, and uses it to 
validate event relationships traced during the archive process as well as adding additional details to events.

Some of the external datasources are "live data", subject of a process of data quality, and can be udpated anytime. In 
particular, Geographic API data must be updated everyday according to license terms. 

The Indexer module is meant to re-index a generous part of the indexed events everyday. In particular all the History 
Depth is reindexed once a day.

## Technology stack

The module is based on [NetsJS](https://nestjs.com/)