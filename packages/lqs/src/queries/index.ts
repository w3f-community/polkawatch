// Copyright 2021-2022 Valletech AB authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GeoRegion } from './controller.geo.region';
import { GeoCountry } from './controller.geo.country';
import { NetworkProviderGroup } from './controller.network.group';
import { ValidatorGroup } from './controller.validator.group';
import { AboutDataset } from './controller.about.datasets';

export default [
    GeoRegion,
    GeoCountry,
    NetworkProviderGroup,
    ValidatorGroup,
    AboutDataset,
];