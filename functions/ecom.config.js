/* eslint-disable comma-dangle, no-multi-spaces, key-spacing, quotes, quote-props */

/**
 * Edit base E-Com Plus Application object here.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/applications/
 */

const app = {
  app_id: 119988,
  title: 'UX Delivery',
  slug: 'ux-delivery',
  type: 'external',
  state: 'active',
  authentication: true,

  /**
   * Uncomment modules above to work with E-Com Plus Mods API on Storefront.
   * Ref.: https://developers.e-com.plus/modules-api/
   */
  modules: {
    /**
     * Triggered to calculate shipping options, must return values and deadlines.
     * Start editing `routes/ecom/modules/calculate-shipping.js`
     */
    // calculate_shipping:   { enabled: true },
    /**
     * Triggered to validate and apply discount value, must return discount and conditions.
     * Start editing `routes/ecom/modules/apply-discount.js`
     */
    // apply_discount:       { enabled: true },

    /**
     * Triggered when listing payments, must return available payment methods.
     * Start editing `routes/ecom/modules/list-payments.js`
     */
    // list_payments:        { enabled: true },

    /**
     * Triggered when order is being closed, must create payment transaction and return info.
     * Start editing `routes/ecom/modules/create-transaction.js`
     */
    // create_transaction:   { enabled: true },
  },

  /**
   * Uncomment only the resources/methods your app may need to consume through Store API.
   */
  auth_scope: {
    'stores/me': [
      'GET'            // Read store info
    ],
    procedures: [
      'POST'           // Create procedures to receive webhooks
    ],
    products: [
      // 'GET',           // Read products with public and private fields
      // 'POST',          // Create products
      // 'PATCH',         // Edit products
      // 'PUT',           // Overwrite products
      // 'DELETE',        // Delete products
    ],
    brands: [
      // 'GET',           // List/read brands with public and private fields
      // 'POST',          // Create brands
      // 'PATCH',         // Edit brands
      // 'PUT',           // Overwrite brands
      // 'DELETE',        // Delete brands
    ],
    categories: [
      // 'GET',           // List/read categories with public and private fields
      // 'POST',          // Create categories
      // 'PATCH',         // Edit categories
      // 'PUT',           // Overwrite categories
      // 'DELETE',        // Delete categories
    ],
    customers: [
      // 'GET',           // List/read customers
      // 'POST',          // Create customers
      // 'PATCH',         // Edit customers
      // 'PUT',           // Overwrite customers
      // 'DELETE',        // Delete customers
    ],
    orders: [
      'GET',           // List/read orders with public and private fields
      'POST',          // Create orders
      'PATCH',         // Edit orders
      // 'PUT',           // Overwrite orders
      // 'DELETE',        // Delete orders
    ],
    carts: [
      // 'GET',           // List all carts (no auth needed to read specific cart only)
      // 'POST',          // Create carts
      // 'PATCH',         // Edit carts
      // 'PUT',           // Overwrite carts
      // 'DELETE',        // Delete carts
    ],

    /**
     * Prefer using 'fulfillments' and 'payment_history' subresources to manipulate update order status.
     */
    'orders/fulfillments': [
      'GET',           // List/read order fulfillment and tracking events
      'POST',             // Create fulfillment event with new status
      // 'DELETE',        // Delete fulfillment event
    ],
    'orders/shipping_lines': [
      'GET',              // List/read order shipping lines
      'PATCH',            // Edit order shipping line nested object
    ],
    'orders/payments_history': [
      // 'GET',           // List/read order payments history events
      // 'POST',          // Create payments history entry with new status
      // 'DELETE',        // Delete payments history entry
    ],

    /**
     * Set above 'quantity' and 'price' subresources if you don't need access for full product document.
     * Stock and price management only.
     */
    'products/quantity': [
      // 'GET',           // Read product available quantity
      // 'PUT',           // Set product stock quantity
    ],
    'products/variations/quantity': [
      // 'GET',           // Read variaton available quantity
      // 'PUT',           // Set variation stock quantity
    ],
    'products/price': [
      // 'GET',           // Read product current sale price
      // 'PUT',           // Set product sale price
    ],
    'products/variations/price': [
      // 'GET',           // Read variation current sale price
      // 'PUT',           // Set variation sale price
    ],

    /**
     * You can also set any other valid resource/subresource combination.
     * Ref.: https://developers.e-com.plus/docs/api/#/store/
     */
  },

  admin_settings: {
    ux_token: {
      schema: {
        type: 'string',
        maxLength: 255,
        title: 'UX Delivery token',
        description: 'Solitite na UX Delivery o token para REST API cálculo frete'
      },
      hide: true
    },
    zip: {
      schema: {
        type: 'string',
        maxLength: 9,
        pattern: '^[0-9]{5}-?[0-9]{3}$',
        title: 'CEP de origem'
      },
      hide: true
    },
    order_options: {
      schema: {
        type: 'string',
        title: 'Tipo de envio',
        enum: [
          'Entrega Agendada',
          'Entrega Convencional',
          'Entrega Expressa',
          'Entrega B2B',
          'Entrega Same Day',
          'Entrega Next Day',
          'Entrega Leve',
          'Entrega Pesada',
          'Entrega P2P',
          'Entrega Redespacho',
          'Cash On Delivery',
          'Smart Label',
          '3P Malha Direta',
          'Entrega Transit Point'
        ],
        default: 'Entrega Expressa'
      },
      hide: false
    },
    send_tag_status: {
      schema: {
        type: 'string',
        title: 'Status para envio de etiqueta',
        enum: [
          'Pago',
          'Em produção',
          'Em separação',
          'Pronto para envio',
          'NF emitida',
          'Enviado'
        ],
        default: 'Pronto para envio'
      },
      hide: false
    },
    seller: {
      schema: {
        type: 'object',
        title: 'Dados do remetente',
        description: 'Configure informações de remetente para etiqueta.',
        properties: {
          doc_number: {
            type: 'string',
            maxLength: 20,
            title: 'CPF/CNPJ sem pontuação'
          },
          contact: {
            type: 'string',
            maxLength: 100,
            title: 'Nome do responsável'
          },
          name: {
            type: 'string',
            maxLength: 100,
            title: 'Nome da empresa ou loja'
          }
        }
      },
      hide: true
    },
    from: {
      schema: {
        type: 'object',
        title: 'Endereço do remetente',
        description: 'Configure endereço de remetente para etiqueta.',
        properties: {
          street: {
            type: 'string',
            maxLength: 200,
            title: 'Digite a rua'
          },
          number: {
            type: 'integer',
            min: 1,
            max: 9999999,
            title: 'Digite o número da residência'
          },
          complement: {
            type: 'string',
            maxLength: 100,
            title: 'Complemento'
          },
          borough: {
            type: 'string',
            maxLength: 100,
            title: 'Bairro'
          },
          city: {
            type: 'string',
            maxLength: 100,
            title: 'Cidade'
          },
          province_code: {
            type: 'string',
            title: 'Sigla do Estado',
            enum: [
              'AC',
              'AL',
              'AP',
              'AM',
              'BA',
              'CE',
              'DF',
              'ES',
              'GO',
              'MA',
              'MT',
              'MS',
              'MG',
              'PA',
              'PB',
              'PR',
              'PE',
              'PI',
              'RR',
              'RO',
              'RJ',
              'RS',
              'RN',
              'SC',
              'SP',
              'SE',
              'TO'
            ]
          }
        }
      },
      hide: true
    },
  }
}

/**
 * List of Procedures to be created on each store after app installation.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/procedures/
 */

const procedures = []

/*
const { baseUri } = require('./__env')

procedures.push({
  title: app.title,

  triggers: [
    // Receive notifications when new order is created:
    {
      resource: 'orders',
      action: 'create',
    },

    // Receive notifications when order financial/fulfillment status are set or changed:
    // Obs.: you probably SHOULD NOT enable the orders triggers below and the one above (create) together.
    {
      resource: 'orders',
      field: 'fulfillment_status',
    }

    // Feel free to create custom combinations with any Store API resource, subresource, action and field.
  ],

  webhooks: [
    {
      api: {
        external_api: {
          uri: `${baseUri}/ecom/webhook`
        }
      },
      method: 'POST'
    }
  ]
})
*/

exports.app = app

exports.procedures = procedures
