import { GeoRegionController } from './controller.geo.region';
import { GeoCountryController} from "./controller.geo.country";
import { NetworkProviderController } from "./controller.network.provider";
import { ValidatorGroupController} from "./controller.validator.group";
import { AboutDatasetController } from "./controller.about.dataset";

export default [
    AboutDatasetController,
    GeoRegionController,
    GeoCountryController,
    NetworkProviderController,
    ValidatorGroupController
];