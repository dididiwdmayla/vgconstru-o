// Fonte única das mensagens de WhatsApp — edite aqui para mudar em todo o site.
window.WA_DATA = {
  PHONE: '5545988431052',
  MESSAGES: {
    header: 'Olá! Vim pelo site do S.O.S Gabriel e quero falar sobre um serviço.',
    hero: 'Olá! Vim pelo site e quero um orçamento sem compromisso.',
    pintura: 'Olá! Vim pelo site e quero um orçamento de pintura.',
    ceramica: 'Olá! Vim pelo site e quero um orçamento de cerâmica e porcelanato.',
    eletrica: 'Olá! Vim pelo site e quero um orçamento de elétrica e instalações.',
    moveis: 'Olá! Vim pelo site e quero um orçamento de montagem de móveis.',
    manutencao: 'Olá! Vim pelo site e quero um orçamento de manutenção geral.',
    desentupimento: 'Olá! Vim pelo site e preciso de um desentupimento.',
    calhas: 'Olá! Vim pelo site e quero um orçamento de limpeza de calhas e telhados.',
    acabamentos: 'Olá! Vim pelo site e quero um orçamento de acabamentos.',
    servicosGenerico: 'Olá! Não encontrei o serviço que preciso na lista do site, mas quero um orçamento.',
    contato: 'Olá! Vim pela página de contato do site e quero um orçamento.',
    galeria: 'Olá! Vi a galeria no site e quero um orçamento.',
    ctaFinal: 'Olá! Vim pelo site e quero resolver meu serviço hoje.',
    footer: 'Olá! Vim pelo site do S.O.S Gabriel.',
    contato: 'Olá! Vim pela página de contato do site e quero um orçamento.',
    floating: 'Olá! Vim pelo site e quero um orçamento rápido.'
  },
  link: function (key) {
    var msg = this.MESSAGES[key] || this.MESSAGES.header;
    return 'https://wa.me/' + this.PHONE + '?text=' + encodeURIComponent(msg);
  }
};
