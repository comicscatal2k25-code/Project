import { createClient } from '@/lib/supabase/server'

// SHOPIFY: REVIEW - Template and metafields handling for Shopify integration

export interface ShopifyProduct {
  title: string
  body_html: string
  vendor: string
  product_type: string
  tags: string[]
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  metafields?: ShopifyMetafield[]
}

export interface ShopifyVariant {
  title: string
  price: string
  sku: string
  inventory_quantity: number
  weight: number
  weight_unit: string
  requires_shipping: boolean
  taxable: boolean
  barcode?: string
  metafields?: ShopifyMetafield[]
}

export interface ShopifyImage {
  src: string
  alt?: string
  position?: number
}

export interface ShopifyMetafield {
  namespace: string
  key: string
  value: string
  type: string
}

// SHOPIFY: REVIEW - Transform comic variant to Shopify product
export async function transformComicToShopifyProduct(
  variantId: string,
  templateId?: string
): Promise<ShopifyProduct | null> {
  try {
    const supabase = await createClient()

    // Get variant with comic data
    const { data: variant, error: variantError } = await supabase
      .from('comic_variants')
      .select(`
        *,
        comics(*)
      `)
      .eq('id', variantId)
      .single()

    if (variantError || !variant) {
      throw new Error('Variant not found')
    }

    const comic = variant.comics

    // Get template if specified
    let template = null
    if (templateId) {
      const { data: templateData } = await supabase
        .from('listing_templates')
        .select('*')
        .eq('id', templateId)
        .single()
      
      template = templateData
    }

    // Transform to Shopify format
    const shopifyProduct: ShopifyProduct = {
      title: generateProductTitle(comic, variant, template),
      body_html: generateProductDescription(comic, variant, template),
      vendor: comic.publisher || 'Unknown Publisher',
      product_type: 'Comic Book',
      tags: generateTags(comic, variant),
      variants: [generateShopifyVariant(variant, template)],
      images: await generateImages(comic, variant),
      metafields: generateMetafields(comic, variant)
    }

    return shopifyProduct

  } catch (error) {
    console.error('Error transforming comic to Shopify product:', error)
    return null
  }
}

// SHOPIFY: REVIEW - Generate product title
function generateProductTitle(comic: any, variant: any, template: any): string {
  if (template?.title_template) {
    return renderTemplate(template.title_template, { comic, variant })
  }

  // Default title format
  const parts = []
  if (comic.series) parts.push(comic.series)
  if (comic.title) parts.push(comic.title)
  if (variant.issue_number) parts.push(`#${variant.issue_number}`)
  if (variant.grade) parts.push(`Grade ${variant.grade}`)

  return parts.join(' ') || comic.title || 'Comic Book'
}

// SHOPIFY: REVIEW - Generate product description
function generateProductDescription(comic: any, variant: any, template: any): string {
  if (template?.description_template) {
    return renderTemplate(template.description_template, { comic, variant })
  }

  // Default description
  const parts = []
  
  if (comic.description) {
    parts.push(`<p>${comic.description}</p>`)
  }

  if (variant.grade) {
    parts.push(`<p><strong>Grade:</strong> ${variant.grade}</p>`)
  }

  if (variant.grading_service) {
    parts.push(`<p><strong>Grading Service:</strong> ${variant.grading_service}</p>`)
  }

  if (variant.key_issue) {
    parts.push(`<p><strong>Key Issue:</strong> Yes</p>`)
  }

  if (variant.key_issue_notes) {
    parts.push(`<p><strong>Key Issue Notes:</strong> ${variant.key_issue_notes}</p>`)
  }

  return parts.join('\n') || '<p>Comic book for sale</p>'
}

// SHOPIFY: REVIEW - Generate tags
function generateTags(comic: any, variant: any): string[] {
  const tags = []

  if (comic.publisher) tags.push(comic.publisher)
  if (comic.era) tags.push(comic.era)
  if (variant.grade) tags.push(`Grade ${variant.grade}`)
  if (variant.grading_service) tags.push(variant.grading_service)
  if (variant.key_issue) tags.push('Key Issue')
  if (comic.creators && comic.creators.length > 0) {
    tags.push(...comic.creators.slice(0, 3)) // Limit to first 3 creators
  }

  return tags.filter(Boolean)
}

// SHOPIFY: REVIEW - Generate Shopify variant
function generateShopifyVariant(variant: any, template: any): ShopifyVariant {
  return {
    title: variant.title || 'Default Title',
    price: variant.current_value?.toString() || '0.00',
    sku: generateSKU(variant),
    inventory_quantity: variant.for_sale ? 1 : 0,
    weight: 0.2, // Default weight for comics
    weight_unit: 'kg',
    requires_shipping: true,
    taxable: true,
    barcode: variant.slab_id || undefined,
    metafields: generateVariantMetafields(variant)
  }
}

