# Polkawatch Archive

Archiving is the first-pass of the polkawatch 2-pass indexing process. 

Archiving extracts the "canonical" substrate chain data that is required to create the polkawatch 
index. In the second pass, the "canonical" data will be enriched with external datasources.

The Archiving process takes place only once. Polkawatch Indexer component will run a 2nd-pass indexing.

## Toolchain

Archiving is implemented as a [subQuery](https://subquery.network/) project.


