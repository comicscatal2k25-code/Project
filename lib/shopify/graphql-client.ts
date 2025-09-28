import crypto from 'crypto'

// SHOPIFY: REVIEW - GraphQL client for Shopify Admin API

export interface ShopifyProduct {
  id?: string
  title: string
  description?: string
  productType: string
  vendor: string
  tags: string[]
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  metafields?: ShopifyMetafield[]
}

export interface ShopifyVariant {
  id?: string
  title: string
  price: string
  compareAtPrice?: string
  sku?: string
  barcode?: string
  inventoryQuantity?: number
  weight?: number
  weightUnit: 'GRAMS' | 'KILOGRAMS' | 'OUNCES' | 'POUNDS'
  requiresShipping: boolean
  taxable: boolean
  inventoryManagement?: 'SHOPIFY' | 'NOT_MANAGED'
  inventoryPolicy?: 'DENY' | 'CONTINUE'
}

export interface ShopifyImage {
  id?: string
  src: string
  altText?: string
  position?: number
}

export interface ShopifyMetafield {
  namespace: string
  key: string
  value: string
  type: string
}

export interface ShopifyResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
  extensions?: {
    cost: {
      requestedQueryCost: number
      actualQueryCost: number
      throttleStatus: {
        maximumAvailable: number
        currentlyAvailable: number
        restoreRate: number
      }
    }
  }
}

// SHOPIFY: REVIEW - Create GraphQL client for Shopify
export class ShopifyGraphQLClient {
  private accessToken: string
  private shopDomain: string
  private apiVersion: string = '2024-10'

  constructor(accessToken: string, shopDomain: string) {
    this.accessToken = accessToken
    this.shopDomain = shopDomain
  }

