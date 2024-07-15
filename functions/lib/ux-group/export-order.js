const logger = require('firebase-functions/logger')
const axios = require('axios')
const ecomUtils = require('@ecomplus/utils')

module.exports = async (
  { appSdk, storeId, auth },
  { order, uxToken, mandaeOrderSettings }
) => {
  const { number } = order
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
  const trackingId = (mandaeOrderSettings.tracking_prefix || '') +
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
  const { sender, cnpj } = mandaeOrderSettings.data
  const data = { 
    "cnpjEmbarcadorOrigem":cnpj,
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
    if (response && response.data && response.data.mensagem === 'OK' && response.data.resultados &&  && response.data.resultados.length) {
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
