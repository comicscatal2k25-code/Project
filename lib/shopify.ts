interface ShopifyProduct {
  title: string
  body_html: string
  vendor: string
  product_type: string
  tags: string
  variants: Array<{
    price: string
    inventory_quantity: number
    sku?: string
  }>
}

interface ShopifySettings {
  shop_domain: string
  access_token: string
}

export class ShopifyAPI {
  private settings: ShopifySettings

  constructor(settings: ShopifySettings) {
    this.settings = settings
  }

  private async makeRequest(endpoint: string, method = "GET", data?: any) {
    const url = `https://${this.settings.shop_domain}/admin/api/2023-10/${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.settings.access_token,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createProduct(productData: ShopifyProduct) {
    return this.makeRequest("products.json", "POST", { product: productData })
  }

  async updateProduct(productId: string, productData: Partial<ShopifyProduct>) {
    return this.makeRequest(`products/${productId}.json`, "PUT", { product: productData })
  }

  async deleteProduct(productId: string) {
    return this.makeRequest(`products/${productId}.json`, "DELETE")
  }

  async getProduct(productId: string) {
    return this.makeRequest(`products/${productId}.json`)
  }
}

export function formatComicForShopify(comic: any, template: any): ShopifyProduct {
  // Replace template variables with comic data
  const title = template.title_template
    .replace(/\{\{title\}\}/g, comic.title || "")
    .replace(/\{\{issue_number\}\}/g, comic.issue_number || "")
    .replace(/\{\{variant\}\}/g, comic.variant || "")
    .replace(/\{\{publisher\}\}/g, comic.publishers?.name || "")
    .replace(/\{\{publication_date\}\}/g, comic.publication_date || "")

  const description = template.description_template
    .replace(/\{\{condition\}\}/g, comic.condition || "")
    .replace(/\{\{grade\}\}/g, comic.grade || "")
    .replace(/\{\{publication_date\}\}/g, comic.publication_date || "")
    .replace(/\{\{publisher\}\}/g, comic.publishers?.name || "")
    .replace(/\{\{description\}\}/g, comic.description || "")
    .replace(/\{\{tags\}\}/g, comic.tags?.join(", ") || "")

  const tags = [...(template.tags_template || []), ...(comic.tags || []), comic.condition, comic.publishers?.name]
    .filter(Boolean)
    .join(", ")

  return {
    title: title.trim(),
    body_html: description.replace(/\n/g, "<br>"),
    vendor: template.vendor || "Comic Collector",
    product_type: template.product_type || "Comic Books",
    tags,
    variants: [
      {
        price: (comic.sale_price || comic.current_value || 0).toString(),
        inventory_quantity: 1,
        sku: `comic-${comic.id}`,
      },
    ],
  }
}