  // SHOPIFY: REVIEW - Execute GraphQL query
  async query<T>(query: string, variables?: Record<string, any>): Promise<ShopifyResponse<T>> {
    const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}/graphql.json`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check for rate limiting
    if (data.extensions?.cost?.throttleStatus?.currentlyAvailable === 0) {
      const restoreRate = data.extensions.cost.throttleStatus.restoreRate
      const waitTime = Math.ceil(1000 / restoreRate) // Convert to milliseconds
      console.log(`Rate limited. Waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return this.query<T>(query, variables) // Retry
    }

    return data
  }

  // SHOPIFY: REVIEW - Create product using REST API (more reliable for variants)
  async createProduct(product: ShopifyProduct): Promise<ShopifyResponse<{ productCreate: { product: { id: string } } }>> {
    const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}/products.json`
    
    // Transform to REST API format
    const restProduct = {
      product: {
        title: product.title,
        body_html: product.description,
        product_type: product.productType,
        vendor: product.vendor,
        tags: product.tags?.join(',') || '',
        status: product.status?.toLowerCase() || 'active',
        handle: product.handle,
        variants: product.variants?.map(variant => ({
          title: variant.title,
          price: variant.price,
          compare_at_price: variant.compareAtPrice,
          sku: variant.sku,
          barcode: variant.barcode,
          inventory_quantity: variant.inventoryQuantity,
          weight: variant.weight,
          weight_unit: variant.weightUnit === 'POUNDS' ? 'lb' : 'kg',
          requires_shipping: variant.requiresShipping,
          taxable: variant.taxable,
          inventory_management: variant.inventoryManagement?.toLowerCase(),
          inventory_policy: variant.inventoryPolicy?.toLowerCase(),
        })) || [{
          price: '0.00',
          title: 'Default Title'
        }],
        images: product.images?.map(image => ({
          src: image.src,
          alt: image.altText || product.title,
        })) || [],
        metafields: product.metafields?.map(metafield => ({
          namespace: metafield.namespace,
          key: metafield.key,
          value: metafield.value,
          type: metafield.type,
        })) || [],
      }
    }

    console.log('Creating product with REST API:', JSON.stringify(restProduct, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
      body: JSON.stringify(restProduct),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Shopify REST API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    // Transform REST response to match GraphQL format
    const result = {
      data: {
        productCreate: {
          product: {
            id: `gid://shopify/Product/${data.product.id}`,
            title: data.product.title,
            handle: data.product.handle,
            status: data.product.status?.toUpperCase(),
            variants: {
              edges: data.product.variants?.map((variant: any) => ({
                node: {
                  id: `gid://shopify/ProductVariant/${variant.id}`,
                  title: variant.title,
                  price: variant.price,
                }
              })) || []
            }
          },
          userErrors: []
        }
      }
    }

    console.log('Product created successfully with REST API:', result.data.productCreate.product.id)
    console.log('Product creation result:', JSON.stringify(result.data.productCreate, null, 2))

    return result
  }

  // SHOPIFY: REVIEW - Update existing default variant using productVariantsBulkUpdate (2024-10 API)
  async addVariantsToProduct(productId: string, variants: ShopifyVariant[]): Promise<ShopifyResponse<any>> {
    // First, get the existing default variant ID
    const getVariantQuery = `
      query getProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    `

    const getVariantResult = await this.query(getVariantQuery, { id: productId })
    
    if (!getVariantResult.data?.product?.variants?.edges?.[0]?.node) {
      throw new Error('No default variant found')
    }

    const defaultVariantId = getVariantResult.data.product.variants.edges[0].node.id
    console.log('Found default variant ID:', defaultVariantId)

    // Now update the default variant with our data using bulk update (2024-10 API)
    const mutation = `
      mutation productVariantsBulkUpdate($input: ProductVariantsBulkInput!) {
        productVariantsBulkUpdate(input: $input) {
          productVariants {
            id
            title
            price
            compareAtPrice
            sku
            barcode
            inventoryQuantity
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const variant = variants[0] // Use first variant
    const variables = {
      input: {
        variants: [{
          id: defaultVariantId,
          title: variant.title,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          sku: variant.sku,
          barcode: variant.barcode,
          inventoryQuantity: variant.inventoryQuantity,
          weight: variant.weight,
          weightUnit: variant.weightUnit,
          requiresShipping: variant.requiresShipping,
          taxable: variant.taxable,
          inventoryManagement: variant.inventoryManagement,
          inventoryPolicy: variant.inventoryPolicy,
        }]
      }
    }

    console.log('Updating variant with bulk update:', JSON.stringify(variables.input, null, 2))
    console.log('Variant price being set:', variant.price)
    
    const result = await this.query(mutation, variables)
    console.log('Variant update response:', JSON.stringify(result, null, 2))
    
    return result
  }

  // SHOPIFY: REVIEW - Add image to product
  async addImageToProduct(productId: string, image: ShopifyImage): Promise<ShopifyResponse<any>> {
    const mutation = `
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            id
            alt
            status
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `

    const variables = {
      productId: productId,
      media: [{
        originalSource: image.src,
        alt: image.altText,
      }]
    }

    console.log('Adding image to product:', JSON.stringify(variables, null, 2))
    return this.query(mutation, variables)
  }

  // SHOPIFY: REVIEW - Update product mutation
  async updateProduct(productId: string, product: Partial<ShopifyProduct>): Promise<ShopifyResponse<{ productUpdate: { product: { id: string } } }>> {
    const mutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const variables = {
      input: {
        id: productId,
        ...product,
      },
    }

    return this.query(mutation, variables)
  }

  // SHOPIFY: REVIEW - Get product by handle
  async getProductByHandle(handle: string): Promise<ShopifyResponse<{ productByHandle: ShopifyProduct | null }>> {
    const query = `
      query getProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          handle
          status
          productType
          vendor
          tags
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                barcode
                inventoryQuantity
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                src
                altText
              }
            }
          }
        }
      }
    `

    return this.query(query, { handle })
  }
}

// SHOPIFY: REVIEW - Transform comic data to Shopify product format
export function transformComicToShopifyProduct(comic: any, processedImage?: any): ShopifyProduct {
  // Generate handle from title
  const handle = comic.handle || comic.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  // Create variant with validated data
  const variant: ShopifyVariant = {
    title: 'Default Title',
    price: (comic.current_value || 0).toString(),
    compareAtPrice: comic.compare_at_price ? comic.compare_at_price.toString() : undefined,
    sku: comic.barcode || undefined,
    barcode: comic.barcode || undefined,
    inventoryQuantity: Math.max(0, comic.inventory_quantity || 0),
    weight: 0.1, // Default weight for comics
    weightUnit: 'POUNDS',
    requiresShipping: true,
    taxable: true,
    inventoryManagement: 'SHOPIFY',
    inventoryPolicy: 'DENY',
  }
  
  console.log('Creating variant for comic:', comic.title)
  console.log('Comic current_value:', comic.current_value)
  console.log('Variant price:', variant.price)
  
  // Ensure price is valid
  if (!variant.price || variant.price === '0' || variant.price === '') {
    variant.price = '1.00' // Minimum price
    console.log('Price was invalid, setting to minimum:', variant.price)
  }

  // Create images array
  const images: ShopifyImage[] = []
  if (processedImage?.uploadedUrl) {
    images.push({
      src: processedImage.uploadedUrl,
      altText: `${comic.title} - Comic Cover`,
      position: 1,
    })
  }

  // Create metafields for comic-specific data (simplified for now)
  const metafields: ShopifyMetafield[] = []
  
  // Add metafields only if they have values
  if (comic.condition) {
    metafields.push({
      namespace: 'comic',
      key: 'condition',
      value: comic.condition,
      type: 'single_line_text_field',
    })
  }
  
  if (comic.grade) {
    metafields.push({
      namespace: 'comic',
      key: 'grade',
      value: comic.grade.toString(),
      type: 'number_decimal',
    })
  }
  
  if (comic.grading_service) {
    metafields.push({
      namespace: 'comic',
      key: 'grading_service',
      value: comic.grading_service,
      type: 'single_line_text_field',
    })
  }
  
  if (comic.era) {
    metafields.push({
      namespace: 'comic',
      key: 'era',
      value: comic.era,
      type: 'single_line_text_field',
    })
  }

  return {
    title: comic.title,
    description: `${comic.title} - ${comic.series} (${comic.era})`,
    productType: comic.product_type || 'Comic Book',
    vendor: comic.vendor || comic.publisher || 'Unknown',
    tags: comic.tags || [],
    status: 'ACTIVE',
    handle: handle,
    variants: [variant],
    images,
    metafields,
  }
}
