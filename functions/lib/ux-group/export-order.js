const logger = require('firebase-functions/logger')
const axios = require('axios')
const ecomUtils = require('@ecomplus/utils')

const getEcomProduct = (appSdk, storeId, productId) => {
  const resource = `/products/${productId}.json`
  return new Promise((resolve, reject) => {
    appSdk.apiRequest(storeId, resource, 'GET', null, null, noAuth = true)
      .then(({ response }) => {
        resolve({ response })
      })
      .catch((err) => {
        console.log(err.message)
        console.log('erro na request api')
        reject(err)
      })
  })     
}

module.exports = async (
  { appSdk, storeId, auth },
  { order, uxToken, uxOrderSettings }
) => {
  const { number, items } = order
  const buyer = order.buyers?.[0]
  if (!buyer) return
  const shippingLine = order.shipping_lines?.find(({ app }) => app?.carrier === 'Ux')
  if (!shippingLine?.to) return
  const { to } = shippingLine
  const invoice = shippingLine.invoices?.[0]
  if (!invoice?.number || !invoice.serial_number || !invoice.access_key) {
    logger.warn(`Skipping #${storeId} ${number} without invoice data`)
    return
  }
  const trackingId = (uxOrderSettings.tracking_prefix || '') +
    invoice.number.replace(/^0+/, '') +
    invoice.serial_number.replace(/^0+/, '')
  const lineTrackingCodes = shippingLine.tracking_codes || []
  const savedTrackingCode = lineTrackingCodes.find(({ code }) => {
    return code === trackingId
  })
  if (savedTrackingCode) {
    logger.warn(`Skipping #${storeId} ${number} with tracking code already set`)
    if (!savedTrackingCode.tag) {
      savedTrackingCode.tag = 'ux_delivery'
      await appSdk.apiRequest(
        storeId,
        `/orders/${order._id}/shipping_lines/${shippingLine._id}.json`,
        'PATCH',
        { tracking_codes: lineTrackingCodes },
        auth
      )
    }
    return
  }
  logger.info(`Sending #${storeId} ${number} with tracking ID ${trackingId}`)
  const { sender } = uxOrderSettings.data
  let sumWeight = 0
  if (items && items.length) {
    for (let i = 0; i < items.length; i++) {
      await getEcomProduct(appSdk, storeId, items[i].product_id)
      .then(({ response }) => {
        const product = response.data
        const { weight } = product
        // parse cart items to kangu schema
        let kgWeight = 0
        if (weight && weight.value) {
          switch (weight.unit) {
            case 'g':
              kgWeight = weight.value / 1000
              break
            case 'mg':
              kgWeight = weight.value / 1000000
              break
            default:
              kgWeight = weight.value
          }
          sumWeight += kgWeight
        }
      })
      .catch(err => {
        console.log(err.message)
        console.error('deu erro ao buscar produto')
      })
    }
  }
  const data = { 
    "cnpjEmbarcadorOrigem":sender.document,
    "listaSolicitacoes":[ 
       { 
          "idSolicitacaoInterno": String(number),
          "idServico":8,
          "Destinatario":{ 
             "nome": ecomUtils.fullName(buyer),
             "telefone":ecomUtils.phone(buyer),
             "email":buyer.main_email,
             "Endereco":{ 
                "cep": to.zip,
                "logradouro": to.street,
                "numero": to.number ? String(to.number) : 'SN',
                "complemento": to.complement,
                "pontoReferencia": to.near_to,
                "bairro": to.borough,
                "nomeCidade": to.city,
                "siglaEstado": to.province_code,
             }
          },
          "listaOperacoes":[ 
             { 
                "idTipoDocumento": 55,
                "nroNotaFiscal": invoice.number.replace(/^0+/, '') ,
                "serieNotaFiscal": invoice.serial_number.replace(/^0+/, ''),
                "chaveNotaFiscal": invoice.access_key,
                "nroPedido": `TS${number}`,
                "nroEntrega": `TS${number}`,
                "qtdeVolumes": 1,
                "pesoTotal": sumWeight,
                "valorMercadoria": amount.subtotal,
                "listaVolumes":[ 
                   { 
                      "nroEtiqueta": `TS${number}`,
                      "pesoVolume": sumWeight
                   }
                ],
                "listaItens":null,
             }
          ]
       }
    ]
 }
  try {
    const response = await axios.post('https://tms.uxdelivery.com.br/Api/Solicitacoes/RegistrarNovaSolicitacao', data, {
      headers: { Authorization: `Basic ${uxToken}` },
      timeout: 7000
    })
    if (response?.data?.mensagem === 'OK' && response.data.resultados?.length) {
      const result = response.data.resultados[0]
      console.log('order sent', order._id, number, result.idSolicitacaoGerada, result.idSolicitacaoInterno)
      const volume = result.listaVolumes && result.listaVolumes.length && result.listaVolumes[0]
      await appSdk.apiRequest(
        storeId,
        `/orders/${order._id}/shipping_lines/${shippingLine._id}.json`,
        'PATCH',
        {
          tracking_codes: [
            {
              tag: 'ux_delivery',
              code: volume && volume.codigoRastreio || trackingId
            },
            ...lineTrackingCodes
          ]
        },
        auth
      )
      
    }
  } catch (error) {
    if (!error.response?.data?.error?.message?.endsWith(' já foi utilizado')) {
      throw error
    }
  }
}
