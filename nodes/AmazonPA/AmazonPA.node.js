"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonPA = void 0;
const amazonPaapi = __importStar(require("amazon-paapi"));
class AmazonPA {
    constructor() {
        this.description = {
            displayName: 'Amazon PA API',
            name: 'amazonPA',
            icon: 'file:amazon.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Interact with Amazon Product Advertising API',
            defaults: {
                name: 'Amazon PA API',
                color: '#FF9900',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'amazonPaApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    options: [
                        {
                            name: 'Search Items',
                            value: 'searchItems',
                            description: 'Search for items on Amazon',
                        },
                        {
                            name: 'Get Items',
                            value: 'getItems',
                            description: 'Get item information by ASIN',
                        },
                        {
                            name: 'Get Browse Nodes',
                            value: 'getBrowseNodes',
                            description: 'Get browse node information',
                        },
                    ],
                    default: 'searchItems',
                },
                {
                    displayName: 'Partner Tag',
                    name: 'partnerTag',
                    type: 'string',
                    default: '',
                    description: 'Amazon Partner Tag (overrides default if set)',
                },
                {
                    displayName: 'Item IDs (for Get Items)',
                    name: 'itemIds',
                    type: 'string',
                    displayOptions: {
                        show: {
                            operation: ['getItems'],
                        },
                    },
                    default: '',
                    description: 'Comma-separated list of ASINs for items',
                },
                {
                    displayName: 'Keywords (for Search Items)',
                    name: 'keywords',
                    type: 'string',
                    displayOptions: {
                        show: {
                            operation: ['searchItems'],
                        },
                    },
                    default: '',
                    description: 'Keywords to search for items on Amazon',
                },
                {
                    displayName: 'Browse Node IDs (for Get Browse Nodes)',
                    name: 'browseNodeIds',
                    type: 'string',
                    displayOptions: {
                        show: {
                            operation: ['getBrowseNodes'],
                        },
                    },
                    default: '',
                    description: 'Comma-separated list of Browse Node IDs',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Retrieve credentials
        const credentials = await this.getCredentials('amazonPaApi');
        // Get partnerTag either from the input or from the credentials
        const partnerTag = this.getNodeParameter('partnerTag', 0, '') || credentials.partnerTag;
        // Ensure PartnerTag exists
        if (!partnerTag) {
            throw new Error('PartnerTag is required but was not provided in both the request and credentials.');
        }
        const commonParameters = {
            AccessKey: credentials.accessKey,
            SecretKey: credentials.secretKey,
            PartnerTag: partnerTag,
            Marketplace: credentials.marketplace,
            PartnerType: 'Associates',
        };
        // Loop through each item
        for (let i = 0; i < items.length; i++) {
            let responseData;
            const requestParameters = {};
            try {
                const operation = this.getNodeParameter('operation', i);
                if (operation === 'getItems') {
                    // Handling Get Items request
                    const itemIds = this.getNodeParameter('itemIds', i);
                    if (itemIds) {
                        requestParameters.ItemIds = itemIds.includes(',') ? itemIds.split(',') : [itemIds];
                        requestParameters.Resources = [
                            'ItemInfo.Title',
                            'Offers.Listings.Price' // Add this line to get the price
                        ];
                    }
                    else {
                        throw new Error('Item IDs are required but were not provided.');
                    }
                    console.log('Common Parameters:', commonParameters);
                    console.log('Request Parameters for GetItems:', requestParameters);
                    responseData = await amazonPaapi.GetItems(commonParameters, requestParameters);
                    try {
                        console.log('responseData: ', responseData.body);
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                else if (operation === 'searchItems') {
                    // Handling Search Items request
                    const keywords = this.getNodeParameter('keywords', i);
                    requestParameters.Keywords = keywords;
                    responseData = await amazonPaapi.SearchItems(commonParameters, requestParameters);
                }
                else if (operation === 'getBrowseNodes') {
                    // Handling Get Browse Nodes request
                    const browseNodeIds = this.getNodeParameter('browseNodeIds', i);
                    if (browseNodeIds) {
                        requestParameters.BrowseNodeIds = browseNodeIds.includes(',') ? browseNodeIds.split(',') : [browseNodeIds];
                    }
                    else {
                        throw new Error('Browse Node IDs are required but were not provided.');
                    }
                    responseData = await amazonPaapi.GetBrowseNodes(commonParameters, requestParameters);
                }
                // Log the API response for debugging
                console.log('API Response:', responseData);
                // Add response to returnData
                returnData.push({ json: responseData });
            }
            catch (error) {
                // Log error and continue
                console.error('API Request Error:', error);
                if (error instanceof Error) {
                    throw new Error(`Failed to execute Amazon PA API operation: ${error.message}`);
                }
                else {
                    throw new Error('Failed to execute Amazon PA API operation due to an unknown error.');
                }
            }
        }
        // Return the processed data
        return [returnData];
    }
}
exports.AmazonPA = AmazonPA;
