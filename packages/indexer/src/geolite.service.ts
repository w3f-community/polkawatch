// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0


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

    /**
     * We will process every reward event adding Geolocation and Networking information (ASN)
     * @param reward
     */
    async processReward(reward):Promise<any> {
        if(reward.previousHeartbeat) {
            if (reward.previousHeartbeat.externalIPV46Addresses) {
                const publicIPV46Addresses = reward.previousHeartbeat.externalIPV46Addresses;
                const countries = publicIPV46Addresses.map(ip => this.geolite.country.get(ip));
                const ASNs = publicIPV46Addresses.map(ip => this.geolite.asn.get(ip));
                reward.geo_countries = countries;
                reward.geo_ASNs = ASNs;
            }
        }

        // On top of "Raw" data as returned by the Database, we add the preferred display form of this information.
        reward = this.addGeoCountriesDisplay(reward);
        reward = this.addGeoASNDisplay(reward);
        return reward;
    }

    /**
     * Adds the Geographic information to display in its preferred form. Also assures that when not traced they rewards
     * are labelled accordingly.
     * @param reward
     */
    addGeoCountriesDisplay(reward) {
        const display = {
            group_code: 'NOT_TRACED',
            group_name: 'NOT_TRACED',
            country_code: 'NOT_TRACED',
            country_name: 'NOT_TRACED',
        };

        try {
            display.group_code = reward.geo_countries[0].continent.code;
            display.group_name = reward.geo_countries[0].continent.names.en;
            display.country_code = reward.geo_countries[0].country.iso_code;
            display.country_name = reward.geo_countries[0].country.names.en;
        } catch (e) {
            // ignore
        }

        reward.geo_country_display = display;
        return reward;
    }

    /**
     * Adds the Networking information to display in its preferred form. Also assures that when not traced they rewards
     * are labelled accordingly.
     * @param reward
     */

    addGeoASNDisplay(reward) {
        const display = {
            asn_group_code: 'NOT_TRACED',
            asn_group_name: 'NOT_TRACED',
            asn_code: 'NOT_TRACED',
            asn_name: 'NOT_TRACED',
        };

        try{
            display.asn_code = reward.geo_ASNs[0].autonomous_system_number;
            display.asn_name = reward.geo_ASNs[0].autonomous_system_organization;
            display.asn_group_name = this.getASNNetworkGroupName(display.asn_name);
        } catch (e) {
            // ignore
        }

        reward.geo_asn_display = display;
        return reward;
    }


    /**
     * This GeoIP solution does not implement this concept, but a minimal implementation can be
     * provided by pattern matching top brand names in the space.
     *
     * This is required because the same company group will use multiple networks.
     *
     * @param asnName
     */
    getASNNetworkGroupName(asnName) {

        // If the organization name matches any of this, will be returned as group

        const group = [
            'GOOGLE',
            'AMAZON',
            'OVH',
            'MICROSOFT',
            'DIGITALOCEAN',
            'ALIBABA',
            'HETZNER',
        ].filter(v=> asnName.toUpperCase().indexOf(v) >= 0);

        if(group.length) return group[0];
        else return asnName;
    }

    async onModuleDestroy() {
        this.logger.log('Closing Databases...');
        await this.geolite.asn.close();
        await this.geolite.country.close();
    }

}

/**
 * This lightweight provider will open the GeoIP database after downloading it on first use or if there is
 * an update.
 */
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
