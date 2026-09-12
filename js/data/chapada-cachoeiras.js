(function () {
  "use strict";

  const transferCoordinates = [[-56.120532,-15.651191],[-56.121335,-15.649776],[-56.122022,-15.650068],[-56.122349,-15.649881],[-56.123175,-15.648012],[-56.123884,-15.645338],[-56.123624,-15.643302],[-56.12309,-15.641974],[-56.12174,-15.640289],[-56.120057,-15.637616],[-56.117436,-15.633051],[-56.114018,-15.628146],[-56.111779,-15.625914],[-56.109365,-15.623184],[-56.108593,-15.622165],[-56.106073,-15.618171],[-56.1057,-15.617392],[-56.105012,-15.615058],[-56.10465,-15.615051],[-56.102599,-15.615568],[-56.102064,-15.615386],[-56.10225,-15.613756],[-56.100999,-15.611207],[-56.098795,-15.606865],[-56.099545,-15.605967],[-56.099626,-15.605088],[-56.098578,-15.603564],[-56.096872,-15.601035],[-56.0959,-15.600083],[-56.093803,-15.597997],[-56.092745,-15.596446],[-56.092568,-15.595459],[-56.092689,-15.594082],[-56.092544,-15.593245],[-56.092424,-15.592866],[-56.093881,-15.591617],[-56.096077,-15.589797],[-56.097315,-15.588026],[-56.09452,-15.584811],[-56.092968,-15.583508],[-56.091733,-15.582876],[-56.089198,-15.581458],[-56.087968,-15.580664],[-56.087524,-15.579426],[-56.087152,-15.577238],[-56.086529,-15.574322],[-56.085629,-15.569092],[-56.08543,-15.567798],[-56.085594,-15.566035],[-56.086121,-15.564893],[-56.086532,-15.564133],[-56.088196,-15.562693],[-56.088511,-15.56223],[-56.087824,-15.560596],[-56.086637,-15.558497],[-56.086533,-15.55793],[-56.085374,-15.555299],[-56.083259,-15.550819],[-56.08286,-15.54984],[-56.079217,-15.541981],[-56.07814,-15.539673],[-56.077506,-15.538861],[-56.077188,-15.53763],[-56.075853,-15.5347],[-56.075065,-15.533021],[-56.074684,-15.532321],[-56.073856,-15.530027],[-56.071232,-15.523517],[-56.068757,-15.518842],[-56.066446,-15.514333],[-56.06394,-15.502658],[-56.061509,-15.491152],[-56.061055,-15.488994],[-56.057969,-15.474243],[-56.056826,-15.470427],[-56.05034,-15.463115],[-56.031574,-15.442456],[-56.030509,-15.441414],[-56.029856,-15.440495],[-56.02418,-15.43417],[-56.020627,-15.430252],[-56.019996,-15.42952],[-56.01464,-15.423493],[-55.999475,-15.406775],[-55.990593,-15.397],[-55.985895,-15.391779],[-55.983517,-15.389142],[-55.979468,-15.381739],[-55.974472,-15.375166],[-55.966209,-15.366051],[-55.953337,-15.364861],[-55.94527,-15.359971],[-55.93109,-15.352225],[-55.92225,-15.344164],[-55.91831,-15.340276],[-55.910115,-15.338478],[-55.907915,-15.337178],[-55.906325,-15.336273],[-55.901951,-15.336466],[-55.896013,-15.336891],[-55.885595,-15.337649],[-55.882036,-15.337868],[-55.878017,-15.337149],[-55.875722,-15.337007],[-55.871151,-15.338346],[-55.865914,-15.340073],[-55.863086,-15.341909],[-55.859613,-15.344176],[-55.858282,-15.344628],[-55.847207,-15.345248],[-55.84072,-15.346153],[-55.830701,-15.351381],[-55.829028,-15.355976],[-55.829077,-15.358174],[-55.835554,-15.364048],[-55.838858,-15.364875],[-55.839023,-15.366152],[-55.839367,-15.366832],[-55.842594,-15.368393],[-55.846647,-15.3676],[-55.847873,-15.367937],[-55.849553,-15.371237],[-55.849572,-15.371928],[-55.84916,-15.372187],[-55.848807,-15.373388],[-55.848086,-15.37801],[-55.845113,-15.380623],[-55.841705,-15.382903],[-55.840495,-15.382581],[-55.839652,-15.382858],[-55.839025,-15.384338],[-55.837289,-15.388626],[-55.832564,-15.398711],[-55.828415,-15.401765],[-55.82059,-15.406917],[-55.818843,-15.408213],[-55.811963,-15.416731],[-55.809996,-15.419911],[-55.805703,-15.423342],[-55.790706,-15.430202],[-55.780612,-15.435061],[-55.777638,-15.43618],[-55.769114,-15.44008],[-55.761582,-15.443524],[-55.756954,-15.445714],[-55.754969,-15.447225],[-55.753716,-15.449355],[-55.753306,-15.451359],[-55.753144,-15.455203],[-55.752993,-15.457537],[-55.752658,-15.458132],[-55.752855,-15.45897],[-55.748552,-15.460808],[-55.746709,-15.457213],[-55.745855,-15.456978]];

  window.ChapadaWaterfalls = Object.freeze({
    consultadoEm: "12/09/2026",
    origem: {
      nome: "Aeroporto Internacional Marechal Rondon",
      lat: -15.6510677,
      lng: -56.120279
    },
    pousada: {
      nome: "Pousada Flor da Chapada e Agência de Turismo",
      lat: -15.4569605,
      lng: -55.7459641,
      endereco: "Rua Frei Canuto, 213 — Chapada dos Guimarães, MT, 78195-000",
      telefone: "+55 66 98432-1060",
      site: "https://www.chapadaexp.com/",
      localizacao: "https://share.google/20Ss7TS4HXiKU1ezK"
    },
    traslado: {
      distanciaKm: 74.6,
      duracaoMinutos: 79,
      rota: { type: "LineString", coordinates: transferCoordinates }
    },
    atracoes: [
      { id: "veu-de-noiva", nome: "Cachoeira Véu de Noiva", tipo: "Cachoeira", descricao: "Cartão-postal da Chapada, dentro do Parque Nacional.", lat: -15.407390714918305, lng: -55.83219478594039 },
      { id: "cidade-de-pedra", nome: "Cidade de Pedra", tipo: "Formação rochosa", descricao: "Formações de arenito e uma das paisagens mais marcantes da região.", lat: -15.300873624658351, lng: -55.841113116644756 },
      { id: "aroe-jari", nome: "Caverna Aroe Jari", tipo: "Caverna", descricao: "Grande caverna de arenito, com visitação acompanhada por guia.", lat: -15.600059350667145, lng: -55.477048060816 },
      { id: "lagoa-azul", nome: "Lagoa Azul", tipo: "Gruta", descricao: "Gruta com água cristalina e tons azulados em determinadas épocas.", lat: -15.600018016222627, lng: -55.477005145474564 },
      { id: "mirante-veu-de-noiva", nome: "Mirante do Véu de Noiva", tipo: "Mirante", descricao: "Vista panorâmica para o vale e para a cachoeira.", lat: -15.4074179, lng: -55.8326158 },
      { id: "centro-geodesico", nome: "Centro Geodésico", tipo: "Mirante", descricao: "Mirante histórico e um dos pontos mais conhecidos da Chapada.", lat: -15.47933509601598, lng: -55.68788164732442 },
      { id: "igreja-santana", nome: "Igreja de Sant'Ana", tipo: "Cultura", descricao: "Patrimônio histórico localizado na praça central da cidade.", lat: -15.459015, lng: -55.7473427 },
      { id: "aguas-do-cerrado", nome: "Circuito Águas do Cerrado", tipo: "Circuito", descricao: "Trilha com rios, poços naturais e paisagens do cerrado.", lat: -15.642512501215855, lng: -55.46708812490113 },
      { id: "pedra-furada", nome: "Cachoeira da Pedra Furada", tipo: "Cachoeira", descricao: "Queda d'água em uma formação rochosa naturalmente perfurada.", lat: -15.360021168475438, lng: -55.43227186082058 },
      { id: "paraiso", nome: "Cachoeira do Paraíso", tipo: "Cachoeira", descricao: "Piscinas naturais em cascata com águas translúcidas.", lat: -15.506552546641089, lng: -55.417970715552904 },
      { id: "sete-jotas", nome: "Balneário 7 Jotas", tipo: "Balneário", descricao: "Parada popular no trajeto entre Cuiabá e Chapada.", lat: -15.350687564719284, lng: -55.88593004500605 },
      { id: "cachoeira-do-indio", nome: "Cachoeira do Índio", tipo: "Cachoeira", descricao: "Cachoeira em área preservada, cercada pela vegetação do cerrado.", lat: -15.44307938023827, lng: -55.66736581121171 },
      { id: "kiogo-brado", nome: "Caverna Kiogo Brado", tipo: "Caverna", descricao: "Gruta de arenito integrada aos roteiros de cavernas da região.", lat: -15.612123737786227, lng: -55.50312829695671 },
      { id: "cachoeira-dos-namorados", nome: "Cachoeira dos Namorados", tipo: "Cachoeira", descricao: "Piscinas naturais cercadas pela vegetação do cerrado.", lat: -15.407593124514753, lng: -55.82268163198422 },
      { id: "parque-nacional", nome: "Parque Nacional", tipo: "Parque", descricao: "Área protegida com trilhas, mirantes, cachoeiras e cerrado preservado.", lat: -15.4055128, lng: -55.8295161 },
      { id: "praca-dom-wunibaldo", nome: "Praça Dom Wunibaldo", tipo: "Cultura", descricao: "Praça central com restaurantes, artesanato e movimento noturno.", lat: -15.4581961, lng: -55.7473724 }
    ]
  });
})();