// SHOPIFY: REVIEW - Generate SKU
function generateSKU(variant: any): string {
  const parts = []
  
  if (variant.comics?.series) {
    parts.push(variant.comics.series.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10))
  }
  
  if (variant.issue_number) {
    parts.push(variant.issue_number.toString().padStart(3, '0'))
  }
  
  if (variant.grade) {
    parts.push(variant.grade.replace(/[^a-zA-Z0-9]/g, ''))
  }

  return parts.join('-') || `COMIC-${variant.id.substring(0, 8)}`
}

// SHOPIFY: REVIEW - Generate images
async function generateImages(comic: any, variant: any): Promise<ShopifyImage[]> {
  const images: ShopifyImage[] = []

  // Add comic image
  if (comic.image_url) {
    images.push({
      src: comic.image_url,
      alt: comic.title || 'Comic cover',
      position: 1
    })
  }

  // Add variant-specific images if any
  if (variant.image_url && variant.image_url !== comic.image_url) {
    images.push({
      src: variant.image_url,
      alt: `${comic.title} - ${variant.title}`,
      position: images.length + 1
    })
  }

  return images
}

// SHOPIFY: REVIEW - Generate metafields
function generateMetafields(comic: any, variant: any): ShopifyMetafield[] {
  const metafields: ShopifyMetafield[] = []

  // Comic-specific metafields
  if (comic.era) {
    metafields.push({
      namespace: 'comic',
      key: 'era',
      value: comic.era,
      type: 'single_line_text_field'
    })
  }

  if (variant.issue_number) {
    metafields.push({
      namespace: 'comic',
      key: 'issue_number',
      value: variant.issue_number.toString(),
      type: 'number_integer'
    })
  }

  if (comic.creators && comic.creators.length > 0) {
    metafields.push({
      namespace: 'comic',
      key: 'creators',
      value: JSON.stringify(comic.creators),
      type: 'json'
    })
  }

  if (variant.grade) {
    metafields.push({
      namespace: 'comic',
      key: 'grade',
      value: variant.grade,
      type: 'single_line_text_field'
    })
  }

  if (variant.grading_service) {
    metafields.push({
      namespace: 'comic',
      key: 'grading_service',
      value: variant.grading_service,
      type: 'single_line_text_field'
    })
  }

  if (variant.slab_id) {
    metafields.push({
      namespace: 'comic',
      key: 'slab_id',
      value: variant.slab_id,
      type: 'single_line_text_field'
    })
  }

  if (variant.key_issue) {
    metafields.push({
      namespace: 'comic',
      key: 'key_issue',
      value: 'true',
      type: 'boolean'
    })
  }

  if (variant.key_issue_notes) {
    metafields.push({
      namespace: 'comic',
      key: 'key_issue_notes',
      value: variant.key_issue_notes,
      type: 'multi_line_text_field'
    })
  }

  if (variant.print_run) {
    metafields.push({
      namespace: 'comic',
      key: 'print_run',
      value: variant.print_run.toString(),
      type: 'number_integer'
    })
  }

  if (comic.release_date) {
    metafields.push({
      namespace: 'comic',
      key: 'release_date',
      value: comic.release_date,
      type: 'date'
    })
  }

  if (variant.restoration_notes) {
    metafields.push({
      namespace: 'comic',
      key: 'restoration_notes',
      value: variant.restoration_notes,
      type: 'multi_line_text_field'
    })
  }

  if (variant.internal_notes) {
    metafields.push({
      namespace: 'comic',
      key: 'internal_notes',
      value: variant.internal_notes,
      type: 'multi_line_text_field'
    })
  }

  return metafields
}

// SHOPIFY: REVIEW - Generate variant-specific metafields
function generateVariantMetafields(variant: any): ShopifyMetafield[] {
  const metafields: ShopifyMetafield[] = []

  if (variant.condition) {
    metafields.push({
      namespace: 'variant',
      key: 'condition',
      value: variant.condition,
      type: 'single_line_text_field'
    })
  }

  return metafields
}

// SHOPIFY: REVIEW - Simple template renderer
function renderTemplate(template: string, data: { comic: any; variant: any }): string {
  let result = template

  // Replace comic fields
  result = result.replace(/\{\{comic\.(\w+)\}\}/g, (match, field) => {
    return data.comic[field] || ''
  })

  // Replace variant fields
  result = result.replace(/\{\{variant\.(\w+)\}\}/g, (match, field) => {
    return data.variant[field] || ''
  })

  return result
}
