import { Inject, Injectable, Logger } from '@nestjs/common';

import geolite2 from 'geolite2-redist';
import maxmind from 'maxmind';

@Injectable()
export class GeoliteService {

    private readonly tracing = false;
    private readonly logger = new Logger(GeoliteService.name);

    constructor(@Inject('GEOLITE_DB') private geolite) {
        // nothing
    }

    async processReward(reward):Promise<any> {
        if(reward.previousHeartbeat) {
            if (reward.previousHeartbeat.previousPublicExternalIPV46Addresses) {
                const publicIPV46Addresses = reward.previousHeartbeat.previousPublicExternalIPV46Addresses;
                const countries = publicIPV46Addresses.map(ip => this.geolite.country.get(ip));
                const ASNs = publicIPV46Addresses.map(ip => this.geolite.asn.get(ip));
                reward.geo_countries = countries;
                reward.geo_ASNs = ASNs;
            }
        }

        return reward;
    }

}

export const GeoliteDBService = {
    provide: 'GEOLITE_DB',
    useFactory: async () => {
        const logger = new Logger('GEOLITE_DB');
        logger.log('Checking Geolite2 Databases.');
        await geolite2.downloadDbs();
        logger.log('Geolite2 Databases up to date.');
        return {
            asn: await geolite2.open('GeoLite2-ASN', (path) => maxmind.open(path)),
            country: await geolite2.open('GeoLite2-Country', (path) =>
                maxmind.open(path),
            ),
        };
    },
};
