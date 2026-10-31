import { RedocOptions } from 'nestjs-redoc';

/**
 * Builds the ReDoc documentation options.
 *
 * @returns ReDoc configuration
 */
export const createRedocConfig = (): RedocOptions => {
    return {
        title: 'Kulina API',
        sortPropsAlphabetically: true,
        hideDownloadButton: false,
        hideHostname: false,
    };
};
