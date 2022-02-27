# Deployment Tutorial

A ```docker-compose``` is provided with the actual services required for deployment.

Polkawatch can simply be deployed by running:

```bash
$ docker-compose up 
```

# About data Volumes

Polkawatch does not require the Data Volumes to be backed up, as the data is generated from the Sustrate blockchain,
however, generating the data, in particular the archive phase, is very time consuming. In that sense it might be worth
storing a backup of the postgress ``pgdata`` volume. At present time the backup requires 100Mb per 1M blocks when 
compressed.