import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Builds the Swagger document configuration.
 *
 * @returns Swagger config and custom UI options
 */
export const createSwaggerConfig = () => {
    const config = new DocumentBuilder()
        .setTitle('Kulina API')
        .setDescription(
            'Kulina helps everyone cook African recipes with confidence, control FCFA budgets, plan meals, and share with the community.',
        )
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'JWT',
        )
        .setLicense('UNLICENSED', 'https://kulina.app')
        .setContact('Kulina', 'https://kulina.app', 'hello@kulina.app')
        .build();

    const customOptions: SwaggerCustomOptions = {
        swaggerOptions: {
            url: '/docs-json',
            filter: true,
            persistAuthorization: true,
            tagsSorter: 'alpha',
            docExpansion: 'none',
            operationsSorter: (a: any, b: any) => {
                const order = ['get', 'post', 'patch', 'delete'];
                const methodA = a.get('method');
                const methodB = b.get('method');

                if (methodA !== methodB) {
                    return order.indexOf(methodA) - order.indexOf(methodB);
                }

                return a.get('path').localeCompare(b.get('path'));
            },
        },
    };

    return { config, customOptions };
};
