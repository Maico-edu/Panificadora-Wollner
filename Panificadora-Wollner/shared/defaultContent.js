// Conteúdo inicial do site. É usado:
//  - pelo servidor, quando ainda nada foi salvo pelo painel;
//  - pelo site, como reserva se a API estiver indisponível.
// Depois que o painel salva, os dados reais passam a vir do armazenamento.

export const defaultContent = {
  schemaVersion: 1,
  updatedAt: '',

  company: {
    name: 'Panificadora Wollner',
    tagline: 'Panificadora e Confeitaria',
    description:
      'Pães, bolos, doces, salgados e cafés no bairro Boehmerwald, em Joinville. Encomendas e informações pelo WhatsApp.',
    logo: '/images/logo-wollner.png',
    whatsapp: '5547988096127',
    email: '',
    address: {
      street: 'Rua Adolfo da Veiga, 495',
      neighborhood: 'Boehmerwald',
      city: 'Joinville',
      state: 'SC',
      zip: '89235-000',
    },
    // Exemplo: [{ label: 'Segunda a sexta', value: '6h às 19h' }]. Vazio = não exibe horários.
    hours: [],
    hoursNote: '',
    social: {
      instagram: 'https://www.instagram.com/wollnerpanificadora/',
      facebook: '',
    },
    // Se vazio, o mapa usa o endereço acima.
    map: { query: '' },
  },

  home: {
    slides: [
      {
        id: 'slide-1',
        image: '/images/seed/cafe-cremoso.jpg',
        title: 'Café e confeitaria todos os dias',
        subtitle: 'Venha conhecer a vitrine da Wollner.',
        buttonText: 'Ver encomendas',
        buttonTarget: '/encomendas',
        active: true,
      },
      {
        id: 'slide-2',
        image: '/images/seed/bolo-confeitado.jpg',
        title: 'Bolos para a sua comemoração',
        subtitle: 'Fale com a gente para encomendar.',
        buttonText: 'Encomendar pelo WhatsApp',
        buttonTarget: 'whatsapp',
        active: true,
      },
      {
        id: 'slide-3',
        image: '/images/seed/rosquinha-confeitada.jpg',
        title: 'Doces feitos na casa',
        subtitle: '',
        buttonText: 'Ver produtos',
        buttonTarget: '/encomendas',
        active: true,
      },
    ],
    introTitle: 'Panificadora e confeitaria em Joinville',
    introText:
      'A Panificadora Wollner fica no bairro Boehmerwald. Aqui você encontra pães, bolos, doces, salgados e cafés, e pode fazer encomendas direto pelo WhatsApp.',
    featuredTitle: 'Destaques da vitrine',
    ordersCtaTitle: 'Veja tudo o que dá para encomendar',
    ordersCtaText: 'Escolha o produto e envie o pedido pelo WhatsApp com a mensagem já pronta.',
    ordersCtaButton: 'Ver todas as encomendas',
    historyTitle: 'Nossa história',
    contactTitle: 'Onde estamos',
    whatsappInviteTitle: 'Vai encomendar?',
    whatsappInviteText: 'Chame a Wollner no WhatsApp. Você revisa a mensagem antes de enviar.',
    whatsappInviteButton: 'Chamar no WhatsApp',
  },

  about: {
    title: 'Sobre a Panificadora Wollner',
    intro:
      'Panificadora e confeitaria localizada no bairro Boehmerwald, em Joinville (SC).',
    // Preencher no painel com os dados confirmados. Vazio = a seção não aparece.
    history: '',
    foundedYear: null,
    foundedMonth: null,
    foundedDay: null,
    mainPhoto: '/images/seed/cafe-sanduiche.jpg',
    photos: [],
    differentials: [],
  },

  categories: [
    { id: 'paes', name: 'Pães' },
    { id: 'bolos', name: 'Bolos' },
    { id: 'tortas', name: 'Tortas' },
    { id: 'doces', name: 'Doces' },
    { id: 'salgados', name: 'Salgados' },
    { id: 'confeitaria', name: 'Confeitaria' },
    { id: 'cafes', name: 'Cafés e bebidas' },
    { id: 'sazonais', name: 'Produtos sazonais' },
  ],

  // Produtos de partida, baseados nas fotos do Instagram da Wollner.
  // Sem preço: ficam como "sob consulta" até o painel ser preenchido.
  products: [
    {
      id: 'bolo-confeitado',
      name: 'Bolo confeitado',
      description: 'bolo feito com massa de chocolate, recheio de brigadeiro e cobertura de chantilly, decorado com confeitos coloridos.',
      categoryId: 'bolos',
      image: '/images/seed/bolo-confeitado.jpg',
      priceType: 'consult',
      price: null,
      active: true,
      available: true,
      featured: true,
      messageMode: 'default',
      messageTemplateId: '',
      messageCustom: '',
      requestFields: { quantity: true, date: true, variation: false, notes: true },
    },
    {
      id: 'rocambole-morango',
      name: 'Rocambole de morango',
      description: 'rocambole feito com massa de chocolate, recheio de creme e morangos frescos, coberto com chocolate e decorado com morangos.',
      categoryId: 'confeitaria',
      image: '/images/seed/rocambole-morango.jpg',
      priceType: 'consult',
      price: null,
      active: true,
      available: true,
      featured: true,
      messageMode: 'default',
      messageTemplateId: '',
      messageCustom: '',
      requestFields: { quantity: true, date: true, variation: false, notes: true },
    },
    {
      id: 'bomba-chocolate',
      name: 'Bomba de chocolate',
      description: 'bomba feita com massa de chocolate, recheio de creme e cobertura de chocolate.',
      categoryId: 'confeitaria',
      image: '/images/seed/bomba-chocolate.jpg',
      priceType: 'consult',
      price: null,
      active: true,
      available: true,
      featured: true,
      messageMode: 'default',
      messageTemplateId: '',
      messageCustom: '',
      requestFields: { quantity: true, date: false, variation: false, notes: false },
    },
    {
      id: 'rosquinha-confeitada',
      name: 'Rosquinha confeitada',
      description: 'rosquinha feita com massa de chocolate, recheio de creme e cobertura de chocolate.',
      categoryId: 'doces',
      image: '/images/seed/rosquinha-confeitada.jpg',
      priceType: 'consult',
      price: null,
      active: true,
      available: true,
      featured: false,
      messageMode: 'default',
      messageTemplateId: '',
      messageCustom: '',
      requestFields: { quantity: true, date: false, variation: false, notes: false },
    },
    {
      id: 'cafe-cremoso',
      name: 'Café cremoso',
      description: 'café cremoso feito com grãos de café selecionados, servido com leite condensado e canela.',
      categoryId: 'cafes',
      image: '/images/seed/cafe-cremoso.jpg',
      priceType: 'consult',
      price: null,
      active: true,
      available: true,
      featured: false,
      messageMode: 'default',
      messageTemplateId: '',
      messageCustom: '',
      requestFields: { quantity: false, date: false, variation: false, notes: false },
    },
  ],

  messages: {
    order:
      'Olá! Gostaria de encomendar: {produto}.\nQuantidade: {quantidade}\nData desejada: {data}\nObservações: {observacoes}\n\nVi o site da {empresa}.',
    priceConsult:
      'Olá! Gostaria de saber o preço de: {produto}. Poderiam me passar mais informações?',
    general: 'Olá! Gostaria de falar com a {empresa}.',
    floating: 'Olá! Vim pelo site da {empresa} e gostaria de uma informação.',
    buttonOrder: 'Encomendar',
    buttonConsult: 'Consultar preço',
    templates: [
      {
        id: 'modelo-informacoes',
        name: 'Pedir mais informações',
        text: 'Olá! Gostaria de saber mais sobre o produto {produto} da {empresa}. Poderiam me passar mais informações?',
      },
    ],
  },
}
