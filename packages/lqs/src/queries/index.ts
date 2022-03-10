// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GeoRegionController } from './controller.geo.region';
import { GeoCountryController } from './controller.geo.country';
import { NetworkProviderController } from './controller.network.group';
import { ValidatorGroupController } from './controller.validator.group';
import { AboutDatasetController } from './controller.about.datasets';

export default [
    GeoRegionController,
    GeoCountryController,
    NetworkProviderController,
    ValidatorGroupController,
    AboutDatasetController,
];