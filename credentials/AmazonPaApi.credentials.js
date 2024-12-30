"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonPaApi = void 0;
class AmazonPaApi {
    constructor() {
        this.name = 'amazonPaApi';
        this.displayName = 'Amazon PA API';
        this.documentationUrl = 'https://webservices.amazon.com/paapi5/documentation/';
        this.properties = [
            {
                displayName: 'Access Key',
                name: 'accessKey',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Secret Key',
                name: 'secretKey',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Partner Tag',
                name: 'partnerTag',
                type: 'string',
                default: '',
                description: 'Your default Partner Tag (can be overridden per request).',
            },
            {
                displayName: 'Marketplace',
                name: 'marketplace',
                type: 'options',
                options: [
                    { name: 'US', value: 'www.amazon.com' },
                    { name: 'UK', value: 'www.amazon.co.uk' },
                    { name: 'Germany', value: 'www.amazon.de' },
                    { name: 'Japan', value: 'www.amazon.co.jp' },
                    { name: 'Canada', value: 'www.amazon.ca' },
                    { name: 'France', value: 'www.amazon.fr' },
                    { name: 'Italy', value: 'www.amazon.it' },
                    { name: 'Spain', value: 'www.amazon.es' },
                    { name: 'Mexico', value: 'www.amazon.com.mx' },
                    { name: 'Brazil', value: 'www.amazon.com.br' },
                    { name: 'India', value: 'www.amazon.in' },
                    { name: 'Australia', value: 'www.amazon.com.au' },
                    { name: 'China', value: 'www.amazon.cn' },
                ],
                default: 'www.amazon.com',
                description: 'The Amazon marketplace you want to use.',
            },
        ];
    }
}
exports.AmazonPaApi = AmazonPaApi;
