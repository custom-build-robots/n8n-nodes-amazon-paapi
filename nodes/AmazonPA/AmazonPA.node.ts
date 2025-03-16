import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import * as amazonPaapi from 'amazon-paapi';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class AmazonPA implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Amazon PA API Advanced',
        name: 'amazonPaApiAdv',
        icon: 'file:amazon.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Advanced Amazon Product Advertising API Integration for n8n',
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

            // Add SearchIndex definition here
            {
                displayName: 'Category (Search Index)',
                name: 'searchIndex',
                type: 'options',  // Change from 'multiOptions' to 'options'
                options: [
                    { name: 'All', value: 'All' },
                    { name: 'Books', value: 'Books' },
                    { name: 'Toys & Games', value: 'ToysAndGames' },
                    { name: 'Electronics', value: 'Electronics' },
                    { name: 'Health & Personal Care', value: 'HealthPersonalCare' },
                    { name: 'Beauty', value: 'Beauty' },
                    { name: 'Clothing & Accessories', value: 'Apparel' },
                ],
                displayOptions: {
                    show: {
                        operation: ['searchItems'],
                    },
                },
                default: 'All',
                description: 'Select a single category to refine your search (SearchIndex).',
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

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        // Retrieve credentials
        const credentials = await this.getCredentials('amazonPaApi');
        
        // Get partnerTag either from the input or from the credentials
        const partnerTag = this.getNodeParameter('partnerTag', 0, '') as string || credentials.partnerTag;
        
        // Ensure PartnerTag exists
        if (!partnerTag) {
            throw new Error('PartnerTag is required but was not provided in both the request and credentials.');
        }

        const commonParameters = {
            AccessKey: credentials.accessKey as string,
            SecretKey: credentials.secretKey as string,
            PartnerTag: partnerTag,  // Use provided PartnerTag or default from credentials
            Marketplace: credentials.marketplace as string,
            PartnerType: 'Associates',
        };

        // Loop through each item
        for (let i = 0; i < items.length; i++) {
            let responseData;
            const requestParameters: any = {};

            try {
                const operation = this.getNodeParameter('operation', i) as string;

                if (operation === 'getItems') {
                    // Handling Get Items request
                    const itemIds = this.getNodeParameter('itemIds', i) as string | null;

                    if (itemIds) {
                        requestParameters.ItemIds = itemIds.includes(',') ? itemIds.split(',') : [itemIds];
                        requestParameters.Resources = [
                            'ItemInfo.Title',
                            'Offers.Listings.Price', // Add this line to get the price
                            'Images.Primary.Small', // Returns large-sized small image (https://webservices.amazon.com/paapi5/documentation/get-items.html)
                            'Images.Primary.Medium', // Returns large-sized medium image
                            'Images.Primary.Large' // Returns large-sized primary image
                        ];
                    } else {
                        throw new Error('Item IDs are required but were not provided.');
                    }
                    console.log('Common Parameters:', commonParameters); 
                    console.log('Request Parameters for GetItems:', requestParameters);
                    
                    responseData = await amazonPaapi.GetItems(commonParameters, requestParameters);
                    try {
                        console.log('responseData: ', responseData.body)
                    } catch (error) {
                        console.log(error)
                    }
                } else if (operation === 'searchItems') {
                    // Handling Search Items request
                    //const keywords = this.getNodeParameter('keywords', i) as string;
                    //requestParameters.Keywords = keywords;
                    //responseData = await amazonPaapi.SearchItems(commonParameters, requestParameters);
                    
                    // Handling Search Items request
                    const keywords = this.getNodeParameter('keywords', i) as string;
                    const searchIndex = this.getNodeParameter('searchIndex', i, 'All') as string; // Single selection
                    
                    const requestParameters: any = {
                        Keywords: keywords,
                    };
                    
                    // Only include SearchIndex if it's not "All"
                    if (searchIndex !== 'All') {
                        requestParameters.SearchIndex = searchIndex;
                    }
                    
                    const responseData = await amazonPaapi.SearchItems(commonParameters, requestParameters);
                    
                    if (responseData?.body?.SearchResult?.Items) {
                        returnData.push({ json: { results: responseData.body.SearchResult.Items } });
                    } else {
                        returnData.push({ json: { results: [] } });
                    }
                
                
                
                
                
                } else if (operation === 'getBrowseNodes') {
                    // Handling Get Browse Nodes request
                    const browseNodeIds = this.getNodeParameter('browseNodeIds', i) as string | null;

                    if (browseNodeIds) {
                        requestParameters.BrowseNodeIds = browseNodeIds.includes(',') ? browseNodeIds.split(',') : [browseNodeIds];
                    } else {
                        throw new Error('Browse Node IDs are required but were not provided.');
                    }
                    responseData = await amazonPaapi.GetBrowseNodes(commonParameters, requestParameters);
                }

                // Log the API response for debugging
                console.log('API Response:', responseData);

                // Add response to returnData
                returnData.push({ json: responseData });

            } catch (error) {
                // Log error and continue
                console.error('API Request Error:', error);
                if (error instanceof Error) {
                    throw new Error(`Failed to execute Amazon PA API operation: ${error.message}`);
                } else {
                    throw new Error('Failed to execute Amazon PA API operation due to an unknown error.');
                }
            }
        }

        // Return the processed data
        return [returnData];
    }
}
